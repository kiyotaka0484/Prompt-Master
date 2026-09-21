import { ChatWindow, type SlotStatus } from "@/components/chat-window";
import { ThreadSidebar } from "@/components/thread-sidebar";
import { Button } from "@/components/ui/button";
import type { ExpertId } from "@/lib/experts";
import type {
  InferredFact,
  IntelligenceSignal,
} from "@/lib/interview-intelligence";
import {
  deriveTitle,
  loadThreads,
  newThreadId,
  saveThreads,
  type ThreadRecord,
} from "@/lib/threads";
import {
  saveThreadToCloud,
  deleteThreadFromCloud,
  renameThreadInCloud,
  toggleThreadFavoriteInCloud,
  subscribeToUserThreads,
} from "@/lib/cloud-db";
import { useAuth } from "@/contexts/auth-context";
import { AuthModal } from "@/components/auth-modal";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import type { UIMessage } from "ai";
import { Menu, X, Sun, Moon, Cloud, User as UserIcon } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import logo from "@/assets/prompt-master-logo.png";
import { toast } from "sonner";

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
  const { user, theme, toggleTheme } = useAuth();

  const [threads, setThreads] = useState<ThreadRecord[]>([]);
  const [ready, setReady] = useState(false);
  const [mobileSidebar, setMobileSidebar] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [liveProgress, setLiveProgress] = useState<{
    progress: number;
    quality: number;
    collected: string[];
    expert: ExpertId | null;
    slots: SlotStatus[];
    goal: string;
    inferredFacts?: InferredFact[];
    activeSignals?: IntelligenceSignal[];
    strategicFocus?: string;
  }>({
    progress: 0,
    quality: 0,
    collected: [],
    expert: null,
    slots: [],
    goal: "",
    inferredFacts: [],
    activeSignals: [],
    strategicFocus: "",
  });

  // Load local threads initially or listen to Cloud if logged in
  useEffect(() => {
    if (user) {
      const unsubscribe = subscribeToUserThreads(user.uid, (cloudThreads) => {
        if (cloudThreads.length > 0) {
          setThreads((prev) => {
            // merge cloud threads with current active thread if missing
            const activeInCloud = cloudThreads.find((t) => t.id === threadId);
            if (!activeInCloud) {
              const activeInLocal = prev.find((t) => t.id === threadId);
              if (activeInLocal) {
                return [activeInLocal, ...cloudThreads];
              }
            }
            return cloudThreads;
          });
        }
      });
      return () => unsubscribe();
    }
  }, [user, threadId]);

  // Load + auto-create thread if missing (so deep-links don't bounce to /).
  useEffect(() => {
    const loaded = loadThreads();
    const existing = loaded.find((t) => t.id === threadId);
    if (!existing) {
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
      if (user) {
        saveThreadToCloud(user.uid, newThread).catch(console.error);
      }
    } else {
      setThreads(loaded);
    }
    setReady(true);
  }, [threadId, user]);

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

        // Sync to cloud
        if (user) {
          saveThreadToCloud(user.uid, updated).catch((err) =>
            console.error("Cloud persist error:", err),
          );
        }

        return next;
      });
    },
    [threadId, user],
  );

  const handleRename = useCallback(
    (id: string, newTitle: string) => {
      setThreads((prev) => {
        const next = prev.map((t) =>
          t.id === id ? { ...t, title: newTitle, updatedAt: Date.now() } : t,
        );
        saveThreads(next);
        return next;
      });
      if (user) {
        renameThreadInCloud(user.uid, id, newTitle).catch((err) => {
          console.error("Failed to rename in cloud:", err);
          toast.error("Failed to sync rename to cloud");
        });
      }
      toast.success("Session renamed");
    },
    [user],
  );

  const handleToggleFavorite = useCallback(
    (id: string, isFavorite: boolean) => {
      setThreads((prev) => {
        const next = prev.map((t) =>
          t.id === id ? { ...t, isFavorite, updatedAt: Date.now() } : t,
        );
        saveThreads(next);
        return next;
      });
      if (user) {
        toggleThreadFavoriteInCloud(user.uid, id, isFavorite).catch((err) => {
          console.error("Failed to favorite in cloud:", err);
        });
      }
      toast.success(
        isFavorite ? "Session favorited and pinned" : "Session unfavorited",
      );
    },
    [user],
  );

  const handleDelete = useCallback(
    (id: string) => {
      setThreads((prev) => {
        const next = prev.filter((t) => t.id !== id);
        saveThreads(next);
        return next;
      });
      if (user) {
        deleteThreadFromCloud(user.uid, id).catch((err) => {
          console.error("Failed to delete from cloud:", err);
        });
      }
      toast.success("Session deleted");

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
        if (user) {
          saveThreadToCloud(user.uid, fresh).catch(console.error);
        }
        void navigate({
          to: "/chat/$threadId",
          params: { threadId: fresh.id },
          replace: true,
        });
      }
    },
    [navigate, threadId, user],
  );

  if (!ready || !activeThread) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-background text-foreground relative overflow-hidden">
        <div className="pointer-events-none absolute h-64 w-64 rounded-full bg-primary/20 blur-3xl" />
        <div className="relative z-10 flex flex-col items-center gap-4">
          <div className="relative animate-pulse">
            <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-primary to-fuchsia-600 opacity-70 blur-sm" />
            <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl border border-primary/40 bg-card p-1">
              <img
                src={logo}
                alt="Prompt Master"
                className="h-10 w-10 object-contain"
              />
            </div>
          </div>
          <div className="text-center">
            <div className="text-sm font-semibold tracking-wide text-foreground">
              Initializing Interview Studio
            </div>
            <div className="text-xs text-muted-foreground mt-0.5">
              Loading session context…
            </div>
          </div>
        </div>
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
      inferredFacts={liveProgress.inferredFacts}
      activeSignals={liveProgress.activeSignals}
      strategicFocus={liveProgress.strategicFocus}
      onDelete={handleDelete}
      onRename={handleRename}
      onToggleFavorite={handleToggleFavorite}
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

      <div className="flex flex-1 flex-col min-w-0">
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

          <div className="text-sm font-semibold truncate max-w-[180px]">
            {activeThread.title}
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => toggleTheme()}
              title={`Switch to ${theme === "dark" ? "Light" : "Dark"} mode`}
            >
              {theme === "dark" ? (
                <Sun className="h-4 w-4 text-amber-400" />
              ) : (
                <Moon className="h-4 w-4 text-primary" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => setAuthModalOpen(true)}
              title="Account & Cloud Sync"
            >
              {user ? (
                <Cloud className="h-4 w-4 text-emerald-400" />
              ) : (
                <UserIcon className="h-4 w-4" />
              )}
            </Button>
          </div>
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

      <AuthModal open={authModalOpen} onOpenChange={setAuthModalOpen} />
    </div>
  );
}
