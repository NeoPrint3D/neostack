import { Hono } from "hono";
import { createAuthClient } from "@/lib/auth";
import { appInfo } from "@neostack/constants";
import { AppContext, AppEnv, TranscriptionData } from "@/types/AppEnv"; // Assuming types are correctly placed
import { allowBrowser } from "./middleware/allowBrowser";
import { transcriptionRouter } from "./routes/transcription"; // Assume this route handles enqueueing
import { notificationRouter } from "./routes/notifications";
import { Notification } from "./client";
import { transcriptionChunks, transcriptions } from "@neostack/database";
import { db } from "./lib/database";
import { nanoid } from "nanoid";
import { transcriptionConsumer } from "./transcriptionConsumer";

export const app = new Hono<AppContext>()
  .get("/", (c) => c.redirect("/v1"))
  .basePath("/v1")
  .get("/", (c) => c.json({ message: `Welcome to ${appInfo.name}` }))
  .use("*", async (c, next) => {
    try {
      const session = await createAuthClient(c.env).api.getSession({
        headers: c.req.raw.headers,
      });
      c.set("user", session?.user ?? null);
      c.set("session", session?.session ?? null);
    } catch (error) {
      console.error("Auth middleware error:", error);
      c.set("user", null);
      c.set("session", null);
    }
    await next();
  })
  .route("/", transcriptionRouter)
  .route("/", notificationRouter);

app.use("/auth/*", allowBrowser);
app.on(["POST", "GET"], "/auth/*", (c) => {
  return createAuthClient(c.env).handler(c.req.raw);
});

// Default Export
export default {
  fetch: app.fetch,
  // @ts-ignore
  async queue(
    batch: MessageBatch<TranscriptionData>,
    env: AppEnv,
    ctx: ExecutionContext
  ): Promise<void> {
    await Promise.all(
      batch.messages.map((msg) => transcriptionConsumer(env, msg))
    );
  },
} satisfies ExportedHandler<AppEnv>;

export { NotificationWebsocketServer } from "@/durables/NotificationWebsocketServer";
