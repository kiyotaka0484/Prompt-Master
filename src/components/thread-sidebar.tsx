import { useState, useMemo } from "react";
import type { SlotStatus } from "@/components/chat-window";
import { EXPERTS, EXPERT_LIST, type ExpertId } from "@/lib/experts";
import type {
  InferredFact,
  IntelligenceSignal,
} from "@/lib/interview-intelligence";
import { createFreshSession, type ThreadRecord } from "@/lib/threads";
import { cn } from "@/lib/utils";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  Plus,
  Trash2,
  Home,
  Sparkles,
  Search,
  Star,
  Edit2,
  Bookmark,
  Cloud,
  CheckCircle2,
  Sun,
  Moon,
  Zap,
  User as UserIcon,
} from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { AuthModal } from "@/components/auth-modal";
import { SavedPromptsModal } from "@/components/saved-prompts-modal";
import { RenameDialog } from "@/components/rename-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import logo from "@/assets/prompt-master-logo.png";

interface Props {
  threads: ThreadRecord[];
  activeThreadId?: string;
  activeExpert: ExpertId | null;
  progress: number;
  quality: number;
  collected: string[];
  slots: SlotStatus[];
  goal: string;
  inferredFacts?: InferredFact[];
  activeSignals?: IntelligenceSignal[];
  strategicFocus?: string;
  onDelete: (id: string) => void;
  onRename?: (id: string, newTitle: string) => void;
  onToggleFavorite?: (id: string, isFavorite: boolean) => void;
}

