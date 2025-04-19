import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@neostack/ui/components/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@neostack/ui/components/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@neostack/ui/components/form";
import { Input } from "@neostack/ui/components/input";
import { toast } from "sonner";
import { apiClient } from "@/lib/apiClient";
import { Loader2 } from "lucide-react";

// --- Schemas ---
const singleUploadSchema = z.object({
  audioFile: z
    .instanceof(File)
    .refine(
      (file) => file.type.startsWith("audio/"),
      "File must be an audio file"
    ),
});

const batchUploadSchema = z.object({
  audioFiles: z
    .array(
      z
        .instanceof(File)
        .refine(
          (file) => file.type.startsWith("audio/"),
          "File must be an audio file"
        )
    )
    .min(1, "At least one audio file is required"),
});

// --- Tab Component ---
const Tabs = ({
  activeTab,
  setActiveTab,
}: {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}) => {
  return (
    <div className="flex mb-6 border-gray-200 border-b">
      {["Single", "Batch"].map((tab) => (
        <button
          key={tab}
          className={`px-4 py-2 text-sm font-medium ${
            activeTab === tab
              ? "border-b-2 border-blue-500 text-blue-600"
              : "text-gray-500 hover:text-gray-700"
          }`}
          onClick={() => setActiveTab(tab)}
        >
          {tab} Upload
        </button>
      ))}
    </div>
  );
};

// --- Main Component ---
export function PagesDashboardAudioFileUpload({
  initialAuth,
}: {
  initialAuth: Auth;
}) {
  const [activeTab, setActiveTab] = useState<"Single" | "Batch">("Single");

  // Form for single upload
  const singleForm = useForm<z.infer<typeof singleUploadSchema>>({
    resolver: zodResolver(singleUploadSchema),
    defaultValues: { audioFile: undefined },
  });

  // Form for batch upload
  const batchForm = useForm<z.infer<typeof batchUploadSchema>>({
    resolver: zodResolver(batchUploadSchema),
    defaultValues: { audioFiles: [] },
  });

  // Handle single file upload
  async function onSingleSubmit(values: z.infer<typeof singleUploadSchema>) {
    const response = await apiClient.v1.transcripts.process.$post({
      form: {
        audio: values.audioFile,
      },
    });

    if (!response.ok) {
      const data = await response.json();
      toast.error(data.message);
    }

    singleForm.reset();
  }

  // Handle batch file upload
  async function onBatchSubmit(values: z.infer<typeof batchUploadSchema>) {
    try {
      const response = await apiClient.v1.transcripts.process.$post({
        form: {
          audio: values.audioFiles,
        },
      });

      const data = await response.json();
      toast.success(`Batch transcription jobs queued successfully!`);
      batchForm.reset();
    } catch (error) {
      console.error("Error queuing batch transcription jobs:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to queue batch transcription jobs"
      );
    }
  }

  return (
    <div className="mx-auto container">
      <h1 className="mb-6 font-bold text-3xl tracking-tight">
        Audio File Upload Dashboard
      </h1>
      <div className="gap-6 grid lg:grid-cols-3">
        {/* Form Card */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Upload Audio Files</CardTitle>
            <CardDescription>
              Upload one or multiple audio files for transcription.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs
              activeTab={activeTab}
              setActiveTab={(tab) => setActiveTab(tab as "Single" | "Batch")}
            />
            {activeTab === "Single" ? (
              <Form {...singleForm}>
                <form
                  onSubmit={singleForm.handleSubmit(onSingleSubmit)}
                  className="space-y-4"
                >
                  <FormField
                    control={singleForm.control}
                    name="audioFile"
                    render={({ field: { onChange, value, ...rest } }) => (
                      <FormItem>
                        <FormLabel>Audio File</FormLabel>
                        <FormControl>
                          <Input
                            type="file"
                            accept="audio/*"
                            disabled={singleForm.formState.isSubmitting}
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) onChange(file);
                            }}
                            {...rest}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button
                    type="submit"
                    disabled={singleForm.formState.isSubmitting}
                    className="w-full"
                  >
                    {singleForm.formState.isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      "Upload File"
                    )}
                  </Button>
                </form>
              </Form>
            ) : (
              <Form {...batchForm}>
                <form
                  onSubmit={batchForm.handleSubmit(onBatchSubmit)}
                  className="space-y-4"
                >
                  <FormField
                    control={batchForm.control}
                    name="audioFiles"
                    render={({ field: { onChange, value, ...rest } }) => (
                      <FormItem>
                        <FormLabel>Audio Files</FormLabel>
                        <FormControl>
                          <Input
                            type="file"
                            accept="audio/*"
                            multiple
                            disabled={batchForm.formState.isSubmitting}
                            onChange={(e) => {
                              const files = Array.from(e.target.files || []);
                              if (files.length) onChange(files);
                            }}
                            {...rest}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button
                    type="submit"
                    disabled={batchForm.formState.isSubmitting}
                    className="w-full"
                  >
                    {batchForm.formState.isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      "Upload Files"
                    )}
                  </Button>
                </form>
              </Form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
