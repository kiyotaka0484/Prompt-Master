import { MessageResponse } from "@/components/ai-elements/message";
import {
  PromptInput,
  PromptInputFooter,
  PromptInputSubmit,
  PromptInputTextarea,
} from "@/components/ai-elements/prompt-input";
import { Shimmer } from "@/components/ai-elements/shimmer";
import { FinalPromptCard } from "@/components/final-prompt-card";
import {
  EXPERTS,
  detectExpert,
  type ExpertId,
  type Slot,
  type SlotPriority,
} from "@/lib/experts";
import { messageText, type ThreadRecord } from "@/lib/threads";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { Circle as HelpCircle, Sparkles, Target } from "lucide-react";
import { useEffect, useMemo, useRef } from "react";
import { toast } from "sonner";
import logo from "@/assets/prompt-master-logo.png";

export interface SlotStatus {
  id: string;
  label: string;
  filled: boolean;
  value?: string;
  priority: SlotPriority;
  why: string;
}

interface Props {
  thread: ThreadRecord;
  onPersist: (messages: UIMessage[], expertOverride?: ExpertId) => void;
  onProgress?: (info: {
    progress: number;
    quality: number;
    collected: string[];
    expert: ExpertId | null;
    slots: SlotStatus[];
    goal: string;
  }) => void;
}

