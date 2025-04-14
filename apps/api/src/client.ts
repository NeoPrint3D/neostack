import { hc } from "hono/client";
import { app } from ".";
import { createAuthClient } from "./lib/auth";

const client = hc<typeof app>("");

export type ApiClient = typeof client;

export const api = (...args: Parameters<typeof hc>): ApiClient =>
  hc<typeof app>(...args);

export type BetterAuthInstance = Awaited<ReturnType<typeof createAuthClient>>;
