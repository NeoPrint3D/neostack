import { hc } from "hono/client";
import { app } from ".";
import { createAuthClient } from "./lib/auth";
import { z } from "zod";

const client = hc<typeof app>("");

export type ApiClient = typeof client;

export const api = (...args: Parameters<typeof hc>): ApiClient =>
  hc<typeof app>(...args);

export type BetterAuthInstance = Awaited<ReturnType<typeof createAuthClient>>;
export { TranscriptionData } from "@/types/AppEnv";

export const notificationSchema = z.object({
  id: z.string(),
  type: z.enum(["queueStatus", "invitation"]),
  timestamp: z.number(),
  redirectPath: z.string().optional(),
  title: z.string(),
  content: z.string(),
});

export type Notification = z.infer<typeof notificationSchema>;
