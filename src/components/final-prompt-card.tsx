import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Check, Copy, Info, RefreshCw } from "lucide-react";
import { useState } from "react";

export interface MultiModelPrompts {
  chatgpt: string;
  claude: string;
  gemini: string;
}

interface Props {
  prompts: MultiModelPrompts;
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
  onRegenerate,
  regenerating,
}: Props) {
  const [copiedKey, setCopiedKey] = useState<ModelKey | null>(null);
  const [tab, setTab] = useState<ModelKey>("chatgpt");

  async function copy(key: ModelKey) {
    try {
      await navigator.clipboard.writeText(prompts[key]);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey((k) => (k === key ? null : k)), 1800);
    } catch {
      // ignore
    }
  }

  const active = MODELS.find((m) => m.key === tab)!;

  return (
    <div className="my-3 overflow-hidden rounded-xl border border-primary/40 bg-gradient-to-br from-primary/10 via-background to-background shadow-[0_0_40px_-15px_color-mix(in_oklch,var(--primary)_60%,transparent)]">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-primary/20 px-4 py-2.5">
        <div className="flex items-center gap-2">
          <span className="inline-block h-2 w-2 rounded-full bg-primary shadow-[0_0_12px_var(--primary)]" />
          <span className="text-xs font-semibold uppercase tracking-wider text-primary">
            Your Master Prompts · 3 models
          </span>
        </div>
        {onRegenerate && (
          <Button
            size="sm"
            variant="ghost"
            onClick={onRegenerate}
            disabled={regenerating}
            className="h-8"
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
                "flex items-center justify-between border-b border-border/40 bg-card/20 px-4 py-2 " +
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
              <Button
                size="sm"
                variant={copiedKey === m.key ? "secondary" : "default"}
                onClick={() => copy(m.key)}
                className="h-8"
              >
                {copiedKey === m.key ? (
                  <>
                    <Check className="mr-1.5 h-3.5 w-3.5" /> Copied
                  </>
                ) : (
                  <>
                    <Copy className="mr-1.5 h-3.5 w-3.5" /> Copy for {m.label}
                  </>
                )}
              </Button>
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
          <span className="text-emerald-400">ChatGPT</span> responds best to
          explicit roles and structured formatting,{" "}
          <span className="text-orange-400">Claude</span> shines with
          conversational context and thoughtful reasoning, and{" "}
          <span className="text-sky-400">Gemini</span> is sharpest with direct,
          labeled task instructions. Same goal, three native styles.
        </div>
      </div>
    </div>
  );
}
