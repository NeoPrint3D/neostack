import { SidebarTrigger } from "@neostack/ui/components/sidebar";
import { apiClient } from "@/lib/apiClient";
import { useState, useEffect, useRef } from "react";
import { Bell, CheckCircle, Mail, X } from "lucide-react";
import { Badge } from "@neostack/ui/components/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@neostack/ui/components/popover";
import { Button } from "@neostack/ui/components/button";
import { ScrollArea } from "@neostack/ui/components/scroll-area";
import { Separator } from "@neostack/ui/components/separator";
import { toast } from "sonner";
import { z } from "zod";

import { notificationSchema, type Notification } from "@neostack/api/client";

const wsMessageSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("initialState"),
    payload: z.array(notificationSchema),
  }),
  z.object({
    type: z.literal("clear"),
  }),
  z.object({
    type: z.literal("clear-id"),
    payload: z.string(),
  }),
  notificationSchema,
]);

export function useNotifications() {
  const wsUrl = getWebSocketUrl(
    apiClient.v1.notifications.ws.$url().toString()
  );

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [wsStatus, setWsStatus] = useState<
    "connecting" | "connected" | "disconnected" | "error"
  >("disconnected");
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const retryCountRef = useRef(0);
  const maxRetries = 5;

  useEffect(() => {
    const connect = () => {
      if (
        wsRef.current?.readyState === WebSocket.OPEN ||
        retryCountRef.current >= maxRetries
      ) {
        if (retryCountRef.current >= maxRetries) {
          setWsStatus("error");
          toast.error("Failed to connect to notifications server");
        }
        return;
      }

      setWsStatus("connecting");

      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        console.log("WebSocket connected");
        setWsStatus("connected");
        retryCountRef.current = 0;
        pingIntervalRef.current = setInterval(() => {
          if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send("ping");
          } else if (pingIntervalRef.current) {
            clearInterval(pingIntervalRef.current);
          }
        }, 25000);
      };

      wsRef.current.onmessage = (event) => {
        if (
          typeof event.data === "string" &&
          event.data.toLowerCase() === "pong"
        ) {
          return;
        }

        try {
          const message = wsMessageSchema.parse(JSON.parse(event.data));
          console.log("WebSocket message received:", message);

          switch (message.type) {
            case "initialState":
              const parsedNotifications = message.payload
                .map((item) => notificationSchema.safeParse(item))
                .filter((result) => result.success)
                .map((result) => result.data as Notification);
              setNotifications(parsedNotifications);
              break;

            case "clear":
              setNotifications([]);
              toast.success("All notifications cleared");
              break;

            case "clear-id":
              setNotifications((prev) =>
                prev.filter((n) => n.id !== message.payload)
              );
              toast.success(`Notification ${message.payload} cleared`);
              break;

            default:
              const parsed = notificationSchema.safeParse(message);
              if (parsed.success) {
                setNotifications((prev) => [parsed.data, ...prev]);
                toast.success(parsed.data.title);
              }
              break;
          }
        } catch (error) {
          console.error("WebSocket: Error processing message:", error);
        }
      };

      wsRef.current.onclose = (event) => {
        console.log(
          `WebSocket closed: code=${event.code}, reason=${event.reason}`
        );
        if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
        setWsStatus(
          event.code === 1000
            ? "disconnected"
            : retryCountRef.current < maxRetries
              ? "disconnected"
              : "error"
        );

        if (event.code !== 1000 && retryCountRef.current < maxRetries) {
          const delay = Math.min(1000 * 2 ** retryCountRef.current, 30000);
          retryCountRef.current++;
          console.log(
            `Reconnecting in ${delay}ms (Attempt ${retryCountRef.current})`
          );
          reconnectTimeoutRef.current = setTimeout(connect, delay);
        }
      };

      wsRef.current.onerror = (error) => {
        console.error("WebSocket error:", error);
        setWsStatus("error");
      };
    };
    connect();

    return () => {
      console.log("Cleaning up WebSocket");
      if (reconnectTimeoutRef.current)
        clearTimeout(reconnectTimeoutRef.current);
      if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.close(1000, "Component unmounted");
      }
      wsRef.current = null;
      setWsStatus("disconnected");
    };
  }, [wsUrl]);

  const clearNotification = async (id: string) => {
    try {
      const response = await apiClient.v1.notifications.clear[":id"].$post({
        param: { id },
      });
      if (!response.ok) {
        throw new Error("Failed to clear notification");
      }
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    } catch (error) {
      console.error("Error clearing notification:", error);
      toast.error("Failed to clear notification");
    }
  };

  const clearAllNotifications = async () => {
    try {
      const response = await apiClient.v1.notifications.clear.$post();
      if (!response.ok) {
        throw new Error("Failed to clear all notifications");
      }
      setNotifications([]);
    } catch (error) {
      console.error("Error clearing all notifications:", error);
      toast.error("Failed to clear all notifications");
    }
  };

  return { notifications, wsStatus, clearNotification, clearAllNotifications };
}

