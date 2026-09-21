import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Check,
  Copy,
  Info,
  RefreshCw,
  Bookmark,
  Star,
  Sparkles,
} from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import {
  savePromptToCloud,
  saveLocalSavedPrompts,
  loadLocalSavedPrompts,
  type SavedPromptRecord,
} from "@/lib/cloud-db";
import { newThreadId } from "@/lib/threads";
import { toast } from "sonner";

export interface MultiModelPrompts {
  chatgpt: string;
  claude: string;
  gemini: string;
}

interface Props {
  prompts: MultiModelPrompts;
  threadId?: string;
  goalTitle?: string;
  qualityScore?: number;
  onRegenerate?: () => void;
  regenerating?: boolean;
}

type ModelKey = keyof MultiModelPrompts;

const MODELS: {
  key: ModelKey;
  label: string;
  emoji: string;
  accent: string;
  tint: string;
}[] = [
  {
    key: "chatgpt",
    label: "ChatGPT",
    emoji: "🟢",
    accent: "text-emerald-400",
    tint: "border-emerald-500/40",
  },
  {
    key: "claude",
    label: "Claude",
    emoji: "🟠",
    accent: "text-orange-400",
    tint: "border-orange-500/40",
  },
  {
    key: "gemini",
    label: "Gemini",
    emoji: "🔷",
    accent: "text-sky-400",
    tint: "border-sky-500/40",
  },
];

