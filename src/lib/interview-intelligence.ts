import type { UIMessage } from "ai";
import { EXPERTS, type Expert, type ExpertId, type Slot } from "./experts";
import { messageText } from "./threads";
import {
  buildProjectProfileFromMessages,
  createEmptyProjectProfile,
  deserializeProjectProfile,
  ensureAssumptionsForMissingCoreFields,
  formatProjectProfileForConsultant,
  hasExplicitCorrectionIntent,
  hasProjectPivotIntent,
  isGenerateNowRequest,
  isSkipQuestionRequest,
  isUnfamiliarTaskDomain,
  isUserDelegation,
  isUserUncertainty,
  serializeProjectProfile,
  updateProjectProfileTurn,
  validateProjectProfile,
  type ConfidenceLevel,
  type ProfileContradiction,
  type ProfileRequirementItem,
  type ProjectProfile,
  type RequirementOrigin,
  type TurnUpdateInput,
  type UnresolvedQuestionItem,
} from "./project-understanding-engine";

export {
  buildProjectProfileFromMessages,
  createEmptyProjectProfile,
  deserializeProjectProfile,
  ensureAssumptionsForMissingCoreFields,
  formatProjectProfileForConsultant,
  hasExplicitCorrectionIntent,
  hasProjectPivotIntent,
  isGenerateNowRequest,
  isSkipQuestionRequest,
  isUnfamiliarTaskDomain,
  isUserDelegation,
  isUserUncertainty,
  serializeProjectProfile,
  updateProjectProfileTurn,
  validateProjectProfile,
  type ConfidenceLevel,
  type ProfileContradiction,
  type ProfileRequirementItem,
  type ProjectProfile,
  type RequirementOrigin,
  type TurnUpdateInput,
  type UnresolvedQuestionItem,
};

export type SignalType =
  | "vagueness_detected"
  | "contradiction_detected"
  | "unrealistic_expectation"
  | "knowledge_gap"
  | "deep_dive"
  | "scope_calibrated";

export interface IntelligenceSignal {
  type: SignalType;
  title: string;
  description: string;
  recommendation: string;
  severity: "info" | "advisory" | "warning";
}

export interface InferredFact {
  id: string;
  label: string;
  value: string;
  confidence: "high" | "medium";
  rationale: string;
  category:
    "technical" | "audience" | "business" | "timeline" | "scope" | "format";
}

export type QuestionCoverageStatus =
  | "missing"
  | "confirmed"
  | "inferred_high"
  | "inferred_medium"
  | "assumed_by_user"
  | "contradictory"
  | "vague"
  | "domain_irrelevant";

export interface QuestionValueEstimate {
  slot: Slot;
  slotId: string;
  /** 0..10: How important the missing information is to the outcome */
  importance: number;
  /** 0..10: How much the answer could materially change the final prompt */
  promptImpact: number;
  /** Whether the answer is already present in the profile (confirmed, high-confidence inferred, or assumed via user deferral) */
  alreadyPresent: boolean;
  /** Detailed coverage status in ProjectProfile */
  coverageStatus: QuestionCoverageStatus;
  /** 0..10: Penalty when another question or existing fact covers the same information */
  overlapPenalty: number;
  /** 0..10: Cost of asking the user another question at this stage */
  questionCost: number;
  /** Expected net information value */
  expectedNetValue: number;
  /** Plain-English explanation of why this question matters for the user's goal */
  whyItMatters: string;
  /** Explanation of why this question was prioritized or suppressed */
  selectionRationale: string;
}

export type StoppingPolicyOutcome =
  "ask_clarification" | "proceed_with_assumptions" | "generate_final_prompt";

export interface StoppingPolicyDecision {
  outcome: StoppingPolicyOutcome;
  shouldStop: boolean;
  reason: string;
  selectedQuestion: QuestionValueEstimate | null;
  assumptionsToDisclose: string[];
  unresolvedConflictsToDisclose: string[];
}

export interface IntelligenceAnalysis {
  goal: string;
  expertId: ExpertId | null;
  domain: string;
  inferredFacts: InferredFact[];
  confirmedFacts: Array<{ label: string; value: string; slotId?: string }>;
  activeSignals: IntelligenceSignal[];
  strategicFocus: string;
  unnecessaryTopics: string[];
  readinessScore: number; // 0 - 100
  isReadyForMasterPrompt: boolean;
  questionNumber: number;
  projectProfile: ProjectProfile;
  isUnfamiliarDomain?: boolean;
  candidateQuestions?: QuestionValueEstimate[];
  stoppingPolicy?: StoppingPolicyDecision;
}

/**
 * Normalizes slot names consistently across hyphens, spaces, and underscores.
 */
export function normalizeSlotId(slot: string | null | undefined): string {
  if (!slot) return "";
  return slot
    .trim()
    .toLowerCase()
    .replace(/[\s\-_]+/g, "_");
}

/**
 * Matches slot tags with hyphens, underscores, or spaces, e.g. <!--slot:tech-stack-->
 */
export const SLOT_TAG_RE = /<!--\s*slot\s*:\s*([a-zA-Z0-9_\-\s]+?)\s*-->/i;

/**
 * Detects whether a user message is requesting clarification, explanation, or meta-guidance
 * rather than answering an interview slot question.
 */
export function isClarificationOrMetaRequest(text: string): boolean {
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

const VAGUE_WORDS = new Set([
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
]);

/**
 * Normalizes input string for pattern matching
 */
function cleanText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s$]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Detects facts that can be inferred without asking redundant questions
 */
