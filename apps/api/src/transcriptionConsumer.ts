import { transcriptionChunks, transcriptions } from "@neostack/database";
import { nanoid } from "nanoid";
import { TranscriptionData, Notification } from "./client";
import { db } from "./lib/database";
import { AppEnv } from "./types/AppEnv";

// Interface definitions
interface VTTLine {
  startTime: number; // in milliseconds
  endTime: number; // in milliseconds
  text: string;
}

interface Sentence {
  text: string;
  startTime: number; // in milliseconds
  endTime: number; // in milliseconds
}

interface Chunk {
  text: string;
  startTime: number; // in milliseconds
  endTime: number; // in milliseconds
}

// Parse VTT file and extract cues
function parseVTT(vttContent: string): VTTLine[] {
  const lines = vttContent.split("\n");
  const cues: VTTLine[] = [];
  let currentCue: Partial<VTTLine> | null = null;

  const parseTime = (time: string): number => {
    try {
      const cleanedTime = time.trim();
      if (!cleanedTime) throw new Error("Empty timestamp");

      const parts = cleanedTime
        .split(/[:.]/)
        .map((part) => parseInt(part.padStart(2, "0")));
      let hours = 0,
        minutes = 0,
        seconds = 0,
        millis = 0;
      if (parts.length >= 4) {
        [hours, minutes, seconds, millis] = parts.slice(-4);
      } else if (parts.length === 3) {
        [minutes, seconds, millis] = parts;
      } else if (parts.length === 2) {
        [seconds, millis] = parts;
      } else {
        throw new Error("Invalid time format");
      }

      return hours * 3600000 + minutes * 60000 + seconds * 1000 + millis;
    } catch (e) {
      throw new Error(
        `Failed to parse time: ${time} - ${
          e instanceof Error ? e.message : String(e)
        }`
      );
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line === "" || line === "WEBVTT" || line.startsWith("NOTE")) continue;

    if (line.includes("-->")) {
      try {
        const timeParts = line.split(" --> ");
        if (timeParts.length !== 2 || !timeParts[1].trim()) {
          console.warn(
            `Skipping malformed timestamp at line ${i + 1}: ${line}`
          );
          continue;
        }
        const [start, end] = timeParts.map(parseTime);
        currentCue = { startTime: start, endTime: end, text: "" };
      } catch (e) {
        console.warn(
          `Invalid timestamp at line ${i + 1}: ${line} - ${
            e instanceof Error ? e.message : String(e)
          }`
        );
        continue;
      }
    } else if (currentCue) {
      if (line) {
        currentCue.text =
          (currentCue.text || "") + (currentCue.text ? " " : "") + line;
      }
      if (
        i === lines.length - 1 ||
        lines[i + 1]?.trim().includes("-->") ||
        lines[i + 1]?.trim() === ""
      ) {
        if (currentCue.text?.trim()) {
          cues.push(currentCue as VTTLine);
        }
        currentCue = null;
      }
    }
  }

  console.log(`Parsed ${cues.length} cues from VTT`);
  return cues;
}