export function ThreadSidebar({
  threads,
  activeThreadId,
  activeExpert,
  progress,
  quality,
  collected,
  slots,
  goal,
  inferredFacts = [],
  activeSignals = [],
  strategicFocus = "",
  onDelete,
  onRename,
  onToggleFavorite,
}: Props) {
  void collected;
  const navigate = useNavigate();
  const { user, theme, toggleTheme } = useAuth();

  const [searchQuery, setSearchQuery] = useState("");
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [libraryModalOpen, setLibraryModalOpen] = useState(false);
  const [renamingThread, setRenamingThread] = useState<ThreadRecord | null>(
    null,
  );

  const handleNewSession = () => {
    const fresh = createFreshSession();
    void navigate({ to: "/chat/$threadId", params: { threadId: fresh.id } });
  };

  const filteredThreads = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return threads
      .filter((t) => t.messages.length > 0)
      .filter((t) => {
        if (!q) return true;
        return t.title.toLowerCase().includes(q);
      })
      .slice()
      .sort((a, b) => {
        // Starred/Favorite threads pin first, then by updatedAt
        if (a.isFavorite && !b.isFavorite) return -1;
        if (!a.isFavorite && b.isFavorite) return 1;
        return b.updatedAt - a.updatedAt;
      });
  }, [threads, searchQuery]);

  return (
    <>
      <aside className="flex h-full w-72 shrink-0 flex-col border-r border-border/50 bg-sidebar/70 backdrop-blur">
        {/* Brand with Link to Landing */}
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-border/40">
          <Link
            to="/"
            className="flex items-center gap-2.5 group transition-opacity hover:opacity-90"
            title="Return to Prompt Master Home"
          >
            <div className="relative rounded-lg bg-card border border-primary/30 p-1 shadow-sm shadow-primary/20">
              <img
                src={logo}
                alt="Prompt Master"
                width={26}
                height={26}
                className="h-6.5 w-6.5 object-contain"
              />
            </div>
            <div>
              <div className="text-sm font-bold leading-tight text-foreground group-hover:text-primary transition-colors flex items-center gap-1">
                <span>Prompt Master</span>
              </div>
              <div className="text-[10px] text-muted-foreground">
                Asks. Listens. Writes.
              </div>
            </div>
          </Link>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => toggleTheme()}
              className="rounded-lg p-1.5 text-muted-foreground hover:bg-card hover:text-foreground transition-colors"
              title={`Switch to ${theme === "dark" ? "Light" : "Dark"} mode`}
            >
              {theme === "dark" ? (
                <Sun className="h-4 w-4 text-amber-400" />
              ) : (
                <Moon className="h-4 w-4 text-primary" />
              )}
            </button>

            <Link
              to="/"
              className="rounded-lg p-1.5 text-muted-foreground hover:bg-card hover:text-foreground transition-colors"
              title="Home / Landing Page"
            >
              <Home className="h-4 w-4" />
            </Link>
          </div>
        </div>

        {/* Primary Actions: New Session + Prompt Library */}
        <div className="px-3 pt-3 space-y-1.5">
          <button
            type="button"
            onClick={handleNewSession}
            className={cn(
              "flex w-full items-center justify-center gap-2 rounded-xl border border-primary/30 bg-primary/10 px-3 py-2 text-xs font-semibold text-primary",
              "hover:bg-primary/20 hover:border-primary/50 active:scale-[0.98] transition-all cursor-pointer shadow-sm shadow-primary/10",
            )}
          >
            <Plus className="h-4 w-4" />
            <span>New Interview Session</span>
          </button>

          <button
            type="button"
            onClick={() => setLibraryModalOpen(true)}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-border/70 bg-card/60 px-3 py-1.5 text-xs font-medium text-foreground/90 hover:bg-card hover:border-primary/30 active:scale-[0.98] transition-all cursor-pointer"
          >
            <Bookmark className="h-3.5 w-3.5 text-primary" />
            <span>Prompt Library & Favorites</span>
          </button>
        </div>

        {/* Scrollable middle content */}
        <div className="flex-1 overflow-y-auto min-h-0">
          {/* Expert mode */}
          <div className="mt-4 px-4">
            <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Expert Mode
            </div>
            <ul className="space-y-1">
              {EXPERT_LIST.map((e) => {
                const isActive = activeExpert === e.id;
                return (
                  <li
                    key={e.id}
                    className={cn(
                      "flex items-center gap-2 rounded-md border px-2.5 py-1.5 text-xs transition-colors",
                      isActive
                        ? "border-transparent bg-primary/15 text-foreground shadow-[inset_0_0_0_1px_color-mix(in_oklch,var(--primary)_45%,transparent)]"
                        : "border-transparent text-muted-foreground/80",
                    )}
                    style={
                      isActive
                        ? {
                            backgroundImage: `linear-gradient(90deg, color-mix(in oklch, ${e.accent} 20%, transparent), transparent)`,
                          }
                        : undefined
                    }
                  >
                    <span className="text-base leading-none">{e.emoji}</span>
                    <span className="flex-1 truncate font-medium">
                      {e.name}
                    </span>
                    {isActive && (
                      <span className="rounded-full bg-primary/30 px-1.5 py-px text-[10px] font-semibold uppercase tracking-wider text-foreground">
                        Active
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Trust mode header */}
          <div className="mt-4 px-4">
            <div className="space-y-2 rounded-lg border border-primary/25 bg-primary/5 p-3">
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Current Goal
                </div>
                <div className="mt-0.5 line-clamp-2 text-[12px] font-medium leading-snug text-foreground">
                  {goal || "No goal identified yet"}
                </div>
              </div>
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Current Expert
                </div>
                <div className="mt-0.5 text-[12px] font-medium leading-snug text-foreground">
                  {activeExpert
                    ? EXPERTS[activeExpert].name
                    : "Waiting for intent"}
                </div>
              </div>
            </div>
          </div>

          {/* Understanding & Quality */}
          <div className="mt-3 px-4">
            <div className="mb-1.5 flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              <span>Understanding</span>
              <span className="text-foreground">{progress}%</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-gradient-to-r from-primary to-[color:var(--accent-rose)] transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="mt-2 flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              <span>Prompt Quality</span>
              <span
                className={
                  quality >= 8
                    ? "text-primary"
                    : quality >= 5
                      ? "text-amber-400"
                      : "text-foreground/80"
                }
              >
                {quality.toFixed(1)}
                <span className="text-[10px] text-muted-foreground">/10</span>
              </span>
            </div>
          </div>

          {/* Adaptive Roadmap */}
          <div className="mt-4 flex flex-col px-4">
            <div className="mb-1.5 flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              <span className="flex items-center gap-1">
                <span>Adaptive Roadmap</span>
                {inferredFacts.length > 0 && (
                  <span
                    className="text-amber-400"
                    title={`${inferredFacts.length} deduced without asking`}
                  >
                    ⚡
                  </span>
                )}
              </span>
              {slots.length > 0 && (
                <span className="text-foreground/80">
                  {slots.filter((s) => s.filled).length}/{slots.length}
                </span>
              )}
            </div>

            {strategicFocus && (
              <div className="mb-2 rounded bg-primary/10 px-2 py-1 text-[10px] text-primary line-clamp-1">
                Focus: {strategicFocus}
              </div>
            )}

            {slots.length === 0 ? (
              <div className="text-xs text-muted-foreground/80">
                Send your goal to initialize the Interview Intelligence Engine.
              </div>
            ) : (
              <ul className="space-y-1 overflow-y-auto max-h-36 pr-1 text-xs">
                {slots.map((s) => (
                  <li
                    key={s.id}
                    className={cn(
                      "flex items-center gap-2 rounded-md px-2 py-1",
                      s.filled ? "text-foreground" : "text-muted-foreground",
                    )}
                  >
                    <span className="text-[12px] leading-none">
                      {s.filled && s.inferred ? "⚡" : s.filled ? "✅" : "⏳"}
                    </span>
                    <span className="line-clamp-1 flex-1">
                      {s.label}
                      {s.inferred && (
                        <span className="ml-1 text-[9.5px] font-normal text-violet-400">
                          (Inferred)
                        </span>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Sessions Section with Search & Action Controls */}
          <div className="border-t border-border/50 mt-4 px-3 py-3">
            <div className="mb-2 flex items-center justify-between px-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Interviews (
                {threads.filter((t) => t.messages.length > 0).length})
              </span>
            </div>

            {/* Quick Filter Input */}
            <div className="relative mb-2">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search sessions…"
                className="h-7 pl-8 text-xs bg-background/50 border-border/60"
              />
            </div>

            {filteredThreads.length === 0 ? (
              <div className="px-2 py-3 text-center text-xs text-muted-foreground">
                {searchQuery ? "No matching sessions" : "No past sessions yet"}
              </div>
            ) : (
              <ul className="max-h-52 space-y-1 overflow-y-auto pr-1">
                {filteredThreads.slice(0, 15).map((t) => {
                  const expert = t.expert ? EXPERTS[t.expert] : null;
                  const isActive = t.id === activeThreadId;

                  return (
                    <li key={t.id} className="group relative">
                      <Link
                        to="/chat/$threadId"
                        params={{ threadId: t.id }}
                        className={cn(
                          "flex items-center gap-2 rounded-lg px-2 py-1.5 pr-14 text-xs transition-colors",
                          isActive
                            ? "bg-accent text-accent-foreground font-medium"
                            : "text-muted-foreground hover:bg-accent/40 hover:text-foreground",
                        )}
                      >
                        <span className="text-sm leading-none shrink-0">
                          {expert?.emoji ?? "✨"}
                        </span>
                        <span className="min-w-0 flex-1 truncate">
                          {t.title}
                        </span>
                        {t.isFavorite && (
                          <Star className="h-3 w-3 fill-amber-400 text-amber-400 shrink-0" />
                        )}
                      </Link>

                      {/* Quick Actions (Pin, Rename, Delete) */}
                      <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        {onToggleFavorite && (
                          <button
                            type="button"
                            aria-label="Favorite session"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              onToggleFavorite(t.id, !t.isFavorite);
                            }}
                            className="rounded p-1 text-muted-foreground hover:bg-background/80 hover:text-amber-400"
                            title={
                              t.isFavorite
                                ? "Remove favorite"
                                : "Mark as favorite"
                            }
                          >
                            <Star
                              className={`h-3 w-3 ${
                                t.isFavorite
                                  ? "fill-amber-400 text-amber-400"
                                  : ""
                              }`}
                            />
                          </button>
                        )}

                        {onRename && (
                          <button
                            type="button"
                            aria-label="Rename session"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setRenamingThread(t);
                            }}
                            className="rounded p-1 text-muted-foreground hover:bg-background/80 hover:text-foreground"
                            title="Rename session"
                          >
                            <Edit2 className="h-3 w-3" />
                          </button>
                        )}

                        <button
                          type="button"
                          aria-label="Delete session"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            if (confirm(`Delete session "${t.title}"?`)) {
                              onDelete(t.id);
                            }
                          }}
                          className="rounded p-1 text-muted-foreground hover:bg-background/80 hover:text-destructive"
                          title="Delete session"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>

        {/* Footer: User Account & Cloud Sync Status */}
        <div className="border-t border-border/50 p-3 bg-card/40">
          {user ? (
            <button
              type="button"
              onClick={() => setAuthModalOpen(true)}
              className="flex w-full items-center gap-2.5 rounded-xl border border-border/60 bg-background/50 p-2 text-left transition-colors hover:bg-card hover:border-primary/40"
            >
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || "Avatar"}
                  className="h-8 w-8 rounded-full border border-primary/40 object-cover"
                />
              ) : (
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20 text-xs font-bold text-primary">
                  {(user.displayName || user.email || "U")[0].toUpperCase()}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="truncate text-xs font-semibold text-foreground flex items-center gap-1">
                  <span>{user.displayName || "Prompter"}</span>
                </div>
                <div className="flex items-center gap-1 text-[10px] text-emerald-400">
                  <Cloud className="h-3 w-3" />
                  <span>Cloud Synced</span>
                </div>
              </div>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setAuthModalOpen(true)}
              className="flex w-full items-center justify-between rounded-xl border border-dashed border-primary/40 bg-primary/5 p-2.5 text-xs font-medium text-primary hover:bg-primary/10 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Cloud className="h-4 w-4 text-primary" />
                <div className="text-left leading-tight">
                  <div className="font-semibold">Sign In / Sync</div>
                  <div className="text-[10px] text-muted-foreground">
                    Google & GitHub
                  </div>
                </div>
              </div>
              <span className="rounded-md bg-primary px-2 py-0.5 text-[10px] font-semibold text-primary-foreground">
                Connect
              </span>
            </button>
          )}
        </div>
      </aside>

      {/* Auth & Profile Modal */}
      <AuthModal open={authModalOpen} onOpenChange={setAuthModalOpen} />

      {/* Prompt Library Modal */}
      <SavedPromptsModal
        open={libraryModalOpen}
        onOpenChange={setLibraryModalOpen}
      />

      {/* Rename Dialog */}
      {renamingThread && (
        <RenameDialog
          open={!!renamingThread}
          onOpenChange={(open) => {
            if (!open) setRenamingThread(null);
          }}
          currentTitle={renamingThread.title}
          onRename={(newTitle) => {
            if (onRename && renamingThread) {
              onRename(renamingThread.id, newTitle);
            }
          }}
        />
      )}
    </>
  );
}
