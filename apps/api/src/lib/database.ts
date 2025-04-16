import { AppEnv } from "@/types/AppEnv";
import { drizzle, PostgresJsDatabase } from "@neostack/database";

export const db = (env: AppEnv): PostgresJsDatabase =>
  drizzle(env.HYPERDRIVE.connectionString);