export function FinalPromptCard({
  prompts,
  threadId,
  goalTitle,
  qualityScore,
  onRegenerate,
  regenerating,
}: Props) {
  const { user } = useAuth();
  const [copiedKey, setCopiedKey] = useState<ModelKey | null>(null);
  const [tab, setTab] = useState<ModelKey>("chatgpt");
  const [savedKeys, setSavedKeys] = useState<Record<string, boolean>>({});
  const [favoriteKeys, setFavoriteKeys] = useState<Record<string, boolean>>({});

  async function copy(key: ModelKey) {
    try {
      await navigator.clipboard.writeText(prompts[key]);
      setCopiedKey(key);
      toast.success(`Copied master prompt for ${key.toUpperCase()}!`);
      setTimeout(() => setCopiedKey((k) => (k === key ? null : k)), 1800);
    } catch {
      // ignore
    }
  }

  async function handleSavePrompt(key: ModelKey, makeFavorite = false) {
    const promptId = `${threadId || "prompt"}-${key}`;
    const title =
      goalTitle || `${MODELS.find((m) => m.key === key)?.label} Master Prompt`;
    const content = prompts[key];
    const score = qualityScore ?? 10;
    const isFavorite = makeFavorite || favoriteKeys[key] || false;

    if (user) {
      try {
        await savePromptToCloud({
          id: promptId,
          userId: user.uid,
          threadId: threadId || "",
          title,
          model: key,
          content,
          score,
          isFavorite,
          tags: [key, "master-prompt", "certified"],
        });
        setSavedKeys((prev) => ({ ...prev, [key]: true }));
        if (makeFavorite) {
          setFavoriteKeys((prev) => ({ ...prev, [key]: true }));
        }
        toast.success(
          makeFavorite
            ? `Prompt favorited and saved to Cloud Library!`
            : `Prompt saved to Cloud Library!`,
        );
      } catch (err) {
        console.error(err);
        toast.error("Failed to save to cloud");
      }
    } else {
      const local = loadLocalSavedPrompts();
      const existingIdx = local.findIndex((p) => p.id === promptId);
      const record: SavedPromptRecord = {
        id: promptId,
        userId: "guest",
        threadId: threadId || "",
        title,
        model: key,
        content,
        score,
        isFavorite,
        tags: [key, "master-prompt"],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      if (existingIdx >= 0) {
        local[existingIdx] = record;
      } else {
        local.unshift(record);
      }
      saveLocalSavedPrompts(local);
      setSavedKeys((prev) => ({ ...prev, [key]: true }));
      if (makeFavorite) {
        setFavoriteKeys((prev) => ({ ...prev, [key]: true }));
      }
      toast.success(
        makeFavorite
          ? "Prompt saved to favorites in this browser!"
          : "Prompt saved to your local Library!",
      );
    }
  }

  return (
    <div className="my-3 overflow-hidden rounded-xl border border-primary/40 bg-gradient-to-br from-primary/10 via-background to-background shadow-[0_0_40px_-15px_color-mix(in_oklch,var(--primary)_60%,transparent)]">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-primary/20 px-4 py-2.5">
        <div className="flex items-center gap-2">
          <span className="inline-block h-2 w-2 rounded-full bg-primary shadow-[0_0_12px_var(--primary)]" />
          <span className="text-xs font-semibold uppercase tracking-wider text-primary">
            Your Master Prompts · 3 models
          </span>
        </div>
        <div className="flex items-center gap-2">
          {onRegenerate && (
            <Button
              size="sm"
              variant="ghost"
              onClick={onRegenerate}
              disabled={regenerating}
              className="h-8 text-xs"
            >
              <RefreshCw
                className={
                  "mr-1.5 h-3.5 w-3.5 " + (regenerating ? "animate-spin" : "")
                }
              />
              Regenerate
            </Button>
          )}
        </div>
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as ModelKey)}>
        <div className="border-b border-border/40 bg-card/40 px-3 pt-3">
          <TabsList className="w-full justify-start gap-1 bg-transparent p-0">
            {MODELS.map((m) => (
              <TabsTrigger
                key={m.key}
                value={m.key}
                className="data-[state=active]:bg-primary/15 data-[state=active]:text-primary rounded-md px-3 py-1.5 text-xs font-medium"
              >
                <span className="mr-1.5">{m.emoji}</span>
                {m.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        {MODELS.map((m) => (
          <TabsContent key={m.key} value={m.key} className="m-0">
            <div
              className={
                "flex flex-wrap items-center justify-between gap-2 border-b border-border/40 bg-card/20 px-4 py-2 " +
                m.tint
              }
            >
              <div
                className={
                  "text-[11px] font-semibold uppercase tracking-wider " +
                  m.accent
                }
              >
                Optimized for {m.label}
              </div>

              <div className="flex items-center gap-1.5">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleSavePrompt(m.key, true)}
                  title="Favorite and save prompt"
                  className="h-8 px-2 text-xs"
                >
                  <Star
                    className={`h-3.5 w-3.5 ${
                      favoriteKeys[m.key]
                        ? "fill-amber-400 text-amber-400"
                        : "text-muted-foreground"
                    }`}
                  />
                  <span className="ml-1 hidden sm:inline">Favorite</span>
                </Button>

                <Button
                  size="sm"
                  variant={savedKeys[m.key] ? "secondary" : "outline"}
                  onClick={() => handleSavePrompt(m.key)}
                  className="h-8 px-2.5 text-xs"
                >
                  {savedKeys[m.key] ? (
                    <>
                      <Check className="mr-1 h-3.5 w-3.5 text-emerald-400" />{" "}
                      Saved
                    </>
                  ) : (
                    <>
                      <Bookmark className="mr-1 h-3.5 w-3.5" /> Save
                    </>
                  )}
                </Button>

                <Button
                  size="sm"
                  variant={copiedKey === m.key ? "secondary" : "default"}
                  onClick={() => copy(m.key)}
                  className="h-8 text-xs"
                >
                  {copiedKey === m.key ? (
                    <>
                      <Check className="mr-1.5 h-3.5 w-3.5" /> Copied
                    </>
                  ) : (
                    <>
                      <Copy className="mr-1.5 h-3.5 w-3.5" /> Copy
                    </>
                  )}
                </Button>
              </div>
            </div>
            <pre className="max-h-[420px] overflow-auto whitespace-pre-wrap px-4 py-3 font-mono text-[13px] leading-relaxed text-foreground/90">
              {prompts[m.key]}
            </pre>
          </TabsContent>
        ))}
      </Tabs>

      <div className="flex items-start gap-2 border-t border-border/40 bg-muted/20 px-4 py-3 text-[12px] leading-relaxed text-muted-foreground">
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary/70" />
        <div>
          <div className="mb-0.5 font-medium text-foreground/80">
            Why are these prompts different?
          </div>
          Each model thinks differently.{" "}
          <span className="text-emerald-400 font-medium">ChatGPT</span> responds
          best to explicit roles and structured formatting,{" "}
          <span className="text-orange-400 font-medium">Claude</span> shines
          with conversational context and thoughtful reasoning, and{" "}
          <span className="text-sky-400 font-medium">Gemini</span> is sharpest
          with direct, labeled task instructions. Same goal, three native
          styles.
        </div>
      </div>
    </div>
  );
}