export function inferInformation(
  goal: string,
  userMessages: string[],
  expertId: ExpertId | null,
): InferredFact[] {
  const combined = [goal, ...userMessages].join(" ");
  const clean = cleanText(combined);
  const facts: InferredFact[] = [];
  const addedIds = new Set<string>();

  const add = (fact: InferredFact) => {
    if (!addedIds.has(fact.id)) {
      addedIds.add(fact.id);
      facts.push(fact);
    }
  };

  // 1. Technical Level & Coding Skills
  if (
    clean.includes("react") ||
    clean.includes("next js") ||
    clean.includes("nextjs") ||
    clean.includes("vue") ||
    clean.includes("svelte") ||
    clean.includes("angular") ||
    clean.includes("remix") ||
    clean.includes("python") ||
    clean.includes("typescript") ||
    clean.includes("javascript") ||
    clean.includes("tailwind") ||
    clean.includes("node") ||
    clean.includes("express") ||
    clean.includes("fastapi") ||
    clean.includes("django") ||
    clean.includes("flask") ||
    clean.includes("rails") ||
    clean.includes("golang") ||
    clean.includes("rust") ||
    clean.includes("flutter") ||
    clean.includes("swift") ||
    clean.includes("docker") ||
    clean.includes("kubernetes") ||
    clean.includes("api") ||
    clean.includes("github") ||
    clean.includes("sql") ||
    clean.includes("postgres") ||
    clean.includes("supabase") ||
    clean.includes("firebase") ||
    clean.includes("developer") ||
    clean.includes("programmer") ||
    clean.includes("software engineer") ||
    clean.includes("coding")
  ) {
    add({
      id: "skills_technical",
      label: "Technical Proficiency",
      value: "Experienced Developer / Tech-Savvy Builder",
      confidence: "high",
      rationale: "Mentioned specific developer tools/languages in conversation",
      category: "technical",
    });
  } else if (
    clean.includes("no code") ||
    clean.includes("nocode") ||
    clean.includes("zero coding") ||
    clean.includes("can t code") ||
    clean.includes("cant code") ||
    clean.includes("non technical") ||
    clean.includes("framer") ||
    clean.includes("webflow") ||
    clean.includes("wix") ||
    clean.includes("squarespace") ||
    clean.includes("wordpress") ||
    clean.includes("bubble") ||
    clean.includes("airtable") ||
    clean.includes("notion") ||
    clean.includes("shopify")
  ) {
    add({
      id: "skills_technical",
      label: "Technical Proficiency",
      value: "No-Code / Non-Technical Builder",
      confidence: "high",
      rationale:
        "Explicitly highlighted no-code preference or non-technical background",
      category: "technical",
    });
  }

  // 2. Audience Inference
  if (
    clean.includes("freelance") ||
    clean.includes("freelancers") ||
    clean.includes("agency owners") ||
    clean.includes("consultants")
  ) {
    add({
      id: "target_audience",
      label: "Target Audience",
      value: "Freelancers, Contractors & Independent Professionals",
      confidence: "high",
      rationale: "Explicitly specified in target description",
      category: "audience",
    });
  } else if (
    clean.includes("valorant") ||
    clean.includes("esports") ||
    clean.includes("gaming team") ||
    clean.includes("gamers") ||
    clean.includes("scouts")
  ) {
    add({
      id: "target_audience",
      label: "Target Audience",
      value: "Esports Team Scouts, Tournament Organizers & Gaming Community",
      confidence: "high",
      rationale: "Deduced from competitive gaming context",
      category: "audience",
    });
  } else if (
    clean.includes("students") ||
    clean.includes("university") ||
    clean.includes("college") ||
    clean.includes("high school")
  ) {
    add({
      id: "target_audience",
      label: "Target Audience",
      value: "College & University Students",
      confidence: "high",
      rationale: "Mentioned academic student segment",
      category: "audience",
    });
  } else if (
    clean.includes("b2b") ||
    clean.includes("enterprise") ||
    clean.includes("small business") ||
    clean.includes("local businesses") ||
    clean.includes("corporate")
  ) {
    add({
      id: "target_audience",
      label: "Target Audience",
      value: "Small-to-Medium Businesses (B2B)",
      confidence: "high",
      rationale: "Identified commercial enterprise focus",
      category: "audience",
    });
  } else if (
    clean.includes("creators") ||
    clean.includes("youtubers") ||
    clean.includes("streamers")
  ) {
    add({
      id: "target_audience",
      label: "Target Audience",
      value: "Online Content Creators, YouTubers & Media Producers",
      confidence: "high",
      rationale: "Targeting digital content creators",
      category: "audience",
    });
  }

  // 3. Product / Website Format
  if (
    clean.includes("portfolio") ||
    clean.includes("showcase my work") ||
    clean.includes("personal site") ||
    clean.includes("resume site")
  ) {
    add({
      id: "site_type",
      label: "Site Archetype",
      value: "High-Impact Showcase / Personal Portfolio",
      confidence: "high",
      rationale: "Inferred from portfolio/showcase goal",
      category: "scope",
    });
  } else if (
    clean.includes("saas") ||
    clean.includes("micro saas") ||
    clean.includes("web app") ||
    clean.includes("software product") ||
    clean.includes("subscription tool")
  ) {
    add({
      id: "site_type",
      label: "Product Format",
      value: "Web Application / SaaS Platform",
      confidence: "high",
      rationale: "Software-as-a-service model specified",
      category: "scope",
    });
  } else if (
    clean.includes("ecommerce") ||
    clean.includes("e commerce") ||
    clean.includes("online store") ||
    clean.includes("sell products") ||
    clean.includes("dropshipping")
  ) {
    add({
      id: "site_type",
      label: "Commerce Model",
      value: "E-Commerce / Direct-to-Consumer Storefront",
      confidence: "high",
      rationale: "Identified retail commerce intent",
      category: "business",
    });
  } else if (
    clean.includes("directory") ||
    clean.includes("listing site") ||
    clean.includes("curated list")
  ) {
    add({
      id: "site_type",
      label: "Site Archetype",
      value: "Curated Directory / Aggregator Platform",
      confidence: "high",
      rationale: "Directory / curation intent detected",
      category: "scope",
    });
  } else if (
    clean.includes("newsletter") ||
    clean.includes("substack") ||
    clean.includes("publication")
  ) {
    add({
      id: "site_type",
      label: "Publication Format",
      value: "Digital Newsletter / Media Publication",
      confidence: "high",
      rationale: "Newsletter / publication model detected",
      category: "scope",
    });
  }

  // 4. Content / Media format (for creators)
  if (
    clean.includes("faceless") ||
    clean.includes("no face") ||
    clean.includes("ai voice") ||
    clean.includes("b roll")
  ) {
    add({
      id: "content_format",
      label: "Production Format",
      value: "Faceless Content with Voiceover & Curated Visuals",
      confidence: "high",
      rationale: "User indicated faceless production route",
      category: "format",
    });
  } else if (
    clean.includes("shorts") ||
    clean.includes("tiktok") ||
    clean.includes("reels")
  ) {
    add({
      id: "content_format",
      label: "Content Format",
      value: "Short-Form Vertical Video (Shorts / Reels / TikTok)",
      confidence: "high",
      rationale: "Short-form vertical video focus detected",
      category: "format",
    });
  }

  // 5. Budget & Free-Tier Constraints
  if (
    clean.includes("$0") ||
    clean.includes("zero budget") ||
    clean.includes("no budget") ||
    clean.includes("free tools") ||
    clean.includes("bootstrapped") ||
    clean.includes("shoestring") ||
    clean.includes("no money") ||
    clean.includes("free tier")
  ) {
    add({
      id: "budget_constraint",
      label: "Capital Constraints",
      value:
        "$0 Starting Budget / 100% Bootstrapped Free Tier (Zero-Cost Services Only)",
      confidence: "high",
      rationale:
        "Detected clear zero-cost constraint requiring verified free-tier services",
      category: "business",
    });
  } else {
    const budgetMatch =
      clean.match(
        /\b(?:budget|capital|funding|spend|spending|invest|investment)\s*(?:of|is|around|under|up to|:)?\s*(\$?[0-9][0-9,]*(?:\.[0-9]+)?k?\s*(?:usd|dollars|eur|gbp|bdt|inr)?)\b/i,
      ) ??
      clean.match(
        /(\$[0-9][0-9,]*(?:\.[0-9]+)?k?|\b[0-9][0-9,]*(?:\.[0-9]+)?k?\s*(?:dollars|usd|eur|gbp|bdt|inr))\s*(?:budget|capital|funding|to spend|to invest|max|limit)/i,
      );
    if (budgetMatch && budgetMatch[1]) {
      add({
        id: "budget_constraint",
        label: "Starting Budget",
        value: `Approx. ${budgetMatch[1].trim().toUpperCase()}`,
        confidence: "medium",
        rationale: "Extracted explicit numeric budget figure from context",
        category: "business",
      });
    }
  }

  // 6. External Integrations & APIs
  if (
    clean.includes("stripe") ||
    clean.includes("payment") ||
    clean.includes("checkout") ||
    clean.includes("paypal") ||
    clean.includes("lemon squeezy")
  ) {
    add({
      id: "integrations_payment",
      label: "Payment & Billing Integration",
      value: "Stripe / Lemon Squeezy Payment Gateway with Webhook Verification",
      confidence: "high",
      rationale: "Detected commercial transaction/monetization requirement",
      category: "technical",
    });
  }
  if (
    clean.includes("auth") ||
    clean.includes("login") ||
    clean.includes("google sign in") ||
    clean.includes("oauth") ||
    clean.includes("user accounts")
  ) {
    add({
      id: "integrations_auth",
      label: "Authentication Integration",
      value: "OAuth / Magic Links with Secure Session Management",
      confidence: "high",
      rationale: "Detected user identity/account requirement",
      category: "technical",
    });
  }
  if (
    clean.includes("ai api") ||
    clean.includes("openai") ||
    clean.includes("gemini") ||
    clean.includes("claude") ||
    clean.includes("llm")
  ) {
    add({
      id: "integrations_ai",
      label: "AI Model Integration",
      value: "External AI Provider SDK with Server-Side Proxy Key Protection",
      confidence: "high",
      rationale: "Detected AI provider API dependency",
      category: "technical",
    });
  }

  // 7. Hosting & Deployment Environment
  if (
    clean.includes("vercel") ||
    clean.includes("netlify") ||
    clean.includes("cloudflare") ||
    clean.includes("github pages") ||
    clean.includes("render") ||
    clean.includes("railway") ||
    clean.includes("fly io")
  ) {
    add({
      id: "hosting_deployment",
      label: "Hosting & Deployment Target",
      value: "Modern Edge / Serverless Cloud Platform with CI/CD Integration",
      confidence: "high",
      rationale: "User identified preferred hosting/deployment ecosystem",
      category: "technical",
    });
  }

  // 8. Timeline / Urgency
  if (
    clean.includes("asap") ||
    clean.includes("this week") ||
    clean.includes("weekend") ||
    clean.includes("few days")
  ) {
    add({
      id: "timeline_urgency",
      label: "Execution Urgency",
      value: "Rapid Sprint / Immediate MVP (Within Days)",
      confidence: "high",
      rationale: "User expressed urgent timeline requirement",
      category: "timeline",
    });
  } else if (
    clean.includes("side project") ||
    clean.includes("spare time") ||
    clean.includes("part time") ||
    clean.includes("few hours")
  ) {
    add({
      id: "timeline_urgency",
      label: "Time Commitment",
      value: "Part-Time / Casual Side Project (5-10 hrs/week)",
      confidence: "medium",
      rationale: "Identified side-project pacing",
      category: "timeline",
    });
  }

  return facts;
}

/**
 * Checks for vague or low-effort user answers
 */
export function detectVagueness(lastUserAnswer: string): {
  isVague: boolean;
  feedback?: string;
  concreteAnchors?: string[];
} {
  const t = lastUserAnswer.trim().toLowerCase();
  const words = t.split(/\s+/).filter(Boolean);

  // Vague multi-word patterns
  const isVaguePhrase =
    t.includes("make money") ||
    t.includes("passive income") ||
    t.includes("get rich") ||
    t.includes("grow fast") ||
    t.includes("get views") ||
    t.includes("make it look good") ||
    t.includes("standard website") ||
    t.includes("website for everyone") ||
    t === "everyone" ||
    t === "anyone" ||
    t === "good" ||
    t === "nice" ||
    t === "cool" ||
    t === "standard" ||
    t === "normal" ||
    t === "idk" ||
    t === "i don't know" ||
    t === "not sure" ||
    t === "whatever works" ||
    t === "as fast as possible" ||
    t === "learn coding";

  const isShortVague =
    words.length <= 2 && words.every((w) => VAGUE_WORDS.has(w));

  if (isShortVague || isVaguePhrase) {
    let anchors = [
      "A specific measurable metric",
      "A tangible real-world example",
      "Your top 1 non-negotiable priority",
    ];

    if (
      t.includes("money") ||
      t.includes("cash") ||
      t.includes("profit") ||
      t.includes("income")
    ) {
      anchors = [
        "Recurring software subscription ($29-$99/mo B2B SaaS)",
        "High-ticket client consulting / freelance service ($1,000-$3,000/project)",
        "Direct-to-consumer e-commerce or digital asset downloads",
        "Affiliate commission or sponsored newsletter audience",
      ];
    } else if (
      t.includes("good") ||
      t.includes("best") ||
      t.includes("nice") ||
      t.includes("clean") ||
      t.includes("modern")
    ) {
      anchors = [
        "High-conversion minimal layout with bold typography",
        "Data-dense technical dashboard with live filters",
        "Immersive editorial portfolio with fluid interactive transitions",
      ];
    } else if (
      t.includes("everyone") ||
      t.includes("anyone") ||
      t.includes("people") ||
      t.includes("all users")
    ) {
      anchors = [
        "Specific independent professionals (e.g. freelance designers, copywriters)",
        "High-intent niche enthusiasts (e.g. competitive FPS players, indie game devs)",
        "Small business operators (e.g. local clinic directors, boutique fitness studios)",
      ];
    } else if (
      t.includes("fast") ||
      t.includes("asap") ||
      t.includes("soon") ||
      t.includes("quick")
    ) {
      anchors = [
        "Ultra-lean 48-hour prototype with 1 core feature",
        "2-week validated MVP ready for first 10 beta testers",
        "1-month production sprint with complete onboarding flow",
      ];
    }

    return {
      isVague: true,
      feedback: `The answer "${lastUserAnswer}" is broad or open-ended. As an experienced consultant, anchor their thinking with 2-4 tangible options.`,
      concreteAnchors: anchors,
    };
  }

  return { isVague: false };
}

