import { allowBrowser } from "@/middleware/allowBrowser";
import { AppContext } from "@/types/AppEnv";
import { Hono } from "hono";

export const notificationRouter = new Hono<AppContext>()
  .basePath("/notifications")
  .post("/clear/:id", allowBrowser, async (c) => {
    const user = c.get("user");
    if (!user?.id) {
      return c.json({ message: "Unauthorized" }, 401);
    }
    const notificationId = c.req.param("id");
    if (!notificationId) {
      return c.json({ message: "Notification ID is required" }, 400);
    }

    const id = c.env.NOTIFICATION_WEBSOCKET_SERVER.idFromName(user.id);
    const pollerStub = c.env.NOTIFICATION_WEBSOCKET_SERVER.get(id);
    const response = await pollerStub.fetch(
      `http://do/clear/${notificationId}`,
      {
        method: "POST",
      }
    );

    if (!response.ok) {
      return c.json({ message: "Failed to clear notification" }, 500);
    }

    return c.json({ message: "Notification cleared" });
  })

  .post("/clear", allowBrowser, async (c) => {
    const user = c.get("user");
    if (!user?.id) {
      return c.json({ message: "Unauthorized" }, 401);
    }

    const id = c.env.NOTIFICATION_WEBSOCKET_SERVER.idFromName(user.id);
    const pollerStub = c.env.NOTIFICATION_WEBSOCKET_SERVER.get(id);
    const response = await pollerStub.fetch("http://do/clear", {
      method: "POST",
    });

    if (!response.ok) {
      return c.json({ message: "Failed to clear all notifications" }, 500);
    }

    return c.json({ message: "All notifications cleared" });
  })
  .get("/ws", async (c) => {
    const user = c.get("user");
    if (!user?.id) {
      return c.json({ message: "Unauthorized" }, 401);
    }
    const upgradeHeader = c.req.header("Upgrade");
    if (upgradeHeader?.toLowerCase() !== "websocket") {
      return new Response("Expected WebSocket upgrade", { status: 426 });
    }
    const id = c.env.NOTIFICATION_WEBSOCKET_SERVER.idFromName(user.id);
    const pollerStub = c.env.NOTIFICATION_WEBSOCKET_SERVER.get(id);
    return pollerStub.fetch(c.req.raw);
  });
