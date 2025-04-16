import { AppContext } from "@/types/AppEnv";
import { Context, Next } from "hono";
import { env } from "hono/adapter";
import { cors } from "hono/cors";

export async function allowBrowser(c: Context<AppContext>, next: Next) {
  if (c.req.header("Upgrade") === "websocket") {
    return await next();
  }
  const corsMiddleware = cors({
    origin: c.env.TRUSTED_ORIGINS.split(","),
    allowHeaders: ["Content-Type", "Authorization", "Cookie"],
    allowMethods: ["POST", "GET", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
    credentials: true,
  });
  return await corsMiddleware(c, next);
}
