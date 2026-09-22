import type { UIMessage } from "ai";
import { EXPERTS, type Expert, type ExpertId, type Slot } from "./experts";
import { messageText } from "./threads";

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

  // 5. Budget Constraints
  if (
    clean.includes("$0") ||
    clean.includes("zero budget") ||
    clean.includes("no budget") ||
    clean.includes("free tools") ||
    clean.includes("bootstrapped") ||
    clean.includes("shoestring")
  ) {
    add({
      id: "budget_constraint",
      label: "Capital Constraints",
      value: "$0 Starting Budget / 100% Bootstrapped Free Tier",
      confidence: "high",
      rationale: "Detected clear zero-cost constraint",
      category: "business",
    });
  } else if (
    /\$?[0-9]+k?\s*(budget|dollars|usd)/.test(clean) ||
    clean.includes("10k") ||
    clean.includes("500") ||
    clean.includes("1000")
  ) {
    const match = clean.match(/(\$?[0-9]+k?)\s*(budget|dollars|usd)?/);
    if (match) {
      add({
        id: "budget_constraint",
        label: "Starting Budget",
        value: `Approx. ${match[1].toUpperCase()}`,
        confidence: "medium",
        rationale: "Extracted numeric budget figure from context",
        category: "business",
      });
    }
  }

  // 6. Timeline / Urgency
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
    t === "make money" ||
    t === "make money fast" ||
    t === "i want to make money" ||
    t === "make lots of money" ||
    t === "passive income" ||
    t === "build a good website" ||
    t === "a website for everyone" ||
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
    t === "grow fast" ||
    t === "get views" ||
    t === "learn coding" ||
    t.startsWith("make it look good") ||
    t.startsWith("standard website") ||
    t.startsWith("make money online");

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

  if (claimsZeroBudget && claimsPaidGrowth) {
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

  if (claimsTinyTime && claimsMassiveScope) {
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

  if (claimsNonTech && claimsLowLevel) {
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

  if (claimsBrokeAudience && claimsHighTicket) {
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

  if (claimsEveryone && claimsNicheProduct) {
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

  return {};
}

/**
 * Master analysis function run by the Interview Intelligence Engine on every turn
 */
export function analyzeInterview(
  messages: UIMessage[],
  expertId: ExpertId | null,
): IntelligenceAnalysis {
  const userMessages = messages.filter((m) => m.role === "user");
  const assistantMessages = messages.filter((m) => m.role === "assistant");
  const userTexts = userMessages.map((m) => messageText(m).trim());
  const goal = userTexts[0] ?? "";

  const expert = expertId ? EXPERTS[expertId] : null;
  const inferredFacts = inferInformation(goal, userTexts.slice(1), expertId);

  // Derive which questions were already asked and answered
  const confirmedFacts: Array<{
    label: string;
    value: string;
    slotId?: string;
  }> = [];
  const SLOT_TAG_RE = /<!--\s*slot\s*:\s*([a-z0-9_]+)\s*-->/i;

  for (let i = 0; i < assistantMessages.length; i++) {
    const ast = assistantMessages[i];
    const astText = messageText(ast);
    const tagMatch = SLOT_TAG_RE.exec(astText);
    const astIdx = messages.indexOf(ast);
    const nextUser = messages.slice(astIdx + 1).find((m) => m.role === "user");

    if (tagMatch && nextUser) {
      const slotId = tagMatch[1].toLowerCase();
      const slotDef = expert?.slots.find((s) => s.id === slotId);
      confirmedFacts.push({
        slotId,
        label: slotDef?.label ?? slotId,
        value: messageText(nextUser).trim(),
      });
    }
  }

  // Identify unnecessary topics that should NEVER be asked because they are already inferred
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

  // Run intelligence detectors
  const activeSignals: IntelligenceSignal[] = [];
  const lastUserText = userTexts[userTexts.length - 1] ?? "";

  if (lastUserText && userTexts.length > 1) {
    const vagueness = detectVagueness(lastUserText);
    if (vagueness.isVague) {
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

  // Calculate readiness score
  // Factors:
  // - Confirmed facts (up to 40 pts)
  // - Inferred facts (up to 30 pts)
  // - Critical questions resolved (up to 30 pts)
  const confirmedScore = Math.min(40, confirmedFacts.length * 10);
  const inferredScore = Math.min(30, inferredFacts.length * 10);
  const criticalSlots = expert?.criticalSlots ?? [];
  const criticalAnsweredCount = criticalSlots.filter(
    (id) =>
      confirmedFacts.some((f) => f.slotId === id) ||
      inferredFacts.some((f) => f.id.includes(id) || factMatchesSlot(f, id)),
  ).length;
  const criticalRatio =
    criticalSlots.length > 0 ? criticalAnsweredCount / criticalSlots.length : 1;
  const criticalScore = Math.round(criticalRatio * 30);

  const rawReadiness = confirmedScore + inferredScore + criticalScore;
  const readinessScore = Math.min(100, Math.max(10, rawReadiness));

  const isReadyForMasterPrompt =
    readinessScore >= 80 &&
    confirmedFacts.length + inferredFacts.length >= 4 &&
    criticalRatio >= 0.75;

  // Determine strategic focus
  let strategicFocus = "Discovering Core Objectives & Target Audience";
  if (inferredFacts.some((f) => f.category === "audience")) {
    strategicFocus = "Pinpointing Unfair Advantage & Key Differentiators";
  }
  if (confirmedFacts.length >= 2) {
    strategicFocus = "Validating Constraints, Feasibility & Tech Stack";
  }
  if (confirmedFacts.length >= 4 || readinessScore >= 70) {
    strategicFocus = "Fine-Tuning Output Architecture & Success Criteria";
  }

  return {
    goal,
    expertId,
    domain: expert?.name ?? "General Strategic Advisory",
    inferredFacts,
    confirmedFacts,
    activeSignals,
    strategicFocus,
    unnecessaryTopics,
    readinessScore,
    isReadyForMasterPrompt,
    questionNumber: userMessages.length,
  };
}

function factMatchesSlot(fact: InferredFact, slotId: string): boolean {
  const f = fact.id.toLowerCase();
  const s = slotId.toLowerCase();
  if (s === "skills" || s === "experience")
    return f.includes("skills") || f.includes("technical");
  if (s === "audience") return f.includes("audience");
  if (s === "budget") return f.includes("budget");
  if (s === "purpose" || s === "type")
    return f.includes("site_type") || f.includes("scope");
  if (s === "niche" || s === "format") return f.includes("format");
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

  return `

# ====================================================================
# INTERVIEW INTELLIGENCE ENGINE (REAL-TIME ADAPTIVE CONSULTANT)
# ====================================================================

You are Prompt Master's Adaptive Interview Intelligence Engine.
You behave like an experienced, top-tier strategic consultant — NEVER like a form, questionnaire, or interrogation script.

LOCKED USER GOAL: "${analysis.goal || "(infer from first user message)"}"
SPECIALTY DOMAIN: ${expert.name}
CURRENT STRATEGIC FOCUS: ${analysis.strategicFocus}
READINESS SCORE: ${analysis.readinessScore}% (Master Prompt Threshold: 80%+)

## 1. MANDATORY INTERVIEW DIRECTIVES:
• **NEVER USE FIXED QUESTIONS**: You must NEVER follow a pre-scripted list or sequence of questions. Every question must be dynamically generated on the fly.
• **INFER MISSING INFORMATION**: Deduce as much context as possible from their goal and previous messages. Treat inferred facts as established truth.
• **DYNAMIC FOLLOW-UP QUESTIONS**: Ask completely different questions depending on previous answers. Branch into whatever specifics, tools, constraints, or unique ideas the user introduces.
• **DETECT VAGUE RESPONSES**: When answers are broad ("make money", "good", "standard", "everyone"), do not reject them robotically. Provide 2-4 concrete, real-world anchors or options to help them decide.
• **DETECT CONTRADICTIONS**: When you notice conflicting statements (e.g., $0 budget vs paid ads), diplomatically surface the tension with curiosity and guide them toward alignment.
• **DETECT UNREALISTIC EXPECTATIONS**: When goals or timelines defy reality, validate their ambition while grounding the scope into an achievable Phase 1 MVP.
• **DETECT KNOWLEDGE GAPS**: If a user overlooks a critical industry blind spot, share a crisp 1-sentence consultant insight before framing your next question.
• **ASK CLARIFICATION QUESTIONS ONLY WHEN NECESSARY**: If an answer is clear enough to formulate a high-yield prompt, accept it and advance.
• **NEVER ASK UNNECESSARY QUESTIONS**: Do not ask about topics that are already known, inferred, or irrelevant to the master prompt.
• **OPTIMIZE FOR NATURAL CONVERSATION**: Speak in a warm, curious, and professional tone. Keep response quality exceptionally high.

## 2. INFORMATION ALREADY INFERRED BY INTELLIGENCE (DO NOT ASK REDUNDANT QUESTIONS!):
${inferredList}

## 3. INFORMATION CONFIRMED BY THE USER:
${confirmedList}

## 4. STRICT NEGATIVE CONSTRAINTS (UNNECESSARY TOPICS):
${unnecessaryList}
- Never ask a question whose answer is already obvious from the user's goal or earlier answers.
- Never ask two questions in the same message. Exactly ONE question per turn.
- If the user already demonstrated they know how to code, NEVER ask "What are your coding skills?".
- If the user already stated their target audience, NEVER ask "Who is your audience?".

## 5. ACTIVE CONSULTANT SIGNALS & HEURISTICS:
${signalsSection}

## 6. REQUIRED OUTPUT STRUCTURE:
1. Speak in a warm, razor-sharp, natural consultant voice (1-3 sentences acknowledging or contextualizing the last answer).
2. Ask exactly ONE numbered question: "**Question ${analysis.questionNumber + 1}:** [Your dynamic question]"
3. On the very last line, include the hidden machine slot tag representing the facet you are exploring: \`<!--slot:slot_id-->\`
   (Available slot IDs: ${expert.slots.map((s) => s.id).join(", ")})

When Readiness is 80%+ and you have sufficient domain depth, trigger the AI Optimization Engine: generate the SEVEN model-specific master prompts (chatgpt, claude, gemini, perplexity, grok, cursor, windsurf) and certificate as specified in your master instructions. Never generate identical prompts across models.`;
}