/**
 * Analyzes conversation for internal contradictions
 */
export function detectContradictions(allUserAnswers: string[]): {
  contradiction?: IntelligenceSignal;
} {
  const combined = allUserAnswers.join(" ").toLowerCase();
  const latest = (
    allUserAnswers[allUserAnswers.length - 1] ?? ""
  ).toLowerCase();

  // Contradiction 1: $0 budget vs expensive paid growth
  const claimsZeroBudget =
    combined.includes("$0") ||
    combined.includes("zero budget") ||
    combined.includes("no money") ||
    combined.includes("shoestring") ||
    combined.includes("no budget");
  const claimsPaidGrowth =
    combined.includes("hire an agency") ||
    combined.includes("facebook ads") ||
    combined.includes("google ads") ||
    combined.includes("run paid ads") ||
    combined.includes("influencer sponsorship") ||
    combined.includes("hire developers") ||
    combined.includes("hire a team");
  const resolvedPaidGrowth =
    latest.includes("organic") ||
    latest.includes("no paid ads") ||
    latest.includes("free channels") ||
    latest.includes("community") ||
    latest.includes("content marketing") ||
    latest.includes("cold outreach") ||
    /\$[1-9][0-9]+/.test(latest);

  if (claimsZeroBudget && claimsPaidGrowth && !resolvedPaidGrowth) {
    return {
      contradiction: {
        type: "contradiction_detected",
        title: "Budget vs Acquisition Contradiction",
        description:
          "User indicated a $0/shoestring budget but proposed capital-intensive customer acquisition like paid ads or hiring external agencies.",
        recommendation:
          "Diplomatically surface the tension: propose organic, zero-cost launch playbooks (niche communities, founder-led content, cold outbound) instead of capital-heavy ads.",
        severity: "warning",
      },
    };
  }

  // Contradiction 2: Extremely limited time vs massive enterprise scope
  const claimsTinyTime =
    combined.includes("2 hours") ||
    combined.includes("couple hours") ||
    combined.includes("very little time") ||
    combined.includes("1 hour a day") ||
    combined.includes("30 minutes");
  const claimsMassiveScope =
    combined.includes("mmo") ||
    combined.includes("social network like facebook") ||
    combined.includes("social network like tiktok") ||
    combined.includes("full operating system") ||
    combined.includes("marketplace like amazon") ||
    combined.includes("custom neural network") ||
    combined.includes("streaming platform");
  const resolvedMassiveScope =
    latest.includes("mvp") ||
    latest.includes("phase 1") ||
    latest.includes("narrow") ||
    latest.includes("single feature") ||
    latest.includes("prototype");

  if (claimsTinyTime && claimsMassiveScope && !resolvedMassiveScope) {
    return {
      contradiction: {
        type: "contradiction_detected",
        title: "Time vs Complexity Contradiction",
        description:
          "User has only a couple hours per week but targets an enterprise/complex platform.",
        recommendation:
          "Recommend aggressive scope reduction: focus exclusively on an ultra-focused Phase 1 MVP or proof-of-concept.",
        severity: "warning",
      },
    };
  }

  // Contradiction 3: Non-technical but wants to build low-level systems
  const claimsNonTech =
    combined.includes("no coding") ||
    combined.includes("can't code") ||
    combined.includes("cant code") ||
    combined.includes("complete beginner") ||
    combined.includes("never programmed");
  const claimsLowLevel =
    combined.includes("build in c++") ||
    combined.includes("custom blockchain") ||
    combined.includes("write an engine") ||
    combined.includes("from scratch in assembly");
  const resolvedLowLevel =
    latest.includes("no-code") ||
    latest.includes("low-code") ||
    latest.includes("react") ||
    latest.includes("next.js") ||
    latest.includes("template") ||
    latest.includes("high-level");

  if (claimsNonTech && claimsLowLevel && !resolvedLowLevel) {
    return {
      contradiction: {
        type: "contradiction_detected",
        title: "Skill vs Architecture Mismatch",
        description:
          "User is a complete beginner but plans low-level systems engineering.",
        recommendation:
          "Guide toward modern AI-assisted no-code/low-code boilerplates or high-level frameworks.",
        severity: "warning",
      },
    };
  }

  // Contradiction 4: High-ticket pricing vs penniless audience
  const claimsBrokeAudience =
    combined.includes("broke students") ||
    combined.includes("unemployed teenagers") ||
    combined.includes("kids with no money");
  const claimsHighTicket =
    combined.includes("$1000") ||
    combined.includes("$2000") ||
    combined.includes("$500/month") ||
    combined.includes("high ticket");
  const resolvedHighTicket =
    latest.includes("freemium") ||
    latest.includes("free tier") ||
    latest.includes("b2b") ||
    latest.includes("enterprise") ||
    latest.includes("low cost") ||
    latest.includes("affordable");

  if (claimsBrokeAudience && claimsHighTicket && !resolvedHighTicket) {
    return {
      contradiction: {
        type: "contradiction_detected",
        title: "Pricing vs Audience Purchasing Power Mismatch",
        description:
          "User wants to charge premium high-ticket prices to an audience with little to no disposable income.",
        recommendation:
          "Surface the purchasing power gap: suggest either pivoting to institutional/parent buyers or adopting a low-cost freemium / micro-tier model.",
        severity: "warning",
      },
    };
  }

  // Contradiction 5: Universal "everyone" audience vs hyper-specialized product
  const claimsEveryone =
    combined.includes("for everyone") ||
    combined.includes("every single person");
  const claimsNicheProduct =
    combined.includes("valorant") ||
    combined.includes("dentist invoice") ||
    combined.includes("cpa tax calculator") ||
    combined.includes("real estate crm");
  const resolvedEveryone =
    !latest.includes("for everyone") &&
    !latest.includes("every single person") &&
    (latest.includes("specifically") ||
      latest.includes("only for") ||
      latest.includes("focused on"));

  if (claimsEveryone && claimsNicheProduct && !resolvedEveryone) {
    return {
      contradiction: {
        type: "contradiction_detected",
        title: "Audience Scope Contradiction",
        description:
          "User claims the product is for 'everyone' while building a tool specifically designed for a specialized vertical.",
        recommendation:
          "Help them embrace the niche: niche positioning drives 5x higher conversion than pretending to serve everyone.",
        severity: "warning",
      },
    };
  }

  // Contradiction 6: $0 Budget / Free Tier vs Features Exceeding Free-Tier Limits
  const claimsFreeOrZero =
    combined.includes("$0") ||
    combined.includes("zero budget") ||
    combined.includes("no budget") ||
    combined.includes("free tier") ||
    combined.includes("no money");
  const claimsExceedingFeatures =
    combined.includes("sms notifications") ||
    combined.includes("twilio") ||
    combined.includes("send text messages") ||
    combined.includes("fine tune gpt-4") ||
    combined.includes("dedicated gpu cluster") ||
    combined.includes("custom model training") ||
    combined.includes("heavy video transcoding") ||
    combined.includes("high volume transactional emails");
  const resolvedExceedingFeatures =
    latest.includes("email") ||
    latest.includes("webpush") ||
    latest.includes("resend") ||
    latest.includes("free alternative") ||
    latest.includes("without sms") ||
    latest.includes("no sms");

  if (
    claimsFreeOrZero &&
    claimsExceedingFeatures &&
    !resolvedExceedingFeatures
  ) {
    return {
      contradiction: {
        type: "contradiction_detected",
        title: "Free-Tier Limit vs Feature Complexity Contradiction",
        description:
          "User specified a $0 budget / free tier but requested services requiring paid billing activation (e.g. paid SMS gateways, dedicated GPUs, or high-volume email services).",
        recommendation:
          "Provide realistic zero-cost alternatives: email magic links or WebPush instead of paid SMS, client-side WebGPU / free Hugging Face API instead of dedicated GPU clusters, and verified free-tier email providers (Resend free tier).",
        severity: "warning",
      },
    };
  }

  // Contradiction 7: Unnecessarily Complex Technology Stack (Overengineering)
  const isSimpleOrMvp =
    combined.includes("portfolio") ||
    combined.includes("landing page") ||
    combined.includes("simple blog") ||
    combined.includes("mvp") ||
    combined.includes("prototype") ||
    combined.includes("simple website") ||
    combined.includes("first version");
  const claimsOverengineered =
    combined.includes("kubernetes") ||
    combined.includes("k8s") ||
    combined.includes("kafka") ||
    combined.includes("microservices architecture") ||
    combined.includes("distributed consensus") ||
    combined.includes("cassandra") ||
    combined.includes("graphql federation mesh");
  const resolvedOverengineered =
    latest.includes("monolith") ||
    latest.includes("supabase") ||
    latest.includes("sqlite") ||
    latest.includes("serverless") ||
    latest.includes("keep it simple") ||
    latest.includes("no kubernetes");

  if (isSimpleOrMvp && claimsOverengineered && !resolvedOverengineered) {
    return {
      contradiction: {
        type: "contradiction_detected",
        title: "Architecture Overengineering Mismatch",
        description:
          "User proposes enterprise distributed microservices, Kubernetes, or Kafka for an early-stage MVP or simple website.",
        recommendation:
          "Guide away from infrastructure overhead: propose a modern, lean unified stack (e.g. Next.js or Vite React + Serverless backend with Supabase / SQLite) to launch in days rather than managing cluster operations.",
        severity: "warning",
      },
    };
  }

  // Contradiction 8: Incompatible Deployment Runtime
  const claimsStaticOnly =
    combined.includes("github pages") || combined.includes("static html only");
  const claimsServerRuntime =
    combined.includes("sqlite database") ||
    combined.includes("express server") ||
    combined.includes("python backend") ||
    combined.includes("docker container");
  const resolvedStaticOnly =
    latest.includes("vercel") ||
    latest.includes("cloudflare") ||
    latest.includes("netlify") ||
    latest.includes("render") ||
    latest.includes("localstorage") ||
    latest.includes("indexeddb");

  if (claimsStaticOnly && claimsServerRuntime && !resolvedStaticOnly) {
    return {
      contradiction: {
        type: "contradiction_detected",
        title: "Deployment Target vs Runtime Incompatibility",
        description:
          "User intends to host a dynamic backend with persistent server storage on a static-only hosting platform (e.g. GitHub Pages).",
        recommendation:
          "Clarify runtime boundaries: recommend serverless full-stack hosting (Vercel, Cloudflare Pages/Workers, Render) or separating static client from cloud backend API.",
        severity: "warning",
      },
    };
  }

  return {};
}

