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
  Download,
  Terminal,
  Cpu,
  Sliders,
  Compass,
  FileCode,
  ShieldCheck,
  Flame,
} from "lucide-react";
import { useState, useMemo } from "react";
import { useAuth } from "@/contexts/auth-context";
import {
  savePromptToCloud,
  saveLocalSavedPrompts,
  loadLocalSavedPrompts,
  type SavedPromptRecord,
} from "@/lib/cloud-db";
import {
  ALL_MODELS,
  MODEL_OPTIMIZATION_PROFILES,
  ensureAllSevenModels,
  type ModelKey,
  type MultiModelPrompts,
} from "@/lib/ai-optimization-engine";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export type { MultiModelPrompts };

interface Props {
  prompts: Partial<MultiModelPrompts> | MultiModelPrompts;
  threadId?: string;
  goalTitle?: string;
  qualityScore?: number;
  onRegenerate?: () => void;
  regenerating?: boolean;
}

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

  // Ensure all 7 models have distinct, structurally optimized prompts
  const resolvedPrompts = useMemo(() => {
    return ensureAllSevenModels(prompts, { goal: goalTitle });
  }, [prompts, goalTitle]);

  const activeProfile = MODEL_OPTIMIZATION_PROFILES[tab];
  const activePrompt = resolvedPrompts[tab] || "";
  const wordCount = useMemo(() => {
    return activePrompt.trim().split(/\s+/).filter(Boolean).length;
  }, [activePrompt]);

  async function copy(key: ModelKey) {
    try {
      const text = resolvedPrompts[key];
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      const name = MODEL_OPTIMIZATION_PROFILES[key].name;
      toast.success(`Copied ${name} optimized prompt!`);
      setTimeout(() => setCopiedKey((k) => (k === key ? null : k)), 1800);
    } catch {
      toast.error("Failed to copy prompt to clipboard");
    }
  }

  function downloadAsFile(key: ModelKey) {
    const text = resolvedPrompts[key];
    const profile = MODEL_OPTIMIZATION_PROFILES[key];
    let filename = `${key}-master-prompt.md`;
    if (key === "cursor") filename = ".cursorrules";
    if (key === "windsurf") filename = ".windsurfrules";

    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success(`Exported ${filename} successfully!`);
  }

  async function handleSavePrompt(key: ModelKey, makeFavorite = false) {
    const promptId = `${threadId || "prompt"}-${key}`;
    const profile = MODEL_OPTIMIZATION_PROFILES[key];
    const title = goalTitle
      ? `${goalTitle} (${profile.name})`
      : `${profile.name} Master Prompt`;
    const content = resolvedPrompts[key];
    const score = qualityScore ?? 9.8;
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
          tags: [key, "ai-optimization-engine", "certified", profile.developer],
        });
        setSavedKeys((prev) => ({ ...prev, [key]: true }));
        if (makeFavorite) {
          setFavoriteKeys((prev) => ({ ...prev, [key]: true }));
        }
        toast.success(
          makeFavorite
            ? `Prompt favorited and saved to Cloud Library!`
            : `Saved to Cloud Library!`,
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
        tags: [key, "ai-optimization-engine", profile.developer],
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
    <div className="my-4 overflow-hidden rounded-xl border border-primary/40 bg-gradient-to-br from-primary/10 via-background to-background shadow-[0_0_50px_-20px_color-mix(in_oklch,var(--primary)_50%,transparent)]">
      {/* Top Banner Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-primary/20 bg-card/60 px-4 py-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/20 text-primary">
            <Cpu className="h-4 w-4 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-primary">
                AI Optimization Engine
              </span>
              <span className="rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                7 Models Supported
              </span>
            </div>
            <div className="text-[11px] text-muted-foreground">
              Distinct prompt architecture tuned to each model&apos;s internal
              reasoning
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onRegenerate && (
            <Button
              size="sm"
              variant="outline"
              onClick={onRegenerate}
              disabled={regenerating}
              className="h-8 text-xs gap-1.5"
            >
              <RefreshCw
                className={cn("h-3.5 w-3.5", regenerating && "animate-spin")}
              />
              Regenerate All
            </Button>
          )}
        </div>
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as ModelKey)}>
        {/* Model Tabs Bar with smooth horizontal scrolling on mobile */}
        <div className="border-b border-border/40 bg-card/40 px-2 pt-2 sm:px-4">
          <TabsList
            aria-label="Target AI Model Optimization Tabs"
            className="flex w-full overflow-x-auto no-scrollbar sm:flex-wrap justify-start gap-1.5 bg-transparent p-1 sm:p-0 h-auto scroll-smooth"
          >
            {ALL_MODELS.map((m) => (
              <TabsTrigger
                key={m.key}
                value={m.key}
                aria-label={`${m.name} prompt tab optimized for ${m.developer}`}
                className={cn(
                  "data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:border-border/80 border border-transparent rounded-lg px-3 py-2 text-xs font-medium transition-all shrink-0 min-h-[38px] focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none",
                  tab === m.key && m.tint,
                )}
              >
                <span className="mr-1.5 text-sm" aria-hidden="true">
                  {m.emoji}
                </span>
                <span className="font-semibold">{m.name}</span>
                <span className="ml-1.5 hidden text-[10px] text-muted-foreground sm:inline">
                  {m.developer}
                </span>
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        {/* Tab Content for each model */}
        {ALL_MODELS.map((m) => {
          const promptText = resolvedPrompts[m.key] || "";
          return (
            <TabsContent
              key={m.key}
              value={m.key}
              tabIndex={0}
              aria-label={`${m.name} optimized prompt`}
              className="m-0 focus-visible:outline-none"
            >
              {/* Model Bar Actions & Metadata */}
              <div
                className={cn(
                  "flex flex-wrap items-center justify-between gap-3 border-b border-border/40 bg-card/25 px-3 py-2.5 sm:px-4",
                  m.tint,
                )}
              >
                <div className="flex items-center gap-2">
                  <span className="text-base" aria-hidden="true">
                    {m.emoji}
                  </span>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={cn(
                          "text-xs font-bold uppercase tracking-wider",
                          m.accent,
                        )}
                      >
                        {m.name} ({m.developer})
                      </span>
                      <span
                        className={cn(
                          "rounded-md border px-1.5 py-0.5 text-[10px] font-medium",
                          m.badgeBg,
                          m.badgeBorder,
                          m.badgeText,
                        )}
                      >
                        {m.tagline}
                      </span>
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                      {wordCount} words · {promptText.split("\n").length} lines
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => downloadAsFile(m.key)}
                    aria-label={`Download and export ${m.name} prompt`}
                    title={`Download ${m.name} prompt`}
                    className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
                  >
                    <Download className="h-3.5 w-3.5" aria-hidden="true" />
                    <span className="ml-1 hidden md:inline">Export</span>
                  </Button>

                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleSavePrompt(m.key, true)}
                    aria-label={`Favorite and save ${m.name} prompt`}
                    title="Favorite and save prompt"
                    className="h-8 px-2 text-xs focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
                  >
                    <Star
                      className={cn(
                        "h-3.5 w-3.5",
                        favoriteKeys[m.key]
                          ? "fill-amber-400 text-amber-400"
                          : "text-muted-foreground",
                      )}
                      aria-hidden="true"
                    />
                    <span className="ml-1 hidden sm:inline">Favorite</span>
                  </Button>

                  <Button
                    size="sm"
                    variant={savedKeys[m.key] ? "secondary" : "outline"}
                    onClick={() => handleSavePrompt(m.key)}
                    aria-label={
                      savedKeys[m.key]
                        ? `${m.name} prompt saved to library`
                        : `Save ${m.name} prompt to library`
                    }
                    className="h-8 px-2.5 text-xs focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
                  >
                    {savedKeys[m.key] ? (
                      <>
                        <Check
                          className="mr-1 h-3.5 w-3.5 text-emerald-400"
                          aria-hidden="true"
                        />
                        Saved
                      </>
                    ) : (
                      <>
                        <Bookmark
                          className="mr-1 h-3.5 w-3.5"
                          aria-hidden="true"
                        />{" "}
                        Save
                      </>
                    )}
                  </Button>

                  <Button
                    size="sm"
                    variant={copiedKey === m.key ? "secondary" : "default"}
                    onClick={() => copy(m.key)}
                    aria-label={
                      copiedKey === m.key
                        ? `Copied ${m.name} prompt to clipboard`
                        : `Copy ${m.name} prompt to clipboard`
                    }
                    className="h-8 text-xs font-medium focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
                  >
                    {copiedKey === m.key ? (
                      <>
                        <Check
                          className="mr-1.5 h-3.5 w-3.5 text-emerald-400"
                          aria-hidden="true"
                        />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy
                          className="mr-1.5 h-3.5 w-3.5"
                          aria-hidden="true"
                        />{" "}
                        Copy Prompt
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* Main Prompt Text Display */}
              <div className="relative">
                <pre
                  tabIndex={0}
                  aria-label={`${m.name} prompt text`}
                  className="max-h-[380px] overflow-auto whitespace-pre-wrap break-words p-3.5 sm:p-4 font-mono text-[12px] sm:text-[13px] leading-relaxed text-foreground/90 selection:bg-primary/30 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none rounded-b-lg"
                >
                  {promptText}
                </pre>
              </div>

              {/* Model-Specific Architecture & Recommendations Panel */}
              <div className="border-t border-border/40 bg-card/40 p-4 space-y-4">
                {/* Why Prompts Differ Section */}
                <div className="rounded-lg border border-border/50 bg-background/60 p-3.5">
                  <div className="flex items-center gap-2 mb-1.5">
                    <Compass className={cn("h-4 w-4", m.accent)} />
                    <span className="text-xs font-semibold text-foreground">
                      Why this prompt is uniquely structured for {m.name}
                    </span>
                  </div>
                  <p className="text-[12px] leading-relaxed text-muted-foreground">
                    {m.whyItDiffers}
                  </p>

                  <div className="mt-2.5 flex flex-wrap gap-1.5">
                    {m.strengths.map((str, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center gap-1 rounded-md border border-border/60 bg-muted/30 px-2 py-0.5 text-[11px] text-foreground/80"
                      >
                        <ShieldCheck className="h-3 w-3 text-primary/80" />
                        {str}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Model-Specific Recommendations Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 text-[12px]">
                  <div className="rounded-lg border border-border/50 bg-background/50 p-2.5">
                    <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
                      <Cpu className="h-3.5 w-3.5 text-primary" />
                      <span className="text-[11px] font-medium uppercase tracking-wider">
                        Recommended Engine
                      </span>
                    </div>
                    <div className="font-semibold text-foreground text-xs">
                      {m.recommendations.bestEngine}
                    </div>
                  </div>

                  <div className="rounded-lg border border-border/50 bg-background/50 p-2.5">
                    <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
                      <Sliders className="h-3.5 w-3.5 text-amber-400" />
                      <span className="text-[11px] font-medium uppercase tracking-wider">
                        Ideal Temperature
                      </span>
                    </div>
                    <div className="font-semibold text-foreground text-xs">
                      {m.recommendations.idealTemperature}
                    </div>
                  </div>

                  <div className="rounded-lg border border-border/50 bg-background/50 p-2.5">
                    <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
                      <FileCode className="h-3.5 w-3.5 text-sky-400" />
                      <span className="text-[11px] font-medium uppercase tracking-wider">
                        Context / Target
                      </span>
                    </div>
                    <div
                      className="font-semibold text-foreground text-xs truncate"
                      title={m.recommendations.fileTarget}
                    >
                      {m.recommendations.fileTarget}
                    </div>
                  </div>

                  <div className="rounded-lg border border-border/50 bg-background/50 p-2.5">
                    <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
                      <Flame className="h-3.5 w-3.5 text-orange-400" />
                      <span className="text-[11px] font-medium uppercase tracking-wider">
                        Best Use Case
                      </span>
                    </div>
                    <div
                      className="font-medium text-foreground/90 text-xs line-clamp-1"
                      title={m.recommendations.bestUseCase}
                    >
                      {m.recommendations.bestUseCase}
                    </div>
                  </div>
                </div>

                {/* Pro Tip */}
                <div className="flex items-start gap-2 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 text-[12px] text-foreground/90">
                  <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                  <div>
                    <span className="font-semibold text-primary mr-1.5">
                      Execution Pro Tip:
                    </span>
                    <span className="text-muted-foreground">
                      {m.recommendations.proTip}
                    </span>
                  </div>
                </div>
              </div>
            </TabsContent>
          );
        })}
      </Tabs>

      {/* Global Optimization Engine Footer */}
      <div className="flex items-start gap-2 border-t border-border/40 bg-muted/25 px-4 py-3 text-[12px] leading-relaxed text-muted-foreground">
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
        <div>
          <span className="font-semibold text-foreground">
            Optimization Engine Guarantee:
          </span>{" "}
          Prompt Master never clones identical prompts. Each output applies the
          target model&apos;s architectural strengths—from Claude&apos;s XML
          hierarchies and Grok&apos;s first-principles candor to Cursor&apos;s
          strict{" "}
          <code className="text-xs bg-muted px-1 py-0.5 rounded">
            .cursorrules
          </code>{" "}
          and Windsurf&apos;s multi-phase Cascade protocol.
        </div>
      </div>
    </div>
  );
}
