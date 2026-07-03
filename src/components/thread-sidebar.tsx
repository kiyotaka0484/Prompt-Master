import type { SlotStatus } from "@/components/chat-window";
import { EXPERTS, EXPERT_LIST, type ExpertId } from "@/lib/experts";
import type { ThreadRecord } from "@/lib/threads";
import { cn } from "@/lib/utils";
import { Link } from "@tanstack/react-router";
import { Plus, Trash2 } from "lucide-react";
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
  onDelete: (id: string) => void;
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
  onDelete,
}: Props) {
  void collected;
  return (
    <aside className="flex h-full w-72 shrink-0 flex-col border-r border-border/50 bg-sidebar/60 backdrop-blur">
      {/* Brand */}
      <div className="flex items-center gap-2 px-4 py-4">
        <img
          src={logo}
          alt="Prompt Master"
          width={32}
          height={32}
          className="h-8 w-8"
        />
        <div>
          <div className="text-sm font-semibold leading-tight">
            Prompt Master
          </div>
          <div className="text-[11px] text-muted-foreground">
            Asks. Listens. Writes.
          </div>
        </div>
      </div>

      {/* New session */}
      <div className="px-3">
        <Link
          to="/"
          className={cn(
            "flex w-full items-center justify-center gap-2 rounded-lg border border-border/60 bg-card/40 px-3 py-2 text-sm font-medium",
            "hover:bg-card/80 transition-colors",
          )}
        >
          <Plus className="h-4 w-4" /> New session
        </Link>
      </div>

      {/* Expert mode */}
      <div className="mt-5 px-4">
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
                <span className="flex-1 truncate font-medium">{e.name}</span>
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
      <div className="mt-5 px-4">
        <div className="space-y-3 rounded-lg border border-primary/25 bg-primary/5 p-3">
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
              {activeExpert ? EXPERTS[activeExpert].name : "Waiting for intent"}
            </div>
          </div>
        </div>
      </div>

      {/* Understanding */}
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
                  ? "text-amber-300"
                  : "text-foreground/80"
            }
          >
            {quality.toFixed(1)}
            <span className="text-[10px] text-muted-foreground">/10</span>
          </span>
        </div>
        <div className="mt-1 text-[10.5px] text-muted-foreground">
          {progress >= 100
            ? "Master prompt ready ✦"
            : progress >= 90
              ? "Almost there — finalising…"
              : progress === 0
                ? "Send your goal to begin."
                : "Learning more about your situation…"}
        </div>
      </div>

      {/* Missing Information */}
      <div className="mt-5 flex min-h-0 flex-1 flex-col px-4">
        <div className="mb-2 flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          <span>Missing Information</span>
          {slots.length > 0 && (
            <span className="text-foreground/80">
              {slots.filter((s) => s.filled).length}/{slots.length}
            </span>
          )}
        </div>
        {slots.length === 0 ? (
          <div className="text-xs text-muted-foreground/80">
            Send your goal to see what Prompt Master needs to learn.
          </div>
        ) : (
          <ul className="space-y-1 overflow-y-auto pr-1 text-xs">
            {slots.map((s) => (
              <li
                key={s.id}
                className={cn(
                  "flex items-center gap-2 rounded-md px-2 py-1",
                  s.filled ? "text-foreground" : "text-muted-foreground",
                )}
              >
                <span className="text-[12px] leading-none">
                  {s.filled ? "✅" : "❌"}
                </span>
                <span className="line-clamp-1 flex-1">{s.label}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Threads */}
      {threads.length > 0 && (
        <div className="border-t border-border/50 px-2 py-3">
          <div className="mb-1.5 px-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Recent
          </div>
          <ul className="max-h-44 space-y-0.5 overflow-y-auto">
            {threads
              .filter((t) => t.messages.length > 0)
              .slice()
              .sort((a, b) => b.updatedAt - a.updatedAt)
              .slice(0, 12)
              .map((t) => {
                const expert = t.expert ? EXPERTS[t.expert] : null;
                const isActive = t.id === activeThreadId;
                return (
                  <li key={t.id} className="group relative">
                    <Link
                      to="/chat/$threadId"
                      params={{ threadId: t.id }}
                      className={cn(
                        "flex items-center gap-2 rounded-md px-2 py-1.5 pr-7 text-xs transition-colors",
                        isActive
                          ? "bg-accent text-accent-foreground"
                          : "text-muted-foreground hover:bg-accent/40 hover:text-foreground",
                      )}
                    >
                      <span className="text-sm leading-none">
                        {expert?.emoji ?? "✨"}
                      </span>
                      <span className="min-w-0 flex-1 truncate">{t.title}</span>
                    </Link>
                    <button
                      type="button"
                      aria-label="Delete session"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (confirm("Delete this session?")) onDelete(t.id);
                      }}
                      className="absolute right-1 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground opacity-0 transition-opacity hover:bg-background/80 hover:text-destructive group-hover:opacity-100"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </li>
                );
              })}
          </ul>
        </div>
      )}

      <div className="border-t border-border/50 px-4 py-2 text-[10.5px] text-muted-foreground">
        Sessions saved locally in this browser.
      </div>
    </aside>
  );
}
