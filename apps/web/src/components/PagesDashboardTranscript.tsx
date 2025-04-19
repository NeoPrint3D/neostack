import React, { useState, useCallback, useEffect, useRef } from "react";
import {
  useQuery,
  QueryClientProvider,
  QueryClient,
} from "@tanstack/react-query";
import { Input } from "@neostack/ui/components/input"; // Adjust path
import { Card, CardContent } from "@neostack/ui/components/card"; // Adjust path
import { Skeleton } from "@neostack/ui/components/skeleton"; // Adjust path
import { motion, AnimatePresence } from "motion/react";
import { Button } from "@neostack/ui/components/button"; // Adjust path
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogFooter,
  DialogClose,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@neostack/ui/components/dialog"; // Adjust path
import { toast } from "sonner";
import {
  Loader2,
  ArrowLeft,
  ArrowRight,
  Search,
  Info,
  Download,
} from "lucide-react";
import { apiClient } from "@/lib/apiClient"; // Adjust path, Assuming fetchTranscriptText is exported from apiClient
import type { transcriptions } from "@neostack/database"; // Adjust path
import { useDebounce } from "@uidotdev/usehooks";
import { cn } from "@neostack/ui/lib/utils"; // Adjust path
import { ScrollArea } from "@neostack/ui/components/scroll-area"; // Adjust path

// --- Custom useKeyPress Hook (Client-Side Safe) ---
interface UseKeyPressOptions {
  target?: EventTarget | null | (() => EventTarget | null);
  event?: "keydown" | "keyup";
}
function useKeyPress(
  targetKey: string | string[],
  callback: (event: KeyboardEvent) => void,
  options: UseKeyPressOptions = {}
): void {
  const { event = "keydown" } = options;
  const targetOption = options.target;
  const handleKeyPress = useCallback(
    (event: Event) => {
      const keyboardEvent = event as KeyboardEvent;
      const keysToCheck = Array.isArray(targetKey) ? targetKey : [targetKey];
      if (keysToCheck.includes(keyboardEvent.key)) {
        const targetElement = keyboardEvent.target as HTMLElement;
        const isInputFocused = ["INPUT", "TEXTAREA", "SELECT"].includes(
          targetElement?.tagName
        );
        if (
          !isInputFocused &&
          !keyboardEvent.metaKey &&
          !keyboardEvent.ctrlKey &&
          !keyboardEvent.altKey
        ) {
          callback(keyboardEvent);
        }
      }
    },
    [targetKey, callback]
  );
  useEffect(() => {
    if (typeof window === "undefined") return;
    const getTarget = () => {
      if (targetOption) {
        return typeof targetOption === "function"
          ? targetOption()
          : targetOption;
      }
      return window;
    };
    const targetElement = getTarget();
    if (!targetElement) return;
    targetElement.addEventListener(event, handleKeyPress);
    return () => {
      targetElement.removeEventListener(event, handleKeyPress);
    };
  }, [targetKey, handleKeyPress, event, targetOption]);
}

// --- Helper Function ---
const formatMilliseconds = (ms: number): string => {
  if (isNaN(ms) || ms < 0) {
    return "Invalid time";
  }
  let totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  totalSeconds %= 3600;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const parts: string[] = [];
  if (hours > 0) parts.push(`${hours} hr`);
  if (minutes > 0) parts.push(`${minutes} min`);
  if (seconds > 0 || parts.length === 0) parts.push(`${seconds} sec`);
  return parts.join(" ") || "0 sec";
};

// --- Interfaces & Types ---
interface TranscriptChunk {
  id: string;
  chunkText: string;
  startTime: number;
  endTime: number;
  chunkIndex: number;
  similarity?: number;
  isMain?: boolean;
}

// --- Constants ---
const INITIAL_LOAD_COUNT = 10;
const SEARCH_CONTEXT_SIZE = 15;
const NAV_NEIGHBOR_LOAD_COUNT = 5;
const SUMMARY_TRUNCATE_LENGTH = 235;