const VAGUE_ANSWER_RE =
  /^(idk|i\s*don'?t\s*know|dunno|maybe|not\s*sure|nothing|anything|whatever|yes|no|yeah|nope|ok|okay|cool|fine|good|bad|fast|slow|a\s*lot|some|money|stuff|things?|👍|👌|🤷)\.?$/i;

function isSpecificAnswer(text: string): boolean {
  const t = text.trim();
  if (t.length < 4) return false;
  if (VAGUE_ANSWER_RE.test(t)) return false;
  // require either a digit or 2+ words
  const wordCount = t.split(/\s+/).length;
  return wordCount >= 2 || /\d/.test(t);
}

const SLOT_TAG_RE = /<!--\s*slot\s*:\s*([a-z0-9_]+)\s*-->/i;
const SLOT_TAG_GLOBAL_RE = /<!--\s*slot\s*:\s*[a-z0-9_]+\s*-->/gi;
const CERT_BLOCK_RE = /<!--\s*certificate\s*([\s\S]*?)-->/i;

function parseSlotTag(text: string): string | null {
  const m = SLOT_TAG_RE.exec(text);
  return m ? m[1].toLowerCase() : null;
}

function stripSlotTag(text: string): string {
  return text.replace(SLOT_TAG_GLOBAL_RE, "").trim();
}

export interface PromptCertificate {
  clarity: number;
  context: number;
  constraints: number;
  audience: number;
  output: number;
  completeness: number;
  overall: number;
  revisions: number;
  assumptions: string[];
}

function extractCertificate(text: string): PromptCertificate | null {
  const m = CERT_BLOCK_RE.exec(text);
  if (!m) return null;
  const body = m[1];
  const num = (key: string): number | null => {
    const r = new RegExp(`${key}\\s*:\\s*([0-9]+(?:\\.[0-9]+)?)`, "i").exec(
      body,
    );
    return r ? Number(r[1]) : null;
  };
  const clarity = num("clarity");
  const context = num("context");
  const constraints = num("constraints");
  const audience = num("audience");
  const output = num("output");
  const completeness = num("completeness");
  const overall = num("overall");
  if (
    clarity === null ||
    context === null ||
    constraints === null ||
    audience === null ||
    output === null ||
    completeness === null ||
    overall === null
  )
    return null;
  const revisions = num("revisions") ?? 1;
  const assumpRaw = /assumptions\s*:\s*(.+)/i.exec(body)?.[1]?.trim() ?? "";
  const assumptions =
    !assumpRaw || /^none$/i.test(assumpRaw)
      ? []
      : assumpRaw
          .split(/[;|]/)
          .map((s) => s.trim())
          .filter(Boolean);
  return {
    clarity,
    context,
    constraints,
    audience,
    output,
    completeness,
    overall,
    revisions: Math.max(1, Math.round(revisions)),
    assumptions,
  };
}

function stripCertificate(text: string): string {
  return text.replace(CERT_BLOCK_RE, "").trim();
}

export interface MultiModelPrompts {
  chatgpt: string;
  claude: string;
  gemini: string;
}

const MODEL_FENCE_RE = /```(chatgpt|claude|gemini)\s*\n([\s\S]*?)```/gi;
const ANY_FENCE_RE = /```(?:prompt|markdown|md|text)?\s*\n?([\s\S]*?)```/i;

function extractFinalPrompt(
  text: string,
): { intro: string; prompts: MultiModelPrompts; outro: string } | null {
  const found: Partial<Record<keyof MultiModelPrompts, string>> = {};
  let firstIndex = Infinity;
  let lastEnd = -1;
  let m: RegExpExecArray | null;
  MODEL_FENCE_RE.lastIndex = 0;
  while ((m = MODEL_FENCE_RE.exec(text)) !== null) {
    const key = m[1].toLowerCase() as keyof MultiModelPrompts;
    const body = m[2].trim();
    if (body.length < 40) continue;
    found[key] = body;
    if (m.index < firstIndex) firstIndex = m.index;
    lastEnd = Math.max(lastEnd, m.index + m[0].length);
  }
  if (found.chatgpt && found.claude && found.gemini) {
    return {
      intro: stripCertificate(text.slice(0, firstIndex)).trim(),
      prompts: {
        chatgpt: found.chatgpt,
        claude: found.claude,
        gemini: found.gemini,
      },
      outro: stripCertificate(text.slice(lastEnd)).trim(),
    };
  }
  // Legacy single-prompt fallback (mirror across all three tabs so old messages still render).
  const legacy = ANY_FENCE_RE.exec(text);
  if (legacy && legacy[1].trim().length >= 80) {
    const prompt = legacy[1].trim();
    return {
      intro: stripCertificate(text.slice(0, legacy.index)).trim(),
      prompts: { chatgpt: prompt, claude: prompt, gemini: prompt },
      outro: stripCertificate(
        text.slice(legacy.index + legacy[0].length),
      ).trim(),
    };
  }
  return null;
}

/** Pull a short label out of an assistant question, e.g. "Question 3: Which country..." -> "Which country..." */
function shortQuestion(text: string): string {
  const cleaned = stripSlotTag(text)
    .replace(/```[\s\S]*?```/g, "")
    .replace(/\*\*/g, "")
    .trim();
  // prefer the line containing "Question N:"
  const qLine = cleaned.split(/\n+/).find((l) => /question\s*\d+\s*:/i.test(l));
  if (qLine) {
    return qLine.replace(/.*question\s*\d+\s*:\s*/i, "").trim();
  }
  // fallback: last sentence ending in ?
  const qMark = cleaned.match(/([^.?!\n]{6,200}\?)\s*$/);
  if (qMark) return qMark[1].trim();
  // fallback: last non-empty line
  const lines = cleaned.split(/\n+/).filter(Boolean);
  return lines[lines.length - 1] ?? cleaned;
}

function questionNumber(text: string): number | null {
  const m = /question\s*(\d+)\s*:/i.exec(text);
  return m ? Number(m[1]) : null;
}

export function ChatWindow({ thread, onPersist, onProgress }: Props) {
  const transport = useMemo(
    () => new DefaultChatTransport({ api: "/api/chat" }),
    [],
  );
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const detectedExpertRef = useRef<ExpertId | null>(thread.expert);
  const activeExpertId = detectedExpertRef.current ?? thread.expert;
  const expert = activeExpertId ? EXPERTS[activeExpertId] : null;

  const { messages, sendMessage, status, error } = useChat({
    id: thread.id,
    messages: thread.messages,
    transport,
    onError: (err) => toast.error(err.message || "Something went wrong"),
  });

  useEffect(() => {
    if (status === "ready") textareaRef.current?.focus();
  }, [status, thread.id]);

  // --- derive interview state ---
  const userMessages = messages.filter((m) => m.role === "user");
  const lastAssistant = [...messages]
    .reverse()
    .find((m) => m.role === "assistant");
  const lastAssistantRaw = lastAssistant ? messageText(lastAssistant) : "";
  const lastAssistantText = stripSlotTag(lastAssistantRaw);
  const lastSlot = lastAssistant ? parseSlotTag(lastAssistantRaw) : null;
  const finalPromptObj = lastAssistant
    ? extractFinalPrompt(lastAssistantText)
    : null;
  const certificate = lastAssistant
    ? extractCertificate(lastAssistantRaw)
    : null;
  const hasFinalPrompt = !!finalPromptObj;

  const goalEntry = userMessages
    .map((message) => {
      const text = messageText(message).trim();
      return { message, text, expert: detectExpert(text) };
    })
    .find((entry) => entry.expert);
  const goal = goalEntry?.text ?? "";
  const goalMessageIndex = goalEntry ? messages.indexOf(goalEntry.message) : -1;
  const isIntentDiscovery = !goal;

  // Build Q→A pairs (skip any greeting/triage messages and the goal itself).
  const pairs: {
    question: string;
    answer: string;
    n: number | null;
    slot: string | null;
  }[] = [];
  for (let i = 0; i < userMessages.length; i++) {
    const userIdx = messages.indexOf(userMessages[i]);
    if (goalMessageIndex === -1 || userIdx <= goalMessageIndex) continue;
    const prevAssistant = [...messages.slice(0, userIdx)]
      .reverse()
      .find((m) => m.role === "assistant");
    if (!prevAssistant) continue;
    const qTextRaw = messageText(prevAssistant);
    pairs.push({
      question: shortQuestion(qTextRaw),
      answer: messageText(userMessages[i]),
      n: questionNumber(qTextRaw),
      slot: parseSlotTag(qTextRaw),
    });
  }

  // Slot status for the current expert.
  const currentExpertId = isIntentDiscovery
    ? null
    : (activeExpertId ?? goalEntry?.expert ?? null);
  const expertConfig = currentExpertId ? EXPERTS[currentExpertId] : null;
  const expertSlots: Slot[] = expertConfig?.slots ?? [];
  const criticalSlotIds = expertConfig?.criticalSlots ?? [];
  const filledSlotIds = new Set(
    pairs.map((p) => p.slot).filter((s): s is string => Boolean(s)),
  );
  const slotStatuses: SlotStatus[] = expertSlots.map((s) => {
    const match = pairs.find((p) => p.slot === s.id);
    return {
      id: s.id,
      label: s.label,
      filled: !!match,
      value: match?.answer,
      priority: s.priority,
      why: s.why,
    };
  });

  const missingCritical = criticalSlotIds.filter(
    (id) => !filledSlotIds.has(id),
  );
  const understanding = isIntentDiscovery
    ? 0
    : hasFinalPrompt
      ? 100
      : expertSlots.length > 0
        ? Math.min(
            95,
            Math.round((filledSlotIds.size / expertSlots.length) * 100),
          )
        : 0;

  // Readiness gate — only allow the final prompt when we have enough.
  const ready =
    expertSlots.length > 0 &&
    understanding >= 80 &&
    missingCritical.length === 0 &&
    filledSlotIds.size >= 6;
  const showFinalPrompt = hasFinalPrompt && ready;

  // Prompt Quality Score (0-10): completeness (4) + critical coverage (4) + specificity (2).
  const quality = (() => {
    if (isIntentDiscovery || expertSlots.length === 0) return 0;
    if (hasFinalPrompt && ready) return 10;
    const completeness = filledSlotIds.size / expertSlots.length; // 0..1
    const criticality =
      criticalSlotIds.length === 0
        ? 1
        : (criticalSlotIds.length - missingCritical.length) /
          criticalSlotIds.length;
    const filledPairs = pairs.filter(
      (p) => p.slot && filledSlotIds.has(p.slot),
    );
    const specificity =
      filledPairs.length === 0
        ? 0
        : filledPairs.filter((p) => isSpecificAnswer(p.answer)).length /
          filledPairs.length;
    const raw = completeness * 4 + criticality * 4 + specificity * 2;
    return Math.round(Math.min(10, Math.max(0, raw)) * 10) / 10;
  })();

  useEffect(() => {
    if (status === "submitted" || status === "streaming") return;
    if (!currentExpertId || goalMessageIndex < 0) return;
    onPersist(messages.slice(goalMessageIndex), currentExpertId);
  }, [currentExpertId, goalMessageIndex, messages, status, onPersist]);

  // bubble to sidebar
  useEffect(() => {
    onProgress?.({
      progress: understanding,
      quality,
      expert: currentExpertId,
      collected: pairs.map((p) => `${p.question} — ${p.answer}`),
      slots: slotStatuses,
      goal,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    understanding,
    quality,
    messages.length,
    thread.id,
    currentExpertId,
    goal,
  ]);

  const isBusy = status === "submitted" || status === "streaming";
  const showWelcome = messages.length === 0;

  function handleSend(text: string) {
    // Keep retrying expert detection until we lock one in.
    if (!detectedExpertRef.current) {
      const detected = detectExpert(text);
      if (detected) detectedExpertRef.current = detected;
    }
    void sendMessage(
      { text },
      { body: { expert: detectedExpertRef.current ?? null } },
    );
  }

  function handleWhy() {
    if (isBusy) return;
    void sendMessage(
      {
        text: "Why are you asking this? How does my answer affect the final prompt?",
      },
      { body: { expert: detectedExpertRef.current ?? null } },
    );
  }

  function handleRegenerate() {
    if (!detectedExpertRef.current) return;
    void sendMessage(
      {
        text: "Please regenerate all three master prompts (ChatGPT, Claude, Gemini) using every detail I shared above. Keep each one optimized for its model's style, and return them in the same three fenced blocks (```chatgpt, ```claude, ```gemini) followed by the certificate.",
      },
      { body: { expert: detectedExpertRef.current } },
    );
  }

  function handleContinueInterview() {
    if (!detectedExpertRef.current || isBusy) return;
    const missingLabels = expertSlots
      .filter((s) => missingCritical.includes(s.id))
      .map((s) => s.label)
      .join(", ");
    void sendMessage(
      {
        text: `Not ready yet — please keep interviewing me. I still need to cover: ${missingLabels}. Ask the next most important question.`,
      },
      { body: { expert: detectedExpertRef.current } },
    );
  }

  // -------- WELCOME (no goal yet) --------
  if (showWelcome) {
    return (
      <div className="relative flex h-full min-h-0 flex-col overflow-y-auto bg-background">
        <BackgroundGlow />
        <div className="relative z-10 mx-auto flex w-full max-w-2xl flex-1 flex-col items-center justify-center px-6 py-12 text-center">
          <img src={logo} alt="" width={56} height={56} className="h-14 w-14" />
          <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/60 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            <Sparkles className="h-3 w-3" /> The AI that asks the questions you
            forgot to ask
          </div>
          <h1 className="mt-4 text-balance text-3xl font-semibold leading-tight sm:text-4xl">
            What are you trying to <span className="text-primary">achieve</span>
            ?
          </h1>
          <p className="mt-3 max-w-lg text-balance text-sm text-muted-foreground">
            Drop your goal in one sentence. Prompt Master will interview you
            with smart follow-up questions, then hand you a master prompt for
            ChatGPT, Gemini, or Claude.
          </p>
          <p className="mt-2 text-[12px] font-medium tracking-wide text-primary/90">
            Bridging human thinking and AI understanding.
          </p>

          <div className="mt-7 w-full">
            <ComposerForm
              disabled={isBusy}
              status={status}
              onSubmit={handleSend}
              textareaRef={textareaRef}
              placeholder="e.g. I want to start a business…"
              big
            />
          </div>

          <div className="mt-5 flex flex-wrap justify-center gap-2">
            {[
              "I want to start a business",
              "I want to build a website",
              "I want to learn Python",
              "I want to start a YouTube channel",
            ].map((s) => (
              <button
                key={s}
                onClick={() => handleSend(s)}
                disabled={isBusy}
                className="rounded-full border border-border/60 bg-card/50 px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:bg-card hover:text-foreground"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const currentQuestionNumber = lastAssistant
    ? (questionNumber(lastAssistantText) ?? userMessages.length + 1)
    : 1;

  // -------- INTERVIEW MODE --------
  return (
    <div className="relative flex h-full min-h-0 flex-col overflow-hidden bg-background">
      <BackgroundGlow />

      {/* Status bar */}
      <header className="relative z-10 flex flex-wrap items-center justify-between gap-3 border-b border-border/50 bg-background/70 px-5 py-3 backdrop-blur">
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 text-[10.5px] font-semibold uppercase tracking-[0.18em] text-primary">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />{" "}
            Interview Mode
          </span>
          {expert ? (
            <div className="flex items-center gap-2">
              <div
                className="flex h-8 w-8 items-center justify-center rounded-lg text-base"
                style={{
                  backgroundColor: `color-mix(in oklch, ${expert.accent} 22%, transparent)`,
                }}
              >
                {expert.emoji}
              </div>
              <div className="leading-tight">
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  Current Expert
                </div>
                <div className="text-sm font-semibold">{expert.name}</div>
              </div>
            </div>
          ) : null}
        </div>

        <div className="flex items-center gap-4">
          <QualityScore value={quality} />
          <ProgressDial value={understanding} />
        </div>
      </header>

      {/* Body */}
      <div className="relative z-10 grid min-h-0 flex-1 grid-cols-1 gap-0 overflow-hidden lg:grid-cols-[1fr_360px]">
        {/* Left: focus column */}
        <div className="flex min-h-0 flex-col overflow-y-auto px-5 py-6 sm:px-8">
          <div className="mx-auto w-full max-w-2xl space-y-6">
            {/* Goal pill */}
            {goal && (
              <div className="rounded-xl border border-border/60 bg-card/50 p-4">
                <div className="flex items-center gap-2 text-[10.5px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  <Target className="h-3.5 w-3.5" /> Your Goal
                </div>
                <p className="mt-1.5 text-base font-medium leading-snug">
                  {goal}
                </p>
              </div>
            )}

            {/* Final prompt or current question */}
            {showFinalPrompt && finalPromptObj ? (
              <div className="space-y-4">
                {finalPromptObj.intro && (
                  <div className="rounded-xl border border-border/60 bg-card/50 p-4 text-sm">
                    <MessageResponse>{finalPromptObj.intro}</MessageResponse>
                  </div>
                )}
                <FinalPromptCard
                  prompts={finalPromptObj.prompts}
                  onRegenerate={handleRegenerate}
                  regenerating={isBusy}
                />
                {certificate && <QualityCertificate cert={certificate} />}
                {finalPromptObj.outro && (
                  <div className="text-xs text-muted-foreground">
                    <MessageResponse>{finalPromptObj.outro}</MessageResponse>
                  </div>
                )}
              </div>
            ) : (
              <>
                {hasFinalPrompt && !ready && (
                  <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 text-sm text-amber-100">
                    <div className="font-semibold">
                      I still need a few important details before generating a
                      world-class prompt.
                    </div>
                    {missingCritical.length > 0 && (
                      <div className="mt-1.5 text-xs text-amber-200/90">
                        Still missing:{" "}
                        {expertSlots
                          .filter((s) => missingCritical.includes(s.id))
                          .map((s) => s.label)
                          .join(", ")}
                        .
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={handleContinueInterview}
                      disabled={isBusy}
                      className="mt-3 inline-flex items-center gap-1.5 rounded-md border border-amber-400/60 bg-amber-400/20 px-3 py-1 text-xs font-medium text-amber-50 transition-colors hover:bg-amber-400/30 disabled:opacity-50"
                    >
                      Ask the next question
                    </button>
                  </div>
                )}
                <div className="overflow-hidden rounded-2xl border border-primary/25 bg-card/60 shadow-[0_0_0_1px_color-mix(in_oklch,var(--primary)_15%,transparent),0_20px_60px_-30px_color-mix(in_oklch,var(--primary)_55%,transparent)]">
                  <div className="flex items-center justify-between border-b border-border/50 bg-primary/5 px-4 py-2">
                    <div className="flex items-center gap-2">
                      <div className="text-[10.5px] font-semibold uppercase tracking-[0.18em] text-primary">
                        Question {currentQuestionNumber}
                      </div>
                      {lastSlot &&
                        expertSlots.find((s) => s.id === lastSlot) && (
                          <span className="rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-primary">
                            {expertSlots.find((s) => s.id === lastSlot)?.label}
                          </span>
                        )}
                    </div>
                    <div className="text-[10.5px] text-muted-foreground">
                      {isBusy ? "Preparing…" : "Awaiting your answer"}
                    </div>
                  </div>
                  <div className="p-5">
                    {isBusy && !lastAssistantText ? (
                      <Shimmer>Thinking of the next question…</Shimmer>
                    ) : lastAssistant ? (
                      <div className="text-[15px] leading-relaxed">
                        <MessageResponse>{lastAssistantText}</MessageResponse>
                      </div>
                    ) : (
                      <Shimmer>Loading…</Shimmer>
                    )}

                    {lastAssistant && !isBusy && (
                      <button
                        type="button"
                        onClick={handleWhy}
                        className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-card/60 px-2.5 py-1 text-[11px] text-muted-foreground transition-colors hover:border-primary/40 hover:bg-card hover:text-foreground"
                      >
                        <HelpCircle className="h-3 w-3" /> Why am I being asked
                        this?
                      </button>
                    )}

                    <div className="mt-5">
                      <ComposerForm
                        disabled={isBusy}
                        status={status}
                        onSubmit={handleSend}
                        textareaRef={textareaRef}
                        placeholder="Type your answer  ·  or ask: what does this mean?"
                      />
                      <div className="mt-1.5 text-[11px] text-muted-foreground">
                        Tip: ask{" "}
                        <span className="text-foreground">
                          "what does this mean?"
                        </span>{" "}
                        any time to learn a term.
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}

            {error && (
              <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-2 text-sm text-destructive">
                {error.message}
              </div>
            )}
          </div>
        </div>

        {/* Right: interview roadmap + collected answers */}
        <aside className="hidden min-h-0 flex-col border-l border-border/50 bg-sidebar/40 lg:flex">
          <div className="flex items-center justify-between border-b border-border/50 px-4 py-3">
            <div className="text-[10.5px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Interview Roadmap
            </div>
            <div className="rounded-full bg-primary/15 px-2 py-0.5 text-[10.5px] font-semibold text-primary">
              {slotStatuses.filter((s) => s.filled).length}/
              {slotStatuses.length || "—"}
            </div>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
            {slotStatuses.length === 0 ? (
              <div className="text-xs text-muted-foreground/80">
                Tracking will appear once we know which expert fits your goal.
              </div>
            ) : (
              <>
                {/* Missing-info counters */}
                <div className="mb-4 grid grid-cols-3 gap-2">
                  {(
                    ["critical", "important", "optional"] as SlotPriority[]
                  ).map((p) => {
                    const missing = slotStatuses.filter(
                      (s) => s.priority === p && !s.filled,
                    ).length;
                    const tone =
                      p === "critical"
                        ? "border-rose-500/40 bg-rose-500/10 text-rose-200"
                        : p === "important"
                          ? "border-amber-500/40 bg-amber-500/10 text-amber-100"
                          : "border-border/60 bg-card/40 text-muted-foreground";
                    return (
                      <div
                        key={p}
                        className={`rounded-md border px-2 py-1.5 text-center ${tone}`}
                      >
                        <div className="text-[9.5px] font-semibold uppercase tracking-[0.14em] opacity-80">
                          {p}
                        </div>
                        <div className="text-base font-semibold tabular-nums">
                          {missing}
                        </div>
                        <div className="text-[9.5px] opacity-70">missing</div>
                      </div>
                    );
                  })}
                </div>

                {(["critical", "important", "optional"] as SlotPriority[]).map(
                  (p) => {
                    const group = slotStatuses.filter((s) => s.priority === p);
                    if (group.length === 0) return null;
                    const heading =
                      p === "critical"
                        ? "Critical"
                        : p === "important"
                          ? "Important"
                          : "Optional";
                    return (
                      <div key={p} className="mb-3">
                        <div className="mb-1.5 flex items-center justify-between text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                          <span>{heading}</span>
                          <span>
                            {group.filter((s) => s.filled).length}/
                            {group.length}
                          </span>
                        </div>
                        <ul className="space-y-1.5">
                          {group.map((s) => (
                            <li
                              key={s.id}
                              title={s.why}
                              className={
                                "flex items-start gap-2 rounded-md border px-2.5 py-1.5 text-xs transition-colors " +
                                (s.filled
                                  ? "border-primary/30 bg-primary/10 text-foreground"
                                  : p === "critical"
                                    ? "border-rose-500/30 bg-rose-500/5 text-muted-foreground"
                                    : "border-border/60 bg-card/30 text-muted-foreground")
                              }
                            >
                              <span className="mt-0.5 text-[12px] leading-none">
                                {s.filled ? "✅" : "❌"}
                              </span>
                              <div className="min-w-0 flex-1">
                                <div className="font-medium">{s.label}</div>
                                {s.filled && s.value && (
                                  <div className="mt-0.5 line-clamp-2 text-[11px] text-foreground/80">
                                    {s.value}
                                  </div>
                                )}
                                {!s.filled && (
                                  <div className="mt-0.5 line-clamp-2 text-[10.5px] text-muted-foreground/80">
                                    {s.why}
                                  </div>
                                )}
                              </div>
                            </li>
                          ))}
                        </ul>
                      </div>
                    );
                  },
                )}
              </>
            )}
            {hasFinalPrompt && (
              <div className="mt-4 rounded-lg border border-primary/30 bg-primary/10 px-3 py-2 text-xs text-primary">
                Interview complete — master prompt generated.
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}

function QualityScore({ value }: { value: number }) {
  const tone =
    value >= 8
      ? "text-primary"
      : value >= 5
        ? "text-amber-300"
        : "text-muted-foreground";
  return (
    <div className="hidden text-right leading-tight sm:block">
      <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
        Prompt Quality
      </div>
      <div className={"text-lg font-semibold tabular-nums " + tone}>
        {value.toFixed(1)}
        <span className="text-xs text-muted-foreground">/10</span>
      </div>
    </div>
  );
}

function ProgressDial({ value }: { value: number }) {
  const radius = 22;
  const c = 2 * Math.PI * radius;
  const offset = c - (value / 100) * c;
  return (
    <div className="flex items-center gap-3">
      <div className="text-right leading-tight">
        <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Understanding
        </div>
        <div className="text-lg font-semibold tabular-nums">{value}%</div>
      </div>
      <div className="relative h-14 w-14">
        <svg viewBox="0 0 56 56" className="h-14 w-14 -rotate-90">
          <circle
            cx="28"
            cy="28"
            r={radius}
            className="fill-none stroke-muted"
            strokeWidth="5"
          />
          <circle
            cx="28"
            cy="28"
            r={radius}
            className="fill-none stroke-primary transition-all duration-500"
            strokeWidth="5"
            strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={offset}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center text-[11px] font-semibold tabular-nums">
          {value}
        </div>
      </div>
    </div>
  );
}

function QualityCertificate({ cert }: { cert: PromptCertificate }) {
  const dims: Array<[string, number]> = [
    ["Clarity", cert.clarity],
    ["Context", cert.context],
    ["Constraints", cert.constraints],
    ["Audience", cert.audience],
    ["Output", cert.output],
    ["Completeness", cert.completeness],
  ];
  const tone =
    cert.overall >= 9.5
      ? "text-primary"
      : cert.overall >= 8
        ? "text-emerald-300"
        : "text-amber-300";
  return (
    <div className="rounded-xl border border-primary/30 bg-card/60 p-4 shadow-[0_0_30px_-20px_var(--primary)]">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-[10.5px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Final Quality Certificate
          </div>
          <div className="mt-2 space-y-1 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-primary">✓</span> Interview Complete
            </div>
            <div className="flex items-center gap-2">
              <span className="text-primary">✓</span> Prompt Reviewed
            </div>
            <div className="flex items-center gap-2">
              <span className="text-primary">✓</span> Self-Corrected (
              {cert.revisions} {cert.revisions === 1 ? "pass" : "passes"})
            </div>
            <div className="flex items-center gap-2">
              <span className="text-primary">✓</span> Quality Verified
            </div>
          </div>
        </div>
        <div className="text-right leading-tight">
          <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Overall Score
          </div>
          <div className={"text-3xl font-semibold tabular-nums " + tone}>
            {cert.overall.toFixed(1)}
            <span className="text-sm text-muted-foreground">/10</span>
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-3">
        {dims.map(([label, v]) => (
          <div key={label}>
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-muted-foreground">{label}</span>
              <span className="tabular-nums font-medium">{v.toFixed(1)}</span>
            </div>
            <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{
                  width: `${Math.min(100, Math.max(0, (v / 10) * 100))}%`,
                }}
              />
            </div>
          </div>
        ))}
      </div>

      {cert.assumptions.length > 0 && (
        <div className="mt-4 rounded-lg border border-border/60 bg-background/40 p-3">
          <div className="text-[10.5px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Assumptions Made
          </div>
          <ul className="mt-1.5 space-y-1 text-xs text-foreground/80">
            {cert.assumptions.map((a, i) => (
              <li key={i} className="flex gap-2">
                <span className="text-muted-foreground">•</span>
                <span>{a}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function InfoRow({
  index,
  label,
  value,
  accent,
}: {
  index: string;
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div
      className={
        "mb-2 rounded-lg border px-3 py-2 transition-colors " +
        (accent
          ? "border-primary/30 bg-primary/10"
          : "border-border/60 bg-card/40 hover:bg-card/70")
      }
    >
      <div className="flex items-center gap-2">
        <span
          className={
            "inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-semibold " +
            (accent
              ? "bg-primary text-primary-foreground"
              : "bg-primary/20 text-primary")
          }
        >
          {index}
        </span>
        <span className="line-clamp-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
      </div>
      <div className="mt-1 line-clamp-3 text-[13px] leading-snug text-foreground/95">
        {value}
      </div>
    </div>
  );
}

function BackgroundGlow() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 overflow-hidden"
    >
      <div
        className="absolute -left-32 -top-32 h-80 w-80 rounded-full opacity-30 blur-3xl"
        style={{
          background:
            "radial-gradient(circle, var(--primary), transparent 60%)",
        }}
      />
      <div
        className="absolute -bottom-40 right-0 h-96 w-96 rounded-full opacity-20 blur-3xl"
        style={{
          background:
            "radial-gradient(circle, var(--accent-cyan, #22d3ee), transparent 60%)",
        }}
      />
    </div>
  );
}

function ComposerForm({
  disabled,
  status,
  onSubmit,
  textareaRef,
  placeholder,
  big,
}: {
  disabled: boolean;
  status: ReturnType<typeof useChat>["status"];
  onSubmit: (text: string) => void;
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  placeholder: string;
  big?: boolean;
}) {
  return (
    <PromptInput
      onSubmit={({ text }) => {
        const t = (text ?? "").trim();
        if (!t || disabled) return;
        onSubmit(t);
      }}
    >
      <PromptInputTextarea
        ref={textareaRef as never}
        placeholder={placeholder}
        className={big ? "min-h-[80px] text-base" : undefined}
      />
      <PromptInputFooter className="justify-end">
        <PromptInputSubmit status={status} disabled={disabled} />
      </PromptInputFooter>
    </PromptInput>
  );
}