/**
 * Detects unrealistic deadlines, viral expectations, or revenue targets
 */
export function detectUnrealisticExpectations(
  goal: string,
  allUserAnswers: string[],
): { unrealistic?: IntelligenceSignal } {
  const combined = [goal, ...allUserAnswers].join(" ").toLowerCase();

  // Revenue speed
  if (
    (combined.includes("10k") ||
      combined.includes("100k") ||
      combined.includes("50k")) &&
    (combined.includes("first week") ||
      combined.includes("in a few days") ||
      combined.includes("overnight") ||
      combined.includes("tomorrow"))
  ) {
    return {
      unrealistic: {
        type: "unrealistic_expectation",
        title: "Unrealistic Revenue Velocity",
        description:
          "Expecting tens of thousands of dollars within days/first week without established distribution.",
        recommendation:
          "Calibrate expectations constructively: validate the revenue ambition while focusing the first prompt on customer validation and first 5 paying users.",
        severity: "advisory",
      },
    };
  }

  // Rapid viral growth from scratch
  if (
    (combined.includes("1 million") ||
      combined.includes("100k subscribers") ||
      combined.includes("go viral immediately")) &&
    (combined.includes("first month") ||
      combined.includes("first week") ||
      combined.includes("day 1"))
  ) {
    return {
      unrealistic: {
        type: "unrealistic_expectation",
        title: "Immediate Viral Expectation",
        description:
          "Expecting instant viral explosion without existing audience or baseline catalog.",
        recommendation:
          "Ground the strategy in consistency: aim for high-retention storytelling, CTR benchmarks, and publishing the first 15 foundational videos.",
        severity: "advisory",
      },
    };
  }

  // Master all skills in days
  if (
    combined.includes("learn all of computer science in 3 days") ||
    combined.includes("master python in 2 days") ||
    combined.includes("fluent in 1 week") ||
    combined.includes("expert full stack in a weekend")
  ) {
    return {
      unrealistic: {
        type: "unrealistic_expectation",
        title: "Hyper-Compressed Learning Horizon",
        description: "Attempting to master an entire discipline in days.",
        recommendation:
          "Pivot to an 80/20 project-based sprint: focus on building one working application rather than memorizing theory.",
        severity: "advisory",
      },
    };
  }

  // 100% passive hands-off myth
  if (
    combined.includes("100% passive with zero work") ||
    combined.includes(
      "completely automated money while i sleep with no maintenance",
    )
  ) {
    return {
      unrealistic: {
        type: "unrealistic_expectation",
        title: "Pure Passive Income Illusion",
        description:
          "Expecting automated passive income from day 1 without upfront system building, marketing distribution, or customer support.",
        recommendation:
          "Ground in operational reality: every scalable asset requires an upfront build sprint before any automated leverage takes over.",
        severity: "advisory",
      },
    };
  }

  return {};
}

/**
 * Detects common industry blind spots / knowledge gaps
 */
export function detectKnowledgeGaps(
  goal: string,
  allUserAnswers: string[],
  expertId: ExpertId | null,
): { knowledgeGap?: IntelligenceSignal } {
  const combined = [goal, ...allUserAnswers].join(" ").toLowerCase();

  // E-commerce blind spot: Payment, shipping & logistics
  if (
    (combined.includes("sell physical products") ||
      combined.includes("store") ||
      combined.includes("ecommerce") ||
      combined.includes("e commerce")) &&
    !combined.includes("stripe") &&
    !combined.includes("shipping") &&
    !combined.includes("supplier")
  ) {
    return {
      knowledgeGap: {
        type: "knowledge_gap",
        title: "E-Commerce Fulfillment & Payment Blind Spot",
        description:
          "User is planning a store but hasn't accounted for payment gateways (processing fees, payout holds) or fulfillment logistics.",
        recommendation:
          "Weave in a quick consultant insight about payment processing and fulfillment logistics before asking the next question.",
        severity: "info",
      },
    };
  }

  // YouTube / Content blind spot: Thumbnails, Packaging & Hook Retention
  if (
    (expertId === "creator" ||
      combined.includes("youtube") ||
      combined.includes("tiktok")) &&
    allUserAnswers.length >= 2 &&
    !combined.includes("hook") &&
    !combined.includes("thumbnail") &&
    !combined.includes("ctr") &&
    !combined.includes("packaging")
  ) {
    return {
      knowledgeGap: {
        type: "knowledge_gap",
        title: "Viewer Retention & Packaging Blind Spot",
        description:
          "Creator is focused on topic ideas without considering packaging (titles/thumbnails) or hook retention (first 10 seconds).",
        recommendation:
          "Consultant should guide attention toward packaging and the first 10 seconds of viewer retention.",
        severity: "info",
      },
    };
  }

  // Website blind spot: Hosting/Deployment & Mobile Responsiveness
  if (
    (expertId === "website" ||
      combined.includes("website") ||
      combined.includes("app")) &&
    allUserAnswers.length >= 2 &&
    !combined.includes("mobile") &&
    !combined.includes("deploy") &&
    !combined.includes("hosting")
  ) {
    return {
      knowledgeGap: {
        type: "knowledge_gap",
        title: "Deployment & Mobile Usability Factor",
        description:
          "Project plan has not accounted for mobile viewport or launch deployment target.",
        recommendation:
          "Briefly factor in mobile-first considerations for the final master prompt.",
        severity: "info",
      },
    };
  }

  // Startup / Business blind spot: Churn / Retention vs Acquisition
  if (
    (expertId === "business" || combined.includes("saas")) &&
    allUserAnswers.length >= 2 &&
    !combined.includes("churn") &&
    !combined.includes("retention") &&
    !combined.includes("cac")
  ) {
    return {
      knowledgeGap: {
        type: "knowledge_gap",
        title: "Customer Retention & Unit Economics Blind Spot",
        description:
          "Startup founder is focused purely on getting users, without factoring in churn, retention loops, or acquisition costs.",
        recommendation:
          "Offer a concise consultant perspective on early retention before exploring feature depth.",
        severity: "info",
      },
    };
  }

  // Study blind spot: Tutorial Hell vs Active Project Building
  if (
    expertId === "study" &&
    allUserAnswers.length >= 2 &&
    !combined.includes("project") &&
    !combined.includes("build") &&
    !combined.includes("practice")
  ) {
    return {
      knowledgeGap: {
        type: "knowledge_gap",
        title: "Passive Study ('Tutorial Hell') Trap",
        description:
          "Learner plans to passively consume courses/videos rather than building real-world projects with active recall.",
        recommendation:
          "Coach them toward project-based milestones where each chapter yields a tangible artifact.",
        severity: "info",
      },
    };
  }

  // Free-Tier Limits & Quota Blind Spot
  if (
    (combined.includes("$0") || combined.includes("free tier")) &&
    allUserAnswers.length >= 2 &&
    !combined.includes("quota") &&
    !combined.includes("limit") &&
    !combined.includes("tier limit")
  ) {
    return {
      knowledgeGap: {
        type: "knowledge_gap",
        title: "Free-Tier Limits & Quota Blind Spot",
        description:
          "User is building on free-tier services without accounting for storage, bandwidth, or execution invocation quotas.",
        recommendation:
          "Highlight free-tier quotas (e.g. Supabase 500MB DB cap, Vercel bandwidth limits) and provide clean zero-cost fallbacks.",
        severity: "info",
      },
    };
  }

  // Third-Party API Secret Protection Blind Spot
  if (
    (combined.includes("api key") ||
      combined.includes("stripe") ||
      combined.includes("openai") ||
      combined.includes("secret")) &&
    allUserAnswers.length >= 2 &&
    !combined.includes("env") &&
    !combined.includes("server-side") &&
    !combined.includes("proxy")
  ) {
    return {
      knowledgeGap: {
        type: "knowledge_gap",
        title: "API Key Security & Client Secret Leakage Risk",
        description:
          "User plans third-party API integration without defining environment variable security or server-side secret protection.",
        recommendation:
          "Ensure the final prompt mandates server-side proxy routes and prohibits exposing private API keys in client-side bundles.",
        severity: "info",
      },
    };
  }

  return {};
}

/**
 * Builds task-adaptive candidate slots when a user's project falls outside the 4 standard
 * consultant categories (business, website, study, creator).
 */
