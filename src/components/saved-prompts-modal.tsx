import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/contexts/auth-context";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  type SavedPromptRecord,
  loadLocalSavedPrompts,
  saveLocalSavedPrompts,
  subscribeToSavedPrompts,
  togglePromptFavoriteInCloud,
  deletePromptFromCloud,
} from "@/lib/cloud-db";
import {
  Search,
  Star,
  Copy,
  Check,
  Trash2,
  ExternalLink,
  Bookmark,
  Sparkles,
  Filter,
} from "lucide-react";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";

interface SavedPromptsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SavedPromptsModal({
  open,
  onOpenChange,
}: SavedPromptsModalProps) {
  const { user } = useAuth();
  const [prompts, setPrompts] = useState<SavedPromptRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [modelFilter, setModelFilter] = useState<string>("all");
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Subscribe to Cloud or Local prompts
  useEffect(() => {
    if (!open) return;

    if (user) {
      const unsubscribe = subscribeToSavedPrompts(user.uid, (items) => {
        setPrompts(items);
      });
      return () => unsubscribe();
    } else {
      setPrompts(loadLocalSavedPrompts());
    }
  }, [user, open]);

  const handleToggleFavorite = async (p: SavedPromptRecord) => {
    const nextFavorite = !p.isFavorite;
    if (user) {
      try {
        await togglePromptFavoriteInCloud(p.id, nextFavorite);
        toast.success(
          nextFavorite ? "Saved to favorites!" : "Removed from favorites",
        );
      } catch (err) {
        console.error(err);
        toast.error("Failed to update favorite status");
      }
    } else {
      const updated = prompts.map((item) =>
        item.id === p.id ? { ...item, isFavorite: nextFavorite } : item,
      );
      setPrompts(updated);
      saveLocalSavedPrompts(updated);
      toast.success(
        nextFavorite ? "Saved to favorites!" : "Removed from favorites",
      );
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this saved prompt?")) return;

    if (user) {
      try {
        await deletePromptFromCloud(id);
        toast.success("Prompt deleted");
      } catch (err) {
        console.error(err);
        toast.error("Failed to delete prompt");
      }
    } else {
      const updated = prompts.filter((p) => p.id !== id);
      setPrompts(updated);
      saveLocalSavedPrompts(updated);
      toast.success("Prompt deleted");
    }
  };

  const handleCopy = async (p: SavedPromptRecord) => {
    try {
      await navigator.clipboard.writeText(p.content);
      setCopiedId(p.id);
      toast.success(`Copied prompt for ${p.model.toUpperCase()}!`);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      toast.error("Failed to copy prompt");
    }
  };

  const filteredPrompts = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return prompts.filter((p) => {
      if (favoritesOnly && !p.isFavorite) return false;
      if (modelFilter !== "all" && p.model !== modelFilter) return false;
      if (!q) return true;
      return (
        p.title.toLowerCase().includes(q) ||
        p.content.toLowerCase().includes(q) ||
        p.model.toLowerCase().includes(q) ||
        p.tags.some((t) => t.toLowerCase().includes(q))
      );
    });
  }, [prompts, searchQuery, modelFilter, favoritesOnly]);

  const modelBadge = (model: string) => {
    switch (model) {
      case "claude":
        return (
          <span className="inline-flex items-center gap-1 rounded-md border border-orange-500/40 bg-orange-500/10 px-2 py-0.5 text-[11px] font-semibold text-orange-400">
            🟠 Claude
          </span>
        );
      case "chatgpt":
        return (
          <span className="inline-flex items-center gap-1 rounded-md border border-emerald-500/40 bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-400">
            🟢 ChatGPT
          </span>
        );
      case "gemini":
        return (
          <span className="inline-flex items-center gap-1 rounded-md border border-sky-500/40 bg-sky-500/10 px-2 py-0.5 text-[11px] font-semibold text-sky-400">
            🔷 Gemini
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-md border border-primary/40 bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">
            ✦ All Models
          </span>
        );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col bg-card p-6">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/15 text-primary">
                <Bookmark className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold">
                  Prompt Library & Favorites
                </DialogTitle>
                <div className="text-xs text-muted-foreground">
                  {user
                    ? "Backed up to your cloud account in real time."
                    : "Stored locally in this browser. Sign in to sync across devices."}
                </div>
              </div>
            </div>
            <div className="text-xs text-muted-foreground font-mono">
              {filteredPrompts.length} of {prompts.length} prompts
            </div>
          </div>
        </DialogHeader>

        {/* Search & Filter Bar */}
        <div className="mt-4 flex flex-col sm:flex-row gap-2.5">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search prompts by title, keywords, or content…"
              className="pl-9 bg-background text-xs sm:text-sm h-9"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto">
            {["all", "claude", "chatgpt", "gemini"].map((m) => (
              <Button
                key={m}
                size="sm"
                variant={modelFilter === m ? "default" : "outline"}
                onClick={() => setModelFilter(m)}
                className="h-9 text-xs capitalize"
              >
                {m === "all" ? "All Models" : m}
              </Button>
            ))}

            <Button
              size="sm"
              variant={favoritesOnly ? "default" : "outline"}
              onClick={() => setFavoritesOnly(!favoritesOnly)}
              className="h-9 text-xs gap-1"
            >
              <Star
                className={`h-3.5 w-3.5 ${favoritesOnly ? "fill-current" : ""}`}
              />
              <span>Favorites</span>
            </Button>
          </div>
        </div>

        {/* List of prompts */}
        <div className="mt-4 flex-1 overflow-y-auto space-y-3 pr-1 min-h-[300px]">
          {filteredPrompts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-center p-6 rounded-xl border border-dashed border-border/70">
              <Sparkles className="h-8 w-8 text-muted-foreground/60 mb-2" />
              <div className="text-sm font-semibold text-foreground">
                No saved prompts found
              </div>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                {prompts.length === 0
                  ? "When an interview finishes and generates your master prompt, click 'Save to Library' or the Star icon to keep it forever."
                  : "No prompts match your current search and filters. Try clearing your search query."}
              </p>
            </div>
          ) : (
            filteredPrompts.map((p) => (
              <div
                key={p.id}
                className="group relative rounded-xl border border-border/70 bg-background/50 p-4 transition-all hover:border-primary/40 hover:bg-card/70 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      {modelBadge(p.model)}
                      <span className="font-semibold text-sm text-foreground">
                        {p.title}
                      </span>
                      {p.score > 0 && (
                        <span className="text-[11px] font-medium text-emerald-400">
                          ★ {p.score.toFixed(1)}/10
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-muted-foreground mt-1">
                      Saved {new Date(p.createdAt).toLocaleDateString()}
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => handleToggleFavorite(p)}
                      title={
                        p.isFavorite
                          ? "Remove from favorites"
                          : "Add to favorites"
                      }
                      className={
                        p.isFavorite
                          ? "text-amber-400 hover:text-amber-300"
                          : "text-muted-foreground hover:text-foreground"
                      }
                    >
                      <Star
                        className={`h-4 w-4 ${p.isFavorite ? "fill-amber-400" : ""}`}
                      />
                    </Button>

                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => handleCopy(p)}
                      title="Copy to clipboard"
                      className="text-muted-foreground hover:text-foreground"
                    >
                      {copiedId === p.id ? (
                        <Check className="h-4 w-4 text-emerald-400" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>

                    {p.threadId && (
                      <Link
                        to="/chat/$threadId"
                        params={{ threadId: p.threadId }}
                        onClick={() => onOpenChange(false)}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                        title="Open interview session"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Link>
                    )}

                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => handleDelete(p.id)}
                      title="Delete prompt"
                      className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="mt-3">
                  <pre className="max-h-36 overflow-y-auto whitespace-pre-wrap rounded-lg bg-card/60 p-3 font-mono text-xs text-foreground/90 leading-relaxed border border-border/40">
                    {p.content}
                  </pre>
                </div>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
