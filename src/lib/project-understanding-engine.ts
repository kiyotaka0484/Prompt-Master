import type { UIMessage } from "ai";
import {
  EXPERTS,
  detectExpert,
  isVagueIntent,
  type ExpertId,
  type SlotPriority,
} from "./experts";

export const PROFILE_SCHEMA_VERSION = 1;

export type RequirementOrigin =
  "explicit" | "inferred" | "assumed" | "unresolved" | "contradictory";

export type ConfidenceLevel = "high" | "medium" | "low";

export type RequirementCategory =
  | "goal"
  | "audience"
  | "deliverable"
  | "platform"
  | "functional"
  | "nonfunctional"
  | "constraint"
  | "budget"
  | "timeline"
  | "resource"
  | "exclusion"
  | "success_criteria"
  | "preference"
  | "domain_extension";

export interface RequirementEvidence {
  /** Verbatim user quote or concise excerpt from the turn */
  quote: string;
  /** 0-based conversation turn index */
  turnIndex: number;
  /** Optional UIMessage ID reference */
  messageId?: string;
  /** Optional interview slot ID if captured in response to a slot question */
  slotId?: string;
  /** Explanation when inferred or assumed */
  rationale?: string;
}

export interface PreviousRequirementValue {
  value: string;
  turnIndex: number;
  quote: string;
}

export interface ProfileRequirementItem {
  id: string;
  category: RequirementCategory;
  label: string;
  value: string;
  origin: RequirementOrigin;
  confidence: ConfidenceLevel;
  evidence: RequirementEvidence;
  status: "active" | "resolved" | "superseded" | "contradictory";
  slotId?: string;
  previousValues?: PreviousRequirementValue[];
  resolvedByTurn?: number;
  updatedAtTurn: number;
}

export interface ProfileContradiction {
  id: string;
  field: string;
  title: string;
  description: string;
  recommendation: string;
  earlierEvidence: RequirementEvidence & { value: string };
  conflictingEvidence: RequirementEvidence & { value: string };
  status: "unresolved" | "resolved";
  resolvedAtTurn?: number;
  resolutionNote?: string;
}

export interface UnresolvedQuestionItem {
  slotId: string;
  label: string;
  priority: SlotPriority;
  why: string;
  reason: "missing" | "vague_answer" | "contradiction";
}

export interface ProjectProfile {
  schemaVersion: number;
  expertId: ExpertId | null;
  lastProcessedTurn: number;
  updatedAt: number;

  // Optional structured top-level fields (only populated when relevant/present)
  primaryGoal?: ProfileRequirementItem;
  intendedAudience?: ProfileRequirementItem;
  desiredDeliverable?: ProfileRequirementItem;
  targetPlatforms: ProfileRequirementItem[];
  functionalRequirements: ProfileRequirementItem[];
  nonFunctionalRequirements: ProfileRequirementItem[];
  constraints: ProfileRequirementItem[];
  budget?: ProfileRequirementItem;
  timeline?: ProfileRequirementItem;
  resources: ProfileRequirementItem[];
  explicitExclusions: ProfileRequirementItem[];
  successCriteria: ProfileRequirementItem[];
  userPreferences: ProfileRequirementItem[];

  // Core collections for evidence, assumptions, open questions, and conflicts
  confirmedFacts: ProfileRequirementItem[];
  inferredAssumptions: ProfileRequirementItem[];
  unresolvedQuestions: UnresolvedQuestionItem[];
  contradictions: ProfileContradiction[];

  // Domain-specific or unknown consultant extensions
  domainExtensions: Record<string, ProfileRequirementItem>;
}

export interface TurnUpdateInput {
  turnIndex?: number;
  messageId?: string;
  userText: string;
  askedSlotId?: string | null;
  askedSlotLabel?: string | null;
  expertId?: ExpertId | null;
  /** Optional custom consultant-specific key/value attributes */
  customFields?: Record<
    string,
    | string
    | {
        value: string;
        label?: string;
        origin?: RequirementOrigin;
        confidence?: ConfidenceLevel;
      }
  >;
}

const SLOT_TAG_RE = /<!--\s*slot\s*:\s*([a-zA-Z0-9_\-\s]+?)\s*-->/i;

const VAGUE_SINGLE_WORDS = new Set([
  "money",
  "income",
  "cash",
  "profit",
  "good",
  "great",
  "best",
  "nice",
  "awesome",
  "fast",
  "quick",
  "asap",
  "soon",
  "a lot",
  "lots",
  "many",
  "some",
  "enough",
  "everyone",
  "anyone",
  "everybody",
  "people",
  "all",
  "standard",
  "normal",
  "basic",
  "simple",
  "regular",
  "whatever",
  "anything",
  "idk",
  "dunno",
  "not sure",
  "cool",
  "fine",
  "ok",
  "okay",
  "yes",
  "no",
  "yep",
  "nope",
  "stuff",
  "things",
  "success",
  "successful",
  "maybe",
]);

function normalizeKey(raw: string | null | undefined): string {
  if (!raw) return "";
  return raw
    .trim()
    .toLowerCase()
    .replace(/[\s\-_]+/g, "_");
}