export function buildTaskAdaptiveSlots(profile: ProjectProfile): Slot[] {
  const goalPreview = profile.primaryGoal?.value || "your project";
  return [
    {
      id: "audience",
      label: "Target Audience & Operating Context",
      priority: "critical",
      why: "Knowing who will use or experience this and their environment ensures the tone, depth, and assumptions fit your real-world context.",
      question: `To make sure the prompt is tailored to ${goalPreview.slice(0, 70)}, who is the intended audience or participant group, and what is their experience level or setting?`,
      examples: [
        "Experienced practitioners vs. first-time participants",
        "Solo execution vs. team/group environment",
        "Specific environment, tools, or operational setting",
      ],
    },
    {
      id: "deliverable_format",
      label: "Deliverable Structure & Output Format",
      priority: "critical",
      why: "Defining the exact sections and format upfront ensures the AI generates an immediately usable deliverable rather than a generic summary.",
      question:
        "What exact structure, sections, or format should the final output follow?",
      examples: [
        "Step-by-step protocol / runbook with verification checklists",
        "Modular sections with concrete templates, scripts, or tables",
        "Comprehensive blueprint with examples and edge-case handling",
      ],
    },
    {
      id: "constraints_scope",
      label: "Core Rules, Boundaries & Must-Have Elements",
      priority: "high",
      why: "Locking in hard constraints, must-have elements, and exclusions prevents the AI from drifting into irrelevant or impractical directions.",
      question:
        "What essential rules, constraints, or must-have elements need to be included (and is there anything that should be strictly excluded)?",
      examples: [
        "Time, length, or resource boundaries",
        "Mandatory mechanics, safety/compliance rules, or style guidelines",
        "Specific topics, clichés, or approaches to avoid",
      ],
    },
    {
      id: "success_criteria",
      label: "Success Criteria & Quality Bar",
      priority: "normal",
      why: "Clear success criteria give the AI an objective checklist to self-verify before completing the output.",
      question:
        "What specific outcome or quality bar will make this final deliverable a 10/10 for your needs?",
      examples: [
        "Ready to execute immediately with zero placeholder text",
        "Includes measurable checkpoints and fallback contingencies",
        "Covers both standard execution and tricky edge cases",
      ],
    },
  ];
}

const COMMERCIAL_OR_DOMAIN_SPECIFIC_SLOTS = new Set([
  "country",
  "model",
  "offer",
  "stage",
  "risk",
  "budget",
  "hosting",
  "tech_stack",
  "skills",
  "integrations",
  "cadence",
  "cta",
  "platform",
  "weakness",
]);

function countRichProfileFacets(
  profile: ProjectProfile,
  inferredFacts: InferredFact[],
): number {
  let count = 0;
  if (
    profile.primaryGoal &&
    profile.primaryGoal.value.split(/\s+/).filter(Boolean).length >= 4
  ) {
    count += 1;
  }
  if (
    profile.intendedAudience ||
    inferredFacts.some((f) => f.category === "audience")
  ) {
    count += 1;
  }
  if (
    profile.desiredDeliverable ||
    inferredFacts.some((f) => f.category === "scope" || f.category === "format")
  ) {
    count += 1;
  }
  if (profile.budget || inferredFacts.some((f) => f.category === "business")) {
    count += 1;
  }
  if (profile.timeline || profile.resources.some((r) => r.slotId === "time")) {
    count += 1;
  }
  if (profile.functionalRequirements.length > 0) {
    count += Math.min(2, profile.functionalRequirements.length);
  }
  if (profile.userPreferences.length > 0) {
    count += Math.min(2, profile.userPreferences.length);
  }
  if (profile.nonFunctionalRequirements.length > 0) {
    count += 1;
  }
  if (profile.explicitExclusions.length > 0) {
    count += 1;
  }
  if (profile.targetPlatforms.length > 0) {
    count += 1;
  }
  const extCount = Object.keys(profile.domainExtensions).filter(
    (k) => k !== "interview_control",
  ).length;
  if (extCount > 0) {
    count += Math.min(2, extCount);
  }
  return count;
}

/**
 * Evaluates every candidate follow-up question by information value:
 * - Importance of missing information to the outcome
 * - Impact of the answer on the final prompt
 * - Whether the answer is already present in the ProjectProfile
 * - Whether another question or captured requirement covers the same ground (overlap)
 * - Cost of asking the user another question
 */