// --- API Call Functions ---
const fetchInitialSearchResult = async ({
  transcriptId,
  searchQuery,
  contextSize = SEARCH_CONTEXT_SIZE,
}: {
  transcriptId: string;
  searchQuery: string;
  contextSize?: number;
}): Promise<{ chunks: TranscriptChunk[]; mainChunkId: string | null }> => {
  if (!searchQuery) return { chunks: [], mainChunkId: null };
  try {
    const response = await apiClient.v1.transcripts[":id"].search.$get({
      param: { id: transcriptId },
      query: {
        q: searchQuery,
        previous: String(contextSize),
        next: String(contextSize),
      },
    });
    if (!response.ok) throw new Error(`Search failed (${response.status})`);
    const result = (await response.json()).data;
    if (!result.mainChunk) return { chunks: [], mainChunkId: null };
    const pChunks = (result.previousContext || []).map((c) => ({
      ...c,
      isMain: false,
    }));
    const nChunks = (result.nextContext || []).map((c) => ({
      ...c,
      isMain: false,
    }));
    const mainChunkWithSimilarity = {
      ...result.mainChunk,
      isMain: true,
      similarity: result.mainChunk.similarity,
    };
    const combined = [...pChunks, mainChunkWithSimilarity, ...nChunks];
    const uniqueMap = new Map<string, TranscriptChunk>();
    combined.forEach((c) => {
      if (!uniqueMap.has(c.id) || (c.isMain && !uniqueMap.get(c.id)?.isMain))
        uniqueMap.set(c.id, c);
    });
    const sorted = Array.from(uniqueMap.values()).sort(
      (a, b) => a.chunkIndex - b.chunkIndex
    );
    return { chunks: sorted, mainChunkId: result.mainChunk.id };
  } catch (error) {
    console.error("Error fetchInitialSearchResult:", error);
    throw error;
  }
};
const fetchInitialChunks = async ({
  transcriptId,
  limit = INITIAL_LOAD_COUNT,
}: {
  transcriptId: string;
  limit?: number;
}): Promise<TranscriptChunk[]> => {
  try {
    const response = await apiClient.v1.transcripts[":id"].chunk[
      ":chunkIndex"
    ].neighbors.$get({
      param: { id: transcriptId, chunkIndex: "0" },
      query: { startNext: "0", endNext: String(limit - 1) },
    });
    if (!response.ok) {
      if (response.status === 404) return [];
      throw new Error(`Initial chunks failed (${response.status})`);
    }
    const result = (await response.json()).data;
    const iChunk = { ...result.mainChunk, isMain: false };
    const nChunks = (result.nextContext || []).map((c) => ({
      ...c,
      isMain: false,
    }));
    const combined = [iChunk, ...nChunks];
    const sorted = combined.sort((a, b) => a.chunkIndex - b.chunkIndex);
    return sorted;
  } catch (error) {
    console.error("Error fetchInitialChunks:", error);
    throw error;
  }
};
const fetchNeighborChunks = async ({
  transcriptId,
  anchorChunkIndex,
  direction,
  count = NAV_NEIGHBOR_LOAD_COUNT,
}: {
  transcriptId: string;
  anchorChunkIndex: number;
  direction: "previous" | "next";
  count?: number;
}): Promise<TranscriptChunk[]> => {
  try {
    let qParams: Record<string, string> = {};
    if (direction === "previous") qParams = { endPrevious: String(count) };
    else qParams = { endNext: String(count) };
    const response = await apiClient.v1.transcripts[":id"].chunk[
      ":chunkIndex"
    ].neighbors.$get({
      param: { id: transcriptId, chunkIndex: String(anchorChunkIndex) },
      query: qParams,
    });
    if (!response.ok) {
      if (response.status === 404) return [];
      throw new Error(`Neighbors batch fetch failed (${response.status})`);
    }
    const result = (await response.json()).data;
    let fetched: TranscriptChunk[] = [];
    if (direction === "previous")
      fetched = (result.previousContext || []).map((c) => ({
        ...c,
        isMain: false,
      }));
    else
      fetched = (result.nextContext || []).map((c) => ({
        ...c,
        isMain: false,
      }));
    return fetched;
  } catch (error) {
    console.error(`Error fetch ${direction} neighbors batch:`, error);
    toast.error(`Failed to load ${direction} chunks.`);
    return [];
  }
};

// --- React Query Hooks ---
const useInitialSearch = ({
  transcriptId,
  searchQuery,
}: {
  transcriptId: string;
  searchQuery: string;
}) => {
  return useQuery({
    queryKey: ["transcriptSearch", transcriptId, searchQuery],
    queryFn: () => fetchInitialSearchResult({ transcriptId, searchQuery }),
    enabled: !!transcriptId && !!searchQuery.trim(),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 1,
    refetchOnWindowFocus: false,
  });
};
const useInitialChunks = ({
  transcriptId,
  enabled,
}: {
  transcriptId: string;
  enabled: boolean;
}) => {
  return useQuery({
    queryKey: ["transcriptInitialChunks", transcriptId],
    queryFn: () =>
      fetchInitialChunks({ transcriptId, limit: INITIAL_LOAD_COUNT }),
    enabled: !!transcriptId && enabled,
    staleTime: 15 * 60 * 1000,
    gcTime: 20 * 60 * 1000,
    retry: 1,
    refetchOnWindowFocus: false,
  });
};

// --- Component ---
const queryClient = new QueryClient();

interface PagesDashboardTranscriptProps {
  transcript: typeof transcriptions.$inferSelect;
  // Removed transcriptText prop, will be fetched on demand
}

export function PagesDashboardTranscript({
  transcript,
}: PagesDashboardTranscriptProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <Page transcript={transcript} />
    </QueryClientProvider>
  );
}

