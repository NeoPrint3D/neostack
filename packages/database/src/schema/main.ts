import {
  pgTable,
  uuid,
  text,
  timestamp,
  boolean,
  integer,
  vector,
} from "drizzle-orm/pg-core";
import { users } from "./auth";

export const transcriptions = pgTable("transcriptions", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  summary: text("summary").notNull(),
  audioPath: text("audio_path").notNull(),
  subtitlePath: text("subtitle_path"),
  transcriptPath: text("transcript_path"),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const transcriptionChunks = pgTable("transcript_chunks", {
  id: text("id").primaryKey(),
  transcriptionId: text("transcription_id")
    .notNull()
    .references(() => transcriptions.id, { onDelete: "cascade" }),
  chunkIndex: integer("chunk_index").notNull(),
  chunkText: text("chunk_text").notNull(),
  startTime: integer("start_time").notNull(), // Store time in seconds
  endTime: integer("end_time").notNull(), // Store time in seconds
  embedding: vector("embedding", { dimensions: 1024 }), // adjust dimensions as needed
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