export function evaluateCandidateQuestions(
  expert: Expert | null,
  profile: ProjectProfile,
  inferredFacts: InferredFact[],
  confirmedFacts: Array<{ label: string; value: string; slotId?: string }>,
  lastUserText = "",
): QuestionValueEstimate[] {
  const isUnfamiliar = isUnfamiliarTaskDomain(profile);
  const baseSlots: Slot[] = [];
  const seenIds = new Set<string>();

  // If unfamiliar task domain, prioritize universal task-adaptive slots first
  if (isUnfamiliar) {
    for (const s of buildTaskAdaptiveSlots(profile)) {
      const norm = normalizeSlotId(s.id);
      seenIds.add(norm);
      baseSlots.push(s);
    }
  }

  if (expert?.slots) {
    for (const s of expert.slots) {
      const norm = normalizeSlotId(s.id);
      if (!seenIds.has(norm)) {
        seenIds.add(norm);
        baseSlots.push(s);
      }
    }
  }

  // Ensure any active unresolved contradiction has a matching slot candidate
  for (const c of profile.contradictions) {
    if (c.status !== "unresolved") continue;
    const normField = normalizeSlotId(c.field);
    if (!seenIds.has(normField)) {
      seenIds.add(normField);
      baseSlots.unshift({
        id: normField,
        label: c.title,
        priority: "critical",
        why: c.description,
        question: `${c.description} ${c.recommendation}`,
        examples: [c.earlierEvidence.value, c.conflictingEvidence.value],
      });
    }
  }

  const confirmedSlotIds = new Set<string>();
  for (const f of confirmedFacts) {
    if (f.slotId) confirmedSlotIds.add(normalizeSlotId(f.slotId));
  }
  for (const f of profile.confirmedFacts) {
    if (f.slotId) confirmedSlotIds.add(normalizeSlotId(f.slotId));
    confirmedSlotIds.add(normalizeSlotId(f.id));
  }

  const hasExplicitSlotCoverage = (normSlot: string): boolean => {
    if (confirmedSlotIds.has(normSlot)) return true;
    if (
      (normSlot === "audience" || normSlot === "target_audience") &&
      profile.intendedAudience?.origin === "explicit"
    ) {
      return true;
    }
    if (
      (normSlot === "purpose" ||
        normSlot === "type" ||
        normSlot === "format" ||
        normSlot === "deliverable_format" ||
        normSlot === "output") &&
      profile.desiredDeliverable?.origin === "explicit"
    ) {
      return true;
    }
    if (normSlot === "budget" && profile.budget?.origin === "explicit") {
      return true;
    }
    if (
      (normSlot === "timeline" || normSlot === "deadline") &&
      profile.timeline?.origin === "explicit"
    ) {
      return true;
    }
    if (
      profile.functionalRequirements.some(
        (fr) =>
          fr.origin === "explicit" && normalizeSlotId(fr.slotId) === normSlot,
      )
    ) {
      return true;
    }
    if (
      normSlot === "constraints_scope" &&
      (profile.functionalRequirements.length > 0 ||
        profile.constraints.length > 0 ||
        profile.explicitExclusions.length > 0)
    ) {
      return true;
    }
    if (
      profile.userPreferences.some(
        (p) =>
          p.origin === "explicit" && normalizeSlotId(p.slotId) === normSlot,
      )
    ) {
      return true;
    }
    if (
      profile.resources.some(
        (r) =>
          r.origin === "explicit" && normalizeSlotId(r.slotId) === normSlot,
      )
    ) {
      return true;
    }
    if (
      (normSlot === "success_criteria" || normSlot === "acceptance_criteria") &&
      profile.successCriteria.length > 0
    ) {
      return true;
    }
    const ext = profile.domainExtensions[normSlot];
    if (ext && ext.origin === "explicit") {
      return true;
    }
    return false;
  };

  const hasUserDeferredAssumption = (normSlot: string): boolean => {
    return profile.inferredAssumptions.some(
      (a) =>
        a.status === "active" &&
        a.origin === "assumed" &&
        (normalizeSlotId(a.slotId) === normSlot ||
          normalizeSlotId(a.id) === `assumed_slot_${normSlot}`) &&
        a.evidence.rationale &&
        (a.evidence.rationale.includes("delegated") ||
          a.evidence.rationale.includes("skipped") ||
          a.evidence.rationale.includes("uncertainty")),
    );
  };

  const getContradictionForSlot = (
    normSlot: string,
  ): ProfileContradiction | undefined => {
    return profile.contradictions.find((c) => {
      if (c.status !== "unresolved") return false;
      const cField = normalizeSlotId(c.field);
      if (cField === normSlot) return true;
      if (
        c.id === "contradiction_budget_vs_paid_growth" &&
        (normSlot === "budget" || normSlot === "model")
      ) {
        return true;
      }
      if (
        c.id === "contradiction_free_tier_vs_paid_infra" &&
        (normSlot === "integrations" || normSlot === "budget")
      ) {
        return true;
      }
      return false;
    });
  };

  const richFacetCount = countRichProfileFacets(profile, inferredFacts);
  const userDeferralCount = profile.inferredAssumptions.filter(
    (a) =>
      a.status === "active" &&
      a.origin === "assumed" &&
      a.id.startsWith("assumed_slot_"),
  ).length;
  const forceGenerateNow =
    Boolean(profile.domainExtensions["interview_control"]) ||
    isGenerateNowRequest(lastUserText);

  const hasCoreFourPillars =
    Boolean(profile.primaryGoal) &&
    Boolean(
      profile.intendedAudience ||
      inferredFacts.some((f) => f.category === "audience"),
    ) &&
    Boolean(
      profile.desiredDeliverable ||
      profile.functionalRequirements.length > 0 ||
      inferredFacts.some((f) => f.category === "scope"),
    ) &&
    Boolean(
      profile.budget ||
      profile.userPreferences.length > 0 ||
      profile.timeline ||
      Object.keys(profile.domainExtensions).length > 0,
    );

  const estimates: QuestionValueEstimate[] = [];

  for (const slot of baseSlots) {
    const normSlot = normalizeSlotId(slot.id);
    const activeContradiction = getContradictionForSlot(normSlot);
    const isVagueSlot = profile.unresolvedQuestions.some(
      (q) =>
        normalizeSlotId(q.slotId) === normSlot && q.reason === "vague_answer",
    );

    let coverageStatus: QuestionCoverageStatus = "missing";
    let alreadyPresent = false;

    if (activeContradiction) {
      coverageStatus = "contradictory";
      alreadyPresent = false;
    } else if (
      isUnfamiliar &&
      COMMERCIAL_OR_DOMAIN_SPECIFIC_SLOTS.has(normSlot)
    ) {
      coverageStatus = "domain_irrelevant";
      alreadyPresent = false;
    } else if (hasUserDeferredAssumption(normSlot)) {
      coverageStatus = "assumed_by_user";
      alreadyPresent = true;
    } else if (hasExplicitSlotCoverage(normSlot)) {
      coverageStatus = "confirmed";
      alreadyPresent = true;
    } else if (isVagueSlot) {
      coverageStatus = "vague";
      alreadyPresent = false;
    } else {
      const matchingInf = inferredFacts.find((inf) =>
        factMatchesSlot(inf, normSlot),
      );
      const matchingProfileInf = profile.inferredAssumptions.find(
        (a) =>
          a.status === "active" &&
          a.origin === "inferred" &&
          (normalizeSlotId(a.slotId) === normSlot ||
            factMatchesSlot(
              {
                id: a.id,
                label: a.label,
                value: a.value,
                confidence: a.confidence === "high" ? "high" : "medium",
                rationale: a.evidence.rationale || "",
                category: "technical",
              },
              normSlot,
            )),
      );
      if (
        matchingInf?.confidence === "high" ||
        matchingProfileInf?.confidence === "high"
      ) {
        coverageStatus = "inferred_high";
        alreadyPresent = true;
      } else if (matchingInf || matchingProfileInf) {
        coverageStatus = "inferred_medium";
        alreadyPresent = false;
      }
    }

    // 1. Estimate importance (0..10)
    let importance = 5.5;
    if (coverageStatus === "contradictory") {
      importance = 10.0;
    } else if (coverageStatus === "domain_irrelevant") {
      importance = 0.5;
    } else if (
      normSlot === "purpose" ||
      normSlot === "goal" ||
      normSlot === "deliverable_format" ||
      normSlot === "audience" ||
      normSlot === "target_audience" ||
      normSlot === "features" ||
      normSlot === "constraints_scope"
    ) {
      importance = 9.2;
    } else if (
      normSlot === "budget" ||
      normSlot === "tech_stack" ||
      normSlot === "model" ||
      normSlot === "offer" ||
      normSlot === "level" ||
      normSlot === "platform" ||
      normSlot === "niche" ||
      normSlot === "format" ||
      normSlot === "output"
    ) {
      importance = 7.8;
    } else if (
      normSlot === "design" ||
      normSlot === "risk" ||
      normSlot === "stage" ||
      normSlot === "cadence" ||
      normSlot === "cta" ||
      normSlot === "weakness" ||
      normSlot === "resources"
    ) {
      importance = 3.0;
    } else if (slot.priority === "critical") {
      importance = 8.8;
    } else if (slot.priority === "high") {
      importance = 7.2;
    }

    // 2. Estimate prompt impact (0..10)
    let promptImpact = 5.2;
    if (coverageStatus === "contradictory") {
      promptImpact = 9.8;
    } else if (coverageStatus === "domain_irrelevant") {
      promptImpact = 0.5;
    } else if (coverageStatus === "vague") {
      promptImpact = 8.8;
    } else if (importance >= 9.0) {
      promptImpact = 9.0;
    } else if (importance >= 7.5) {
      promptImpact = 7.5;
    } else if (importance <= 3.5) {
      promptImpact = 2.8;
    }

    // 3. Estimate overlap penalty (0..10)
    let overlapPenalty = 0;
    if (normSlot === "skills" || normSlot === "experience") {
      if (hasExplicitSlotCoverage("tech_stack")) {
        overlapPenalty = 8.0;
      } else {
        overlapPenalty = 3.2;
      }
    } else if (
      normSlot === "purpose" &&
      (profile.desiredDeliverable ||
        inferredFacts.some((f) => f.id === "site_type"))
    ) {
      overlapPenalty = 7.5;
    } else if (
      normSlot === "time" &&
      (hasExplicitSlotCoverage("timeline") ||
        hasExplicitSlotCoverage("deadline"))
    ) {
      overlapPenalty = 4.5;
    } else if (
      (normSlot === "timeline" || normSlot === "deadline") &&
      hasExplicitSlotCoverage("time")
    ) {
      overlapPenalty = 4.5;
    } else if (
      normSlot === "offer" &&
      (hasExplicitSlotCoverage("model") || Boolean(profile.desiredDeliverable))
    ) {
      overlapPenalty = 5.0;
    }

    // 4. Estimate question cost (0..10)
    let questionCost =
      2.0 + confirmedFacts.length * 1.1 + userDeferralCount * 1.4;
    if (richFacetCount >= 6 && hasCoreFourPillars) {
      questionCost += 6.2;
    } else if (richFacetCount >= 5 && hasCoreFourPillars) {
      questionCost += 4.5;
    } else if (richFacetCount >= 4) {
      questionCost += 1.6;
    }
    if (forceGenerateNow) {
      questionCost = 10.0;
    } else if (coverageStatus === "contradictory") {
      questionCost = 1.0;
    }
    questionCost = Math.min(10.0, Number(questionCost.toFixed(2)));

    // 5. Compute expected net information value
    let expectedNetValue = -10.0;
    if (!alreadyPresent && coverageStatus !== "domain_irrelevant") {
      const rawValue = importance * 0.55 + promptImpact * 0.45;
      const mediumDiscount = coverageStatus === "inferred_medium" ? 3.0 : 0;
      expectedNetValue = Number(
        (rawValue - mediumDiscount - overlapPenalty - questionCost).toFixed(2),
      );
    }

    const whyItMatters = activeContradiction
      ? `${activeContradiction.description} Resolving this tension ensures your final prompt doesn't recommend tools or channels that violate your constraints.`
      : slot.why;

    let selectionRationale = "High-impact missing requirement";
    if (coverageStatus === "contradictory") {
      selectionRationale = `Resolves active conflict: ${activeContradiction?.title}`;
    } else if (coverageStatus === "vague") {
      selectionRationale = "Clarifies earlier broad or ambiguous answer";
    } else if (coverageStatus === "confirmed") {
      selectionRationale = "Suppressed: already explicitly provided in profile";
    } else if (coverageStatus === "inferred_high") {
      selectionRationale = "Suppressed: already inferred with high confidence";
    } else if (coverageStatus === "assumed_by_user") {
      selectionRationale =
        "Suppressed: user delegated or skipped this choice (covered by labeled assumption)";
    } else if (coverageStatus === "domain_irrelevant") {
      selectionRationale =
        "Suppressed: consultant slot is not relevant to this task domain";
    } else if (expectedNetValue <= 1.5) {
      selectionRationale =
        "Low marginal value compared to the cost of asking another question";
    }

    estimates.push({
      slot: activeContradiction
        ? {
            ...slot,
            question: `${activeContradiction.description} ${activeContradiction.recommendation}`,
            why: whyItMatters,
          }
        : slot,
      slotId: normSlot,
      importance,
      promptImpact,
      alreadyPresent,
      coverageStatus,
      overlapPenalty,
      questionCost,
      expectedNetValue,
      whyItMatters,
      selectionRationale,
    });
  }

  return estimates.sort((a, b) => b.expectedNetValue - a.expectedNetValue);
}

/**
 * Evaluates the interview stopping policy based on candidate question value,
 * active contradictions, explicit assumptions, and user intent.
 */
export function evaluateStoppingPolicy(
  profile: ProjectProfile,
  candidateQuestions: QuestionValueEstimate[],
  lastUserText = "",
): StoppingPolicyDecision {
  const unresolvedConflicts = profile.contradictions.filter(
    (c) => c.status === "unresolved",
  );
  const unresolvedConflictsToDisclose = unresolvedConflicts.map(
    (c) => `${c.title}: ${c.description} (Recommendation: ${c.recommendation})`,
  );

  const collectAssumptions = (prof: ProjectProfile): string[] =>
    prof.inferredAssumptions
      .filter((a) => a.status === "active" && a.origin === "assumed")
      .map((a) => `${a.label.replace(/\s*\(Assumed\)$/i, "")}: ${a.value}`);

  const forceGenerateNow =
    Boolean(profile.domainExtensions["interview_control"]) ||
    isGenerateNowRequest(lastUserText);

  // 1. User explicitly asked to skip the interview or generate the prompt now
  if (forceGenerateNow) {
    const hydratedProfile = ensureAssumptionsForMissingCoreFields(profile);
    const assumptionsToDisclose = collectAssumptions(hydratedProfile);
    return {
      outcome:
        assumptionsToDisclose.length > 0 ||
        unresolvedConflictsToDisclose.length > 0
          ? "proceed_with_assumptions"
          : "generate_final_prompt",
      shouldStop: true,
      reason:
        unresolvedConflictsToDisclose.length > 0
          ? "User requested immediate prompt generation; proceeding with explicit conflict disclosure and assumptions."
          : "User requested to skip remaining questions; proceeding with labeled assumptions.",
      selectedQuestion: null,
      assumptionsToDisclose,
      unresolvedConflictsToDisclose,
    };
  }

  // 2. Unresolved contradiction must be resolved before final generation unless user skipped
  const contradictionCandidate = candidateQuestions.find(
    (q) => q.coverageStatus === "contradictory",
  );
  if (contradictionCandidate) {
    return {
      outcome: "ask_clarification",
      shouldStop: false,
      reason: `Active contradiction requires clarification: ${contradictionCandidate.selectionRationale}`,
      selectedQuestion: contradictionCandidate,
      assumptionsToDisclose: collectAssumptions(profile),
      unresolvedConflictsToDisclose,
    };
  }

  // 3. Compare top candidate's expected net value against stopping threshold
  const bestCandidate = candidateQuestions[0] ?? null;
  if (!bestCandidate || bestCandidate.expectedNetValue <= 1.5) {
    const userDeferredAssumptions = profile.inferredAssumptions.filter(
      (a) =>
        a.status === "active" &&
        a.origin === "assumed" &&
        a.id.startsWith("assumed_slot_"),
    );
    const assumptionsToDisclose = collectAssumptions(profile);
    const hasMaterialAssumptions =
      userDeferredAssumptions.length > 0 ||
      (!profile.budget &&
        !isUnfamiliarTaskDomain(profile) &&
        assumptionsToDisclose.length > 0 &&
        profile.confirmedFacts.length < 4);

    return {
      outcome: hasMaterialAssumptions
        ? "proceed_with_assumptions"
        : "generate_final_prompt",
      shouldStop: true,
      reason: hasMaterialAssumptions
        ? "Expected value of further questions is low; proceeding with explicitly identified assumptions."
        : "Project profile has sufficient high-value context; ready to generate final prompts.",
      selectedQuestion: null,
      assumptionsToDisclose,
      unresolvedConflictsToDisclose,
    };
  }

  return {
    outcome: "ask_clarification",
    shouldStop: false,
    reason: bestCandidate.selectionRationale,
    selectedQuestion: bestCandidate,
    assumptionsToDisclose: collectAssumptions(profile),
    unresolvedConflictsToDisclose,
  };
}

