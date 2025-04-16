import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@neostack/ui/components/card";
import { Button } from "@neostack/ui/components/button";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@neostack/ui/components/popover";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@neostack/ui/components/dialog"; // Import Dialog components
import { useState } from "react";
import { toast } from "sonner";
import type { transcriptions } from "@neostack/database";
import { Loader2 } from "lucide-react";

interface PagesDashboardTranscriptProps {
  transcript: typeof transcriptions.$inferSelect & { vttPath?: string }; // Add vttPath
  transcriptText: string;
}

export function PagesDashboardTranscript({
  transcript,
  transcriptText,
}: PagesDashboardTranscriptProps) {
  const [isLoadingVtt, setIsLoadingVtt] = useState(false);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const [isLoadingTranscript, setIsLoadingTranscript] = useState(false);

  // Function to handle downloading VTT file
  const handleDownloadVtt = async () => {
    if (!transcript.vttPath) {
      toast.error("No VTT file available for this transcript.");
      return;
    }

    try {
      setIsLoadingVtt(true);
      // Implement actual download logic here, e.g., window.location.href = vttUrl;
      toast.success("VTT file download started.");
    } catch (error) {
      toast.error("Failed to download VTT file.");
    } finally {
      setIsLoadingVtt(false);
    }
  };

  // Function to handle downloading audio file
  const handleDownloadAudio = async () => {
    if (!transcript.audioPath) {
      toast.error("No audio file available for this transcript.");
      return;
    }

    try {
      setIsLoadingAudio(true);
      // Implement actual download logic here, e.g., window.location.href = audioUrl;
      toast.success("Audio file download started.");
    } catch (error) {
      toast.error("Failed to download audio file.");
    } finally {
      setIsLoadingAudio(false);
    }
  };

  // Function to handle downloading transcript text file
  const handleDownloadTranscript = async () => {
    if (!transcript.transcriptPath) {
      toast.error("No transcript text file available for this transcript.");
      return;
    }

    try {
      setIsLoadingTranscript(true);
      // Implement actual download logic here, e.g., window.location.href = transcriptUrl;
      toast.success("Transcript text file download started.");
    } catch (error) {
      toast.error("Failed to download transcript text file.");
    } finally {
      setIsLoadingTranscript(false);
    }
  };

  return (
    <div className="mx-auto py-6 container">
      <h1 className="mb-6 font-bold text-3xl tracking-tight">
        Transcript Details
      </h1>
      <div className="gap-6 grid lg:grid-cols-3">
        {/* Transcript Details Card */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-3xl">{transcript.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-card-foreground text-lg">
                  Summary
                </h3>
                <p className="text-muted-foreground">{transcript.summary}</p>
              </div>
              <div className="flex gap-4">
                {transcriptText && (
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline">View Full Transcript</Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[600px]">
                      <DialogHeader>
                        <DialogTitle>Full Transcript</DialogTitle>
                      </DialogHeader>
                      <div className="max-h-[60vh] overflow-y-auto text-muted-foreground prose">
                        <pre>{transcriptText}</pre>
                      </div>
                    </DialogContent>
                  </Dialog>
                )}
                {/* Popover for download options */}
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline">Download Options</Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-60">
                    <div className="gap-4 grid">
                      <div className="space-y-2">
                        <h4 className="font-medium leading-none">
                          Download Options
                        </h4>
                        <p className="text-muted-foreground text-sm">
                          Select a file to download.
                        </p>
                      </div>
                      <div className="gap-2 grid">
                        {transcript.audioPath && (
                          <Button
                            onClick={handleDownloadAudio}
                            disabled={isLoadingAudio}
                            className="flex justify-start items-center"
                          >
                            {isLoadingAudio ? (
                              <>
                                <Loader2 className="mr-2 animate-spin" />{" "}
                                Downloading...
                              </>
                            ) : (
                              "Download MP3"
                            )}
                          </Button>
                        )}
                        {transcript.transcriptPath && (
                          <Button
                            onClick={handleDownloadTranscript}
                            disabled={isLoadingTranscript}
                            className="flex justify-start items-center"
                          >
                            {isLoadingTranscript ? (
                              <>
                                <Loader2 className="mr-2 animate-spin" />{" "}
                                Downloading...
                              </>
                            ) : (
                              "Download Transcript Text"
                            )}
                          </Button>
                        )}
                        {transcript.vttPath && (
                          <Button
                            onClick={handleDownloadVtt}
                            disabled={isLoadingVtt}
                            className="flex justify-start items-center"
                          >
                            {isLoadingVtt ? (
                              <>
                                <Loader2 className="mr-2 animate-spin" />{" "}
                                Downloading...
                              </>
                            ) : (
                              "Download VTT"
                            )}
                          </Button>
                        )}
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Metadata Card */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Metadata</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-muted-foreground text-xs">
              <p>
                <span className="font-semibold text-card-foreground">
                  Transcript ID:
                </span>{" "}
                {transcript.id}
              </p>
              <p>
                <span className="font-semibold text-card-foreground">
                  Created At:
                </span>{" "}
                {new Date(transcript.createdAt).toLocaleString()}
              </p>
              <p>
                <span className="font-semibold text-card-foreground">
                  Updated At:
                </span>{" "}
                {new Date(transcript.updatedAt).toLocaleString()}
              </p>
              <p>
                <span className="font-semibold text-card-foreground">
                  User ID:
                </span>{" "}
                {transcript.userId}
              </p>
              <p className="max-w-[50cj truncate">
                <span className="font-semibold text-card-foreground">
                  Audio Path:
                </span>{" "}
                {transcript.audioPath}
              </p>
              {transcript.vttPath && (
                <p>
                  <span className="font-semibold text-card-foreground">
                    VTT Path:
                  </span>{" "}
                  {transcript.vttPath}
                </p>
              )}
              {transcript.transcriptPath && (
                <p className="max-w-[50cj truncate">
                  <span className="font-semibold text-card-foreground">
                    Transcript Path:
                  </span>{" "}
                  {transcript.transcriptPath}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
