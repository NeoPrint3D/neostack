import { allowBrowser } from "@/middleware/allowBrowser";
import { AppContext, TranscriptionData } from "@/types/AppEnv";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { nanoid } from "nanoid";
import { z } from "zod";

export const transcriptionRouter = new Hono<AppContext>()
  .use(allowBrowser)
  .post(
    "/transcribe",
    zValidator(
      "form",
      z.object({
        audio: z.union([z.instanceof(File), z.array(z.instanceof(File))]),
      })
    ),
    async (c) => {
      const user = c.get("user");
      if (!user?.id) {
        return c.json({ message: "Unauthorized" }, 401);
      }

      const { audio } = c.req.valid("form");
      const files = Array.isArray(audio) ? audio : [audio];
      const jobIds: string[] = [];

      try {
        for (const file of files) {
          if (!file.type.startsWith("audio/")) {
            return c.json({ message: "Invalid file type" }, 400);
          }

          const timestamp = Date.now();

          const transcriptId = `trs_${nanoid()}`;

          const jobId = `${user.id}-${transcriptId}`;
          const audioPath = `${user.id}/transcriptions/${transcriptId}/audio.mp3`;

          // Store file in bucket
          await c.env.BUCKET.put(audioPath, await file.arrayBuffer());

          // Queue transcription job
          const message: TranscriptionData = {
            transcriptId: transcriptId,
            audioPath: audioPath,
            status: "enqueued",
            userId: user.id,
            timestamp,
          };

          await c.env.TRANSCRIPTION_QUEUE.send(message);
          jobIds.push(jobId);
        }

        return c.json(
          {
            message: `Transcription job${files.length > 1 ? "s" : ""} successfully queued`,
            jobIds,
          },
          202
        );
      } catch (error) {
        console.error("Transcription error:", error);
        return c.json({ message: "Failed to process transcription" }, 500);
      }
    }
  )
  .post("/test", async (c) => {
    const text = "hllo world";
    const embeddingOutput = await c.env.AI.run("@cf/baai/bge-m3", {
      text,
    });
    const llamaOutputTitle = await c.env.AI.run(
      "@cf/meta/llama-3.2-1b-instruct",
      {
        prompt: `Generate a concise title (max 64 characters) for this text: ${text}`,
        max_tokens: 64,
      }
    );
    return c.json({
      llamaOutputTitle,
      embeddingOutput,
    });
  });