/**
 * Master analysis function run by the Interview Intelligence Engine on every turn
 */
export function analyzeInterview(
  messages: UIMessage[],
  expertId: ExpertId | null,
  existingProfile?: ProjectProfile | null,
): IntelligenceAnalysis {
  const userMessages = messages.filter((m) => m.role === "user");
  const assistantMessages = messages.filter((m) => m.role === "assistant");
  const userTexts = userMessages.map((m) => messageText(m).trim());
  const goal = userTexts[0] ?? "";
  const lastUserText = userTexts[userTexts.length - 1] ?? "";

  const expert = expertId ? EXPERTS[expertId] : null;
  let projectProfile = buildProjectProfileFromMessages(
    messages,
    expertId,
    existingProfile,
  );
  const inferredFacts = inferInformation(goal, userTexts.slice(1), expertId);

  // Derive which questions were already asked and answered
  const confirmedFacts: Array<{
    label: string;
    value: string;
    slotId?: string;
  }> = [];

  for (let i = 0; i < assistantMessages.length; i++) {
    const ast = assistantMessages[i];
    const astText = messageText(ast);
    const tagMatch = SLOT_TAG_RE.exec(astText);
    const astIdx = messages.indexOf(ast);
    const nextUser = messages.slice(astIdx + 1).find((m) => m.role === "user");

    if (tagMatch && nextUser) {
      const userAns = messageText(nextUser).trim();
      // Clarification requests, vague non-answers, and user delegations/skips do not count as confirmed facts
      if (
        !userAns ||
        isClarificationOrMetaRequest(userAns) ||
        detectVagueness(userAns).isVague ||
        isUserDelegation(userAns) ||
        isSkipQuestionRequest(userAns) ||
        isGenerateNowRequest(userAns)
      ) {
        continue;
      }
      const slotId = normalizeSlotId(tagMatch[1]);
      const slotDef = expert?.slots.find(
        (s) => normalizeSlotId(s.id) === slotId,
      );
      const profileSlotFact = projectProfile.confirmedFacts.find(
        (cf) => normalizeSlotId(cf.slotId || cf.id) === slotId,
      );
      const existingIdx = confirmedFacts.findIndex(
        (f) => normalizeSlotId(f.slotId) === slotId,
      );
      const factEntry = {
        slotId,
        label: slotDef?.label ?? profileSlotFact?.label ?? slotId,
        value: profileSlotFact?.value ?? userAns,
      };
      if (existingIdx >= 0) {
        confirmedFacts[existingIdx] = factEntry;
      } else {
        confirmedFacts.push(factEntry);
      }
    }
  }

  // Sync any inline corrections from projectProfile into confirmedFacts for slots already present
  for (const cf of confirmedFacts) {
    if (!cf.slotId) continue;
    const normSlot = normalizeSlotId(cf.slotId);
    if (
      (normSlot === "audience" || normSlot === "target_audience") &&
      projectProfile.intendedAudience?.origin === "explicit"
    ) {
      cf.value = projectProfile.intendedAudience.value;
    } else if (
      normSlot === "budget" &&
      projectProfile.budget?.origin === "explicit"
    ) {
      cf.value = projectProfile.budget.value;
    } else {
      const matchingProfFact = projectProfile.confirmedFacts.find(
        (pf) => normalizeSlotId(pf.slotId || pf.id) === normSlot,
      );
      if (matchingProfFact) {
        cf.value = matchingProfFact.value;
      }
    }
  }

  // Evaluate candidate questions and stopping policy
  const isUnfamiliarDomain = isUnfamiliarTaskDomain(projectProfile);
  const candidateQuestions = evaluateCandidateQuestions(
    expert,
    projectProfile,
    inferredFacts,
    confirmedFacts,
    lastUserText,
  );
  const stoppingPolicy = evaluateStoppingPolicy(
    projectProfile,
    candidateQuestions,
    lastUserText,
  );

  if (
    stoppingPolicy.shouldStop &&
    stoppingPolicy.outcome === "proceed_with_assumptions" &&
    (Boolean(projectProfile.domainExtensions["interview_control"]) ||
      isGenerateNowRequest(lastUserText))
  ) {
    projectProfile = ensureAssumptionsForMissingCoreFields(projectProfile);
  }

  // Identify unnecessary topics that should NEVER be asked because they are already present or irrelevant
  const unnecessaryTopics: string[] = [];
  for (const fact of inferredFacts) {
    if (fact.category === "technical") {
      unnecessaryTopics.push(
        "coding skills / technical background (already inferred)",
      );
    } else if (fact.category === "audience") {
      unnecessaryTopics.push("target audience (already inferred)");
    } else if (fact.category === "scope") {
      unnecessaryTopics.push("project format / type (already inferred)");
    } else if (fact.category === "business") {
      unnecessaryTopics.push("budget constraint (already inferred)");
    } else if (fact.category === "format") {
      unnecessaryTopics.push("production format / style (already inferred)");
    }
  }
  for (const q of candidateQuestions) {
    if (
      q.coverageStatus === "confirmed" ||
      q.coverageStatus === "assumed_by_user" ||
      q.coverageStatus === "domain_irrelevant"
    ) {
      const topicMsg = `${q.slot.label} (${q.selectionRationale})`;
      if (!unnecessaryTopics.includes(topicMsg)) {
        unnecessaryTopics.push(topicMsg);
      }
    }
  }

  // Run intelligence detectors
  const activeSignals: IntelligenceSignal[] = [];

  if (lastUserText && userTexts.length > 1) {
    const vagueness = detectVagueness(lastUserText);
    if (
      vagueness.isVague &&
      !isUserDelegation(lastUserText) &&
      !isSkipQuestionRequest(lastUserText) &&
      !isGenerateNowRequest(lastUserText)
    ) {
      activeSignals.push({
        type: "vagueness_detected",
        title: "Vague Answer Refinement",
        description: vagueness.feedback ?? "Latest answer lacks specificity.",
        recommendation: `Provide 2-3 concrete options such as: ${vagueness.concreteAnchors?.join(", ") ?? "practical alternatives"}.`,
        severity: "advisory",
      });
    }
  }

  const contradictionCheck = detectContradictions(userTexts);
  if (contradictionCheck.contradiction) {
    activeSignals.push(contradictionCheck.contradiction);
  }

  const unrealisticCheck = detectUnrealisticExpectations(goal, userTexts);
  if (unrealisticCheck.unrealistic) {
    activeSignals.push(unrealisticCheck.unrealistic);
  }

  const gapCheck = detectKnowledgeGaps(goal, userTexts, expertId);
  if (gapCheck.knowledgeGap) {
    activeSignals.push(gapCheck.knowledgeGap);
  }

  // Sync any unresolved profile contradictions into activeSignals if not already present
  for (const c of projectProfile.contradictions) {
    if (
      c.status === "unresolved" &&
      !activeSignals.some((s) => s.type === "contradiction_detected")
    ) {
      activeSignals.push({
        type: "contradiction_detected",
        title: c.title,
        description: c.description,
        recommendation: c.recommendation,
        severity: "warning",
      });
    }
  }

  // Calculate readiness score grounded in profile richness + stopping policy
  const richFacets = countRichProfileFacets(projectProfile, inferredFacts);
  const confirmedScore = Math.min(
    45,
    Math.max(confirmedFacts.length, projectProfile.confirmedFacts.length) * 10,
  );
  const inferredScore = Math.min(25, inferredFacts.length * 10);
  const richnessScore = Math.min(30, richFacets * 5);

  const rawReadiness = stoppingPolicy.shouldStop
    ? Math.max(85, confirmedScore + inferredScore + richnessScore)
    : Math.min(
        78,
        confirmedScore + inferredScore + Math.round(richnessScore * 0.5),
      );
  const readinessScore = Math.min(100, Math.max(10, rawReadiness));

  const isReadyForMasterPrompt = stoppingPolicy.shouldStop;

  // Determine prioritized strategic focus based on highest-value selected question or synthesis state
  let strategicFocus = "1. Clarifying Primary Goal & Target Audience";
  if (stoppingPolicy.shouldStop) {
    strategicFocus =
      stoppingPolicy.outcome === "proceed_with_assumptions"
        ? "Synthesizing Master Prompts with Explicit Assumptions"
        : "Finalizing Multi-Platform Master Prompts & Acceptance Criteria";
  } else if (stoppingPolicy.selectedQuestion) {
    strategicFocus = `Focusing on ${stoppingPolicy.selectedQuestion.slot.label}: ${stoppingPolicy.selectedQuestion.whyItMatters}`;
  }

  return {
    goal: projectProfile.primaryGoal?.value || goal,
    expertId,
    domain: isUnfamiliarDomain
      ? "Adaptive Task Advisory"
      : (expert?.name ?? "General Strategic Advisory"),
    inferredFacts,
    confirmedFacts,
    activeSignals,
    strategicFocus,
    unnecessaryTopics,
    readinessScore,
    isReadyForMasterPrompt,
    questionNumber: confirmedFacts.length,
    projectProfile,
    isUnfamiliarDomain,
    candidateQuestions,
    stoppingPolicy,
  };
}

/**
 * Selects the highest-value next interview slot using information-value estimation
 * over the shared ProjectProfile.
 */
