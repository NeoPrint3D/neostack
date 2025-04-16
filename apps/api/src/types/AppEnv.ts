import { BetterAuthInstance } from "@/client";
import { NotificationWebsocketServer } from "@/durables/NotificationWebsocketServer";

export interface AppEnv {
  BUCKET: R2Bucket;
  HYPERDRIVE: Hyperdrive;
  AI: Ai;

  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;

  STRIPE_SECRET_KEY: string;
  STRIPE_WEBHOOK_SECRET: string;

  BETTER_AUTH_URL: string;
  BETTER_AUTH_COOKIE_DOMAIN: string;
  TRUSTED_ORIGINS: string;

  RESEND_API_KEY: string;

  TRANSCRIPTION_QUEUE: Queue<TranscriptionData>;
  NOTIFICATION_WEBSOCKET_SERVER: DurableObjectNamespace<NotificationWebsocketServer>;
}

export type QueueStatus = "enqueued" | "processing" | "completed" | "failed";

export interface TranscriptionData {
  transcriptId: string;
  audioPath: string;
  userId: string;
  timestamp: number;
  status: QueueStatus;
}

export interface AppContext {
  Bindings: AppEnv;
  Variables: {
    user: BetterAuthInstance["$Infer"]["Session"]["user"] | null;
    session: BetterAuthInstance["$Infer"]["Session"]["session"] | null;
  };
}
