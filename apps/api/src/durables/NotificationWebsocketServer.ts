import { Notification, notificationSchema } from "@/client";
import { AppEnv } from "@/types/AppEnv";
import { zValidator } from "@hono/zod-validator";
import { DurableObject } from "cloudflare:workers";
import { Hono } from "hono";

export class NotificationWebsocketServer extends DurableObject<AppEnv> {
  private app: Hono = new Hono();
  private notifications: Map<string, Notification> = new Map();

  constructor(state: DurableObjectState, env: AppEnv) {
    super(state, env);

    // Initialize routes
    this.app.post("/create", async (c) => {
      try {
        const message = await c.req.json();

        await this.ctx.storage.put(`message:${message.id}`, message);
        this.notifications.set(message.id, message);
        for (const ws of this.ctx.getWebSockets()) {
          ws.send(JSON.stringify(message));
        }
        return c.json({ success: true }, 200);
      } catch (error) {
        console.error("Error creating notification:", error);
        return c.json({ error: "Failed to create notification" }, 500);
      }
    });

    this.app.post("/clear", async (c) => {
      try {
        // Clear all notifications from storage and in-memory map
        await this.ctx.storage.deleteAll();
        this.notifications.clear();
        for (const ws of this.ctx.getWebSockets()) {
          ws.send(
            JSON.stringify({
              type: "clear",
            })
          );
        }
        return c.json({ success: true }, 200);
      } catch (error) {
        console.error("Error clearing notifications:", error);
        return c.json({ error: "Failed to clear notifications" }, 500);
      }
    });

    this.app.post("/clear/:id", async (c) => {
      const { id } = c.req.param();
      try {
        // Clear all notifications from storage and in-memory map
        await this.ctx.storage.delete(id);
        this.notifications.delete(id);
        for (const ws of this.ctx.getWebSockets()) {
          ws.send(
            JSON.stringify({
              type: "clear-id",
              payload: id,
            })
          );
        }
        return c.json({ success: true }, 200);
      } catch (error) {
        console.error("Error clearing notifications:", error);
        return c.json({ error: "Failed to clear notifications" }, 500);
      }
    });

    // Load existing notifications
    this.ctx.blockConcurrencyWhile(async () => {
      try {
        const storedNotifications = await this.ctx.storage.list<Notification>({
          prefix: "message:",
        });

        for (const [key, value] of storedNotifications) {
          const notificationId = key.replace("message:", "");
          this.notifications.set(notificationId, value);
        }
      } catch (error) {
        console.error("Error loading stored notifications:", error);
      }
    });
  }

  async webSocketMessage(ws: WebSocket, message: string | ArrayBuffer) {
    try {
      const msg =
        typeof message === "string"
          ? message
          : new TextDecoder().decode(message);

      if (msg.toLowerCase() === "ping") {
        ws.send("pong");
        return;
      }

      const data = JSON.parse(msg);
      ws.send(JSON.stringify({ type: "received", data }));
    } catch (error) {
      console.error("WebSocket message error:", error);
      ws.send(JSON.stringify({ error: "Invalid message" }));
    }
  }

  async webSocketClose(
    ws: WebSocket,
    code: number,
    reason: string,
    wasClean: boolean
  ) {
    try {
      ws.close(code, "Durable Object is closing WebSocket");
    } catch (error) {
      console.error("Error closing WebSocket:", error);
    }
  }

  async webSocketError(ws: WebSocket, error: Error) {
    console.error("WebSocket error:", error);
    try {
      ws.close(1001, "WebSocket error occurred");
    } catch (error) {
      console.error("Error closing WebSocket:", error);
    }
  }

  async fetch(request: Request) {
    try {
      if (request.headers.get("Upgrade") === "websocket") {
        const pair = new WebSocketPair();
        const [client, server] = Object.values(pair);

        this.ctx.acceptWebSocket(server);

        const initialMessage = {
          type: "initialState",
          payload: Array.from(this.notifications.values()).map(
            (notification) => notification
          ),
        };
        server.send(JSON.stringify(initialMessage));

        return new Response(null, {
          status: 101,
          webSocket: client,
        });
      }
      return await this.app.fetch(request);
    } catch (error) {
      console.error("Fetch error:", error);
      return new Response("Internal Server Error", { status: 500 });
    }
  }
}