export function selectNextInterviewSlot(
  expert: Expert,
  analysis: IntelligenceAnalysis,
): Slot {
  if (analysis.stoppingPolicy?.selectedQuestion) {
    return analysis.stoppingPolicy.selectedQuestion.slot;
  }

  const candidates =
    analysis.candidateQuestions ??
    evaluateCandidateQuestions(
      expert,
      analysis.projectProfile,
      analysis.inferredFacts,
      analysis.confirmedFacts,
    );

  const topPositive = candidates.find((c) => c.expectedNetValue > -10);
  if (topPositive) {
    return topPositive.slot;
  }

  if (candidates.length > 0) {
    return candidates[0].slot;
  }

  return (
    expert.slots[
      Math.min(analysis.questionNumber || 0, expert.slots.length - 1)
    ] || expert.slots[0]
  );
}

export function factMatchesSlot(fact: InferredFact, slotId: string): boolean {
  const f = normalizeSlotId(fact.id);
  const s = normalizeSlotId(slotId);
  if (s === f) return true;
  if (s === "skills" || s === "experience" || s === "tech_stack")
    return (
      f.includes("skills") || f.includes("technical") || f.includes("tech")
    );
  if (s === "audience" || s === "target_audience")
    return f.includes("audience");
  if (s === "budget") return f.includes("budget");
  if (s === "purpose" || s === "type")
    return f.includes("site_type") || f.includes("scope");
  if (s === "niche" || s === "format") return f.includes("format");
  if (s === "hosting") return f.includes("hosting");
  if (s === "integrations") return f.includes("integrations");
  if (s === "timeline") return f.includes("timeline");
  return false;
}

/**
 * Builds the runtime prompt injected into the model, guiding the AI to behave like
 * an experienced consultant with the Interview Intelligence Engine active.
 */
export function buildAdaptiveConsultantPrompt(
  expert: Expert,
  analysis: IntelligenceAnalysis,
): string {
  const inferredList =
    analysis.inferredFacts.length > 0
      ? analysis.inferredFacts
          .map(
            (f) =>
              `  • [INFERRED] ${f.label}: "${f.value}" (Rationale: ${f.rationale})`,
          )
          .join("\n")
      : "  • (None yet deduced — actively look for clues in the user's answers)";

  const confirmedList =
    analysis.confirmedFacts.length > 0
      ? analysis.confirmedFacts
          .map((f) => `  • [CONFIRMED] ${f.label}: "${f.value}"`)
          .join("\n")
      : "  • (No direct Q&A pairs recorded yet)";

  const unnecessaryList =
    analysis.unnecessaryTopics.length > 0
      ? analysis.unnecessaryTopics
          .map((t) => `  ❌ DO NOT ASK ABOUT: ${t}`)
          .join("\n")
      : "  (None explicitly forbidden — but always avoid asking the obvious)";

  const signalsSection =
    analysis.activeSignals.length > 0
      ? analysis.activeSignals
          .map(
            (s) =>
              `  ⚠️ [INTELLIGENCE ALERT: ${s.title.toUpperCase()}]\n     Problem: ${s.description}\n     Consultant Strategy: ${s.recommendation}`,
          )
          .join("\n\n")
      : "  ✓ No contradictions or severe vagueness currently detected. Maintain crisp momentum.";

  const nextSlot = selectNextInterviewSlot(expert, analysis);
  const policyOutcome = analysis.stoppingPolicy?.outcome ?? "ask_clarification";
  const assumptionsSection =
    analysis.stoppingPolicy &&
    analysis.stoppingPolicy.assumptionsToDisclose.length > 0
      ? `\n## EXPLICIT ASSUMPTIONS TO DISCLOSE:\n${analysis.stoppingPolicy.assumptionsToDisclose.map((a) => `  • ${a}`).join("\n")}`
      : "";
  const conflictsSection =
    analysis.stoppingPolicy &&
    analysis.stoppingPolicy.unresolvedConflictsToDisclose.length > 0
      ? `\n## UNRESOLVED CONFLICTS TO DISCLOSE:\n${analysis.stoppingPolicy.unresolvedConflictsToDisclose.map((c) => `  • ${c}`).join("\n")}`
      : "";

  return `

# ====================================================================
# INTERVIEW INTELLIGENCE ENGINE (REAL-TIME ADAPTIVE CONSULTANT)
# ====================================================================

You are Prompt Master's Adaptive Interview Intelligence Engine.
You behave like an experienced, top-tier strategic consultant — NEVER like a form, questionnaire, or interrogation script.

LOCKED USER GOAL: "${analysis.goal || "(infer from first user message)"}"
SPECIALTY DOMAIN: ${analysis.domain || expert.name}
CURRENT STRATEGIC FOCUS: ${analysis.strategicFocus}
STOPPING POLICY DECISION: ${policyOutcome.toUpperCase()} (${analysis.stoppingPolicy?.reason ?? "Continue adaptive discovery"})
RECOMMENDED NEXT QUESTION TOPIC: ${nextSlot.label} — "${nextSlot.question}" (Why it matters: ${nextSlot.why})

## 1. MANDATORY INTERVIEW DIRECTIVES:
• **SELECT QUESTIONS BY INFORMATION VALUE**: Ask only about missing information that materially changes the final prompt. Never follow a rigid script.
• **EXPLAIN WHY A QUESTION MATTERS**: Briefly explain in plain, friendly language why your question matters for their specific project. Never expose internal scoring numbers or technical jargon.
• **AVOID UNNECESSARY QUESTIONS**: Never ask for information already supplied in the profile. If the user says "you decide" or "I don't know", apply a sensible assumption, label it clearly, and move forward without repeating the question.
• **DETECT & RESOLVE CONTRADICTIONS**: When you notice conflicting statements (e.g. $0 budget vs expensive paid ads, or wanting enterprise microservices for a simple blog), diplomatically surface the tension and help resolve it. If the user chooses to proceed without resolving a conflict, explicitly disclose the unresolved conflict.
• **DETECT VAGUE RESPONSES**: When answers are broad ("make money", "good", "standard", "everyone"), provide 2-4 concrete, real-world options to help them decide.
• **HANDLE CLARIFICATION REQUESTS GRACEFULLY**: If the user asks "Why am I being asked this?", asks what a technical term means, or requests clarification, explain the concept warmly in 1-2 plain-English sentences and re-frame the current question (Question ${analysis.questionNumber + 1}) with concrete options without skipping or double-incrementing.

## 2. INFORMATION ALREADY INFERRED BY INTELLIGENCE (DO NOT ASK REDUNDANT QUESTIONS!):
${inferredList}

## 3. INFORMATION CONFIRMED BY THE USER:
${confirmedList}

${formatProjectProfileForConsultant(analysis.projectProfile)}${assumptionsSection}${conflictsSection}

## 4. STRICT NEGATIVE CONSTRAINTS (UNNECESSARY TOPICS):
${unnecessaryList}
- Never ask a question whose answer is already obvious from the user's goal or earlier answers.
- Never ask two questions in the same message. Exactly ONE question per turn.
- If the user already demonstrated they know how to code, NEVER ask "What are your coding skills?".
- If the user already stated their target audience, NEVER ask "Who is your audience?".

## 5. ACTIVE CONSULTANT SIGNALS & HEURISTICS:
${signalsSection}

## 6. CRITICAL REQUIREMENTS FOR THE FINAL MASTER PROMPTS (WHEN TRIGGERED):
When generating final master prompts, you MUST strictly enforce:
A. CANONICAL SPECIFICATION & ANTI-FABRICATION DISCIPLINE:
   • Generate all 7 prompts from the single validated ProjectProfile above (primary objective, confirmed facts, constraints, explicit exclusions, target deliverable/format, acceptance criteria, active assumptions, and unresolved contradictions).
   • Do NOT invent unrequested requirements, features, or domain constraints to make the prompt look more complete. Keep inferred and assumed items explicitly labeled.
B. TASK-MATCHED STRUCTURE (DO NOT CROSS-POLLUTE DOMAINS):
   • Match the prompt structure to the actual task category (Software development & debugging, Research & fact-checking, Study & tutoring, Business planning, Creative work, Writing & editing, Data analysis, or General-purpose tasks).
   • Do NOT force a coding prompt to contain academic research citations, and do NOT force a writing, creative, study, or research prompt to contain software test commands (e.g. tsc --noEmit, Zod, .env.example) unless relevant to the user's task.
C. FEASIBILITY, VERIFICATION & HONEST PLATFORM STRATEGIES:
   • Explicitly respect stated budget and resource constraints (including $0 free-tier guardrails when applicable) and mark unverified external quotas, prices, or claims with [VERIFY: ...].
   • When modifying a codebase (software tasks / Cursor / Windsurf), specify how to preserve existing behavior, make minimal scoped changes, isolate secrets in server-side routes (.env.example), and report test execution honestly (never claim unexecuted tests passed).
   • When conducting research (research tasks / Perplexity), specify credible primary source standards, citation expectations, and strict separation of verified evidence from analytical inference.
   • Adapt genuinely to each platform (ChatGPT, Claude, Gemini, Perplexity, Grok, Cursor, Windsurf) based on documented capabilities—never claim that magic wording tricks activate hidden reasoning, and only include multimodal instructions for Gemini when the task involves media/multimodal inputs.

## 7. REQUIRED OUTPUT STRUCTURE:
1. Speak in a warm, razor-sharp, natural consultant voice (1-2 sentences acknowledging the last answer and explaining why the next question matters for their outcome).
2. Ask exactly ONE numbered question: "**Question ${analysis.questionNumber + 1}:** [Your dynamic question]"
3. On the very last line, include the hidden machine slot tag representing the facet you are exploring: \`<!--slot:${nextSlot.id}-->\`

When STOPPING POLICY DECISION is GENERATE_FINAL_PROMPT or PROCEED_WITH_ASSUMPTIONS, trigger the AI Optimization Engine immediately: disclose any explicit assumptions or unresolved conflicts, and generate the SEVEN model-specific master prompts (chatgpt, claude, gemini, perplexity, grok, cursor, windsurf) followed by the certificate. Never generate identical prompts across models.`;
}
