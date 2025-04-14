import { Hono } from "hono";
import { createAuthClient, auth } from "./lib/auth";
import { BetterAuthInstance } from "./client";
import { cors } from "hono/cors";

export interface AppEnv {
  HYPERDRIVE: Hyperdrive;
  AI: Ai;

  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;

  STRIPE_SECRET_KEY: string;
  STRIPE_WEBHOOK_SECRET: string;

  BETTER_AUTH_URL: string;
  TRUSTED_ORIGINS: string;
}

export interface AppContext {
  Bindings: AppEnv;
  Variables: {
    user: BetterAuthInstance["$Infer"]["Session"]["user"] | null;
    session: BetterAuthInstance["$Infer"]["Session"]["session"] | null;
  };
}

export const app = new Hono<AppContext>()
  .get("/", (c) => c.redirect("/v1"))
  .basePath("/v1")
  .get("/", (c) => c.json({ message: "Welcome to the API" }))
  .use("/auth/*", async (c, next) => {
    const corsMiddleware = cors({
      origin: c.env.TRUSTED_ORIGINS.split(","),
      allowHeaders: ["Content-Type", "Authorization"],
      allowMethods: ["POST", "GET", "OPTIONS"],
      exposeHeaders: ["Content-Length"],
      maxAge: 600,
      credentials: true,
    });
    return await corsMiddleware(c, next);
  })
  .use("*", async (c, next) => {
    const session = await createAuthClient(c.env).api.getSession({
      headers: c.req.raw.headers,
    });

    if (!session) {
      c.set("user", null);
      c.set("session", null);
      return next();
    }

    c.set("user", session.user);
    c.set("session", session.session);
    return next();
  })
  .on(["POST", "GET"], "/auth/*", (c) => {
    return createAuthClient(c.env).handler(c.req.raw);
  });

export default {
  fetch: app.fetch,
} satisfies ExportedHandler<AppEnv>;