function normalizeValueForComparison(val: string): string {
  return val
    .toLowerCase()
    .replace(/[^a-z0-9$€£¥]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function isVagueTurnAnswer(text: string): boolean {
  const t = text.trim().toLowerCase();
  if (!t) return true;
  if (isVagueIntent(t)) return true;
  const words = t.split(/\s+/).filter(Boolean);
  if (
    words.length <= 3 &&
    words.every((w) => VAGUE_SINGLE_WORDS.has(w) || w === "not" || w === "sure")
  ) {
    return true;
  }
  if (
    /^(idk|dunno|not sure|i don'?t know|no idea|unsure|whatever|anything)(\s+(idk|dunno|not sure|i don'?t know|no idea|unsure|yet|bro|man|really))*$/i.test(
      t,
    )
  ) {
    return true;
  }
  return (
    t === "make money" ||
    t === "passive income" ||
    t === "get rich" ||
    t === "grow fast" ||
    t === "get views" ||
    t === "make it look good" ||
    t === "standard website" ||
    t === "website for everyone" ||
    t === "i don't know" ||
    t === "i dont know" ||
    t === "not sure" ||
    t === "whatever works" ||
    t === "as fast as possible" ||
    t === "learn coding"
  );
}

function isClarificationQuestion(text: string): boolean {
  if (!text) return false;
  const t = text.trim().toLowerCase();
  return (
    t.startsWith("why are you asking") ||
    t.includes("why am i being asked") ||
    t.startsWith("what does this mean") ||
    t.startsWith("what does that mean") ||
    t.startsWith("can you explain") ||
    t.startsWith("could you explain") ||
    t.startsWith("what is ") ||
    t.startsWith("what are ") ||
    t.includes("i don't understand") ||
    t.includes("i dont understand") ||
    t.includes("explain this to me") ||
    t.includes("tell me more about what you mean") ||
    (t.endsWith("?") &&
      (t.includes("mean") ||
        t.includes("why") ||
        t.includes("explain") ||
        t.includes("clarif")))
  );
}

/**
 * Detects whether a user turn contains explicit correction cues
 * (e.g. "Actually, ...", "Correction:", "Instead of ...", "Wait, change ...").
 */
export function hasExplicitCorrectionIntent(text: string): boolean {
  const lower = text.trim().toLowerCase();
  return /\b(actually|correction|instead of|wait\b|change\b|update\b|scratch that|i meant|sorry,?\s*i meant|no,?\s*let'?s|let'?s switch to|switch to|replace\b|rather than|on second thought)\b/i.test(
    lower,
  );
}

/**
 * Detects whether a user turn pivots or changes the overall project direction.
 */
export function hasProjectPivotIntent(text: string): boolean {
  const lower = text.trim().toLowerCase();
  return /\b(pivot|switch(?:ing)?\s+(?:direction|project|entirely|to\s+a)|completely different|forget that|scratch the whole|change the project to|instead of (?:a|an|building)\s+[a-z0-9\s-]+,\s*(?:let'?s|i want to)|actually,?\s*let'?s\s+(?:pivot|build))\b/i.test(
    lower,
  );
}

/**
 * Detects whether the user is delegating the choice to the consultant ("you decide", "whatever you recommend").
 */
export function isUserDelegation(text: string): boolean {
  const lower = text.trim().toLowerCase();
  return /\b(you decide|up to you|whatever you (?:think|recommend|suggest|prefer)| whatever makes (?:the most )?sense|use your (?:best )?judgment|you pick|you choose|pick for me|choose for me|dealer'?s choice|default is fine|sensible default)\b/i.test(
    lower,
  );
}

/**
 * Detects whether the user is asking to skip the current question.
 */
export function isSkipQuestionRequest(text: string): boolean {
  const lower = text.trim().toLowerCase();
  if (/^(skip|pass|next|next question|move on)$/i.test(lower)) {
    return true;
  }
  return (
    !isGenerateNowRequest(lower) &&
    /\b(skip (?:this|that)(?: question)?|pass on (?:this|that)|move to the next question|don'?t care about this question)\b/i.test(
      lower,
    )
  );
}

/**
 * Detects whether the user is expressing uncertainty ("I don't know", "not sure").
 */
export function isUserUncertainty(text: string): boolean {
  const lower = text.trim().toLowerCase();
  return (
    /^(idk|dunno|not sure|i don'?t know|i dont know|no idea|unsure|not certain)(\s+.*)?$/i.test(
      lower,
    ) ||
    /\b(i don'?t know|i dont know|i am not sure|i'?m not sure|not sure about (?:this|that|hosting|the stack|budget)|no idea what to pick)\b/i.test(
      lower,
    )
  );
}

/**
 * Detects whether the user is requesting to skip the remaining interview and generate the final prompts immediately.
 */
export function isGenerateNowRequest(text: string): boolean {
  const lower = text.trim().toLowerCase();
  return /\b(skip (?:the )?(?:rest of the )?(?:interview|questions)|generate (?:the |my )?(?:final |master )?prompts?(?:\s+now|\s+anyway|\s+immediately|\s+as\s+is)?|just generate|stop asking(?: questions)?|proceed (?:now|without resolving|anyway)|ready for (?:the )?prompts?|give me (?:the )?prompts? now)\b/i.test(
    lower,
  );
}

/**
 * Detects whether the project's primary goal falls outside the 4 standard consultant categories
 * (business, website, study, creator) so commercial/domain-specific checklist slots are suppressed.
 */
export function isUnfamiliarTaskDomain(profile: ProjectProfile): boolean {
  const goalText = profile.primaryGoal?.value?.trim().toLowerCase() ?? "";
  if (!goalText || goalText.split(/\s+/).length < 4) {
    return false;
  }

  const explicitUnfamiliarCue =
    /\b(tabletop|d&d|dungeons\s+and\s+dragons|murder\s+mystery|dungeon\s+module|one-shot|rpg\s+campaign|larp|incident\s+response|runbook|sre\s+playbook|standard\s+operating\s+procedure|fermentation|sourdough|culinary|recipe\s+matrix|clinical\s+trial|lab\s+protocol|board\s+game|wedding\s+speech)\b/i.test(
      goalText,
    );

  const hasStandardCategoryCue =
    /\b(website|web\s+app|web\s+application|web\s+platform|mobile\s+app|saas|landing\s+page|portfolio|dashboard|frontend|backend|react|next\.?js|typescript|supabase|e-commerce|ecommerce|online\s+store|business|startup|company|revenue|monetiz|agency|freelance|side\s+hustle|dropship|b2b|b2c|marketplace|study|learn|learning|course|curriculum|exam|tutorial|certification|youtube|tiktok|instagram|twitch|podcast|newsletter|content\s+creator|shorts|reels|subscribers|followers|viral|blog)\b/i.test(
      goalText,
    );

  if (
    explicitUnfamiliarCue &&
    !/\b(website|web\s+app|mobile\s+app|saas|youtube|tiktok)\b/i.test(goalText)
  ) {
    return true;
  }

  return !hasStandardCategoryCue;
}

/**
 * Creates a clean, empty ProjectProfile ready for incremental updates.
 */
export function createEmptyProjectProfile(
  expertId: ExpertId | null = null,
): ProjectProfile {
  const profile: ProjectProfile = {
    schemaVersion: PROFILE_SCHEMA_VERSION,
    expertId: expertId ?? null,
    lastProcessedTurn: -1,
    updatedAt: Date.now(),
    targetPlatforms: [],
    functionalRequirements: [],
    nonFunctionalRequirements: [],
    constraints: [],
    resources: [],
    explicitExclusions: [],
    successCriteria: [],
    userPreferences: [],
    confirmedFacts: [],
    inferredAssumptions: [],
    unresolvedQuestions: [],
    contradictions: [],
    domainExtensions: {},
  };

  refreshUnresolvedQuestions(profile);
  return profile;
}

/**
 * Deep clones a ProjectProfile to keep updates pure and side-effect free.
 */
function cloneProfile(profile: ProjectProfile): ProjectProfile {
  return JSON.parse(JSON.stringify(profile)) as ProjectProfile;
}

function mergeIntoList(
  list: ProfileRequirementItem[],
  incoming: ProfileRequirementItem,
  allowReplaceById = false,
): void {
  const normIncomingVal = normalizeValueForComparison(incoming.value);
  if (!normIncomingVal) return;

  const existingByIdIdx = list.findIndex(
    (item) => normalizeKey(item.id) === normalizeKey(incoming.id),
  );
  if (existingByIdIdx >= 0) {
    const existing = list[existingByIdIdx];
    const normExistingVal = normalizeValueForComparison(existing.value);
    if (normExistingVal === normIncomingVal) {
      // Duplicate info: preserve earlier item, do not duplicate
      return;
    }
    if (allowReplaceById) {
      const prev = existing.previousValues ? [...existing.previousValues] : [];
      prev.push({
        value: existing.value,
        turnIndex: existing.evidence.turnIndex,
        quote: existing.evidence.quote,
      });
      list[existingByIdIdx] = {
        ...incoming,
        previousValues: prev,
      };
      return;
    }
  }

  // Check if an item with identical category and normalized value already exists
  const duplicateIdx = list.findIndex(
    (item) =>
      item.category === incoming.category &&
      normalizeValueForComparison(item.value) === normIncomingVal,
  );
  if (duplicateIdx >= 0) {
    return;
  }

  list.push(incoming);
}

function setScalarField(
  profile: ProjectProfile,
  fieldKey:
    | "primaryGoal"
    | "intendedAudience"
    | "desiredDeliverable"
    | "budget"
    | "timeline",
  incoming: ProfileRequirementItem,
  isCorrection: boolean,
): void {
  const current = profile[fieldKey];
  if (!current) {
    profile[fieldKey] = incoming;
    return;
  }

  const normCurrent = normalizeValueForComparison(current.value);
  const normIncoming = normalizeValueForComparison(incoming.value);
  if (normCurrent === normIncoming) {
    // Only upgrade confidence/origin if current was inferred/assumed and incoming is explicit
    if (current.origin !== "explicit" && incoming.origin === "explicit") {
      profile[fieldKey] = {
        ...incoming,
        previousValues: current.previousValues,
      };
    }
    return;
  }

  // Never overwrite an explicit fact with an inference or assumption
  if (current.origin === "explicit" && incoming.origin !== "explicit") {
    return;
  }

  // If current was inferred/assumed and user now states an explicit value, replace and resolve assumption
  if (
    current.origin !== "explicit" ||
    isCorrection ||
    incoming.origin === "explicit"
  ) {
    const prev = current.previousValues ? [...current.previousValues] : [];
    if (current.origin === "explicit") {
      prev.push({
        value: current.value,
        turnIndex: current.evidence.turnIndex,
        quote: current.evidence.quote,
      });
    }
    profile[fieldKey] = {
      ...incoming,
      previousValues: prev.length > 0 ? prev : undefined,
    };
  }
}

function resolveMatchingAssumptions(
  profile: ProjectProfile,
  categoryOrSlot: string,
  turnIndex: number,
): void {
  const normTarget = normalizeKey(categoryOrSlot);
  for (const assumption of profile.inferredAssumptions) {
    if (assumption.status !== "active") continue;
    const normId = normalizeKey(assumption.id);
    const normSlot = normalizeKey(assumption.slotId);
    const normCat = normalizeKey(assumption.category);

    const matches =
      normId === normTarget ||
      normSlot === normTarget ||
      normCat === normTarget ||
      (normTarget === "budget" &&
        (normId.includes("budget") || normCat === "budget")) ||
      ((normTarget === "audience" || normTarget === "target_audience") &&
        (normId.includes("audience") || normCat === "audience")) ||
      ((normTarget === "tech_stack" ||
        normTarget === "skills" ||
        normTarget === "experience") &&
        (normId.includes("tech") || normId.includes("skills"))) ||
      ((normTarget === "purpose" || normTarget === "type") &&
        (normId.includes("site_type") || normCat === "deliverable")) ||
      (normTarget === "hosting" && normId.includes("hosting")) ||
      (normTarget === "integrations" && normId.includes("integrations")) ||
      ((normTarget === "timeline" || normTarget === "deadline") &&
        (normId.includes("timeline") || normCat === "timeline"));

    if (matches) {
      assumption.status = "resolved";
      assumption.resolvedByTurn = turnIndex;
      assumption.updatedAtTurn = turnIndex;
    }
  }
}

function upsertConfirmedFact(
  profile: ProjectProfile,
  item: ProfileRequirementItem,
): void {
  // CRITICAL INVARIANT: Never silently convert an inference or assumption into a confirmed fact
  if (item.origin !== "explicit") {
    return;
  }

  const slotKey = normalizeKey(item.slotId || item.id);
  const existingIdx = profile.confirmedFacts.findIndex(
    (f) => normalizeKey(f.slotId || f.id) === slotKey,
  );

  if (existingIdx >= 0) {
    const existing = profile.confirmedFacts[existingIdx];
    if (
      normalizeValueForComparison(existing.value) ===
      normalizeValueForComparison(item.value)
    ) {
      return;
    }
    const prev = existing.previousValues ? [...existing.previousValues] : [];
    prev.push({
      value: existing.value,
      turnIndex: existing.evidence.turnIndex,
      quote: existing.evidence.quote,
    });
    profile.confirmedFacts[existingIdx] = {
      ...item,
      previousValues: prev,
    };
  } else {
    // Also check if another confirmed fact has the exact same category & value
    const sameVal = profile.confirmedFacts.some(
      (f) =>
        f.category === item.category &&
        normalizeValueForComparison(f.value) ===
          normalizeValueForComparison(item.value),
    );
    if (!sameVal) {
      profile.confirmedFacts.push(item);
    }
  }

  resolveMatchingAssumptions(profile, slotKey, item.updatedAtTurn);
  resolveMatchingAssumptions(profile, item.category, item.updatedAtTurn);
}

function addInferredOrAssumedItem(
  profile: ProjectProfile,
  item: ProfileRequirementItem,
): void {
  if (item.origin !== "inferred" && item.origin !== "assumed") {
    return;
  }
  const itemKey = normalizeKey(item.id);
  // Do not add an inference/assumption if we already have an explicit confirmed fact for this slot/category
  const alreadyConfirmed = profile.confirmedFacts.some((f) => {
    const fSlot = normalizeKey(f.slotId || f.id);
    return (
      fSlot === itemKey ||
      (item.slotId && fSlot === normalizeKey(item.slotId)) ||
      (item.category !== "domain_extension" &&
        item.category !== "functional" &&
        f.category === item.category)
    );
  });
  if (alreadyConfirmed) {
    return;
  }

  const existingIdx = profile.inferredAssumptions.findIndex(
    (a) => normalizeKey(a.id) === itemKey,
  );
  if (existingIdx >= 0) {
    const existing = profile.inferredAssumptions[existingIdx];
    if (existing.status === "resolved") return;
    if (
      normalizeValueForComparison(existing.value) ===
      normalizeValueForComparison(item.value)
    ) {
      return;
    }
    profile.inferredAssumptions[existingIdx] = item;
  } else {
    profile.inferredAssumptions.push(item);
  }
}

/**
 * Extracts explicit signals (platforms, exclusions, deliverables, budget, timeline, preferences, constraints)
 * from a user turn.
 */
function extractTurnSignals(
  text: string,
  turnIndex: number,
  messageId: string | undefined,
  askedSlotId: string | null | undefined,
  isCorrection: boolean,
  profile: ProjectProfile,
): void {
  const trimmed = text.trim();
  const lower = trimmed.toLowerCase();

  // 1. Target AI Platforms mentioned explicitly by the user
  const platformMap: Array<{ key: string; label: string; pattern: RegExp }> = [
    {
      key: "chatgpt",
      label: "ChatGPT (OpenAI)",
      pattern: /\b(chatgpt|gpt-4o?|openai)\b/i,
    },
    {
      key: "claude",
      label: "Claude (Anthropic)",
      pattern: /\b(claude|anthropic|sonnet|opus)\b/i,
    },
    { key: "gemini", label: "Gemini (Google)", pattern: /\b(gemini)\b/i },
    { key: "perplexity", label: "Perplexity AI", pattern: /\b(perplexity)\b/i },
    { key: "grok", label: "Grok (xAI)", pattern: /\b(grok)\b/i },
    {
      key: "cursor",
      label: "Cursor IDE",
      pattern: /\b(cursor|\.cursorrules)\b/i,
    },
    {
      key: "windsurf",
      label: "Windsurf Cascade",
      pattern: /\b(windsurf|codeium)\b/i,
    },
  ];
  for (const plat of platformMap) {
    if (plat.pattern.test(trimmed)) {
      const item: ProfileRequirementItem = {
        id: `platform_${plat.key}`,
        category: "platform",
        label: "Target AI Platform",
        value: plat.label,
        origin: "explicit",
        confidence: "high",
        evidence: { quote: trimmed, turnIndex, messageId },
        status: "active",
        updatedAtTurn: turnIndex,
      };
      mergeIntoList(profile.targetPlatforms, item);
    }
  }

  // 2. Explicit Exclusions (e.g. "no paid ads", "without SMS", "don't use Kubernetes", "avoid Redux", "no camera / faceless")
  const exclusionPatterns: RegExp[] = [
    /\b(?:no|without|avoid|don'?t\s+(?:use|want|include)|never\s+use|exclude|skip)\s+([a-z0-9\s\-/+#]{3,45}?)(?=[.,;!\n]|$|\s+(?:and|or|because|since|but|instead))/gi,
  ];
  for (const re of exclusionPatterns) {
    let m: RegExpExecArray | null;
    while ((m = re.exec(trimmed)) !== null) {
      const rawExcl = m[0].trim();
      const target = (m[1] || "").trim().toLowerCase();
      // Skip budget phrases like "no money" or "no budget" (handled by budget extractor) or vague "no idea"
      if (
        !target ||
        /^(money|budget|cost|idea|clue|problem|worries|thanks|thank you|coding|code|experience)\b/.test(
          target,
        )
      ) {
        continue;
      }
      const exclId = `exclusion_${normalizeKey(target).slice(0, 32)}`;
      const exclItem: ProfileRequirementItem = {
        id: exclId,
        category: "exclusion",
        label: "Explicit Exclusion",
        value: rawExcl,
        origin: "explicit",
        confidence: "high",
        evidence: { quote: trimmed, turnIndex, messageId },
        status: "active",
        updatedAtTurn: turnIndex,
      };
      mergeIntoList(profile.explicitExclusions, exclItem, true);
    }
  }

  // 3. Explicit Budget Statements
  const normSlot = normalizeKey(askedSlotId);
  const isZeroBudgetExplicit =
    /(?:^|[\s(])\$0\b|\b(zero budget|no budget|no money|100%\s*free|free tier only|strictly free|shoestring)\b/i.test(
      trimmed,
    );
  const explicitBudgetMatch =
    trimmed.match(
      /\b(?:budget|capital|funding|spend|spending|invest|investment)\s*(?:of|is|around|under|up to|to|:)?\s*(\$[0-9][0-9,]*(?:\.[0-9]+)?k?|\b[0-9][0-9,]*(?:\.[0-9]+)?k?\s*(?:usd|dollars|eur|gbp|bdt|inr)(?:\s*\/\s*(?:mo|month))?)/i,
    ) ??
    trimmed.match(
      /(\$[0-9][0-9,]*(?:\.[0-9]+)?k?(?:\s*\/\s*(?:mo|month))?)\s*(?:budget|capital|funding|max|limit|per month|a month)?/i,
    );

  // Only treat bare "$X" as budget if slot is budget OR text mentions budget/cost/spend/free/capital/month
  const hasBudgetContextWord =
    normSlot === "budget" ||
    /\b(budget|capital|funding|cost|spend|invest|bootstrap|free tier|starting with)\b/i.test(
      trimmed,
    );

  if (isZeroBudgetExplicit) {
    const budgetItem: ProfileRequirementItem = {
      id: "budget",
      slotId: "budget",
      category: "budget",
      label: "Budget Constraint",
      value: "$0 (Free Tier / Zero-Cost Only)",
      origin: "explicit",
      confidence: "high",
      evidence: {
        quote: trimmed,
        turnIndex,
        messageId,
        slotId: normSlot || "budget",
      },
      status: "active",
      updatedAtTurn: turnIndex,
    };
    setScalarField(profile, "budget", budgetItem, isCorrection);
    upsertConfirmedFact(profile, budgetItem);
    mergeIntoList(profile.constraints, budgetItem, true);
  } else if (
    explicitBudgetMatch &&
    explicitBudgetMatch[1] &&
    hasBudgetContextWord
  ) {
    const rawAmt = explicitBudgetMatch[1].trim();
    // Avoid confusing pricing tiers ("charge $2000/month" or "priced at $99/mo") with project budget unless slot is budget
    const isPricingStatement =
      normSlot !== "budget" &&
      /\b(charge|charging|price|priced at|pricing|sell for|subscription of|pay\s+\$)\b/i.test(
        trimmed,
      ) &&
      !/\bbudget\b/i.test(trimmed);

    if (!isPricingStatement) {
      const budgetItem: ProfileRequirementItem = {
        id: "budget",
        slotId: "budget",
        category: "budget",
        label: "Budget Constraint",
        value: rawAmt,
        origin: "explicit",
        confidence: "high",
        evidence: {
          quote: trimmed,
          turnIndex,
          messageId,
          slotId: normSlot || "budget",
        },
        status: "active",
        updatedAtTurn: turnIndex,
      };
      setScalarField(profile, "budget", budgetItem, isCorrection);
      upsertConfirmedFact(profile, budgetItem);
      mergeIntoList(profile.constraints, budgetItem, true);
    }
  }

  // 4. Explicit Audience Mention in Detailed Prompts or Multi-Requirement Answers
  const audienceCorrectionMatch = isCorrection
    ? trimmed.match(
        /\b(?:change|switch|update|set)?\s*(?:the\s+)?(?:target\s+)?(?:audience|customers?|users?|clients?|buyers?|players?|readers?)\s+(?:to|is|are|should be)\s+([^.;,\n]+?)(?=[.;,\n]|$|\s+(?:and\s+change|and\s+budget|and\s+for|instead\s+of))/i,
      ) ||
      trimmed.match(
        /\binstead\s+of\s+[a-z0-9\s-]+?,\s*(?:target|focus on|serve|for)\s+([^.;,\n]+)/i,
      )
    : null;

  const audienceMatch =
    audienceCorrectionMatch ??
    trimmed.match(
      /\b(?:for|targeting|target audience is|aimed at|built for|serving|designed for|tailored for|helping|customers are|users are|clients are)\s+((?:freelance|independent|remote|b2b|b2c|enterprise|small business|local|postpartum|university|college|high school|beginner|intermediate|advanced|indie|competitive|dental|medical|healthcare|legal|accounting|construction|e-commerce|ecommerce|retail|saas|youtube|tiktok|solo|startup|agency|clinical|adhd|neurodivergent|tabletop|d&d|dungeon)[a-z0-9\s,\-()]{2,70}?)(?=[.;,\n]|$|\s+(?:with|who|using|on|in\s+[0-9]|and\s+i|to\s+help|built\s+with|that\s+need))/i,
    );
  if (
    audienceMatch &&
    audienceMatch[1] &&
    ((normSlot !== "audience" && normSlot !== "target_audience") ||
      Boolean(audienceCorrectionMatch))
  ) {
    const audVal = audienceMatch[1]
      .replace(/\s+instead\s+of\s+.*$/i, "")
      .trim();
    if (audVal && !/^(embedded devices|my project|this app)$/i.test(audVal)) {
      const audItem: ProfileRequirementItem = {
        id: "audience",
        slotId: "audience",
        category: "audience",
        label: "Target Audience",
        value: audVal,
        origin: "explicit",
        confidence: "high",
        evidence: { quote: trimmed, turnIndex, messageId, slotId: "audience" },
        status: "active",
        updatedAtTurn: turnIndex,
      };
      setScalarField(
        profile,
        "intendedAudience",
        audItem,
        isCorrection || Boolean(audienceCorrectionMatch),
      );
      upsertConfirmedFact(profile, audItem);
    }
  }

  // 5. Explicit Deliverable Mention
  const deliverableMatch = trimmed.match(
    /\b(?:build|create|launch|develop|design|make|plan|write|draft)\s+(?:a|an|my|the)?\s*((?:full-stack|b2b|saas|portfolio|landing page|web app|website|mobile app|e-commerce|online store|study plan|curriculum|youtube channel|newsletter|dashboard|invoicing tool|invoice reconciliation tool|task tracker|habit tracker|ticketing tool|murder mystery campaign|tabletop .*? campaign|incident response .*?(?:playbook|runbook)|standard operating procedure|recipe .*?matrix)[a-z0-9\s\-()]{2,55}?)(?=[.,;\n]|$|\s+(?:for|with|using|that|in|on|under|set\s+in|set\s+aboard))/i,
  );
  if (deliverableMatch && deliverableMatch[1]) {
    const delivVal = deliverableMatch[1].trim();
    const delivItem: ProfileRequirementItem = {
      id: "desired_deliverable",
      category: "deliverable",
      label: "Desired Deliverable",
      value: delivVal,
      origin: "explicit",
      confidence: "high",
      evidence: { quote: trimmed, turnIndex, messageId },
      status: "active",
      updatedAtTurn: turnIndex,
    };
    setScalarField(profile, "desiredDeliverable", delivItem, isCorrection);
  }

  // 6. Explicit Timeline Mention
  const timelineMatch = trimmed.match(
    /\b(?:in|within|by|over|deadline(?:\s+is)?|timeline(?:\s+is)?|launching(?:\s+mvp)?\s+in)\s+([0-9]+\s*(?:days?|weeks?|months?|hours?)|this\s+(?:week|weekend|month)|next\s+(?:week|month))\b/i,
  );
  if (
    timelineMatch &&
    timelineMatch[1] &&
    normSlot !== "timeline" &&
    normSlot !== "deadline"
  ) {
    const timeVal = timelineMatch[1].trim();
    const timeItem: ProfileRequirementItem = {
      id: "timeline",
      slotId: "timeline",
      category: "timeline",
      label: "Timeline",
      value: timeVal,
      origin: "explicit",
      confidence: "high",
      evidence: { quote: trimmed, turnIndex, messageId, slotId: "timeline" },
      status: "active",
      updatedAtTurn: turnIndex,
    };
    setScalarField(profile, "timeline", timeItem, isCorrection);
    upsertConfirmedFact(profile, timeItem);
  }

  // 7. Non-functional requirements (WCAG accessibility, offline-first, latency, mobile-first, security)
  const nfrPatterns: Array<{
    id: string;
    label: string;
    value: string;
    re: RegExp;
  }> = [
    {
      id: "nfr_offline",
      label: "Offline Resilience",
      value: "Offline-first capability with local storage / IndexedDB fallback",
      re: /\b(offline[- ]first|work offline|indexeddb|localstorage)\b/i,
    },
    {
      id: "nfr_a11y",
      label: "Accessibility",
      value: "WCAG AA accessibility compliance and keyboard navigation",
      re: /\b(wcag|accessible|accessibility|screen reader|a11y)\b/i,
    },
    {
      id: "nfr_mobile",
      label: "Responsive Viewport",
      value: "Mobile-first responsive layout",
      re: /\b(mobile[- ]first|responsive|mobile friendly)\b/i,
    },
    {
      id: "nfr_security",
      label: "Security & Secret Hygiene",
      value: "Server-side secret isolation and zero client key exposure",
      re: /\b(server-side proxy|secret|hipaa|gdpr|soc2|encryption)\b/i,
    },
  ];
  for (const nfr of nfrPatterns) {
    if (nfr.re.test(trimmed)) {
      mergeIntoList(profile.nonFunctionalRequirements, {
        id: nfr.id,
        category: "nonfunctional",
        label: nfr.label,
        value: nfr.value,
        origin: "explicit",
        confidence: "high",
        evidence: { quote: trimmed, turnIndex, messageId },
        status: "active",
        updatedAtTurn: turnIndex,
      });
    }
  }

  // 8. Explicit Tech Stack / Preferences in free text (when not already answering tech_stack slot)
  if (
    normSlot !== "tech_stack" &&
    /\b(react|next\.?js|vite|tailwind|typescript|supabase|firebase|postgres|postgresql|python|fastapi|stripe|prisma|drizzle|framer|webflow|vue|svelte|angular|node\.?js|express|mongodb|redis|graphql|shadcn)\b/i.test(
      lower,
    )
  ) {
    const matchedTech = Array.from(
      new Set(
        (
          trimmed.match(
            /\b(React(?:\s*19)?|Next\.?js|Vite|Tailwind(?:\s*CSS)?|TypeScript|Supabase|Firebase|PostgreSQL|Postgres|Python|FastAPI|Stripe|Prisma|Drizzle|Framer|Webflow|IndexedDB|SQLite|Vue|Svelte|Angular|Node\.?js|Express|MongoDB|Redis|GraphQL|Shadcn)\b/gi,
          ) || []
        ).map((t) => t.trim()),
      ),
    );
    if (matchedTech.length > 0) {
      const prefItem: ProfileRequirementItem = {
        id: "pref_tech_stack",
        slotId: "tech_stack",
        category: "preference",
        label: "Preferred Technology Stack",
        value: matchedTech.join(", "),
        origin: "explicit",
        confidence: "high",
        evidence: {
          quote: trimmed,
          turnIndex,
          messageId,
          slotId: "tech_stack",
        },
        status: "active",
        updatedAtTurn: turnIndex,
      };
      mergeIntoList(profile.userPreferences, prefItem, true);
      upsertConfirmedFact(profile, prefItem);
    }
  }

  // 9. Explicit Features / Functional Scope mentioned inline (when not already answering features slot)
  if (normSlot !== "features") {
    const featureClauseMatch =
      trimmed.match(
        /\b(?:core\s+features?|features?\s+include|key\s+features?|must\s+(?:support|include|have)|for\s+features?,?\s*(?:we\s+need|i\s+want)|needs?\s+(?:to\s+support|to\s+include|automated))\s*[:-]?\s*([^.;\n]{8,140})/i,
      ) ??
      trimmed.match(
        /\bwith\s+((?:automated\s+|recurring\s+|real-time\s+|multi-tenant\s+|role-based\s+|client\s+|patient\s+|daily\s+)?[a-z0-9\s,\-/]+?(?:invoices?|reminders?|billing|checkout|intake\s+forms?|audit\s+logs?|reconciliation|pdf\s+export|pdf\s+reporting|workout\s+tracking|role\s+permissions|flashcards|spaced\s+repetition|branching\s+clues|suspect\s+profiles)[a-z0-9\s,\-/]*)(?=[.;\n]|$|\s+(?:built\s+with|using\s+|deployed\s+on|on\s+a\s+\$|within\s+[0-9]))/i,
      );
    if (featureClauseMatch && featureClauseMatch[1]) {
      const featVal = featureClauseMatch[1].trim();
      const featItem: ProfileRequirementItem = {
        id: "features",
        slotId: "features",
        category: "functional",
        label: "Core Features & Scope",
        value: featVal,
        origin: "explicit",
        confidence: "high",
        evidence: {
          quote: trimmed,
          turnIndex,
          messageId,
          slotId: "features",
        },
        status: "active",
        updatedAtTurn: turnIndex,
      };
      mergeIntoList(profile.functionalRequirements, featItem, true);
      upsertConfirmedFact(profile, featItem);
    }
  }

  // 10. Explicit Integrations / Data Services mentioned inline (when not already answering integrations slot)
  if (
    normSlot !== "integrations" &&
    normSlot !== "features" &&
    /\b(stripe|supabase|firebase|postgresql|postgres|sqlite|indexeddb|mongodb|openai|gemini\s+api|claude\s+api|twilio|resend|sendgrid|auth0|clerk|quickbooks|shopify|slack|google\s+calendar|google\s+drive|webhooks?|graphql|rest\s+api)\b/i.test(
      lower,
    )
  ) {
    const matchedIntegrations = Array.from(
      new Set(
        (
          trimmed.match(
            /\b(Stripe|Supabase|Firebase|PostgreSQL|Postgres|SQLite|IndexedDB|MongoDB|OpenAI|Gemini\s+API|Claude\s+API|Twilio|Resend|SendGrid|Auth0|Clerk|QuickBooks|Shopify|Slack|Google\s+Calendar|Google\s+Drive|Webhooks?|GraphQL|REST\s+API)\b/gi,
          ) || []
        ).map((t) => t.trim()),
      ),
    );
    if (matchedIntegrations.length > 0) {
      const intItem: ProfileRequirementItem = {
        id: "integrations",
        slotId: "integrations",
        category: "functional",
        label: "External Integrations & Data Layer",
        value: matchedIntegrations.join(", "),
        origin: "explicit",
        confidence: "high",
        evidence: {
          quote: trimmed,
          turnIndex,
          messageId,
          slotId: "integrations",
        },
        status: "active",
        updatedAtTurn: turnIndex,
      };
      mergeIntoList(profile.functionalRequirements, intItem, true);
      upsertConfirmedFact(profile, intItem);
    }
  }

  // 11. Explicit Hosting / Deployment mentioned inline (when not already answering hosting slot)
  if (
    normSlot !== "hosting" &&
    /\b(vercel|cloudflare\s+pages|cloudflare\s+workers|netlify|render|railway|fly\.io|github\s+pages|aws|google\s+cloud\s+run|docker|self-hosted)\b/i.test(
      lower,
    )
  ) {
    const matchedHost = Array.from(
      new Set(
        (
          trimmed.match(
            /\b(Vercel|Cloudflare\s+Pages|Cloudflare\s+Workers|Netlify|Render|Railway|Fly\.io|GitHub\s+Pages|AWS|Google\s+Cloud\s+Run|Docker|Self-Hosted)\b/gi,
          ) || []
        ).map((t) => t.trim()),
      ),
    );
    if (matchedHost.length > 0) {
      const hostItem: ProfileRequirementItem = {
        id: "hosting",
        slotId: "hosting",
        category: "preference",
        label: "Hosting & Deployment",
        value: matchedHost.join(", "),
        origin: "explicit",
        confidence: "high",
        evidence: {
          quote: trimmed,
          turnIndex,
          messageId,
          slotId: "hosting",
        },
        status: "active",
        updatedAtTurn: turnIndex,
      };
      mergeIntoList(profile.userPreferences, hostItem, true);
      upsertConfirmedFact(profile, hostItem);
    }
  }

  // 12. Explicit Business / Study / Creator / Universal domain signals in multi-requirement answers
  if (normSlot !== "country") {
    const countryMatch = trimmed.match(
      /\b(?:in|launching in|based in|market is|targeting)\s+(the\s+US|United\s+States|USA|the\s+UK|United\s+Kingdom|Canada|Australia|India|Europe|EU|Germany|Singapore|Bangladesh|North\s+America|Global\s+market)\b/i,
    );
    if (countryMatch && countryMatch[1]) {
      const countryItem: ProfileRequirementItem = {
        id: "country",
        slotId: "country",
        category: "domain_extension",
        label: "Target Country / Market",
        value: countryMatch[1].trim(),
        origin: "explicit",
        confidence: "high",
        evidence: { quote: trimmed, turnIndex, messageId, slotId: "country" },
        status: "active",
        updatedAtTurn: turnIndex,
      };
      profile.domainExtensions["country"] = countryItem;
      upsertConfirmedFact(profile, countryItem);
    }
  }

  if (normSlot !== "model") {
    const modelMatch = trimmed.match(
      /\b(subscription(?:\s+pricing|\s+model|\s+billing)|freemium(?:\s+tier|\s+model)?|one-time\s+purchase|agency\s+retainer|productized\s+service|marketplace\s+commission)\b/i,
    );
    if (modelMatch && modelMatch[1]) {
      const modelItem: ProfileRequirementItem = {
        id: "model",
        slotId: "model",
        category: "domain_extension",
        label: "Business / Revenue Model",
        value: modelMatch[1].trim(),
        origin: "explicit",
        confidence: "high",
        evidence: { quote: trimmed, turnIndex, messageId, slotId: "model" },
        status: "active",
        updatedAtTurn: turnIndex,
      };
      profile.domainExtensions["model"] = modelItem;
      upsertConfirmedFact(profile, modelItem);
    }
  }

  if (normSlot !== "time") {
    const weeklyTimeMatch = trimmed.match(
      /\b([0-9]+(?:\s*-\s*[0-9]+)?\s*(?:hours?|hrs?)\s*(?:per|a|\/)\s*(?:week|day)|full-time\s+commitment)\b/i,
    );
    if (weeklyTimeMatch && weeklyTimeMatch[1]) {
      const timeResourceItem: ProfileRequirementItem = {
        id: "time",
        slotId: "time",
        category: "resource",
        label: "Time Commitment",
        value: weeklyTimeMatch[1].trim(),
        origin: "explicit",
        confidence: "high",
        evidence: { quote: trimmed, turnIndex, messageId, slotId: "time" },
        status: "active",
        updatedAtTurn: turnIndex,
      };
      mergeIntoList(profile.resources, timeResourceItem, true);
      upsertConfirmedFact(profile, timeResourceItem);
    }
  }
}

/**
 * Creates a sensible, domain-grounded default assumption when the user delegates a choice
 * ("you decide", "whatever you recommend"), skips a question, or says "I don't know" / "not sure".
 */
function recordUserDeferredSlotAssumption(
  profile: ProjectProfile,
  slotId: string,
  slotLabel: string,
  userText: string,
  turnIndex: number,
  messageId: string | undefined,
  reason: "delegated" | "skipped" | "uncertain",
): void {
  const normSlot = normalizeKey(slotId);
  if (!normSlot) return;

  const isUnfamiliar = isUnfamiliarTaskDomain(profile);
  const tag =
    reason === "delegated"
      ? "Assumed — user delegated choice ('you decide')"
      : reason === "skipped"
        ? "Assumed — user skipped question"
        : "Assumed — user expressed uncertainty";

  let assumedValue = `Sensible domain-standard baseline for ${slotLabel}`;
  switch (normSlot) {
    case "audience":
    case "target_audience":
      assumedValue = isUnfamiliar
        ? "Target practitioners/participants directly engaged in the primary task context"
        : "Core target segment and decision-makers aligned with the primary goal";
      break;
    case "purpose":
    case "goal":
    case "deliverable_format":
    case "output":
    case "format":
      assumedValue =
        "Structured, actionable implementation blueprint with modular sections and examples";
      break;
    case "features":
    case "offer":
    case "constraints_scope":
      assumedValue =
        "Focused Phase 1 MVP core workflow with essential validation, clear boundaries, and zero bloat";
      break;
    case "budget":
      assumedValue = "$0 / Free-Tier & Lean MVP baseline";
      break;
    case "tech_stack":
    case "skills":
      assumedValue =
        "Modern full-stack web baseline (React 19, TypeScript, Tailwind CSS, Supabase/SQLite)";
      break;
    case "hosting":
      assumedValue =
        "Zero-config serverless cloud deployment (Vercel / Cloudflare Pages)";
      break;
    case "integrations":
      assumedValue =
        "Self-contained storage with modular, server-side environment-isolated API adapters";
      break;
    case "timeline":
    case "deadline":
    case "time":
      assumedValue = "Phased 2–4 week iterative execution schedule";
      break;
    case "design":
    case "style":
    case "tone":
      assumedValue =
        "Clean, high-contrast accessible layout with direct, authoritative tone";
      break;
    case "model":
      assumedValue =
        "Lean direct-to-customer value proposition with frictionless onboarding";
      break;
    case "country":
      assumedValue = "Global / English-speaking market baseline";
      break;
    case "success_criteria":
    case "acceptance_criteria":
      assumedValue =
        "Objective pass/fail verification checklist and measurable completion criteria";
      break;
  }

  const item: ProfileRequirementItem = {
    id: `assumed_slot_${normSlot}`,
    slotId: normSlot,
    category:
      normSlot === "budget"
        ? "budget"
        : normSlot === "audience" || normSlot === "target_audience"
          ? "audience"
          : normSlot === "timeline" || normSlot === "deadline"
            ? "timeline"
            : "preference",
    label: `${slotLabel} (Assumed)`,
    value: `${assumedValue} [${tag}]`,
    origin: "assumed",
    confidence: "medium",
    evidence: {
      quote: userText.trim(),
      turnIndex,
      messageId,
      slotId: normSlot,
      rationale: tag,
    },
    status: "active",
    updatedAtTurn: turnIndex,
  };

  addInferredOrAssumedItem(profile, item);
}

/**
 * Ensures sensible labeled assumptions exist for missing core facets when the user
 * chooses to skip the interview or generate the final prompt early.
 */
export function ensureAssumptionsForMissingCoreFields(
  profile: ProjectProfile,
  turnIndex = 0,
  userText = "User requested immediate prompt generation",
  messageId?: string,
): ProjectProfile {
  const updated = cloneProfile(profile);
  const isUnfamiliar = isUnfamiliarTaskDomain(updated);

  const hasConfirmedOrAssumed = (slotKey: string): boolean => {
    const norm = normalizeKey(slotKey);
    if (
      updated.confirmedFacts.some(
        (f) => normalizeKey(f.slotId || f.id) === norm,
      )
    ) {
      return true;
    }
    if (
      updated.inferredAssumptions.some(
        (a) =>
          a.status === "active" &&
          (normalizeKey(a.slotId) === norm ||
            normalizeKey(a.id) === `assumed_slot_${norm}` ||
            (norm === "budget" && a.category === "budget")),
      )
    ) {
      return true;
    }
    if (norm === "audience" && updated.intendedAudience) return true;
    if (norm === "budget" && updated.budget) return true;
    if (norm === "timeline" && updated.timeline) return true;
    if (
      norm === "features" &&
      updated.functionalRequirements.some((f) => f.slotId === "features")
    ) {
      return true;
    }
    if (
      norm === "tech_stack" &&
      updated.userPreferences.some((p) => p.slotId === "tech_stack")
    ) {
      return true;
    }
    return false;
  };

  if (!hasConfirmedOrAssumed("audience")) {
    recordUserDeferredSlotAssumption(
      updated,
      "audience",
      "Target Audience",
      userText,
      turnIndex,
      messageId,
      "skipped",
    );
  }
  if (!hasConfirmedOrAssumed("features")) {
    recordUserDeferredSlotAssumption(
      updated,
      isUnfamiliar ? "constraints_scope" : "features",
      isUnfamiliar ? "Key Scope & Constraints" : "Core Features & MVP Scope",
      userText,
      turnIndex,
      messageId,
      "skipped",
    );
  }
  if (
    !isUnfamiliar &&
    updated.expertId === "website" &&
    !hasConfirmedOrAssumed("tech_stack")
  ) {
    recordUserDeferredSlotAssumption(
      updated,
      "tech_stack",
      "Technology Stack",
      userText,
      turnIndex,
      messageId,
      "skipped",
    );
  }
  if (!isUnfamiliar && !hasConfirmedOrAssumed("budget")) {
    recordUserDeferredSlotAssumption(
      updated,
      "budget",
      "Budget Constraint",
      userText,
      turnIndex,
      messageId,
      "skipped",
    );
  }

  return updated;
}

/**
 * Maps an answered interview slot into the appropriate structured fields of ProjectProfile.
 */
function applySlotAnswerToProfile(
  profile: ProjectProfile,
  slotId: string,
  slotLabel: string,
  userText: string,
  turnIndex: number,
  messageId: string | undefined,
  isCorrection: boolean,
): void {
  const normSlot = normalizeKey(slotId);
  const trimmed = userText.trim();

  const makeItem = (
    category: RequirementCategory,
    idOverride?: string,
  ): ProfileRequirementItem => ({
    id: idOverride || normSlot,
    slotId: normSlot,
    category,
    label: slotLabel,
    value: trimmed,
    origin: "explicit",
    confidence: "high",
    evidence: {
      quote: trimmed,
      turnIndex,
      messageId,
      slotId: normSlot,
    },
    status: "active",
    updatedAtTurn: turnIndex,
  });

  switch (normSlot) {
    case "purpose":
    case "goal": {
      const item = makeItem("goal", normSlot);
      if (!profile.primaryGoal) {
        setScalarField(profile, "primaryGoal", item, isCorrection);
      } else {
        setScalarField(
          profile,
          "desiredDeliverable",
          makeItem("deliverable", "desired_deliverable"),
          isCorrection,
        );
      }
      upsertConfirmedFact(profile, item);
      break;
    }
    case "audience":
    case "target_audience": {
      const item = makeItem("audience", "audience");
      setScalarField(profile, "intendedAudience", item, isCorrection);
      upsertConfirmedFact(profile, item);
      break;
    }
    case "type":
    case "site_type":
    case "format":
    case "deliverable_format":
    case "output": {
      const item = makeItem("deliverable", normSlot);
      setScalarField(profile, "desiredDeliverable", item, isCorrection);
      upsertConfirmedFact(profile, item);
      break;
    }
    case "features":
    case "pages":
    case "integrations":
    case "constraints_scope": {
      const item = makeItem("functional", normSlot);
      mergeIntoList(profile.functionalRequirements, item, true);
      upsertConfirmedFact(profile, item);
      break;
    }
    case "budget": {
      const item = makeItem("budget", "budget");
      setScalarField(profile, "budget", item, isCorrection);
      mergeIntoList(profile.constraints, item, true);
      upsertConfirmedFact(profile, item);
      break;
    }
    case "timeline":
    case "deadline": {
      const item = makeItem("timeline", normSlot);
      setScalarField(profile, "timeline", item, isCorrection);
      upsertConfirmedFact(profile, item);
      break;
    }
    case "time":
    case "skills":
    case "experience":
    case "equipment":
    case "background":
    case "level": {
      const item = makeItem("resource", normSlot);
      mergeIntoList(profile.resources, item, true);
      upsertConfirmedFact(profile, item);
      break;
    }
    case "tech_stack":
    case "design":
    case "style":
    case "language":
    case "hosting": {
      const item = makeItem("preference", normSlot);
      mergeIntoList(profile.userPreferences, item, true);
      if (normSlot === "hosting") {
        mergeIntoList(
          profile.constraints,
          makeItem("constraint", "hosting"),
          true,
        );
      }
      upsertConfirmedFact(profile, item);
      break;
    }
    case "acceptance_criteria":
    case "success_criteria":
    case "goal_detail": {
      const item = makeItem("success_criteria", normSlot);
      mergeIntoList(profile.successCriteria, item, true);
      upsertConfirmedFact(profile, item);
      break;
    }
    default: {
      // Domain-specific or unknown consultant-specific slot (e.g. country, model, niche, frequency, monetization, subject, or custom unknown slot)
      const item = makeItem("domain_extension", normSlot);
      const existingExt = profile.domainExtensions[normSlot];
      if (existingExt) {
        if (
          normalizeValueForComparison(existingExt.value) !==
          normalizeValueForComparison(item.value)
        ) {
          const prev = existingExt.previousValues
            ? [...existingExt.previousValues]
            : [];
          prev.push({
            value: existingExt.value,
            turnIndex: existingExt.evidence.turnIndex,
            quote: existingExt.evidence.quote,
          });
          profile.domainExtensions[normSlot] = {
            ...item,
            previousValues: prev,
          };
        }
      } else {
        profile.domainExtensions[normSlot] = item;
      }
      upsertConfirmedFact(profile, item);
      break;
    }
  }
}

/**
 * Generates contextual inferences and missing-information assumptions without ever
 * promoting them to confirmedFacts.
 */
function updateInferencesAndAssumptions(
  profile: ProjectProfile,
  text: string,
  turnIndex: number,
  messageId: string | undefined,
): void {
  const lower = text.toLowerCase();

  // 1. Technical proficiency inference
  if (
    /\b(react|next\.?js|typescript|tailwind|node|python|postgres|supabase|docker|graphql|developer|software engineer)\b/i.test(
      lower,
    )
  ) {
    addInferredOrAssumedItem(profile, {
      id: "skills_technical",
      slotId: "experience",
      category: "resource",
      label: "Technical Proficiency",
      value: "Experienced Developer / Tech-Savvy Builder",
      origin: "inferred",
      confidence: "high",
      evidence: {
        quote: text.trim(),
        turnIndex,
        messageId,
        rationale: "Mentioned concrete developer frameworks or languages",
      },
      status: "active",
      updatedAtTurn: turnIndex,
    });
  } else if (
    /\b(no[- ]?code|can'?t code|non[- ]?technical|complete beginner|never coded|wix|squarespace|webflow|framer)\b/i.test(
      lower,
    )
  ) {
    addInferredOrAssumedItem(profile, {
      id: "skills_technical",
      slotId: "experience",
      category: "resource",
      label: "Technical Proficiency",
      value: "No-Code / Non-Technical Builder",
      origin: "inferred",
      confidence: "high",
      evidence: {
        quote: text.trim(),
        turnIndex,
        messageId,
        rationale: "Indicated non-technical or no-code background",
      },
      status: "active",
      updatedAtTurn: turnIndex,
    });
  }

  // 2. Deliverable / Archetype inference
  if (
    /\b(portfolio|personal site|showcase my work|resume site)\b/i.test(lower)
  ) {
    const item: ProfileRequirementItem = {
      id: "site_type",
      slotId: "type",
      category: "deliverable",
      label: "Site Archetype",
      value: "High-Impact Showcase / Personal Portfolio",
      origin: "inferred",
      confidence: "high",
      evidence: {
        quote: text.trim(),
        turnIndex,
        messageId,
        rationale: "Inferred from portfolio/showcase intent",
      },
      status: "active",
      updatedAtTurn: turnIndex,
    };
    addInferredOrAssumedItem(profile, item);
    if (!profile.desiredDeliverable) {
      profile.desiredDeliverable = item;
    }
  } else if (
    /\b(saas|micro[- ]?saas|subscription tool|web app)\b/i.test(lower)
  ) {
    const item: ProfileRequirementItem = {
      id: "site_type",
      slotId: "type",
      category: "deliverable",
      label: "Product Format",
      value: "Web Application / SaaS Platform",
      origin: "inferred",
      confidence: "high",
      evidence: {
        quote: text.trim(),
        turnIndex,
        messageId,
        rationale: "Inferred from SaaS / web application intent",
      },
      status: "active",
      updatedAtTurn: turnIndex,
    };
    addInferredOrAssumedItem(profile, item);
    if (!profile.desiredDeliverable) {
      profile.desiredDeliverable = item;
    }
  }

  // 3. Assumed defaults when information is missing on Turn 0
  if (turnIndex === 0 && !profile.budget && !isUnfamiliarTaskDomain(profile)) {
    addInferredOrAssumedItem(profile, {
      id: "assumed_budget_lean",
      slotId: "budget",
      category: "budget",
      label: "Assumed Budget Baseline",
      value: "Lean / Free-Tier Preferred Until Budget Confirmed",
      origin: "assumed",
      confidence: "low",
      evidence: {
        quote: text.trim(),
        turnIndex,
        messageId,
        rationale:
          "Assumed because explicit budget information is currently missing",
      },
      status: "active",
      updatedAtTurn: turnIndex,
    });
  }
}

/**
 * Evaluates cross-turn and intra-turn contradictions and updates contradiction statuses.
 * Also supports resolving contradictions when the user clarifies or corrects an earlier answer.
 */
function evaluateProfileContradictions(
  profile: ProjectProfile,
  latestText: string,
  turnIndex: number,
  messageId: string | undefined,
  isCorrection: boolean,
): void {
  const lowerLatest = latestText.trim().toLowerCase();

  // First check if the latest turn resolves any existing unresolved contradictions
  for (const c of profile.contradictions) {
    if (c.status !== "unresolved") continue;

    if (
      c.id === "contradiction_budget_vs_paid_growth" &&
      (isCorrection ||
        /\b(organic|no paid ads|free channels|community|content marketing|cold outreach)\b/i.test(
          lowerLatest,
        ) ||
        /\$[1-9][0-9]+/.test(lowerLatest))
    ) {
      c.status = "resolved";
      c.resolvedAtTurn = turnIndex;
      c.resolutionNote = `Resolved at turn ${turnIndex}: "${latestText.trim()}"`;
    } else if (
      c.id === "contradiction_time_vs_scope" &&
      (isCorrection ||
        /\b(mvp|phase 1|narrow|single feature|prototype|simple)\b/i.test(
          lowerLatest,
        ))
    ) {
      c.status = "resolved";
      c.resolvedAtTurn = turnIndex;
      c.resolutionNote = `Resolved at turn ${turnIndex}: "${latestText.trim()}"`;
    } else if (
      c.id === "contradiction_free_tier_vs_paid_infra" &&
      (isCorrection ||
        /\b(email|magic link|webpush|resend|free alternative|without sms|no sms)\b/i.test(
          lowerLatest,
        ))
    ) {
      c.status = "resolved";
      c.resolvedAtTurn = turnIndex;
      c.resolutionNote = `Resolved at turn ${turnIndex}: "${latestText.trim()}"`;
    } else if (
      c.id === "contradiction_static_host_vs_backend" &&
      (isCorrection ||
        /\b(vercel|cloudflare|netlify|render|supabase|localstorage|indexeddb)\b/i.test(
          lowerLatest,
        ))
    ) {
      c.status = "resolved";
      c.resolvedAtTurn = turnIndex;
      c.resolutionNote = `Resolved at turn ${turnIndex}: "${latestText.trim()}"`;
    } else if (
      c.id === "contradiction_overengineering" &&
      (isCorrection ||
        /\b(monolith|supabase|sqlite|serverless|keep it simple|no kubernetes)\b/i.test(
          lowerLatest,
        ))
    ) {
      c.status = "resolved";
      c.resolvedAtTurn = turnIndex;
      c.resolutionNote = `Resolved at turn ${turnIndex}: "${latestText.trim()}"`;
    } else if (
      c.id === "contradiction_pricing_vs_audience" &&
      (isCorrection ||
        /\b(freemium|free tier|b2b|enterprise|low cost|affordable)\b/i.test(
          lowerLatest,
        ))
    ) {
      c.status = "resolved";
      c.resolvedAtTurn = turnIndex;
      c.resolutionNote = `Resolved at turn ${turnIndex}: "${latestText.trim()}"`;
    }
  }

  // Gather all active confirmed facts + goal to inspect for conflicts
  const allQuotes: Array<{
    text: string;
    turnIndex: number;
    messageId?: string;
  }> = [];
  if (profile.primaryGoal) {
    allQuotes.push({
      text: profile.primaryGoal.evidence.quote,
      turnIndex: profile.primaryGoal.evidence.turnIndex,
      messageId: profile.primaryGoal.evidence.messageId,
    });
  }
  for (const f of profile.confirmedFacts) {
    if (
      !allQuotes.some(
        (q) =>
          q.turnIndex === f.evidence.turnIndex && q.text === f.evidence.quote,
      )
    ) {
      allQuotes.push({
        text: f.evidence.quote,
        turnIndex: f.evidence.turnIndex,
        messageId: f.evidence.messageId,
      });
    }
  }
  if (
    !allQuotes.some(
      (q) => q.turnIndex === turnIndex && q.text === latestText.trim(),
    )
  ) {
    allQuotes.push({ text: latestText.trim(), turnIndex, messageId });
  }

  const findQuoteMatching = (re: RegExp) =>
    allQuotes.find((q) => re.test(q.text));

  const upsertContradiction = (c: ProfileContradiction) => {
    const idx = profile.contradictions.findIndex((item) => item.id === c.id);
    if (idx >= 0) {
      if (profile.contradictions[idx].status === "resolved") return;
      profile.contradictions[idx] = c;
    } else {
      profile.contradictions.push(c);
    }
  };

  // Rule 1: $0 budget vs paid ads / agency
  const zeroBudgetQuote = findQuoteMatching(
    /(?:^|[\s(])\$0\b|\b(zero budget|no money|shoestring|no budget|free tier only)\b/i,
  );
  const paidGrowthQuote = findQuoteMatching(
    /\b(hire an agency|facebook ads|google ads|meta ads|linkedin ads|paid\s+(?:meta|linkedin|google|search|social)?\s*ads|run paid ads|influencer sponsorship|hire developers|hire a team)\b/i,
  );
  if (
    zeroBudgetQuote &&
    paidGrowthQuote &&
    !(
      isCorrection &&
      /\b(organic|no paid ads|free channels)\b/i.test(lowerLatest)
    ) &&
    !(profile.budget && !/\$0|zero|free/i.test(profile.budget.value))
  ) {
    const alreadyResolved = profile.contradictions.some(
      (c) =>
        c.id === "contradiction_budget_vs_paid_growth" &&
        c.status === "resolved",
    );
    if (!alreadyResolved) {
      upsertContradiction({
        id: "contradiction_budget_vs_paid_growth",
        field: "budget",
        title: "Budget vs Acquisition Contradiction",
        description:
          "Stated a $0/shoestring budget alongside capital-intensive paid ads or agency hiring.",
        recommendation:
          "Clarify whether to use zero-cost organic channels or revise the starting budget.",
        earlierEvidence: {
          value: "$0 / Zero Budget",
          quote: zeroBudgetQuote.text,
          turnIndex: zeroBudgetQuote.turnIndex,
          messageId: zeroBudgetQuote.messageId,
        },
        conflictingEvidence: {
          value: "Paid Ads / Agency Spend",
          quote: paidGrowthQuote.text,
          turnIndex: paidGrowthQuote.turnIndex,
          messageId: paidGrowthQuote.messageId,
        },
        status: "unresolved",
      });
    }
  }

  // Rule 2: $0 budget vs paid SMS / GPU clusters
  const paidInfraQuote = findQuoteMatching(
    /\b(sms notifications|twilio|send text messages|fine tune gpt-4|dedicated gpu cluster|custom model training|heavy video transcoding)\b/i,
  );
  if (
    zeroBudgetQuote &&
    paidInfraQuote &&
    !(profile.budget && !/\$0|zero|free/i.test(profile.budget.value))
  ) {
    const alreadyResolved = profile.contradictions.some(
      (c) =>
        c.id === "contradiction_free_tier_vs_paid_infra" &&
        c.status === "resolved",
    );
    if (!alreadyResolved) {
      upsertContradiction({
        id: "contradiction_free_tier_vs_paid_infra",
        field: "integrations",
        title: "Free-Tier Limit vs Feature Complexity Contradiction",
        description:
          "Specified a $0 budget / free tier while requesting services that require paid billing (e.g. Twilio SMS or dedicated GPUs).",
        recommendation:
          "Use zero-cost alternatives such as email magic links/WebPush instead of paid SMS.",
        earlierEvidence: {
          value: "$0 / Free Tier",
          quote: zeroBudgetQuote.text,
          turnIndex: zeroBudgetQuote.turnIndex,
        },
        conflictingEvidence: {
          value: "Paid SMS / Dedicated GPU Infrastructure",
          quote: paidInfraQuote.text,
          turnIndex: paidInfraQuote.turnIndex,
        },
        status: "unresolved",
      });
    }
  }

  // Rule 3: Static hosting vs dynamic server runtime
  const staticHostQuote = findQuoteMatching(
    /\b(github pages|static html only)\b/i,
  );
  const serverRuntimeQuote = findQuoteMatching(
    /\b(sqlite database|express server|python backend|docker container)\b/i,
  );
  if (staticHostQuote && serverRuntimeQuote) {
    const alreadyResolved = profile.contradictions.some(
      (c) =>
        c.id === "contradiction_static_host_vs_backend" &&
        c.status === "resolved",
    );
    if (!alreadyResolved) {
      upsertContradiction({
        id: "contradiction_static_host_vs_backend",
        field: "hosting",
        title: "Deployment Target vs Runtime Incompatibility",
        description:
          "Plans to host a dynamic server/database runtime on a static-only host (GitHub Pages).",
        recommendation:
          "Use serverless full-stack hosting (Vercel, Cloudflare Pages, Render) or client-side storage.",
        earlierEvidence: {
          value: "Static Hosting Only",
          quote: staticHostQuote.text,
          turnIndex: staticHostQuote.turnIndex,
        },
        conflictingEvidence: {
          value: "Dynamic Server & Database Runtime",
          quote: serverRuntimeQuote.text,
          turnIndex: serverRuntimeQuote.turnIndex,
        },
        status: "unresolved",
      });
    }
  }

  // Rule 4: Tiny time availability vs massive scope
  const tinyTimeQuote = findQuoteMatching(
    /\b(2 hours|couple hours|very little time|1 hour a day|30 minutes)\b/i,
  );
  const massiveScopeQuote = findQuoteMatching(
    /\b(mmo|social network like facebook|social network like tiktok|full operating system|marketplace like amazon|custom neural network)\b/i,
  );
  if (tinyTimeQuote && massiveScopeQuote) {
    const alreadyResolved = profile.contradictions.some(
      (c) => c.id === "contradiction_time_vs_scope" && c.status === "resolved",
    );
    if (!alreadyResolved) {
      upsertContradiction({
        id: "contradiction_time_vs_scope",
        field: "timeline",
        title: "Time vs Complexity Contradiction",
        description:
          "Limited weekly time commitment paired with a massive enterprise-scale build scope.",
        recommendation:
          "Scope down to a lean Phase 1 MVP with a single core workflow.",
        earlierEvidence: {
          value: "Minimal Weekly Time",
          quote: tinyTimeQuote.text,
          turnIndex: tinyTimeQuote.turnIndex,
        },
        conflictingEvidence: {
          value: "Enterprise / Massive Scope",
          quote: massiveScopeQuote.text,
          turnIndex: massiveScopeQuote.turnIndex,
        },
        status: "unresolved",
      });
    }
  }

  // Rule 5: Overengineering simple MVP
  const simpleMvpQuote = findQuoteMatching(
    /\b(portfolio|landing page|simple blog|mvp|prototype|simple website)\b/i,
  );
  const overengQuote = findQuoteMatching(
    /\b(kubernetes|k8s|kafka|microservices architecture|distributed consensus|cassandra)\b/i,
  );
  if (simpleMvpQuote && overengQuote) {
    const alreadyResolved = profile.contradictions.some(
      (c) =>
        c.id === "contradiction_overengineering" && c.status === "resolved",
    );
    if (!alreadyResolved) {
      upsertContradiction({
        id: "contradiction_overengineering",
        field: "tech_stack",
        title: "Architecture Overengineering Mismatch",
        description:
          "Proposes distributed microservices/Kubernetes/Kafka for a simple MVP or landing page.",
        recommendation:
          "Use a unified modern monolith or serverless stack (React/Next.js + Supabase/SQLite).",
        earlierEvidence: {
          value: "Simple MVP / Portfolio",
          quote: simpleMvpQuote.text,
          turnIndex: simpleMvpQuote.turnIndex,
        },
        conflictingEvidence: {
          value: "Distributed Microservices / Kubernetes",
          quote: overengQuote.text,
          turnIndex: overengQuote.turnIndex,
        },
        status: "unresolved",
      });
    }
  }

  // Rule 6: High-ticket pricing vs low-income audience
  const brokeAudQuote = findQuoteMatching(
    /\b(broke students|unemployed teenagers|kids with no money)\b/i,
  );
  const highTicketQuote = findQuoteMatching(
    /\b(\$1000|\$2000|\$500\/month|high ticket)\b/i,
  );
  if (brokeAudQuote && highTicketQuote) {
    const alreadyResolved = profile.contradictions.some(
      (c) =>
        c.id === "contradiction_pricing_vs_audience" && c.status === "resolved",
    );
    if (!alreadyResolved) {
      upsertContradiction({
        id: "contradiction_pricing_vs_audience",
        field: "audience",
        title: "Pricing vs Audience Purchasing Power Mismatch",
        description:
          "Targets an audience without disposable income while charging high-ticket prices.",
        recommendation:
          "Pivot to institutional/B2B buyers or adopt a freemium pricing tier.",
        earlierEvidence: {
          value: "Low-Income Audience",
          quote: brokeAudQuote.text,
          turnIndex: brokeAudQuote.turnIndex,
        },
        conflictingEvidence: {
          value: "High-Ticket Pricing",
          quote: highTicketQuote.text,
          turnIndex: highTicketQuote.turnIndex,
        },
        status: "unresolved",
      });
    }
  }
}

/**
 * Recomputes `unresolvedQuestions` from the assigned expert's slot definitions,
 * taking into account confirmed facts and active contradictions.
 * Note: Inferred assumptions do NOT count as confirmed facts, though high-confidence
 * inferences de-prioritize redundant questions unless critical.
 */
function refreshUnresolvedQuestions(
  profile: ProjectProfile,
  vagueSlotId?: string | null,
): void {
  const expert = profile.expertId ? EXPERTS[profile.expertId] : null;
  if (!expert) {
    profile.unresolvedQuestions = [];
    return;
  }

  const confirmedSlotSet = new Set<string>();
  for (const fact of profile.confirmedFacts) {
    if (fact.slotId) confirmedSlotSet.add(normalizeKey(fact.slotId));
    confirmedSlotSet.add(normalizeKey(fact.id));
  }
  if (profile.intendedAudience?.origin === "explicit") {
    confirmedSlotSet.add("audience");
    confirmedSlotSet.add("target_audience");
  }
  if (profile.desiredDeliverable?.origin === "explicit") {
    confirmedSlotSet.add("purpose");
    confirmedSlotSet.add("type");
    confirmedSlotSet.add("format");
    confirmedSlotSet.add("output");
  }
  if (profile.budget?.origin === "explicit") {
    confirmedSlotSet.add("budget");
  }
  if (profile.timeline?.origin === "explicit") {
    confirmedSlotSet.add("timeline");
    confirmedSlotSet.add("deadline");
  }
  for (const fr of profile.functionalRequirements) {
    if (fr.origin === "explicit" && fr.slotId) {
      confirmedSlotSet.add(normalizeKey(fr.slotId));
    }
  }
  for (const pref of profile.userPreferences) {
    if (pref.origin === "explicit" && pref.slotId) {
      confirmedSlotSet.add(normalizeKey(pref.slotId));
    }
  }
  for (const res of profile.resources) {
    if (res.origin === "explicit" && res.slotId) {
      confirmedSlotSet.add(normalizeKey(res.slotId));
    }
  }
  for (const ext of Object.values(profile.domainExtensions)) {
    if (ext.origin === "explicit" && ext.slotId) {
      confirmedSlotSet.add(normalizeKey(ext.slotId));
    }
  }

  // Also check slots explicitly delegated ("you decide") or skipped by the user
  const userDelegatedOrSkippedSlots = new Set<string>();
  for (const a of profile.inferredAssumptions) {
    if (
      a.status === "active" &&
      a.origin === "assumed" &&
      a.slotId &&
      a.evidence.rationale &&
      (a.evidence.rationale.includes("delegated") ||
        a.evidence.rationale.includes("skipped"))
    ) {
      userDelegatedOrSkippedSlots.add(normalizeKey(a.slotId));
    }
  }

  const unresolvedContradictionFields = new Set(
    profile.contradictions
      .filter((c) => c.status === "unresolved")
      .map((c) => normalizeKey(c.field)),
  );

  const unresolved: UnresolvedQuestionItem[] = [];

  for (const slot of expert.slots) {
    const normSlot = normalizeKey(slot.id);
    if (unresolvedContradictionFields.has(normSlot)) {
      unresolved.push({
        slotId: normSlot,
        label: slot.label,
        priority: "critical",
        why: slot.why,
        reason: "contradiction",
      });
      continue;
    }

    if (vagueSlotId && normalizeKey(vagueSlotId) === normSlot) {
      unresolved.push({
        slotId: normSlot,
        label: slot.label,
        priority: slot.priority,
        why: slot.why,
        reason: "vague_answer",
      });
      continue;
    }

    if (
      !confirmedSlotSet.has(normSlot) &&
      !userDelegatedOrSkippedSlots.has(normSlot)
    ) {
      unresolved.push({
        slotId: normSlot,
        label: slot.label,
        priority: slot.priority,
        why: slot.why,
        reason: "missing",
      });
    }
  }

  profile.unresolvedQuestions = unresolved;
}

/**
 * Incrementally updates a ProjectProfile with a single user turn.
 * Pure function: returns a new updated ProjectProfile without mutating the input.
 */
export function updateProjectProfileTurn(
  currentProfile: ProjectProfile,
  turn: TurnUpdateInput,
): ProjectProfile {
  let profile = cloneProfile(currentProfile);
  const turnIndex =
    typeof turn.turnIndex === "number"
      ? turn.turnIndex
      : profile.lastProcessedTurn + 1;
  profile.lastProcessedTurn = Math.max(profile.lastProcessedTurn, turnIndex);
  profile.updatedAt = Date.now();

  const text = (turn.userText || "").trim();
  if (turn.expertId && EXPERTS[turn.expertId]) {
    profile.expertId = turn.expertId;
  } else if (!profile.expertId && text && !isVagueIntent(text)) {
    profile.expertId = detectExpert(text) ?? "business";
  }

  // Handle custom/unknown consultant-specific fields if provided programmatically
  if (turn.customFields && typeof turn.customFields === "object") {
    for (const [rawKey, rawVal] of Object.entries(turn.customFields)) {
      const extKey = normalizeKey(rawKey);
      if (!extKey) continue;
      const valObj = typeof rawVal === "string" ? { value: rawVal } : rawVal;
      if (!valObj || typeof valObj.value !== "string" || !valObj.value.trim()) {
        continue;
      }
      const origin: RequirementOrigin = valObj.origin ?? "explicit";
      const confidence: ConfidenceLevel = valObj.confidence ?? "high";
      const item: ProfileRequirementItem = {
        id: extKey,
        slotId: extKey,
        category: "domain_extension",
        label: valObj.label || rawKey,
        value: valObj.value.trim(),
        origin,
        confidence,
        evidence: {
          quote: text || valObj.value.trim(),
          turnIndex,
          messageId: turn.messageId,
          slotId: extKey,
        },
        status: "active",
        updatedAtTurn: turnIndex,
      };
      profile.domainExtensions[extKey] = item;
      if (origin === "explicit") {
        upsertConfirmedFact(profile, item);
      } else if (origin === "inferred" || origin === "assumed") {
        addInferredOrAssumedItem(profile, item);
      }
    }
  }

  if (!text) {
    refreshUnresolvedQuestions(profile);
    return profile;
  }

  // Ignore meta/clarification questions ("Why are you asking this?")
  if (isClarificationQuestion(text)) {
    refreshUnresolvedQuestions(profile);
    return profile;
  }

  const isCorrection = hasExplicitCorrectionIntent(text);
  const isPivot = hasProjectPivotIntent(text);
  const isVague = isVagueTurnAnswer(text);
  const isDelegated = isUserDelegation(text);
  const isSkipped = isSkipQuestionRequest(text);
  const isUncertain = isUserUncertainty(text);
  const isGenNow = isGenerateNowRequest(text);

  // If user requests to skip the interview / generate the prompt now
  if (isGenNow) {
    // Strip the generate-now directive to check if they also included a goal or requirement in the same turn
    const strippedGoal = text
      .replace(
        /\b(skip (?:the )?(?:rest of the )?(?:interview|questions)|and generate (?:the )?prompts?(?:\s+now)?|generate (?:the |my )?(?:final |master )?prompts?(?:\s+now|\s+anyway)?|just generate (?:the )?prompts?(?:\s+now)?|stop asking questions|proceed without resolving)\b/gi,
        "",
      )
      .replace(/^[.,;:\s-]+|[.,;:\s-]+$/g, "")
      .trim();

    if (
      !profile.primaryGoal &&
      strippedGoal.length >= 6 &&
      !isVagueIntent(strippedGoal)
    ) {
      const goalItem: ProfileRequirementItem = {
        id: "primary_goal",
        category: "goal",
        label: "Primary Goal",
        value: strippedGoal,
        origin: "explicit",
        confidence: "high",
        evidence: {
          quote: text,
          turnIndex,
          messageId: turn.messageId,
        },
        status: "active",
        updatedAtTurn: turnIndex,
      };
      setScalarField(profile, "primaryGoal", goalItem, false);
      extractTurnSignals(
        strippedGoal,
        turnIndex,
        turn.messageId,
        null,
        false,
        profile,
      );
    }

    profile.domainExtensions["interview_control"] = {
      id: "interview_control",
      slotId: "interview_control",
      category: "preference",
      label: "Interview Control Preference",
      value: "User requested immediate prompt generation",
      origin: "explicit",
      confidence: "high",
      evidence: {
        quote: text,
        turnIndex,
        messageId: turn.messageId,
      },
      status: "active",
      updatedAtTurn: turnIndex,
    };

    profile = ensureAssumptionsForMissingCoreFields(
      profile,
      turnIndex,
      text,
      turn.messageId,
    );
    refreshUnresolvedQuestions(profile);
    return profile;
  }

  // If this is the initial goal or primaryGoal is not yet set and text is not vague
  if (!profile.primaryGoal && !isVague && !isDelegated && !isSkipped) {
    const goalItem: ProfileRequirementItem = {
      id: "primary_goal",
      category: "goal",
      label: "Primary Goal",
      value: text,
      origin: "explicit",
      confidence: "high",
      evidence: {
        quote: text,
        turnIndex,
        messageId: turn.messageId,
      },
      status: "active",
      updatedAtTurn: turnIndex,
    };
    setScalarField(profile, "primaryGoal", goalItem, isCorrection);
  } else if (
    profile.primaryGoal &&
    (isPivot ||
      (isCorrection &&
        /\b(goal|project|instead i want to build|switch project to|change my goal to|instead of a [a-z0-9\s]+,?\s*i want)\b/i.test(
          text,
        )))
  ) {
    const goalItem: ProfileRequirementItem = {
      id: "primary_goal",
      category: "goal",
      label: "Primary Goal",
      value: text,
      origin: "explicit",
      confidence: "high",
      evidence: {
        quote: text,
        turnIndex,
        messageId: turn.messageId,
      },
      status: "active",
      updatedAtTurn: turnIndex,
    };
    setScalarField(profile, "primaryGoal", goalItem, true);

    // Supersede stale deliverable/archetype assumptions from the old direction
    for (const a of profile.inferredAssumptions) {
      if (a.status === "active" && a.category === "deliverable") {
        a.status = "superseded";
        a.updatedAtTurn = turnIndex;
      }
    }
  }

  // Handle user delegation ("you decide"), skip ("skip this question"), or uncertainty ("idk", "not sure")
  if (turn.askedSlotId && (isDelegated || isSkipped || isUncertain)) {
    const normSlot = normalizeKey(turn.askedSlotId);
    const expert = profile.expertId ? EXPERTS[profile.expertId] : null;
    const slotDef = expert?.slots.find((s) => normalizeKey(s.id) === normSlot);
    const label = turn.askedSlotLabel || slotDef?.label || turn.askedSlotId;
    const reason = isDelegated
      ? "delegated"
      : isSkipped
        ? "skipped"
        : "uncertain";

    recordUserDeferredSlotAssumption(
      profile,
      normSlot,
      label,
      text,
      turnIndex,
      turn.messageId,
      reason,
    );

    // If the message also contains additional concrete requirements alongside delegation/uncertainty
    // (e.g., "Not sure about hosting, you decide, but our budget is $0 and audience is B2B founders"),
    // extract those concrete inline signals before returning.
    if (!isVague && !isSkipped) {
      extractTurnSignals(
        text,
        turnIndex,
        turn.messageId,
        null,
        isCorrection,
        profile,
      );
      updateInferencesAndAssumptions(profile, text, turnIndex, turn.messageId);
      evaluateProfileContradictions(
        profile,
        text,
        turnIndex,
        turn.messageId,
        isCorrection,
      );
    }

    // Preserve vague_answer reason in unresolvedQuestions when pure uncertainty ("idk not sure")
    refreshUnresolvedQuestions(
      profile,
      isVague && !isDelegated && !isSkipped ? turn.askedSlotId : undefined,
    );
    return profile;
  }

  // If the user gave a vague answer (e.g., "everyone", "good", "make money") to a specific slot,
  // do not record it as a confirmed fact; mark that slot as needing refinement in unresolvedQuestions
  if (isVague) {
    refreshUnresolvedQuestions(profile, turn.askedSlotId);
    return profile;
  }

  // If answering a specific slot question with a concrete answer
  if (turn.askedSlotId && !isPivot) {
    const normSlot = normalizeKey(turn.askedSlotId);
    const expert = profile.expertId ? EXPERTS[profile.expertId] : null;
    const slotDef = expert?.slots.find((s) => normalizeKey(s.id) === normSlot);
    const label = turn.askedSlotLabel || slotDef?.label || turn.askedSlotId;
    applySlotAnswerToProfile(
      profile,
      normSlot,
      label,
      text,
      turnIndex,
      turn.messageId,
      isCorrection,
    );
  } else if (isCorrection) {
    // Handle free-form correction turns even when no slot tag was attached
    // e.g. "Actually, change the target audience to enterprise CFOs"
    const audCorrection = text.match(
      /\b(?:audience|target customer|users?|clients?)\s+(?:is|are|should be|to)\s+([^.;,\n]+)/i,
    );
    if (audCorrection && audCorrection[1]) {
      applySlotAnswerToProfile(
        profile,
        "audience",
        "Target Audience",
        audCorrection[1].trim(),
        turnIndex,
        turn.messageId,
        true,
      );
    }
  }

  // Extract inline explicit signals (budget, platforms, exclusions, deliverable, NFRs, preferences, features, integrations)
  extractTurnSignals(
    text,
    turnIndex,
    turn.messageId,
    turn.askedSlotId,
    isCorrection,
    profile,
  );

  // Update contextual inferences and assumptions (never promoting inferences to confirmedFacts)
  updateInferencesAndAssumptions(profile, text, turnIndex, turn.messageId);

  // Evaluate contradictions and resolutions
  evaluateProfileContradictions(
    profile,
    text,
    turnIndex,
    turn.messageId,
    isCorrection,
  );

  // Refresh unresolved questions
  refreshUnresolvedQuestions(profile);

  return profile;
}

function getTextFromUiMessage(m: UIMessage | undefined | null): string {
  if (!m || !Array.isArray(m.parts)) return "";
  return m.parts
    .map((p) =>
      p?.type === "text" && typeof p.text === "string" ? p.text : "",
    )
    .join("");
}

/**
 * Builds or incrementally catches up a ProjectProfile from a UIMessage conversation array.
 */
export function buildProjectProfileFromMessages(
  messages: UIMessage[],
  expertId?: ExpertId | null,
  existingProfile?: ProjectProfile | null,
): ProjectProfile {
  const safeMessages = Array.isArray(messages) ? messages : [];
  let profile =
    existingProfile && validateProjectProfile(existingProfile).valid
      ? cloneProfile(existingProfile)
      : createEmptyProjectProfile(expertId ?? null);

  if (expertId && EXPERTS[expertId]) {
    profile.expertId = expertId;
  }

  let currentPendingSlot: string | null = null;
  let userTurnCounter = 0;

  for (let i = 0; i < safeMessages.length; i++) {
    const msg = safeMessages[i];
    if (!msg || typeof msg !== "object") continue;
    const text = getTextFromUiMessage(msg).trim();

    if (msg.role === "assistant") {
      const match = SLOT_TAG_RE.exec(text);
      currentPendingSlot = match ? normalizeKey(match[1]) : null;
    } else if (msg.role === "user") {
      const turnIdx = userTurnCounter++;
      if (turnIdx > profile.lastProcessedTurn) {
        profile = updateProjectProfileTurn(profile, {
          turnIndex: turnIdx,
          messageId: msg.id,
          userText: text,
          askedSlotId: currentPendingSlot,
          expertId: profile.expertId,
        });
      }
      // If the user answered (and it wasn't a clarification question or pure non-delegated vague word), consume the pending slot
      if (
        !isClarificationQuestion(text) &&
        (!isVagueTurnAnswer(text) ||
          isUserDelegation(text) ||
          isSkipQuestionRequest(text))
      ) {
        currentPendingSlot = null;
      }
    }
  }

  refreshUnresolvedQuestions(profile, currentPendingSlot);
  return profile;
}

/**
 * Validates an unknown object against the ProjectProfile contract.
 */
export function validateProjectProfile(input: unknown): {
  valid: boolean;
  profile: ProjectProfile | null;
  errors: string[];
} {
  const errors: string[] = [];
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return {
      valid: false,
      profile: null,
      errors: ["Profile must be a non-null object."],
    };
  }

  const candidate = input as Record<string, unknown>;

  if (
    typeof candidate.schemaVersion !== "number" ||
    candidate.schemaVersion < 1
  ) {
    errors.push("Invalid or missing schemaVersion.");
  }

  if (
    candidate.expertId !== null &&
    candidate.expertId !== undefined &&
    typeof candidate.expertId !== "string"
  ) {
    errors.push("expertId must be a valid string or null.");
  }

  const requiredArrays = [
    "targetPlatforms",
    "functionalRequirements",
    "nonFunctionalRequirements",
    "constraints",
    "resources",
    "explicitExclusions",
    "successCriteria",
    "userPreferences",
    "confirmedFacts",
    "inferredAssumptions",
    "unresolvedQuestions",
    "contradictions",
  ];

  for (const key of requiredArrays) {
    if (!Array.isArray(candidate[key])) {
      errors.push(`Field "${key}" must be an array.`);
    }
  }

  if (
    !candidate.domainExtensions ||
    typeof candidate.domainExtensions !== "object" ||
    Array.isArray(candidate.domainExtensions)
  ) {
    errors.push('Field "domainExtensions" must be an object map.');
  }

  // Verify invariant: confirmedFacts must never contain inferred or assumed items
  if (Array.isArray(candidate.confirmedFacts)) {
    for (const item of candidate.confirmedFacts as ProfileRequirementItem[]) {
      if (!item || typeof item.value !== "string") {
        errors.push("confirmedFacts contains an entry without a string value.");
      } else if (item.origin !== "explicit") {
        errors.push(
          `Invariant violation: confirmedFact "${item.id}" has non-explicit origin "${item.origin}".`,
        );
      }
    }
  }

  if (errors.length > 0) {
    return { valid: false, profile: null, errors };
  }

  return {
    valid: true,
    profile: candidate as unknown as ProjectProfile,
    errors: [],
  };
}

/**
 * Serializes a ProjectProfile cleanly to JSON string.
 */
export function serializeProjectProfile(profile: ProjectProfile): string {
  return JSON.stringify(profile);
}

/**
 * Safely deserializes or migrates a stored ProjectProfile, falling back to reconstructing
 * from conversation messages if stored data is missing or corrupted.
 */
export function deserializeProjectProfile(
  raw: string | unknown,
  fallbackMessages: UIMessage[] = [],
  fallbackExpert: ExpertId | null = null,
): ProjectProfile {
  try {
    const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
    const validation = validateProjectProfile(parsed);
    if (validation.valid && validation.profile) {
      if (fallbackMessages.length > 0) {
        return buildProjectProfileFromMessages(
          fallbackMessages,
          fallbackExpert ?? validation.profile.expertId,
          validation.profile,
        );
      }
      return validation.profile;
    }
  } catch {
    // Fall through to safe reconstruction
  }

  return buildProjectProfileFromMessages(fallbackMessages, fallbackExpert);
}

/**
 * Formats the ProjectProfile into a structured, presentation-independent summary
 * for consultant reasoning and prompt synthesis.
 */
export function formatProjectProfileForConsultant(
  profile: ProjectProfile,
): string {
  const lines: string[] = [];
  lines.push("## STRUCTURED PROJECT PROFILE (SHARED UNDERSTANDING ENGINE)");
  lines.push(
    `- Primary Goal: ${profile.primaryGoal ? `"${profile.primaryGoal.value}" [explicit, turn ${profile.primaryGoal.evidence.turnIndex}]` : "(Not yet locked)"}`,
  );
  if (profile.intendedAudience) {
    lines.push(
      `- Intended Audience: "${profile.intendedAudience.value}" [${profile.intendedAudience.origin}, confidence: ${profile.intendedAudience.confidence}]`,
    );
  }
  if (profile.desiredDeliverable) {
    lines.push(
      `- Desired Deliverable: "${profile.desiredDeliverable.value}" [${profile.desiredDeliverable.origin}]`,
    );
  }
  if (profile.budget) {
    lines.push(
      `- Budget Constraint: "${profile.budget.value}" [${profile.budget.origin}]`,
    );
  }
  if (profile.timeline) {
    lines.push(
      `- Timeline: "${profile.timeline.value}" [${profile.timeline.origin}]`,
    );
  }
  if (profile.targetPlatforms.length > 0) {
    lines.push(
      `- Target Platforms: ${profile.targetPlatforms.map((p) => p.value).join(", ")}`,
    );
  }
  if (profile.explicitExclusions.length > 0) {
    lines.push(
      `- Explicit Exclusions (MUST RESPECT): ${profile.explicitExclusions.map((e) => e.value).join("; ")}`,
    );
  }
  if (profile.functionalRequirements.length > 0) {
    lines.push(
      `- Functional Requirements: ${profile.functionalRequirements.map((f) => `${f.label}: ${f.value}`).join("; ")}`,
    );
  }
  if (profile.nonFunctionalRequirements.length > 0) {
    lines.push(
      `- Non-Functional Requirements: ${profile.nonFunctionalRequirements.map((n) => `${n.label}: ${n.value}`).join("; ")}`,
    );
  }
  if (profile.userPreferences.length > 0) {
    lines.push(
      `- User Preferences: ${profile.userPreferences.map((p) => `${p.label}: ${p.value}`).join("; ")}`,
    );
  }
  const extEntries = Object.values(profile.domainExtensions);
  if (extEntries.length > 0) {
    lines.push(
      `- Domain Extensions: ${extEntries.map((e) => `${e.label}: ${e.value} [${e.origin}]`).join("; ")}`,
    );
  }
  const activeAssumptions = profile.inferredAssumptions.filter(
    (a) => a.status === "active",
  );
  if (activeAssumptions.length > 0) {
    lines.push(
      `- Active Inferences & Unconfirmed Assumptions (Never treat as explicit facts unless confirmed): ${activeAssumptions.map((a) => `${a.label}: ${a.value} [${a.origin}, ${a.confidence}]`).join("; ")}`,
    );
  }
  const unresolvedContradictions = profile.contradictions.filter(
    (c) => c.status === "unresolved",
  );
  if (unresolvedContradictions.length > 0) {
    lines.push(
      `- UNRESOLVED CONTRADICTIONS REQUIRING CLARIFICATION: ${unresolvedContradictions.map((c) => `${c.title} (${c.description})`).join(" | ")}`,
    );
  }
  return lines.join("\n");
}
