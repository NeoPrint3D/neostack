import { useState, useEffect } from "react";
import { Button } from "@neostack/ui/components/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@neostack/ui/components/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@neostack/ui/components/table";
import { toast } from "sonner";
import { apiClient } from "@/lib/apiClient";
import { Loader2 } from "lucide-react";
import type { InferResponseType } from "hono/client";

interface Pagination {
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export function PagesDashboardTranscripts() {
  const [transcripts, setTranscripts] = useState<
    InferResponseType<typeof apiClient.v1.transcripts.$get, 200>["data"]
  >([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 10,
    totalCount: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPreviousPage: false,
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch transcripts from the API
  const fetchTranscripts = async (page: number, limit: number) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.v1.transcripts.$get({
        query: { page: page.toString(), limit: limit.toString() },
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Failed to fetch transcripts");
      }
      const data = await response.json();
      setTranscripts(data.data);
      setPagination(data.pagination);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "An unexpected error occurred";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch and refetch on page/limit change
  useEffect(() => {
    fetchTranscripts(pagination.page, pagination.limit);
  }, []);

  // Handle page change
  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      fetchTranscripts(newPage, pagination.limit);
    }
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="mx-auto container">
      <h1 className="mb-6 font-bold text-3xl tracking-tight">
        Transcripts Dashboard
      </h1>
      <div className="gap-6 grid lg:grid-cols-3">
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Your Transcripts</CardTitle>
            <CardDescription>
              View and manage your transcription jobs.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center items-center py-8">
                <Loader2 className="w-6 h-6 animate-spin" />
                <span className="ml-2">Loading transcripts...</span>
              </div>
            ) : error ? (
              <div className="py-8 text-red-500 text-center">{error}</div>
            ) : transcripts.length === 0 ? (
              <div className="py-8 text-gray-500 text-center">
                No transcripts found. Upload an audio file to get started.
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Created At</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transcripts.map((transcript) => (
                      <TableRow key={transcript.id}>
                        <TableCell>
                          <Button variant="link" asChild>
                            <a href={`/dashboard/transcripts/${transcript.id}`}>
                              {transcript.title || "Untitled"}
                            </a>
                          </Button>
                        </TableCell>
                        <TableCell>
                          {formatDate(transcript.createdAt)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {/* Pagination Controls */}
                <div className="flex justify-between items-center mt-6">
                  <div className="text-gray-500 text-sm">
                    Showing {transcripts.length} of {pagination.totalCount}{" "}
                    transcripts
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(pagination.page - 1)}
                      disabled={!pagination.hasPreviousPage || loading}
                    >
                      Previous
                    </Button>
                    <div className="text-sm">
                      Page {pagination.page} of {pagination.totalPages}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(pagination.page + 1)}
                      disabled={!pagination.hasNextPage || loading}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
