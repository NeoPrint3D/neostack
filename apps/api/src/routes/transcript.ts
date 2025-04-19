import { db } from "@/lib/database";
import { allowBrowser } from "@/middleware/allowBrowser";
import { AppContext, TranscriptionData } from "@/types/AppEnv";
import { zValidator } from "@hono/zod-validator";
import {
  sql,
  transcriptionChunks,
  transcriptions,
  desc,
  eq,
  cosineDistance,
  asc,
} from "@neostack/database";
import { Hono } from "hono";
import { nanoid } from "nanoid";
import { z } from "zod";

export const transcriptionRouter = new Hono<AppContext>()
  .use(allowBrowser)
  .basePath("/transcripts")
  .get(
    "/",
    zValidator(
      "query",
      z.object({
        page: z.coerce.number().min(1).default(1),
        limit: z.coerce.number().min(1).max(100).default(10),
      })
    ),
    async (c) => {
      const user = c.get("user");
      if (!user?.id) {
        return c.json({ message: "Unauthorized" }, 401);
      }

      const { page, limit } = c.req.valid("query");

      try {
        // Calculate offset for pagination
        const offset = (page - 1) * limit;

        // Fetch transcripts with pagination
        const transcripts = await db(c.env)
          .select()
          .from(transcriptions)
          .where(eq(transcriptions.userId, user.id))
          .orderBy(desc(transcriptions.createdAt))
          .limit(limit)
          .offset(offset);

        // Get total count for pagination metadata
        const totalCountResult = await db(c.env)
          .select({
            count: sql<number>`count(*)`.as("count"),
          })
          .from(transcriptions)
          .where(eq(transcriptions.userId, user.id));

        const totalCount = totalCountResult[0]?.count || 0;
        const totalPages = Math.ceil(totalCount / limit);

        return c.json({
          message: "Transcripts retrieved successfully",
          data: transcripts,
          pagination: {
            page,
            limit,
            totalCount,
            totalPages,
            hasNextPage: page < totalPages,
            hasPreviousPage: page > 1,
          },
        });
      } catch (error) {
        console.error("Error fetching transcripts:", error);
        return c.json({ message: "Failed to fetch transcripts" }, 500);
      }
    }
  )
  .post(
    "/process",
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
      const transcriptIds: string[] = [];

      try {
        for (const file of files) {
          if (!file.type.startsWith("audio/")) {
            return c.json({ message: "Invalid file type" }, 400);
          }

          const timestamp = Date.now();

          const transcriptId = `trs_${nanoid()}`;

          const jobId = `${user.id}-${transcriptId}`;
          const audioPath = `transcriptions/${user.id}/${transcriptId}/audio.mp3`;

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
          transcriptIds.push(transcriptId);
        }

        return c.json(
          {
            message: `Transcription job${files.length > 1 ? "s" : ""} successfully queued`,
            data: transcriptIds,
          },
          202
        );
      } catch (error) {
        console.error("Transcription error:", error);
        return c.json({ message: "Failed to process transcription" }, 500);
      }
    }
  )
  .get(
    "/:id",
    zValidator("param", z.object({ id: z.string().min(1) })),
    zValidator(
      "query",
      z.object({
        includeChunks: z.coerce.boolean().default(false),
      })
    ),

    async (c) => {
      const user = c.get("user");
      if (!user?.id) {
        return c.json({ message: "Unauthorized" }, 401);
      }

      const { id } = c.req.valid("param");
      const { includeChunks } = c.req.valid("query");
      try {
        // Fetch the transcription
        const transcription = await db(c.env)
          .select()
          .from(transcriptions)
          .where(
            sql`${eq(transcriptions.id, id)} AND ${eq(
              transcriptions.userId,
              user.id
            )}`
          )
          .limit(1);
        if (transcription.length === 0) {
          return c.json({ message: "Transcription not found" }, 404);
        }
        const transcriptionData = transcription[0];

        return c.json({
          message: "Transcription retrieved successfully",
          data: transcriptionData,
        });
      } catch (error) {
        console.error("Error fetching transcription:", error);
        return c.json({ message: "Failed to fetch transcription" }, 500);
      }
    }
  )
  .get(
    "/:id/text",
    zValidator("param", z.object({ id: z.string().min(1) })),
    async (c) => {
      const user = c.get("user");
      if (!user?.id) {
        return c.json({ message: "Unauthorized" }, 401);
      }

      const { id } = c.req.valid("param");

      try {
        const transcript = await db(c.env)
          .select({
            transcriptPath: transcriptions.transcriptPath,
          })
          .from(transcriptions)
          .where(
            sql`${eq(transcriptions.id, id)} AND ${eq(
              transcriptions.userId,
              user.id
            )}`
          )
          .limit(1);
        if (transcript.length === 0) {
          return c.json({ message: "Transcription not found" }, 404);
        }
        const transcriptPath = transcript[0].transcriptPath;
        if (!transcriptPath) {
          return c.json({ message: "Transcript not available" }, 404);
        }
        const transcriptFile = await c.env.BUCKET.get(transcriptPath);
        if (!transcriptFile) {
          return c.json({ message: "Transcript file not found" }, 404);
        }
        const text = await transcriptFile.text();
        return c.json({
          message: "Transcription text retrieved successfully",
          data: text,
        });
      } catch (error) {
        console.error("Error fetching transcription text:", error);
        return c.json({ message: "Failed to fetch transcription text" }, 500);
      }
    }
  )

  .get(
    "/:id/search",
    zValidator("param", z.object({ id: z.string().min(1) })),
    zValidator(
      "query",
      z.object({
        q: z.string().min(1),
        previous: z.coerce.number().min(0).max(50).optional(),
        next: z.coerce.number().min(0).max(50).optional(),
      })
    ),
    async (c) => {
      const user = c.get("user");
      if (!user?.id) {
        return c.json({ message: "Unauthorized" }, 401);
      }

      const { id } = c.req.valid("param");
      const { q } = c.req.valid("query");
      const previous = c.req.valid("query").previous ?? 0;
      const next = c.req.valid("query").next ?? 0;

      try {
        // Generate embedding for the search query
        const queryEmbedding = (await c.env.AI.run(
          "@cf/baai/bge-large-en-v1.5",
          {
            text: q,
          }
        )) as { data: number[][] };

        if (!queryEmbedding.data || !queryEmbedding.data[0]) {
          return c.json({ message: "Failed to generate query embedding" }, 500);
        }

        // Prepare similarity SQL
        const similarity = sql<number>`1 - (${cosineDistance(
          transcriptionChunks.embedding,
          queryEmbedding.data[0]
        )})`;

        // Find the top matching chunk
        const topResultArr = await db(c.env)
          .select({
            id: transcriptionChunks.id,
            transcriptionId: transcriptionChunks.transcriptionId,
            chunkIndex: transcriptionChunks.chunkIndex,
            chunkText: transcriptionChunks.chunkText,
            startTime: transcriptionChunks.startTime,
            endTime: transcriptionChunks.endTime,
            similarity,
          })
          .from(transcriptionChunks)
          .innerJoin(
            transcriptions,
            eq(transcriptions.id, transcriptionChunks.transcriptionId)
          )
          .where(
            sql`${eq(transcriptions.id, id)} AND ${eq(
              transcriptions.userId,
              user.id
            )}`
          )
          .orderBy(desc(similarity))
          .limit(1);

        console.log("Top result:", topResultArr);

        if (topResultArr.length === 0) {
          return c.json({ message: "No results found" }, 404);
        }

        const mainChunk = topResultArr[0];

        // Fetch previousContext and nextContext
        type TranscriptionChunk = {
          id: string;
          chunkIndex: number;
          chunkText: string;
          startTime: number;
          endTime: number;
        };
        let previousContext: TranscriptionChunk[] = [];
        let nextContext: TranscriptionChunk[] = [];
        let prevId = null;
        let nextId = null;

        if (previous > 0) {
          previousContext = await db(c.env)
            .select({
              id: transcriptionChunks.id,
              chunkIndex: transcriptionChunks.chunkIndex,
              chunkText: transcriptionChunks.chunkText,
              startTime: transcriptionChunks.startTime,
              endTime: transcriptionChunks.endTime,
            })
            .from(transcriptionChunks)
            .where(
              sql`${eq(transcriptionChunks.transcriptionId, id)}
                AND ${transcriptionChunks.chunkIndex} BETWEEN ${mainChunk.chunkIndex - previous} AND ${mainChunk.chunkIndex - 1}`
            )
            .orderBy(transcriptionChunks.chunkIndex);

          if (previousContext.length > 0) {
            prevId = previousContext[previousContext.length - 1].id;
          }
        }

        if (next > 0) {
          nextContext = await db(c.env)
            .select({
              id: transcriptionChunks.id,
              chunkIndex: transcriptionChunks.chunkIndex,
              chunkText: transcriptionChunks.chunkText,
              startTime: transcriptionChunks.startTime,
              endTime: transcriptionChunks.endTime,
            })
            .from(transcriptionChunks)
            .where(
              sql`${eq(transcriptionChunks.transcriptionId, id)}
                AND ${transcriptionChunks.chunkIndex} BETWEEN ${mainChunk.chunkIndex + 1} AND ${mainChunk.chunkIndex + next}`
            )
            .orderBy(transcriptionChunks.chunkIndex);

          if (nextContext.length > 0) {
            nextId = nextContext[0].id;
          }
        }

        return c.json({
          message: "Context search completed",
          data: {
            mainChunk,
            previousContext,
            nextContext,
            prevId,
            nextId,
          },
        });
      } catch (error) {
        console.error("Search error:", error);
        return c.json({ message: "Failed to perform search" }, 500);
      }
    }
  )
  .get(
    "/:id/chunk/:chunkIndex/neighbors",
    zValidator(
      "param",
      z.object({ id: z.string(), chunkIndex: z.coerce.number() })
    ),
    zValidator(
      "query",
      z.object({
        startPrevious: z.coerce.number().min(0).max(50).optional(),
        endPrevious: z.coerce.number().min(0).max(50).optional(),
        startNext: z.coerce.number().min(0).max(50).optional(),
        endNext: z.coerce.number().min(0).max(50).optional(),
      })
    ),
    async (c) => {
      const user = c.get("user");
      if (!user?.id) {
        return c.json({ message: "Unauthorized" }, 401);
      }
      const { id, chunkIndex } = c.req.valid("param");
      const {
        startPrevious = 0,
        endPrevious = 3,
        startNext = 0,
        endNext = 3,
      } = c.req.valid("query");

      // Main chunk
      const mainChunkArr = await db(c.env)
        .select({
          id: transcriptionChunks.id,
          chunkIndex: transcriptionChunks.chunkIndex,
          chunkText: transcriptionChunks.chunkText,
          startTime: transcriptionChunks.startTime,
          endTime: transcriptionChunks.endTime,
        })
        .from(transcriptionChunks)
        .where(
          sql`${eq(transcriptionChunks.transcriptionId, id)}
            AND ${eq(transcriptionChunks.chunkIndex, chunkIndex)}`
        )
        .limit(1);

      if (mainChunkArr.length === 0) {
        return c.json({ message: "Main chunk not found" }, 404);
      }
      const mainChunk = mainChunkArr[0];

      // Previous context (from chunkIndex - endPrevious to chunkIndex - startPrevious - 1)
      let previousContext: any[] = [];
      if (endPrevious > startPrevious) {
        previousContext = await db(c.env)
          .select({
            id: transcriptionChunks.id,
            chunkIndex: transcriptionChunks.chunkIndex,
            chunkText: transcriptionChunks.chunkText,
            startTime: transcriptionChunks.startTime,
            endTime: transcriptionChunks.endTime,
          })
          .from(transcriptionChunks)
          .where(
            sql`${eq(transcriptionChunks.transcriptionId, id)}
              AND ${transcriptionChunks.chunkIndex} BETWEEN ${chunkIndex - endPrevious} AND ${chunkIndex - startPrevious - 1}`
          )
          .orderBy(asc(transcriptionChunks.chunkIndex));
      }

      // Next context (from chunkIndex + startNext + 1 to chunkIndex + endNext)
      let nextContext: any[] = [];
      if (endNext > startNext) {
        nextContext = await db(c.env)
          .select({
            id: transcriptionChunks.id,
            chunkIndex: transcriptionChunks.chunkIndex,
            chunkText: transcriptionChunks.chunkText,
            startTime: transcriptionChunks.startTime,
            endTime: transcriptionChunks.endTime,
          })
          .from(transcriptionChunks)
          .where(
            sql`${eq(transcriptionChunks.transcriptionId, id)}
              AND ${transcriptionChunks.chunkIndex} BETWEEN ${chunkIndex + startNext + 1} AND ${chunkIndex + endNext}`
          )
          .orderBy(transcriptionChunks.chunkIndex);
      }

      // prevId: last in previousContext if present
      const prevId =
        previousContext.length > 0
          ? previousContext[previousContext.length - 1].id
          : null;
      // nextId: first in nextContext if present
      const nextId = nextContext.length > 0 ? nextContext[0].id : null;

      return c.json({
        message: "Neighbors fetched",
        data: {
          mainChunk,
          previousContext,
          nextContext,
          prevId,
          nextId,
        },
      });
    }
  );