function Page({ transcript }: PagesDashboardTranscriptProps) {
  // State
  const [searchInputValue, setSearchInputValue] = useState("");
  const debouncedSearchQuery = useDebounce(searchInputValue.trim(), 300);
  const [displayedChunks, setDisplayedChunks] = useState<TranscriptChunk[]>([]);
  const [mainChunkId, setMainChunkId] = useState<string | null>(null);
  const [activeChunkIndex, setActiveChunkIndex] = useState<number | null>(null);
  const [isFetchingNeighbor, setIsFetchingNeighbor] = useState(false);
  const [hasReachedStart, setHasReachedStart] = useState(false);
  const [hasReachedEnd, setHasReachedEnd] = useState(false);
  const [isSummaryExpanded, setIsSummaryExpanded] = useState(false);
  const [fullTranscriptText, setFullTranscriptText] = useState<string | null>(
    null
  ); // State for fetched full text
  const [isFetchingFullText, setIsFetchingFullText] = useState(false);
  const hasAttemptedFetchFullText = useRef(false); // Track fetch attempt

  // Refs
  const fetchedIndices = useRef(new Set<number>());
  const scrollViewportRef = useRef<HTMLDivElement>(null);
  const isProcessingAction = useRef(false);
  const fetchDirectionRef = useRef<"previous" | "next" | null>(null);
  const scrollTargetIndex = useRef<number | null>(null);
  const scrollBehavior = useRef<ScrollBehavior>("smooth");
  const scrollBlock = useRef<ScrollLogicalPosition>("nearest");

  // Data Fetching Hooks
  const isSearchMode = !!debouncedSearchQuery;
  const {
    data: initialSearchData,
    isLoading: isLoadingInitialSearch,
    error: initialSearchError,
    isFetching: isFetchingInitialSearch,
    isSuccess: isInitialSearchSuccess,
  } = useInitialSearch({
    transcriptId: transcript.id,
    searchQuery: debouncedSearchQuery,
  });
  const {
    data: initialChunksData,
    isLoading: isLoadingInitialChunks,
    error: initialChunksError,
    isFetching: isFetchingInitialChunks,
    isSuccess: isInitialChunksSuccess,
  } = useInitialChunks({ transcriptId: transcript.id, enabled: !isSearchMode });
  const isLoadingInitialData = isSearchMode
    ? isLoadingInitialSearch
    : isLoadingInitialChunks;
  const isFetchingInitialData = isSearchMode
    ? isFetchingInitialSearch
    : isFetchingInitialChunks;
  const initialDataError = isSearchMode
    ? initialSearchError
    : initialChunksError;

  // --- Scroll To Chunk Helper ---
  const scheduleScrollToChunk = useCallback(
    (
      index: number | null,
      behavior: ScrollBehavior = "smooth",
      block: ScrollLogicalPosition = "nearest"
    ) => {
      if (index !== null) {
        console.log(`Scheduling scroll to index: ${index}`);
        scrollTargetIndex.current = index;
        scrollBehavior.current = behavior;
        scrollBlock.current = block;
      }
    },
    []
  );

  // --- Navigation Logic ---
  const navigateAndEnsureChunks = useCallback(
    async (direction: "previous" | "next") => {
      if (isProcessingAction.current || activeChunkIndex === null) return;
      const targetIndex =
        direction === "previous" ? activeChunkIndex - 1 : activeChunkIndex + 1;
      if (
        (direction === "previous" && activeChunkIndex === 0) ||
        targetIndex < 0
      ) {
        setHasReachedStart(true);
        toast.info("Reached the beginning.");
        return;
      }
      const targetChunkExistsLocally = displayedChunks.some(
        (c) => c.chunkIndex === targetIndex
      );
      if (direction === "next" && hasReachedEnd && !targetChunkExistsLocally) {
        toast.info("Reached the end.");
        return;
      }
      isProcessingAction.current = true;
      let boundaryHitDuringFetch = false;
      let newChunksFetched: TranscriptChunk[] = [];
      const needsFetch = !targetChunkExistsLocally;
      if (needsFetch) {
        if (!(direction === "next" && hasReachedEnd)) {
          fetchDirectionRef.current = direction;
          setIsFetchingNeighbor(true);
          const anchorIndexForFetch = activeChunkIndex;
          const fetchedChunks = await fetchNeighborChunks({
            transcriptId: transcript.id,
            anchorChunkIndex: anchorIndexForFetch,
            direction: direction,
            count: NAV_NEIGHBOR_LOAD_COUNT,
          });
          setIsFetchingNeighbor(false);
          fetchDirectionRef.current = null;
          if (fetchedChunks.length > 0) {
            newChunksFetched = fetchedChunks.filter(
              (c) => !fetchedIndices.current.has(c.chunkIndex)
            );
            if (newChunksFetched.length > 0) {
              setDisplayedChunks((prev) =>
                [...prev, ...newChunksFetched].sort(
                  (a, b) => a.chunkIndex - b.chunkIndex
                )
              );
              newChunksFetched.forEach((c) =>
                fetchedIndices.current.add(c.chunkIndex)
              );
            }
            if (
              direction === "previous" &&
              newChunksFetched.some((c) => c.chunkIndex === 0)
            ) {
              boundaryHitDuringFetch = true;
              setHasReachedStart(true);
            }
            if (
              direction === "next" &&
              fetchedChunks.length < NAV_NEIGHBOR_LOAD_COUNT
            ) {
              boundaryHitDuringFetch = true;
              setHasReachedEnd(true);
            }
          } else {
            boundaryHitDuringFetch = true;
            if (direction === "previous") setHasReachedStart(true);
            if (direction === "next") setHasReachedEnd(true);
            toast.info(
              direction === "previous"
                ? "Reached the beginning."
                : "Reached the end."
            );
          }
        } else {
          boundaryHitDuringFetch = true;
        }
      }
      if (!boundaryHitDuringFetch) {
        setActiveChunkIndex(targetIndex);
        setHasReachedStart(targetIndex === 0);
        if (direction === "previous") setHasReachedEnd(false);
        scheduleScrollToChunk(targetIndex, "smooth", "nearest");
      }
      isProcessingAction.current = false;
    },
    [
      activeChunkIndex,
      transcript.id,
      displayedChunks,
      hasReachedEnd,
      hasReachedStart,
      scheduleScrollToChunk,
    ]
  );

  const handleNavigatePrevious = useCallback(
    () => navigateAndEnsureChunks("previous"),
    [navigateAndEnsureChunks]
  );
  const handleNavigateNext = useCallback(
    () => navigateAndEnsureChunks("next"),
    [navigateAndEnsureChunks]
  );

  // --- Effect for Initial Load / Search Change ---
  useEffect(() => {
    console.log("=== Initial Load Effect START ===");
    setDisplayedChunks([]);
    setMainChunkId(null);
    setActiveChunkIndex(null);
    setHasReachedStart(false);
    setHasReachedEnd(false);
    setIsFetchingNeighbor(false);
    fetchedIndices.current.clear();
    isProcessingAction.current = false;
    fetchDirectionRef.current = null;
    scrollTargetIndex.current = null;
    if (scrollViewportRef.current) {
      scrollViewportRef.current.scrollTop = 0;
    }
    let dataToProcess: TranscriptChunk[] | null = null;
    let potentialMainChunkId: string | null = null;
    let potentialActiveIndex: number | null = null;
    let querySucceeded = false;
    if (isSearchMode) {
      if (isInitialSearchSuccess && initialSearchData?.chunks) {
        dataToProcess = initialSearchData.chunks;
        potentialMainChunkId = initialSearchData.mainChunkId;
        potentialActiveIndex =
          dataToProcess.find((c) => c.id === potentialMainChunkId)
            ?.chunkIndex ??
          dataToProcess[0]?.chunkIndex ??
          null;
        querySucceeded = true;
      } else if (isInitialSearchSuccess) {
        querySucceeded = true;
        dataToProcess = [];
      }
    } else {
      if (isInitialChunksSuccess && initialChunksData) {
        dataToProcess = initialChunksData;
        potentialActiveIndex = dataToProcess.length > 0 ? 0 : null;
        querySucceeded = true;
      } else if (isInitialChunksSuccess) {
        querySucceeded = true;
        dataToProcess = [];
      }
    }
    if (querySucceeded && dataToProcess) {
      setDisplayedChunks(dataToProcess);
      setMainChunkId(potentialMainChunkId);
      setActiveChunkIndex(potentialActiveIndex);
      dataToProcess.forEach((chunk) =>
        fetchedIndices.current.add(chunk.chunkIndex)
      );
      const newHasReachedStart =
        potentialActiveIndex === 0 || dataToProcess.length === 0;
      const newHasReachedEnd = false;
      setHasReachedStart(newHasReachedStart);
      setHasReachedEnd(newHasReachedEnd);
      console.log(
        `Initial State Updated: ${dataToProcess.length} chunks. ActiveIdx=${potentialActiveIndex}, Start=${newHasReachedStart}, End=${newHasReachedEnd}`
      );
      if (potentialActiveIndex !== null) {
        scheduleScrollToChunk(potentialActiveIndex, "auto", "center");
      }
    } else if (querySucceeded && !dataToProcess) {
      setHasReachedStart(true);
      setHasReachedEnd(true);
    }
    console.log("=== Initial Load Effect END ===");
  }, [
    transcript.id,
    isSearchMode,
    initialSearchData,
    isInitialSearchSuccess,
    initialChunksData,
    isInitialChunksSuccess,
    scheduleScrollToChunk,
  ]);

  // --- Effect for scrolling AFTER state updates ---
  useEffect(() => {
    if (scrollTargetIndex.current !== null) {
      const timer = setTimeout(() => {
        const indexToScroll = scrollTargetIndex.current;
        const behavior = scrollBehavior.current;
        const block = scrollBlock.current;
        const targetChunk = displayedChunks.find(
          (c) => c.chunkIndex === indexToScroll
        );
        if (targetChunk) {
          const chunkId = targetChunk.id;
          const element = document.getElementById(`chunk-${chunkId}`);
          const viewport = scrollViewportRef.current;
          if (element && viewport) {
            console.log(
              `Executing scheduled scroll to index: ${indexToScroll} (id: ${chunkId})`
            );
            const viewportRect = viewport.getBoundingClientRect();
            const elementRect = element.getBoundingClientRect();
            let offset = 0;
            if (block === "center")
              offset = viewportRect.height / 2 - elementRect.height / 2;
            else if (block === "start") offset = 20;
            else if (block === "end")
              offset = viewportRect.height - elementRect.height - 20;
            else if (block === "nearest") {
              if (
                elementRect.top >= viewportRect.top &&
                elementRect.bottom <= viewportRect.bottom
              )
                return;
              const viewportCenter = viewportRect.top + viewportRect.height / 2;
              offset =
                elementRect.top < viewportCenter
                  ? 20
                  : viewportRect.height - elementRect.height - 20;
            }
            const elementTop = elementRect.top - viewportRect.top;
            const desiredScrollTop = viewport.scrollTop + elementTop - offset;
            viewport.scrollTo({
              top: Math.max(0, desiredScrollTop),
              behavior: behavior,
            });
          } else {
            console.warn(
              `Scheduled scroll target element chunk-${chunkId} or viewport not found.`
            );
          }
        } else {
          console.warn(
            `Scheduled scroll: Chunk index ${indexToScroll} not found in current displayedChunks.`
          );
        }
        scrollTargetIndex.current = null;
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [displayedChunks, activeChunkIndex]); // Re-run when chunks or active index change

  // --- Custom useKeyPress hook integration ---
  useKeyPress("ArrowLeft", (e) => {
    e.preventDefault();
    handleNavigatePrevious();
  });
  useKeyPress("ArrowRight", (e) => {
    e.preventDefault();
    handleNavigateNext();
  });

  // --- Handler to fetch full text ---
  const handleOpenFullTextView = async () => {
    if (
      !fullTranscriptText &&
      !isFetchingFullText &&
      !hasAttemptedFetchFullText.current
    ) {
      setIsFetchingFullText(true);
      hasAttemptedFetchFullText.current = true;
      const transcriptTextRes = await apiClient.v1.transcripts[":id"].text.$get(
        {
          param: { id: transcript.id },
        }
      );

      if (transcriptTextRes.ok) {
        const transcriptTextData = await transcriptTextRes.json();
        setFullTranscriptText(transcriptTextData.data);
        setIsFetchingFullText(false);
      }
    } else if (!fullTranscriptText && hasAttemptedFetchFullText.current) {
      toast.error("Full transcript text is not available.");
    }
  };

  // --- Download Handlers ---
  const [isLoadingVtt, setIsLoadingVtt] = useState(false);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const [isLoadingTranscript, setIsLoadingTranscript] = useState(false);
  const triggerDownload = (
    url: string | undefined | null,
    filename: string,
    type: string
  ): boolean => {
    if (!url) {
      toast.error(`No ${type} file available.`);
      return false;
    }
    try {
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success(`${type} download started.`);
      return true;
    } catch (error) {
      console.error(`Error downloading ${type}:`, error);
      toast.error(`Failed to download ${type}.`);
      return false;
    }
  };
  const handleDownloadVtt = () => {
    setIsLoadingVtt(true);
    triggerDownload(
      transcript.subtitlePath,
      `${transcript.title || "transcript"}.vtt`,
      "VTT"
    );
    setTimeout(() => setIsLoadingVtt(false), 500);
  };
  const handleDownloadAudio = () => {
    setIsLoadingAudio(true);
    triggerDownload(
      transcript.audioPath,
      `${transcript.title || "audio"}.mp3`,
      "Audio"
    );
    setTimeout(() => setIsLoadingAudio(false), 500);
  };
  // Updated Transcript Download to prioritize fetched text, then path
  const handleDownloadTranscript = () => {
    setIsLoadingTranscript(true);
    let success = false;
    const filename = `${transcript.title || "transcript"}.txt`;
    if (fullTranscriptText) {
      // Prioritize fetched text
      try {
        const blob = new Blob([fullTranscriptText], {
          type: "text/plain;charset=utf-8",
        });
        const url = URL.createObjectURL(blob);
        success = triggerDownload(url, filename, "Transcript Text (Generated)");
        URL.revokeObjectURL(url);
      } catch (error) {
        console.error("Error creating blob:", error);
        toast.error("Failed to prepare transcript download.");
      }
    } else if (transcript.transcriptPath) {
      // Fallback to path
      success = triggerDownload(
        transcript.transcriptPath,
        filename,
        "Transcript Text"
      );
    } else {
      toast.error("No transcript text available for download.");
    }
    setTimeout(() => setIsLoadingTranscript(false), 500);
  };

  // --- Summary Truncation Logic ---
  const summary = transcript.summary || "No summary available.";
  const needsTruncation = summary.length > SUMMARY_TRUNCATE_LENGTH;
  const displayedSummary =
    needsTruncation && !isSummaryExpanded
      ? summary.substring(0, SUMMARY_TRUNCATE_LENGTH) + "..."
      : summary;

  // --- Rendering ---
  const showLoadingSkeleton = isLoadingInitialData && !initialDataError;
  const showInitialError = !!initialDataError;
  const showChunks = displayedChunks.length > 0;
  const queryHasCompleted = isSearchMode
    ? isInitialSearchSuccess
    : isInitialChunksSuccess;
  const showNoResults =
    !isLoadingInitialData &&
    !isFetchingInitialData &&
    !initialDataError &&
    !showChunks &&
    queryHasCompleted;

  return (
    <div className="relative mx-auto">
      <div className="p-4 md:p-6">
        {/* Padding bottom for sticky bar */}
        {/* Title & Summary */}
        <h1 className="mb-2 font-bold text-3xl tracking-tight">
          {transcript.title || "Transcript Viewer"}
        </h1>
        <div className="mb-2 max-w-prose text-muted-foreground text-xs">
          <p className="transition-all duration-300">{displayedSummary}</p>
          {needsTruncation && (
            <Button
              variant="link"
              size="sm"
              className="mt-1 p-0 h-auto text-primary hover:no-underline"
              onClick={() => setIsSummaryExpanded(!isSummaryExpanded)}
            >
              {" "}
              {isSummaryExpanded ? "See less" : "See more"}{" "}
            </Button>
          )}
        </div>
        {/* Top action buttons */}
        <div className="flex flex-wrap gap-2 mb-4">
          {/* --- Downloads Dialog --- */}
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Download className="mr-2 w-4 h-4" /> Downloads & Full
                Transcript
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <motion.div layout /* ... */>
                <DialogHeader>
                  <DialogTitle>Download Options</DialogTitle>
                  <DialogDescription>
                    Download the transcript files or view the full text content
                    if available.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-3 py-4">
                  {/* --- Full Transcript Button & Nested Dialog --- */}
                  {/* Button always visible, triggers fetch */}
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={handleOpenFullTextView} // Fetch/check on open
                        disabled={isFetchingFullText}
                      >
                        {isFetchingFullText && (
                          <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                        )}
                        View Full Transcript
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="flex flex-col w-[90vw] max-w-[1200px] h-[90vh] max-h-[80vh]">
                      <DialogHeader className="flex-shrink-0">
                        <DialogTitle>Full Transcript</DialogTitle>
                      </DialogHeader>
                      <div className="flex-grow mt-2 mb-4 border rounded-md overflow-hidden">
                        <ScrollArea className="w-full h-full">
                          {isFetchingFullText ? (
                            <div className="flex justify-center items-center h-full">
                              <Loader2 className="w-8 h-8 text-muted-foreground animate-spin" />
                            </div>
                          ) : fullTranscriptText ? (
                            <pre className="p-4 font-sans text-sm break-words whitespace-pre-wrap">
                              {fullTranscriptText}
                            </pre>
                          ) : (
                            <p className="p-4 text-muted-foreground text-center italic">
                              Full transcript text could not be loaded or is not
                              available.
                            </p>
                          )}
                        </ScrollArea>
                      </div>
                      <DialogFooter className="flex-shrink-0">
                        <DialogClose asChild>
                          <Button type="button" variant="secondary">
                            Close
                          </Button>
                        </DialogClose>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>

                  {/* --- Download Buttons --- */}
                  <Button
                    onClick={handleDownloadTranscript}
                    disabled={
                      isLoadingTranscript ||
                      (!transcript.transcriptPath &&
                        !fullTranscriptText) /* Check both sources */
                    }
                    size="sm"
                    variant="secondary"
                    className="w-full"
                  >
                    {isLoadingTranscript ? (
                      <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                    ) : (
                      <Download className="mr-2 w-4 h-4" />
                    )}{" "}
                    Download Text (.txt)
                  </Button>
                  {transcript.audioPath ? (
                    <Button
                      onClick={handleDownloadAudio}
                      disabled={isLoadingAudio}
                      size="sm"
                      variant="secondary"
                      className="w-full"
                    >
                      {isLoadingAudio ? (
                        <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                      ) : (
                        <Download className="mr-2 w-4 h-4" />
                      )}{" "}
                      Download Audio (.mp3)
                    </Button>
                  ) : (
                    <Button
                      disabled
                      size="sm"
                      variant="secondary"
                      className="opacity-50 w-full"
                    >
                      <Download className="mr-2 w-4 h-4" /> Audio Not Available
                    </Button>
                  )}
                  {transcript.subtitlePath ? (
                    <Button
                      onClick={handleDownloadVtt}
                      disabled={isLoadingVtt}
                      size="sm"
                      variant="secondary"
                      className="w-full"
                    >
                      {isLoadingVtt ? (
                        <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                      ) : (
                        <Download className="mr-2 w-4 h-4" />
                      )}{" "}
                      Download Subtitles (.vtt)
                    </Button>
                  ) : (
                    <Button
                      disabled
                      size="sm"
                      variant="secondary"
                      className="opacity-50 w-full"
                    >
                      <Download className="mr-2 w-4 h-4" /> Subtitles Not
                      Available
                    </Button>
                  )}
                  {!transcript.audioPath &&
                    !transcript.subtitlePath &&
                    !transcript.transcriptPath &&
                    !fullTranscriptText && (
                      <p className="pt-2 text-muted-foreground text-xs text-center">
                        No downloadable files available.
                      </p>
                    )}
                </div>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button type="button" variant="outline">
                      Close
                    </Button>
                  </DialogClose>
                </DialogFooter>
              </motion.div>
            </DialogContent>
          </Dialog>

          {/* --- Metadata Dialog --- */}
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Info className="mr-2 w-4 h-4" /> View Metadata
              </Button>
            </DialogTrigger>
            <DialogContent className="w-full sm:max-w-md">
              <motion.div layout /* ... */>
                <DialogHeader>
                  <DialogTitle>Transcript Metadata</DialogTitle>
                  <DialogDescription>
                    Details about this transcript record.
                  </DialogDescription>
                </DialogHeader>
                <ScrollArea className="mt-2 -mr-4 mb-4 pr-4 max-h-[60vh]">
                  <div className="space-y-2 py-4 text-muted-foreground text-xs">
                    <div className="flex justify-between">
                      <span className="font-medium text-foreground">ID:</span>
                      <span className="font-mono break-all">
                        {transcript.id}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium text-foreground">
                        Title:
                      </span>
                      <span>
                        {transcript.title || <i className="opacity-70">N/A</i>}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium text-foreground">
                        Created:
                      </span>
                      <span>
                        {new Date(transcript.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium text-foreground">
                        Updated:
                      </span>
                      <span>
                        {new Date(transcript.updatedAt).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium text-foreground">
                        User ID:
                      </span>{" "}
                      <span className="font-mono break-all">
                        {transcript.userId}
                      </span>
                    </div>
                    <div className="flex justify-between items-start gap-2">
                      <span className="flex-shrink-0 font-medium text-foreground">
                        Audio Path:
                      </span>
                      <span className="font-mono text-right break-all">
                        {transcript.audioPath || (
                          <i className="opacity-70">N/A</i>
                        )}
                      </span>
                    </div>
                    {transcript.subtitlePath && (
                      <div className="flex justify-between items-start gap-2">
                        <span className="flex-shrink-0 font-medium text-foreground">
                          VTT Path:
                        </span>
                        <span className="font-mono text-right break-all">
                          {transcript.subtitlePath}
                        </span>
                      </div>
                    )}
                    {transcript.transcriptPath && (
                      <div className="flex justify-between items-start gap-2">
                        <span className="flex-shrink-0 font-medium text-foreground">
                          Text Path:
                        </span>
                        <span className="font-mono text-right break-all">
                          {transcript.transcriptPath}
                        </span>
                      </div>
                    )}
                  </div>
                </ScrollArea>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button type="button" variant="outline">
                      Close
                    </Button>
                  </DialogClose>
                </DialogFooter>
              </motion.div>
            </DialogContent>
          </Dialog>
        </div>
        {/* Transcript Chunks List Area */}
        <ScrollArea
          className="border rounded-md h-[calc(100vh-350px)]"
          viewportRef={scrollViewportRef}
        >
          <div className="relative p-1 sm:p-2">
            {showLoadingSkeleton ? (
              <div className="space-y-2">
                {/* Skeleton */}{" "}
                {Array.from({ length: 7 }).map((_, index) => (
                  <Card key={index} className="opacity-70 p-3">
                    <Skeleton className="mb-2 rounded w-4/5 h-5" />
                    <Skeleton className="rounded w-1/3 h-4" />
                  </Card>
                ))}
              </div>
            ) : showInitialError ? (
              <p className="px-4 py-10 text-destructive text-center">
                Error: {initialDataError.message}
              </p>
            ) : showNoResults ? (
              isSearchMode ? (
                <p className="px-4 py-10 text-muted-foreground text-center">
                  No results found for "{debouncedSearchQuery}".
                </p>
              ) : (
                <p className="px-4 py-10 text-muted-foreground text-center">
                  Transcript is empty.
                </p>
              )
            ) : showChunks ? (
              <AnimatePresence initial={false}>
                {displayedChunks.map((chunk) => (
                  <motion.div
                    key={chunk.id}
                    id={`chunk-${chunk.id}`}
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="mb-1.5"
                  >
                    <Card
                      className={cn(
                        "transition-all duration-200 ease-out border cursor-pointer p-0",
                        chunk.chunkIndex === activeChunkIndex &&
                          "bg-accent border-accent-foreground/60 ring-2 ring-accent-foreground/50 shadow-md scale-[1.01]", // Active
                        chunk.chunkIndex !== activeChunkIndex &&
                          chunk.id === mainChunkId &&
                          isSearchMode &&
                          "bg-primary/10 border-primary/40", // Search Result (inactive)
                        chunk.chunkIndex !== activeChunkIndex &&
                          !(chunk.id === mainChunkId && isSearchMode) &&
                          "border-border bg-card hover:bg-muted/50" // Default
                      )}
                      onClick={() => {
                        setActiveChunkIndex(chunk.chunkIndex);
                        setHasReachedStart(chunk.chunkIndex === 0);
                      }}
                    >
                      <CardContent className="flex sm:flex-row flex-col justify-between items-start gap-x-4 gap-y-1 px-3 py-2 text-sm">
                        <div className="flex-grow min-w-0">
                          <p className="break-words leading-relaxed">
                            {chunk.chunkText}
                          </p>
                        </div>
                        <div className="flex-shrink-0 pt-0.5 sm:pt-0 text-muted-foreground text-xs text-left sm:text-right whitespace-nowrap">
                          {formatMilliseconds(chunk.startTime)} -{" "}
                          {formatMilliseconds(chunk.endTime)}
                          {chunk.similarity !== undefined &&
                            chunk.id === mainChunkId &&
                            isSearchMode && (
                              <span className="block opacity-70 mt-0.5">
                                (Match: ~{(chunk.similarity * 100).toFixed(0)}%)
                              </span>
                            )}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            ) : null}
          </div>
        </ScrollArea>
      </div>{" "}
      {/* End padded content area */}
      {/* --- Sticky Bottom Control Bar --- */}
      <div className="right-0 bottom-0 left-0 z-20 fixed bg-background/95 shadow-md backdrop-blur-sm py-3 border-t border-border w-full">
        <div className="flex sm:flex-row flex-col justify-between items-center gap-3 sm:gap-4 ml-auto px-4 max-w-[calc(100%-var(--sidebar-width,0px))]">
          <Button
            variant="outline"
            size="sm"
            onClick={handleNavigatePrevious}
            disabled={
              isFetchingNeighbor ||
              isProcessingAction.current ||
              activeChunkIndex === null ||
              hasReachedStart
            }
            className="w-full sm:w-auto"
            aria-label="Previous Chunk (Left Arrow)"
          >
            {isFetchingNeighbor && fetchDirectionRef.current === "previous" ? (
              <Loader2 className="mr-2 w-4 h-4 animate-spin" />
            ) : (
              <ArrowLeft className="mr-2 w-4 h-4" />
            )}{" "}
            Prev (←)
          </Button>
          <div className="relative flex-grow order-first sm:order-none w-full sm:max-w-xs md:max-w-sm">
            <Search className="top-1/2 left-2.5 absolute w-4 h-4 text-muted-foreground -translate-y-1/2 pointer-events-none" />
            <Input
              type="search"
              placeholder="Search transcript..."
              value={searchInputValue}
              onChange={(e) => setSearchInputValue(e.target.value)}
              className="pl-8 w-full"
              aria-label="Search transcript input"
            />
            {(isLoadingInitialData || isFetchingInitialData) &&
              isSearchMode && (
                <div className="top-1/2 right-2.5 absolute -translate-y-1/2">
                  <Loader2 className="w-4 h-4 text-muted-foreground animate-spin" />
                </div>
              )}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleNavigateNext}
            disabled={
              isFetchingNeighbor ||
              isProcessingAction.current ||
              activeChunkIndex === null ||
              hasReachedEnd
            }
            className="w-full sm:w-auto"
            aria-label="Next Chunk (Right Arrow)"
          >
            {isFetchingNeighbor && fetchDirectionRef.current === "next" ? (
              <Loader2 className="mr-2 w-4 h-4 animate-spin" />
            ) : (
              <ArrowRight className="mr-2 w-4 h-4" />
            )}{" "}
            Next (→)
          </Button>
        </div>
      </div>
    </div>
  );
}