// Format time in milliseconds to HH:MM:SS
function formatTime(ms: number): string {
  const hours = Math.floor(ms / 3600000);
  const minutes = Math.floor((ms % 3600000) / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  return `[Time: ${hours.toString().padStart(2, "0")}:${minutes
    .toString()
    .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}]`;
}

// Reconstruct sentences from word-level VTT cues
function reconstructSentences(cues: VTTLine[]): Sentence[] {
  const sentences: Sentence[] = [];
  let currentSentence: Partial<Sentence> = {
    text: "",
    startTime: 0,
    endTime: 0,
  };
  const timeGapThreshold = 500; // Milliseconds to consider a sentence break
  const minWordsPerSentence = 3; // Minimum words to form a sentence

  for (let i = 0; i < cues.length; i++) {
    const cue = cues[i];
    const nextCue = cues[i + 1];

    if (!currentSentence.startTime) {
      currentSentence.startTime = cue.startTime;
    }
    currentSentence.text =
      (currentSentence.text || "") +
      (currentSentence.text ? " " : "") +
      cue.text;
    currentSentence.endTime = cue.endTime;

    const isLastCue = i === cues.length - 1;
    const timeGap = nextCue ? nextCue.startTime - cue.endTime : 0;
    const isPunctuation = /[.!?]/.test(cue.text.trim());
    const wordCount = currentSentence.text?.trim().split(/\s+/).length || 0;

    if (
      isPunctuation ||
      isLastCue ||
      (timeGap > timeGapThreshold && wordCount >= minWordsPerSentence) ||
      cue.text.toLowerCase().includes("next line")
    ) {
      if (currentSentence.text && currentSentence.text.trim().length > 0) {
        const formattedText = currentSentence.text
          .split("next line")
          .map((part, index) => {
            if (index === 0 && part.trim()) {
              return part.trim();
            }
            return part.trim();
          })
          .filter((part) => part)
          .join("\n");
        sentences.push({
          ...currentSentence,
          text: formattedText,
        } as Sentence);
      }
      currentSentence = { text: "", startTime: 0, endTime: 0 };
    }
  }

  if (currentSentence.text?.trim()) {
    const formattedText = currentSentence.text
      .split("next line")
      .map((part, index) => {
        if (index === 0 && part.trim()) {
          return part.trim();
        }
        return part.trim();
      })
      .filter((part) => part)
      .join("\n");
    sentences.push({
      ...currentSentence,
      text: formattedText,
    } as Sentence);
  }

  console.log(`Reconstructed ${sentences.length} sentences`);
  return sentences.filter((s) => s.text.trim().length > 0);
}

function chunkSentences(sentences: Sentence[]): Chunk[] {
  const chunks: Chunk[] = sentences.map((sentence) => ({
    text: sentence.text,
    startTime: sentence.startTime,
    endTime: sentence.endTime,
  }));

  console.log(`Generated ${chunks.length} chunks`);
  return chunks;
}

export async function transcriptionConsumer(
  env: AppEnv,
  message: Message<TranscriptionData>
): Promise<void> {
  const { transcriptId, audioPath, userId } = message.body;
  const id = env.NOTIFICATION_WEBSOCKET_SERVER.idFromName(userId);
  const notificationStub = env.NOTIFICATION_WEBSOCKET_SERVER.get(id);

  try {
    // Send initial notification
    const queueStatusNotification: Notification = {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      type: "queueStatus",
      title: `Transcription ${transcriptId} started`,
      content: "",
      redirectPath: `/dashboard/transcripts/${transcriptId}`,
    };

    await notificationStub.fetch("http://do/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(queueStatusNotification),
    });

    // Fetch audio file
    const audioFile = await env.BUCKET.get(audioPath);
    if (!audioFile) {
      throw new Error(`Audio file not found at path: ${audioPath}`);
    }

    // Convert audio to base64
    const audioBuffer = await audioFile.arrayBuffer();
    const audioBase64 = Buffer.from(audioBuffer).toString("base64");
    const audioSizeMB =
      Buffer.byteLength(audioBase64, "base64") / (1024 * 1024);
    console.log(`Processing audio file (${audioSizeMB.toFixed(2)} MB)`);

    // Run Whisper for transcription
    const whisperOutput = await env.AI.run(
      "@cf/openai/whisper-large-v3-turbo",
      { audio: audioBase64 }
    );

    if (!whisperOutput?.text || !whisperOutput?.vtt) {
      throw new Error("Whisper transcription failed");
    }

    // Generate summary and title
    const summaryPrompt = `
Summarize the following text in 2-3 sentences, focusing only on key factual details such as dates, locations, people, events, or other objective information. Do not include opinions, analysis, or sensitive personal details. The text is a transcription of a factual report or conversation:
      ${whisperOutput.text} SUMMARY ONLY NO OTHER EXTRA WORDS
    `;
    const llamaOutputSummary = (await env.AI.run(
      "@cf/meta/llama-3.2-1b-instruct",
      {
        prompt: summaryPrompt,
        max_tokens: 150,
      }
    )) as { response: string };

    const titlePrompt = `
Generate a clear and concise title (10-15 words) for the following summary, capturing the main factual topic, such as important dates, locations, people, or events. Avoid including opinions, analysis, or sensitive personal details:
      ${llamaOutputSummary.response} TITLE ONLY NO OTHER EXTRA WORDS
    `;
    const llamaOutputTitle = (await env.AI.run(
      "@cf/meta/llama-3.2-1b-instruct",
      {
        prompt: titlePrompt,
        max_tokens: 64,
      }
    )) as { response: string };

    // Save transcript files
    const transcriptPath = `transcriptions/${userId}/${transcriptId}/transcript.txt`;
    const vttPath = `transcriptions/${userId}/${transcriptId}/subtitles.vtt`;

    await Promise.all([
      env.BUCKET.put(transcriptPath, whisperOutput.text, {
        httpMetadata: {
          contentType: "text/plain",
        },
      }),
      env.BUCKET.put(vttPath, whisperOutput.vtt, {
        httpMetadata: {
          contentType: "text/vtt",
        },
      }),
    ]);

    // Process VTT and create chunks
    let chunks: Chunk[] = [];
    if (!whisperOutput.vtt || !whisperOutput.vtt.includes("WEBVTT")) {
      console.warn("Invalid or empty VTT output, falling back to single chunk");
      chunks = [
        {
          text: whisperOutput.text || "No transcription available",
          startTime: 0,
          endTime: 0,
        },
      ];
    } else {
      const cues = parseVTT(whisperOutput.vtt);
      if (cues.length === 0) {
        console.warn("No valid cues parsed, falling back to single chunk");
        chunks = [
          {
            text: whisperOutput.text || "No transcription available",
            startTime: 0,
            endTime: 0,
          },
        ];
      } else {
        const sentences = reconstructSentences(cues);
        if (sentences.length === 0) {
          console.warn(
            "No sentences reconstructed, falling back to single chunk"
          );
          chunks = [
            {
              text: whisperOutput.text || "No transcription available",
              startTime: 0,
              endTime: 0,
            },
          ];
        } else {
          chunks = chunkSentences(sentences);
          if (chunks.length === 0) {
            console.warn("No chunks generated, falling back to single chunk");
            chunks = [
              {
                text: whisperOutput.text || "No transcription available",
                startTime: 0,
                endTime: 0,
              },
            ];
          }
        }
      }
    }

    // Create chunks and embeddings
    const chunkInserts = await Promise.all(
      chunks.map(async (chunk, index) => {
        // Prepend time to chunk text before embedding

        const chunkEmbedding = (await env.AI.run("@cf/baai/bge-large-en-v1.5", {
          text: chunk.text,
        })) as { data: number[][] };

        return {
          id: `trnchk_${nanoid()}`,
          transcriptionId: transcriptId,
          chunkIndex: index,
          chunkText: chunk.text,
          startTime: chunk.startTime,
          endTime: chunk.endTime,
          embedding: chunkEmbedding.data[0],
          createdAt: new Date(),
        } satisfies typeof transcriptionChunks.$inferInsert;
      })
    );

    // Insert transcription and chunks into database
    await db(env).transaction(async (tx) => {
      await tx.insert(transcriptions).values({
        id: transcriptId,
        userId,
        title: llamaOutputTitle.response || "Untitled Transcription",
        summary: llamaOutputSummary.response || "No summary available",
        audioPath,
        subtitlePath: vttPath,
        transcriptPath,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      if (chunkInserts.length > 0) {
        await tx.insert(transcriptionChunks).values(chunkInserts);
      } else {
        console.warn("Skipping chunk insertion due to empty chunks");
      }
    });

    // Send completion notification
    const transcriptionCompletionNotification: Notification = {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      type: "queueStatus",
      title: `Transcription finished - ${llamaOutputTitle.response}`,
      content: llamaOutputSummary.response,
      redirectPath: `/dashboard/transcripts/${transcriptId}`,
    };

    await notificationStub.fetch("http://do/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(transcriptionCompletionNotification),
    });

    message.ack();
  } catch (error) {
    const err = error as Error;
    console.error(`Consumer error for job ${userId}-${transcriptId}`, err);

    const notification: Notification = {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      type: "queueStatus",
      title: `Transcription failed`,
      content: err.message || "Transcription failed",
      redirectPath: `/dashboard/transcripts/${transcriptId}`,
    };

    await notificationStub.fetch("http://do/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(notification),
    });

    throw err;
  }
}
