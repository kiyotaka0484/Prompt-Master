import { ChatWindow, type SlotStatus } from "@/components/chat-window";
import { ThreadSidebar } from "@/components/thread-sidebar";
import { Button } from "@/components/ui/button";
import type { ExpertId } from "@/lib/experts";
import {
  deriveTitle,
  loadThreads,
  newThreadId,
  saveThreads,
  type ThreadRecord,
} from "@/lib/threads";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import type { UIMessage } from "ai";
import { Menu, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

export const Route = createFileRoute("/chat/$threadId")({
  head: () => ({
    meta: [
      { title: "Session — Prompt Master" },
      { name: "description", content: "Your Prompt Master interview session." },
    ],
  }),
  component: ChatThreadPage,
});

function ChatThreadPage() {
  const { threadId } = Route.useParams();
  const navigate = useNavigate();
  const [threads, setThreads] = useState<ThreadRecord[]>([]);
  const [ready, setReady] = useState(false);
  const [mobileSidebar, setMobileSidebar] = useState(false);
  const [liveProgress, setLiveProgress] = useState<{
    progress: number;
    quality: number;
    collected: string[];
    expert: ExpertId | null;
    slots: SlotStatus[];
    goal: string;
  }>({
    progress: 0,
    quality: 0,
    collected: [],
    expert: null,
    slots: [],
    goal: "",
  });

  // Load + auto-create thread if missing (so deep-links don't bounce to /).
  useEffect(() => {
    const loaded = loadThreads();
    if (!loaded.find((t) => t.id === threadId)) {
      const newThread: ThreadRecord = {
        id: threadId,
        expert: null,
        title: "New session",
        updatedAt: Date.now(),
        messages: [],
      };
      const next = [newThread, ...loaded];
      saveThreads(next);
      setThreads(next);
    } else {
      setThreads(loaded);
    }
    setReady(true);
  }, [threadId]);

  const activeThread = useMemo(
    () => threads.find((t) => t.id === threadId),
    [threads, threadId],
  );

  // Reset live progress when switching threads.
  useEffect(() => {
    setLiveProgress({
      progress: 0,
      quality: 0,
      collected: [],
      expert: activeThread?.expert ?? null,
      slots: [],
      goal: "",
    });
  }, [threadId, activeThread?.expert]);

  const handlePersist = useCallback(
    (messages: UIMessage[], expertOverride?: ExpertId) => {
      setThreads((prev) => {
        const idx = prev.findIndex((t) => t.id === threadId);
        if (idx === -1) return prev;
        const cur = prev[idx];
        const title =
          cur.title === "New session" ? deriveTitle(messages) : cur.title;
        const updated: ThreadRecord = {
          ...cur,
          expert: cur.expert ?? expertOverride ?? null,
          title,
          messages,
          updatedAt: Date.now(),
        };
        const next = [...prev];
        next[idx] = updated;
        saveThreads(next);
        return next;
      });
    },
    [threadId],
  );

  const handleDelete = useCallback(
    (id: string) => {
      setThreads((prev) => {
        const next = prev.filter((t) => t.id !== id);
        saveThreads(next);
        return next;
      });
      if (id === threadId) {
        // Create a fresh thread and navigate to it.
        const fresh: ThreadRecord = {
          id: newThreadId(),
          expert: null,
          title: "New session",
          updatedAt: Date.now(),
          messages: [],
        };
        setThreads((prev) => {
          const next = [fresh, ...prev];
          saveThreads(next);
          return next;
        });
        void navigate({
          to: "/chat/$threadId",
          params: { threadId: fresh.id },
          replace: true,
        });
      }
    },
    [navigate, threadId],
  );

  if (!ready || !activeThread) {
    return (
      <div className="flex h-screen items-center justify-center bg-background text-sm text-muted-foreground">
        Loading session…
      </div>
    );
  }

  const sidebar = (
    <ThreadSidebar
      threads={threads}
      activeThreadId={threadId}
      activeExpert={liveProgress.expert ?? activeThread.expert ?? null}
      progress={liveProgress.progress}
      quality={liveProgress.quality}
      collected={liveProgress.collected}
      slots={liveProgress.slots}
      goal={liveProgress.goal}
      onDelete={handleDelete}
    />
  );

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      <div className="hidden md:block">{sidebar}</div>

      {mobileSidebar && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setMobileSidebar(false)}
            aria-hidden
          />
          <div className="absolute inset-y-0 left-0 shadow-2xl">{sidebar}</div>
        </div>
      )}

      <div className="flex flex-1 flex-col">
        <div className="flex items-center justify-between border-b border-border/50 px-3 py-2 md:hidden">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setMobileSidebar((v) => !v)}
            aria-label="Toggle sidebar"
          >
            {mobileSidebar ? (
              <X className="h-4 w-4" />
            ) : (
              <Menu className="h-4 w-4" />
            )}
          </Button>
          <div className="text-sm font-semibold">Prompt Master</div>
          <div className="w-8" />
        </div>

        <div className="min-h-0 flex-1">
          <ChatWindow
            key={activeThread.id}
            thread={activeThread}
            onPersist={handlePersist}
            onProgress={setLiveProgress}
          />
        </div>
      </div>
    </div>
  );
}