function NotificationItem({
  notification,
  onClear,
}: {
  notification: Notification;
  onClear: (id: string) => void;
}) {
  const { type, content, timestamp, redirectPath, id, title } = notification;

  const icon =
    type === "queueStatus" ? (
      <CheckCircle className="w-5 h-5" />
    ) : (
      <Mail className="w-5 h-5" />
    );

  return (
    <div className="flex items-start gap-3 hover:bg-muted/50 p-4 transition-colors">
      <div className="mt-1 text-primary">{icon}</div>
      <div className="flex-1">
        <div className="flex justify-between items-center">
          <h4 className="font-semibold text-foreground text-sm">{title}</h4>
          <Button
            variant="ghost"
            size="icon"
            className="w-6 h-6 text-muted-foreground hover:text-foreground"
            onClick={() => onClear(id)}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
        <p className="text-muted-foreground text-sm line-clamp-2">{content}</p>
        {redirectPath && (
          <a
            href={redirectPath}
            target="_blank"
            rel="noopener noreferrer"
            className="block mt-1 text-primary text-sm hover:underline"
          >
            View Details
          </a>
        )}
        <p className="mt-1 text-muted-foreground text-xs">
          {new Date(timestamp).toLocaleString()}
        </p>
      </div>
    </div>
  );
}

export function NotificationBell() {
  const { notifications, wsStatus, clearNotification, clearAllNotifications } =
    useNotifications();
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative hover:bg-muted"
          aria-label={`Notifications (${notifications.length})`}
        >
          <Bell className="w-5 h-5" />
          {notifications.length > 0 && (
            <Badge
              variant="destructive"
              className="-top-1 -right-1 absolute flex justify-center items-center rounded-full w-5 h-5 text-xs"
            >
              {notifications.length}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="bg-background shadow-lg p-0 border rounded-lg w-96">
        <div className="flex justify-between items-center px-4 py-3">
          <div>
            <h3 className="font-semibold text-foreground text-lg">
              Notifications
            </h3>
            <p className="text-muted-foreground text-xs">Status: {wsStatus}</p>
          </div>
          {notifications.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-foreground"
              onClick={clearAllNotifications}
            >
              Clear All
            </Button>
          )}
        </div>
        <Separator />
        <ScrollArea className="h-[400px]">
          {notifications.length === 0 ? (
            <div className="p-6 text-center">
              <Bell className="mx-auto mb-2 w-8 h-8 text-muted-foreground" />
              <p className="text-muted-foreground text-sm">No notifications</p>
            </div>
          ) : (
            notifications.map((notification, index) => (
              <div key={notification.id}>
                <NotificationItem
                  notification={notification}
                  onClear={clearNotification}
                />
                {index < notifications.length - 1 && <Separator />}
              </div>
            ))
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}

function getWebSocketUrl(httpUrl: string): string {
  const wsUrl = httpUrl.replace(/^http(s?)/, "ws$1");
  return wsUrl;
}
