/**
 * AI Optimization Engine
 *
 * Transforms a single validated ProjectProfile (Canonical Project Specification)
 * into 7 distinct, platform-native Master Prompts for:
 * - ChatGPT (OpenAI)
 * - Claude (Anthropic)
 * - Gemini (Google)
 * - Perplexity
 * - Grok (xAI)
 * - Cursor
 * - Windsurf (Codeium)
 *
 * Core Engineering Guarantees:
 * 1. Single Canonical Project Specification: Every platform prompt is synthesized from
 *    the same validated specification (objective, confirmed requirements, constraints,
 *    explicit exclusions, target deliverable/format, acceptance criteria, active
 *    assumptions, unresolved contradictions, and task-appropriate safety/privacy/accuracy rules).
 * 2. Anti-Fabrication Discipline: Never invents unrequested features, tech stacks, or
 *    domain requirements to make a prompt look fuller. Inferred and assumed items remain
 *    explicitly labeled.
 * 3. Task-Matched Structure: Adapts structure across 8 task categories
 *    (software_development, research_fact_checking, study_tutoring, business_planning,
 *    creative_work, writing_editing, data_analysis, general_purpose) so coding prompts
 *    are not forced to include academic research citations and writing/study/creative
 *    prompts are not polluted with software test suites or web-app boilerplate.
 * 4. Honest Platform Capabilities: Adapts to each platform's documented strengths and
 *    workflow without claiming that magic wording tricks activate hidden reasoning or
 *    assuming live web access when unavailable.
 */

import type { ProjectProfile } from "./project-understanding-engine";

export type ModelKey =
  | "chatgpt"
  | "claude"
  | "gemini"
  | "perplexity"
  | "grok"
  | "cursor"
  | "windsurf";

export type TaskCategory =
  | "software_development"
  | "research_fact_checking"
  | "study_tutoring"
  | "business_planning"
  | "creative_work"
  | "writing_editing"
  | "data_analysis"
  | "general_purpose";

export interface ModelOptimizationProfile {
  key: ModelKey;
  name: string;
  company: string;
  tagline: string;
  badgeColor: string;
  bestFor: string;
  whyItDiffers: string;
  PromptStrategy: string[];
  recommendations: {
    bestEngine: string;
    recommendedMode: string;
    temperature: string;
    keySetting: string;
    proTip: string;
  };
  strengths: string[];
}

export const MODEL_OPTIMIZATION_PROFILES: Record<
  ModelKey,
  ModelOptimizationProfile
> = {
  chatgpt: {
    key: "chatgpt",
    name: "ChatGPT",
    company: "OpenAI",
    tagline: "Structured Task & Iterative Execution",
    badgeColor: "#10a37f",
    bestFor:
      "Clear multi-section deliverables, structured synthesis, and iterative follow-up refinement",
    whyItDiffers:
      "ChatGPT performs well when given explicit section headings, clear scope boundaries, a concrete deliverable format, and a defined protocol for follow-up iterations.",
    PromptStrategy: [
      "Explicit Markdown hierarchy separating objective, confirmed context, constraints, deliverable structure, and acceptance criteria",
      "Clear scope and exclusion rules to prevent unrequested filler",
      "Actionable iteration protocol for refining sections or resolving open assumptions",
    ],
    recommendations: {
      bestEngine: "GPT-4o or o3-mini / o1 (for complex analysis or logic)",
      recommendedMode:
        "Standard Chat or Canvas Mode for iterative document/code editing",
      temperature: "0.3 for technical/analytical tasks, 0.7 for creative work",
      keySetting: "Use Canvas when iterating on sections or code blocks",
      proTip:
        "Review the Deliverable and Acceptance Criteria sections first, then use the Iteration Protocol to refine individual sections.",
    },
    strengths: [
      "Structured multi-section formatting",
      "Strong adherence to explicit output schemas and checklists",
      "Reliable iterative refinement across conversational turns",
    ],
  },
  claude: {
    key: "claude",
    name: "Claude",
    company: "Anthropic",
    tagline: "XML-Structured Context & Priority Hierarchy",
    badgeColor: "#d97757",
    bestFor:
      "Nuanced writing, complex multi-constraint reasoning, and long-context synthesis",
    whyItDiffers:
      "Claude responds reliably to XML-delimited context blocks (<context>, <priorities>, <deliverable>, <verification>) and explicit priority ordering when balancing competing constraints.",
    PromptStrategy: [
      "Semantic XML tags (<role>, <goal>, <context>, <priorities>, <technical_feasibility>, <verification>) to separate reference data from instructions",
      "Explicit priority ranking so confirmed user constraints override defaults",
      "Transparent separation of confirmed facts, active assumptions, and unresolved conflicts",
    ],
    recommendations: {
      bestEngine: "Claude 3.7 Sonnet or Claude 3.5 Sonnet",
      recommendedMode:
        "Artifacts enabled for standalone documents, visuals, or code modules",
      temperature: "0.2 - 0.5 depending on analytical vs editorial focus",
      keySetting:
        "Attach relevant reference files directly inside the conversation context when available",
      proTip:
        "Claude follows XML boundaries closely—keep confirmed facts inside <context> and output rules inside <deliverable>.",
    },
    strengths: [
      "Nuanced adherence to tone, style, and negative constraints",
      "Clear handling of long-context documents and XML-delimited inputs",
      "Balanced trade-off analysis when requirements conflict",
    ],
  },
  gemini: {
    key: "gemini",
    name: "Gemini",
    company: "Google",
    tagline: "Long-Context Synthesis & Task-Matched Workspace Execution",
    badgeColor: "#4285f4",
    bestFor:
      "Large context inputs, cross-document synthesis, structured tables, and multimodal tasks when media assets are involved",
    whyItDiffers:
      "Gemini handles large context windows and structured input-to-output mappings effectively, and supports multimodal inputs (images, PDFs, audio, video) when the task specifically involves them.",
    PromptStrategy: [
      "Clear separation of Task Objective, Confirmed Context Parameters, Constraints, and Verification Criteria",
      "Task-appropriate multimodal instructions included only when the project involves visual, audio, video, or document media",
      "Structured output tables and verification checklists grounded in provided context",
    ],
    recommendations: {
      bestEngine: "Gemini 2.5 Pro or Gemini 2.5 Flash",
      recommendedMode:
        "Google AI Studio or Gemini Advanced with relevant documents/files attached",
      temperature: "0.2 for analytical/technical tasks, 0.6 for creative tasks",
      keySetting:
        "Upload reference documents, datasets, or media assets directly when the task relies on external files",
      proTip:
        "When working with large documents or files, upload them before running the prompt so Gemini can ground its output in the primary material.",
    },
    strengths: [
      "High-capacity context window for large files and multi-document analysis",
      "Native multimodal understanding when images, PDFs, audio, or video are part of the task",
      "Clean structured tables and systematic constraint verification",
    ],
  },
  perplexity: {
    key: "perplexity",
    name: "Perplexity",
    company: "Perplexity AI",
    tagline: "Source-Grounded Research & Citation Verification",
    badgeColor: "#20b2aa",
    bestFor:
      "Evidence-backed research, fact-checking, official documentation verification, and cited comparisons",
    whyItDiffers:
      "Perplexity is built around retrieval and source verification. Its prompt structure centers on explicit research questions, source quality standards, inline citations, and separating verified evidence from analytical inference.",
    PromptStrategy: [
      "Formulates targeted research and verification questions derived from the project specification",
      "Mandates credible primary sources (official documentation, peer-reviewed studies, regulatory filings) with inline citations",
      "Enforces a strict boundary between verified empirical evidence and reasoned inference",
    ],
    recommendations: {
      bestEngine: "Perplexity Pro Search (Deep Research or Reasoning mode)",
      recommendedMode:
        "Pro Search enabled with appropriate Focus (Web / Academic)",
      temperature: "0.1 (Strict factual retrieval and citation grounding)",
      keySetting:
        "Enable Pro Search to verify claims across multiple independent sources",
      proTip:
        "Use Perplexity to verify external facts, pricing, regulatory rules, or official documentation, then feed verified findings into your implementation workflow.",
    },
    strengths: [
      "Live web retrieval with inline source citations",
      "Cross-checking claims, pricing, quotas, and official documentation",
      "Clear separation of cited facts from unverified assumptions",
    ],
  },
  grok: {
    key: "grok",
    name: "Grok",
    company: "xAI",
    tagline: "First-Principles Analysis & Constraint Stress-Testing",
    badgeColor: "#1d9bf0",
    bestFor:
      "Direct constraint auditing, risk analysis, assumption stress-testing, and concise execution plans",
    whyItDiffers:
      "Grok is structured around direct objectives, first-principles stress-testing of assumptions, and explicit evidence boundaries—without assuming live information access unless search is active.",
    PromptStrategy: [
      "Direct objective framing paired with first-principles bottleneck and risk auditing",
      "Explicit evidence boundary: does not assume live web/social data unless live search is available in the session",
      "Actionable tactical punch list with concrete verification criteria",
    ],
    recommendations: {
      bestEngine: "Grok 3 or Grok 3 Thinking",
      recommendedMode: "Think Mode for analytical or technical trade-offs",
      temperature: "0.3 (Direct analytical execution)",
      keySetting:
        "Only rely on current/live data if live search is explicitly enabled in your session",
      proTip:
        "Use Grok to challenge weak assumptions, identify failure modes early, and produce a no-filler action plan.",
    },
    strengths: [
      "Direct, low-verbosity critique of assumptions and bottlenecks",
      "Strong trade-off and failure-mode analysis",
      "Concise tactical execution checklists",
    ],
  },
  cursor: {
    key: "cursor",
    name: "Cursor",
    company: "Anysphere",
    tagline: "Repository-Aware Implementation & Scoped Diffs",
    badgeColor: "#6366f1",
    bestFor:
      "Repository-aware coding, debugging, minimal scoped file changes, and test verification",
    whyItDiffers:
      "Cursor operates directly inside a codebase. Its prompt specifies relevant files/modules, minimal non-destructive edits that preserve existing behavior, test execution, and honest test reporting.",
    PromptStrategy: [
      "Repository-aware instructions emphasizing reconnaissance of existing files before editing",
      "Minimal, scoped changes that preserve existing public interfaces and behavior",
      "Explicit testing requirements and honest reporting (never claiming unexecuted tests passed)",
    ],
    recommendations: {
      bestEngine: "Claude 3.7 Sonnet or GPT-4o inside Cursor Composer / Agent",
      recommendedMode: "Composer Agent Mode (Cmd+I / Ctrl+I)",
      temperature: "0.0 (Deterministic codebase editing)",
      keySetting:
        "Reference relevant files with @Files or @Codebase before applying edits",
      proTip:
        "Ask Cursor to inspect the affected files first, apply minimal scoped diffs, and report exact command outputs for any tests run.",
    },
    strengths: [
      "Multi-file repository context awareness",
      "Scoped diffs that preserve existing application architecture",
      "Integrated terminal test execution and verification",
    ],
  },
  windsurf: {
    key: "windsurf",
    name: "Windsurf",
    company: "Codeium",
    tagline: "Cascade Codebase Workflow & Staged Validation",
    badgeColor: "#06b6d4",
    bestFor:
      "Staged multi-step codebase workflows, dependency/impact checks, and verified completion reporting",
    whyItDiffers:
      "Windsurf's Cascade flow coordinates file inspection, scoped edits, and validation steps. Its prompt organizes work into Reconnaissance, Scoped Execution, and Validation with honest completion reporting.",
    PromptStrategy: [
      "Phased Cascade workflow: Phase 1 Reconnaissance, Phase 2 Scoped Execution, Phase 3 Validation & Completion Report",
      "Preservation of existing behavior and strict adherence to explicit exclusions",
      "Transparent validation reporting distinguishing verified checks from unexecuted steps",
    ],
    recommendations: {
      bestEngine: "Cascade Base / Claude 3.7 Sonnet in Windsurf",
      recommendedMode: "Cascade Write / Flow Mode",
      temperature: "0.0 (Deterministic step-by-step workflow)",
      keySetting:
        "Review Cascade's proposed file plan in Phase 1 before approving multi-file writes",
      proTip:
        "Let Cascade complete Phase 1 reconnaissance to confirm file paths and existing interfaces before executing Phase 2 changes.",
    },
    strengths: [
      "Structured multi-phase codebase navigation and impact analysis",
      "Coordinated edits across interdependent modules",
      "Clear completion reporting and verification tracking",
    ],
  },
};

export const ALL_MODELS: ModelOptimizationProfile[] = Object.values(
  MODEL_OPTIMIZATION_PROFILES,
);

export type MultiModelPrompts = Record<ModelKey, string>;

export interface OptimizationContext {
  goal?: string;
  expertDomain?: string;
  domain?: string;
  facts?: string[];
  budget?: string;
  userExperience?: string;
  projectProfile?: ProjectProfile;
}

export interface CanonicalProjectSpec {
  objective: string;
  taskCategory: TaskCategory;
  taskCategoryLabel: string;
  domainLabel: string;
  targetPlatform?: string;
  audience?: {
    value: string;
    status: "confirmed" | "inferred" | "assumed";
  };
  deliverable?: {
    value: string;
    format?: string;
    status: "confirmed" | "inferred" | "assumed";
  };
  confirmedRequirements: string[];
  functionalRequirements: string[];
  nonFunctionalRequirements: string[];
  constraints: string[];
  budget?: {
    value: string;
    isZeroBudget: boolean;
    status: "confirmed" | "inferred" | "assumed";
  };
  timeline?: {
    value: string;
    status: "confirmed" | "inferred" | "assumed";
  };
  explicitExclusions: string[];
  acceptanceCriteria: string[];
  unresolvedAssumptions: string[];
  unresolvedContradictions: string[];
  unresolvedQuestions: string[];
  safetyPrivacyAccuracy: string[];
  hasMultimodalContext: boolean;
  hasLiveWebNeed: boolean;
  hasCodebaseModification: boolean;
  softwareParams?: {
    stack?: string;
    integrations?: string;
    hosting?: string;
    needsSecretIsolation: boolean;
    needsFreeTierGuardrails: boolean;
  };
}

const TASK_CATEGORY_LABELS: Record<TaskCategory, string> = {
  software_development: "Software Development & Debugging",
  research_fact_checking: "Research & Fact-Checking",
  study_tutoring: "Study & Tutoring",
  business_planning: "Business & Strategic Planning",
  creative_work: "Creative Work & Worldbuilding",
  writing_editing: "Writing, Editing & Editorial Communication",
  data_analysis: "Data Analysis & Quantitative Synthesis",
  general_purpose: "General-Purpose Task Execution",
};

/**
 * Classifies the project into one of 8 task categories so the prompt structure
 * matches the actual work being performed.
 */
export function classifyTaskCategory(
  goal: string,
  facts: string[] = [],
  domain?: string,
  context?: OptimizationContext,
): TaskCategory {
  const profile = context?.projectProfile;
  const primaryText = [
    goal,
    profile?.primaryGoal?.value || "",
    profile?.desiredDeliverable?.value || "",
    profile?.outputFormat?.value || "",
  ]
    .join(" ")
    .toLowerCase();

  const allText = [
    primaryText,
    ...facts,
    ...(profile?.confirmedFacts.map((f) => `${f.label}: ${f.value}`) ?? []),
    ...(profile?.functionalRequirements.map((r) => r.value) ?? []),
  ]
    .join(" ")
    .toLowerCase();

  const dom = (
    domain ||
    context?.expertDomain ||
    context?.domain ||
    profile?.expertId ||
    ""
  ).toLowerCase();

  // 1. Check strong non-software signals in primary objective first so a writing,
  // research, study, creative, or data task is never misclassified as software.
  const isResearchPrimary =
    /\b(fact[- ]?check|literature review|research report|research question|systematic review|primary sources|peer[- ]?reviewed|citations?|verify claims|evidence synthesis|market research report|due diligence report|whitepaper research)\b/i.test(
      primaryText,
    );
  const isDataAnalysisPrimary =
    /\b(data analysis|analyze (?:the |this )?(?:dataset|csv|sql|cohort|churn|metrics|survey|spreadsheet)|statistical analysis|regression|hypothesis test|exploratory data|pandas|jupyter|bi report|funnel analysis|kpi analysis)\b/i.test(
      primaryText,
    );
  const isStudyPrimary =
    /\b(study plan|tutor|tutoring|learn how to|prepare for (?:the )?exam|curriculum|syllabus|flashcards? for studying|lesson plan|spaced repetition|exam prep|practice problems|mastery roadmap)\b/i.test(
      primaryText,
    );
  const isCreativePrimary =
    /\b(short story|novel|screenplay|scriptwriting|worldbuilding|fiction|poetry|poem|character backstory|rpg campaign|game lore|creative story|fable|lyric|story arc)\b/i.test(
      primaryText,
    );
  const isWritingPrimary =
    /\b(write (?:a |an )?(?:essay|article|blog post|op-ed|newsletter issue|press release|speech|memo|whitepaper|case study|email sequence|cover letter)|copywriting|proofread|edit (?:this|my) (?:draft|essay|article|prose)|editorial)\b/i.test(
      primaryText,
    );

  // Strong software/coding cues
  const hasExplicitSoftwareSignals =
    /\b(build (?:a |an )?(?:web|website|app|application|saas|platform|dashboard|store|e-commerce|tool|cli|api|microservice|extension|plugin)|react|vite|next\.?js|tailwind|typescript|javascript|python backend|node\.?js|supabase|postgresql|sqlite|mongodb|prisma|drizzle|stripe|endpoint|codebase|refactor|bug|debug|unit test|docker|kubernetes|cloudflare|vercel|netlify|github pages|indexeddb|oauth|jwt)\b/i.test(
      allText,
    );

  if (isResearchPrimary && !hasExplicitSoftwareSignals) {
    return "research_fact_checking";
  }
  if (isDataAnalysisPrimary && !hasExplicitSoftwareSignals) {
    return "data_analysis";
  }
  if (isStudyPrimary && !hasExplicitSoftwareSignals) {
    return "study_tutoring";
  }
  if (isCreativePrimary && !hasExplicitSoftwareSignals) {
    return "creative_work";
  }
  if (isWritingPrimary && !hasExplicitSoftwareSignals) {
    return "writing_editing";
  }

  if (hasExplicitSoftwareSignals || dom === "website" || dom === "developer") {
    return "software_development";
  }

  // Secondary classification across full context
  if (
    /\b(research|fact[- ]?check|citations?|peer[- ]?reviewed|credible sources|literature|investigate|empirical evidence)\b/i.test(
      allText,
    )
  ) {
    return "research_fact_checking";
  }

  if (
    /\b(dataset|csv|cohort|statistical|anova|p-value|confidence interval|correlation|outlier|sql query|data cleaning|chart|visualization)\b/i.test(
      allText,
    )
  ) {
    return "data_analysis";
  }

  if (
    dom === "study" ||
    /\b(study|tutor|exam|curriculum|syllabus|pedagog|active recall|worked example|quiz|learner)\b/i.test(
      allText,
    )
  ) {
    return "study_tutoring";
  }

  if (
    /\b(fiction|story|novel|worldbuilding|character|screenplay|poem|poetry|mythology|creative direction|storyboard)\b/i.test(
      allText,
    )
  ) {
    return "creative_work";
  }

  if (
    dom === "creator" ||
    /\b(essay|article|op-ed|editorial|copywriting|blog post|newsletter|manuscript|tone of voice|proofread|rewrite|prose)\b/i.test(
      allText,
    )
  ) {
    return "writing_editing";
  }

  if (
    dom === "business" ||
    /\b(business plan|go-to-market|unit economics|pricing model|monetization|revenue|b2b|cac|ltv|pitch deck|acquisition channel|operations plan)\b/i.test(
      allText,
    )
  ) {
    return "business_planning";
  }

  return "general_purpose";
}

/**
 * Builds a single, canonical project specification from the validated ProjectProfile
 * and optimization context without inventing unrequested requirements.
 */
export function buildCanonicalProjectSpec(
  goal: string,
  facts: string[] = [],
  domain?: string,
  context?: OptimizationContext,
): CanonicalProjectSpec {
  const profile = context?.projectProfile;
  const cleanGoal =
    (profile?.primaryGoal?.value || context?.goal || goal || "").trim() ||
    "Complete the specified project objective";

  const taskCategory = classifyTaskCategory(cleanGoal, facts, domain, context);
  const taskCategoryLabel = TASK_CATEGORY_LABELS[taskCategory];

  const rawDomain =
    domain || context?.expertDomain || context?.domain || profile?.expertId;
  const domainLabel = getDomainLabel(rawDomain, taskCategory);

  // 1. Target platform (if specified)
  const targetPlatform = profile?.targetPlatform?.value;

  // 2. Audience (preserve confirmed vs inferred/assumed status)
  let audience: CanonicalProjectSpec["audience"];
  if (profile?.intendedAudience?.value) {
    audience = {
      value: profile.intendedAudience.value,
      status:
        profile.intendedAudience.origin === "explicit"
          ? "confirmed"
          : profile.intendedAudience.origin === "inferred"
            ? "inferred"
            : "assumed",
    };
  } else {
    const audFact = facts.find((f) =>
      /^(?:target\s+)?audience\s*:/i.test(f.trim()),
    );
    if (audFact) {
      const isInf = /\(inferred\)/i.test(audFact);
      const isAssumed = /\(assumed\)/i.test(audFact);
      audience = {
        value: audFact
          .replace(/^(?:target\s+)?audience\s*:\s*/i, "")
          .replace(/\s*\((?:inferred|assumed)\)\s*$/i, "")
          .trim(),
        status: isAssumed ? "assumed" : isInf ? "inferred" : "confirmed",
      };
    } else {
      const goalAudMatch =
        /\bfor\s+([a-z0-9][a-z0-9\s-]{2,45}?)(?:\.|,|\bwith\b|\busing\b|\bin\b|\bexclude\b|\band\b|$)/i.exec(
          cleanGoal,
        );
      if (goalAudMatch && goalAudMatch[1]) {
        audience = {
          value: goalAudMatch[1].trim(),
          status: "inferred",
        };
      }
    }
  }

  // 3. Deliverable & Output Format
  let deliverable: CanonicalProjectSpec["deliverable"];
  if (profile?.desiredDeliverable?.value || profile?.outputFormat?.value) {
    const delivOrigin =
      profile?.desiredDeliverable?.origin ||
      profile?.outputFormat?.origin ||
      "explicit";
    deliverable = {
      value:
        profile?.desiredDeliverable?.value ||
        profile?.outputFormat?.value ||
        cleanGoal,
      format: profile?.outputFormat?.value,
      status:
        delivOrigin === "explicit"
          ? "confirmed"
          : delivOrigin === "inferred"
            ? "inferred"
            : "assumed",
    };
  } else {
    const delivFact = facts.find((f) =>
      /^(?:desired\s+deliverable|deliverable|output\s+format|format)\s*:/i.test(
        f.trim(),
      ),
    );
    if (delivFact) {
      const isInf = /\(inferred\)/i.test(delivFact);
      const isAssumed = /\(assumed\)/i.test(delivFact);
      deliverable = {
        value: delivFact
          .replace(
            /^(?:desired\s+deliverable|deliverable|output\s+format|format)\s*:\s*/i,
            "",
          )
          .replace(/\s*\((?:inferred|assumed)\)\s*$/i, "")
          .trim(),
        status: isAssumed ? "assumed" : isInf ? "inferred" : "confirmed",
      };
    }
  }

  // 4. Budget & Timeline
  let budget: CanonicalProjectSpec["budget"];
  const rawBudgetStr =
    profile?.budget?.value ||
    context?.budget ||
    facts
      .find((f) =>
        /^(?:stated\s+)?budget(?:\s+constraint)?\s*:/i.test(f.trim()),
      )
      ?.replace(/^(?:stated\s+)?budget(?:\s+constraint)?\s*:\s*/i, "")
      .trim();

  if (rawBudgetStr) {
    const lowerB = rawBudgetStr.toLowerCase();
    const isZero =
      lowerB.includes("$0") ||
      lowerB === "0" ||
      lowerB.includes("zero") ||
      lowerB.includes("free") ||
      lowerB.includes("no money") ||
      lowerB.includes("no budget");
    const bOrigin = profile?.budget?.origin || "explicit";
    budget = {
      value: rawBudgetStr
        .replace(/\s*\((?:inferred|assumed)\)\s*$/i, "")
        .trim(),
      isZeroBudget: isZero,
      status:
        bOrigin === "explicit"
          ? "confirmed"
          : bOrigin === "inferred"
            ? "inferred"
            : "assumed",
    };
  }

  let timeline: CanonicalProjectSpec["timeline"];
  if (profile?.timeline?.value) {
    timeline = {
      value: profile.timeline.value,
      status:
        profile.timeline.origin === "explicit"
          ? "confirmed"
          : profile.timeline.origin === "inferred"
            ? "inferred"
            : "assumed",
    };
  } else {
    const timeFact = facts.find((f) =>
      /^(?:timeline|deadline|time\s+commitment)\s*:/i.test(f.trim()),
    );
    if (timeFact) {
      timeline = {
        value: timeFact
          .replace(/^(?:timeline|deadline|time\s+commitment)\s*:\s*/i, "")
          .replace(/\s*\((?:inferred|assumed)\)\s*$/i, "")
          .trim(),
        status: /\(inferred\)/i.test(timeFact)
          ? "inferred"
          : /\(assumed\)/i.test(timeFact)
            ? "assumed"
            : "confirmed",
      };
    }
  }

  // 5. Confirmed Requirements, Functional & Non-Functional Requirements, Constraints, Exclusions
  const confirmedRequirements: string[] = [];
  const addUnique = (arr: string[], item: string) => {
    const trimmed = item.trim();
    if (!trimmed) return;
    const norm = trimmed.toLowerCase();
    if (!arr.some((existing) => existing.toLowerCase() === norm)) {
      arr.push(trimmed);
    }
  };

  if (profile) {
    for (const cf of profile.confirmedFacts) {
      addUnique(confirmedRequirements, `${cf.label}: ${cf.value}`);
    }
    for (const pref of profile.userPreferences) {
      addUnique(confirmedRequirements, `Preference: ${pref.value}`);
    }
    for (const res of profile.resources) {
      addUnique(confirmedRequirements, `Resource: ${res.value}`);
    }
    for (const [extKey, extField] of Object.entries(profile.domainExtensions)) {
      if (extKey === "interview_control") continue;
      if (extField.origin === "explicit") {
        addUnique(confirmedRequirements, `${extKey}: ${extField.value}`);
      }
    }
  }

  const unresolvedAssumptions: string[] = [];
  for (const fact of facts) {
    const trimmed = fact.trim();
    if (!trimmed) continue;
    if (/\((?:inferred|assumed)\)\s*$/i.test(trimmed)) {
      addUnique(unresolvedAssumptions, trimmed);
    } else {
      addUnique(confirmedRequirements, trimmed);
    }
  }

  if (profile) {
    for (const ia of profile.inferredAssumptions) {
      if (ia.status !== "active") continue;
      const tag = ia.origin === "assumed" ? "Assumed" : "Inferred";
      const cleanLabel = ia.label.replace(/\s*\((?:Assumed|Inferred)\)$/i, "");
      addUnique(unresolvedAssumptions, `${cleanLabel}: ${ia.value} (${tag})`);
    }
  }
  if (audience && audience.status !== "confirmed") {
    const tag = audience.status === "assumed" ? "Assumed" : "Inferred";
    addUnique(
      unresolvedAssumptions,
      `Target Audience: ${audience.value} (${tag})`,
    );
  }
  if (deliverable && deliverable.status !== "confirmed") {
    const tag = deliverable.status === "assumed" ? "Assumed" : "Inferred";
    addUnique(
      unresolvedAssumptions,
      `Target Deliverable: ${deliverable.value} (${tag})`,
    );
  }

  const functionalRequirements: string[] = [];
  if (profile) {
    for (const fr of profile.functionalRequirements) {
      addUnique(functionalRequirements, fr.value);
    }
  }

  const nonFunctionalRequirements: string[] = [];
  if (profile) {
    for (const nfr of profile.nonFunctionalRequirements) {
      addUnique(nonFunctionalRequirements, nfr.value);
    }
  }

  const constraints: string[] = [];
  if (profile) {
    for (const c of profile.constraints) {
      addUnique(constraints, c.value);
    }
  }
  if (budget) {
    addUnique(
      constraints,
      `Budget Constraint: ${budget.value}${budget.status !== "confirmed" ? ` (${budget.status})` : ""}`,
    );
  }
  if (timeline) {
    addUnique(
      constraints,
      `Timeline Constraint: ${timeline.value}${timeline.status !== "confirmed" ? ` (${timeline.status})` : ""}`,
    );
  }

  const explicitExclusions: string[] = [];
  if (profile) {
    for (const ex of profile.explicitExclusions) {
      addUnique(explicitExclusions, ex.value);
    }
  }
  for (const f of facts) {
    if (
      /\b(?:exclude|excluding|do not include|no paid|without|must not|avoid)\b/i.test(
        f,
      )
    ) {
      addUnique(explicitExclusions, f);
    }
  }

  // 6. Unresolved Contradictions & Questions
  const unresolvedContradictions: string[] = [];
  if (profile) {
    for (const c of profile.contradictions) {
      if (c.status === "unresolved") {
        addUnique(
          unresolvedContradictions,
          `${c.title}: ${c.description} (Recommended resolution: ${c.recommendation})`,
        );
      }
    }
  }

  const unresolvedQuestions: string[] = [];
  if (profile) {
    for (const q of profile.unresolvedQuestions) {
      addUnique(unresolvedQuestions, `${q.label}: ${q.question}`);
    }
  }

  // 7. Acceptance Criteria
  const acceptanceCriteria: string[] = [];
  if (profile) {
    for (const sc of profile.successCriteria) {
      addUnique(acceptanceCriteria, sc.value);
    }
  }
  for (const crit of getDefaultTaskAcceptanceCriteria(
    taskCategory,
    cleanGoal,
    explicitExclusions,
  )) {
    addUnique(acceptanceCriteria, crit);
  }

  // 8. Multimodal, Live Web, and Codebase Modification detection
  const combinedCorpus = [
    cleanGoal,
    ...confirmedRequirements,
    ...functionalRequirements,
    ...constraints,
  ].join(" ");

  const hasMultimodalContext =
    /\b(image|images|photo|screenshot|diagram|video|audio|voice|pdf|slide deck|vision|multimodal|chart image|handwritten|scan)\b/i.test(
      combinedCorpus,
    );

  const hasLiveWebNeed =
    taskCategory === "research_fact_checking" ||
    /\b(current|latest|2025|2026|real-time|live data|recent news|up-to-date|market prices|current regulations|benchmark)\b/i.test(
      combinedCorpus,
    );

  const hasCodebaseModification =
    taskCategory === "software_development" ||
    /\b(repo|repository|codebase|refactor|existing code|file|module|script|pull request|commit|test suite)\b/i.test(
      combinedCorpus,
    );

  // 9. Software parameters (only when taskCategory === "software_development")
  let softwareParams: CanonicalProjectSpec["softwareParams"];
  if (taskCategory === "software_development") {
    const extracted = extractSoftwareParameters(
      cleanGoal,
      confirmedRequirements,
      unresolvedAssumptions,
      budget,
    );
    softwareParams = extracted;
  }

  // 10. Safety, Privacy, and Factual Accuracy requirements tailored to the task
  const safetyPrivacyAccuracy = buildSafetyPrivacyAccuracyRules(
    taskCategory,
    budget,
    softwareParams,
    hasLiveWebNeed,
  );

  return {
    objective: cleanGoal,
    taskCategory,
    taskCategoryLabel,
    domainLabel,
    targetPlatform,
    audience,
    deliverable,
    confirmedRequirements,
    functionalRequirements,
    nonFunctionalRequirements,
    constraints,
    budget,
    timeline,
    explicitExclusions,
    acceptanceCriteria,
    unresolvedAssumptions,
    unresolvedContradictions,
    unresolvedQuestions,
    safetyPrivacyAccuracy,
    hasMultimodalContext,
    hasLiveWebNeed,
    hasCodebaseModification,
    softwareParams,
  };
}

function getDomainLabel(
  rawDomain: string | undefined,
  taskCategory: TaskCategory,
): string {
  const d = (rawDomain || "").toLowerCase();
  if (taskCategory === "software_development") {
    return "Software Architecture & Engineering";
  }
  if (taskCategory === "research_fact_checking") {
    return "Evidence Synthesis & Fact Verification";
  }
  if (taskCategory === "study_tutoring") {
    return "Pedagogical Design & Skill Mastery";
  }
  if (taskCategory === "business_planning") {
    return "Venture Strategy & Operational Planning";
  }
  if (taskCategory === "creative_work") {
    return "Creative Direction & Narrative Craft";
  }
  if (taskCategory === "writing_editing") {
    return "Editorial Strategy & High-Clarity Writing";
  }
  if (taskCategory === "data_analysis") {
    return "Quantitative Analysis & Decision Intelligence";
  }
  if (d.includes("business")) return "Strategic Advisory & Planning";
  if (d.includes("website")) return "Full-Stack Web Engineering";
  if (d.includes("study")) return "Learning & Curriculum Design";
  if (d.includes("creator")) return "Content & Audience Strategy";
  return "Strategic Execution & Problem Solving";
}

function extractSoftwareParameters(
  goal: string,
  confirmedRequirements: string[],
  unresolvedAssumptions: string[],
  budget?: CanonicalProjectSpec["budget"],
): NonNullable<CanonicalProjectSpec["softwareParams"]> {
  const allItems = [...confirmedRequirements, ...unresolvedAssumptions];
  const joined = [goal, ...allItems].join(" | ");

  const stackFact = allItems.find((f) =>
    /^(?:tech\s*stack|stack|architecture|framework|skills)\s*:/i.test(f),
  );
  const integrationFact = allItems.find((f) =>
    /^(?:integrations?|apis?|services|auth|database)\s*:/i.test(f),
  );
  const hostingFact = allItems.find((f) =>
    /^(?:hosting|deployment|infrastructure)\s*:/i.test(f),
  );

  const isZeroBudget = Boolean(budget?.isZeroBudget);

  let stack = stackFact
    ? stackFact.replace(/^[^:]+:\s*/, "").trim()
    : undefined;
  if (!stack) {
    if (/\b(react|vite|next\.?js|tailwind|typescript)\b/i.test(joined)) {
      stack =
        "Vite + React 19, TypeScript, Tailwind CSS v4, Lucide React, Zod schema validation";
    } else if (/\b(python|fastapi|flask|django)\b/i.test(joined)) {
      stack = "Python 3.12, FastAPI/Pydantic validation, pytest";
    } else {
      stack =
        "Vite + React 19, TypeScript, Tailwind CSS v4, TanStack Query, Zod validation (Defaulted for web execution — adjust if repository uses another stack)";
    }
  }

  let integrations = integrationFact
    ? integrationFact.replace(/^[^:]+:\s*/, "").trim()
    : undefined;
  if (!integrations) {
    if (isZeroBudget) {
      integrations =
        "Supabase Free Tier (Auth & PostgreSQL 500MB limit) or local IndexedDB/SQLite storage; zero paid API dependencies [VERIFY: provider quota limits before deployment]";
    } else if (/\b(stripe|openai|gemini|supabase|auth)\b/i.test(joined)) {
      integrations =
        "Configured third-party APIs isolated behind server-side proxy routes with Zod payload validation [VERIFY: provider pricing and rate limits]";
    } else {
      integrations =
        "Minimal external dependencies; Supabase Free Tier (500MB DB limit) or local persistence [VERIFY: provider quota limits]";
    }
  }

  let hosting = hostingFact
    ? hostingFact.replace(/^[^:]+:\s*/, "").trim()
    : undefined;
  if (!hosting) {
    hosting = isZeroBudget
      ? "Cloudflare Pages or Vercel Hobby/Free Tier [VERIFY: commercial usage terms and bandwidth quotas]"
      : "Vercel, Cloudflare Pages, or target repository deployment pipeline [VERIFY: provider bandwidth and build limits]";
  }

  const needsSecretIsolation =
    /\b(api|stripe|openai|gemini|secret|key|token|auth|supabase|webhook|database_url)\b/i.test(
      joined,
    ) || true;

  return {
    stack,
    integrations,
    hosting,
    needsSecretIsolation,
    needsFreeTierGuardrails: true,
  };
}

function buildSafetyPrivacyAccuracyRules(
  taskCategory: TaskCategory,
  budget?: CanonicalProjectSpec["budget"],
  softwareParams?: CanonicalProjectSpec["softwareParams"],
  hasLiveWebNeed?: boolean,
): string[] {
  const rules: string[] = [];

  if (taskCategory === "software_development") {
    rules.push(
      "Secret & API Key Hygiene: Never expose private API keys or database credentials in client-side code; isolate secrets in server-side proxy routes and document variable names in `.env.example`.",
    );
    rules.push(
      "Preserve Existing Behavior: When modifying an existing codebase, scope changes minimally, preserve existing public interfaces, and avoid unrelated refactoring.",
    );
    rules.push(
      "Honest Test & Build Reporting: Never claim that tests, linters, or builds pass unless they were actually executed; explicitly distinguish verified checks from unexecuted commands.",
    );
    if (budget?.isZeroBudget) {
      rules.push(
        "Zero-Budget Free-Tier Compliance: Strictly respect the $0 budget constraint; use genuinely free tiers (e.g., Supabase 500MB DB, Cloudflare Pages / Vercel Free Tier) and mark any external quota or commercial restriction with `[VERIFY: provider quota limits and terms]`.",
      );
    } else {
      rules.push(
        "Quota & Pricing Verification: Flag any external service rate limits, storage caps, or pricing tiers with `[VERIFY: provider quota limits and pricing]` rather than guessing.",
      );
    }
  } else if (taskCategory === "research_fact_checking") {
    rules.push(
      "Source Credibility Hierarchy: Prioritize primary sources, peer-reviewed literature, official documentation, and regulatory filings over secondary commentary.",
    );
    rules.push(
      "Evidence vs. Inference Separation: Explicitly separate verified empirical facts (backed by citations) from analytical inferences or hypotheses.",
    );
    rules.push(
      "Zero Fabrication: Never invent citations, URLs, DOIs, or statistical figures; mark any claim that cannot be independently verified with `[VERIFY: primary source needed]`.",
    );
  } else if (taskCategory === "study_tutoring") {
    rules.push(
      "Pedagogical Accuracy: Ensure all conceptual explanations, worked examples, and formulas are factually accurate; flag any curriculum/exam policy detail that varies by institution with `[VERIFY: official exam syllabus]`.",
    );
    rules.push(
      "Active Mastery over Passive Reading: Prioritize diagnostic checkpoints, worked examples, and active recall practice over generic summaries.",
    );
  } else if (taskCategory === "business_planning") {
    rules.push(
      "Financial & Operational Realism: Ground unit economics, CAC/LTV, and channel assumptions in realistic benchmarks; explicitly separate confirmed facts from modeled financial assumptions.",
    );
    rules.push(
      "Budget & Tooling Feasibility: Respect stated budget boundaries and flag third-party platform pricing or legal/compliance requirements with `[VERIFY: current provider pricing and regulatory terms]`.",
    );
  } else if (taskCategory === "creative_work") {
    rules.push(
      "Creative & Stylistic Fidelity: Adhere strictly to the requested tone, POV, setting constraints, and stylistic exclusions without inserting meta-commentary or generic tropes.",
    );
  } else if (taskCategory === "writing_editing") {
    rules.push(
      "Factual & Editorial Integrity: Do not invent quotes, statistics, or source attributions; preserve the author's intended register and honor all word-count and exclusion rules.",
    );
  } else if (taskCategory === "data_analysis") {
    rules.push(
      "Statistical & Data Integrity: Check for missing values, sample-size limitations, and outliers before drawing conclusions; clearly separate observed correlations from causal claims.",
    );
    rules.push(
      "Privacy & Data Hygiene: Never hardcode or expose personally identifiable information (PII) or sensitive credentials in analysis outputs.",
    );
  } else {
    rules.push(
      "Factual Accuracy & Constraint Fidelity: Do not invent unrequested requirements or unverified statistics; mark uncertain external facts with `[VERIFY: confirm current details]`.",
    );
  }

  if (hasLiveWebNeed && taskCategory !== "research_fact_checking") {
    rules.push(
      "Recency & Live Information Boundary: Do not assume access to real-time information unless live search is available; flag time-sensitive figures with `[VERIFY: current data]`.",
    );
  }

  return rules;
}

function getDefaultTaskAcceptanceCriteria(
  taskCategory: TaskCategory,
  objective: string,
  exclusions: string[],
): string[] {
  const criteria: string[] = [
    `Directly fulfills the primary objective ("${objective}") without adding unrequested filler.`,
  ];

  if (exclusions.length > 0) {
    criteria.push(
      `Strictly honors all explicit exclusions (${exclusions.join("; ")}).`,
    );
  }

  switch (taskCategory) {
    case "software_development":
      criteria.push(
        "TypeScript/code compiles cleanly (`tsc --noEmit` / `npm run build` exits 0) with runtime input validation (e.g., Zod schemas) at boundary inputs.",
        "Interactive views handle loading states, empty states, and error recovery without exposing private API keys in client bundles.",
        "Existing behavior outside the target scope is preserved, and test results are reported honestly (distinguishing executed tests from unrun checks).",
      );
      break;
    case "research_fact_checking":
      criteria.push(
        "Every major factual or quantitative claim is paired with a credible source citation or explicitly marked `[VERIFY: source required]`.",
        "Verified evidence is clearly separated from analytical inference, and conflicting evidence across sources is explicitly noted.",
      );
      break;
    case "study_tutoring":
      criteria.push(
        "Includes clear learning milestones, step-by-step worked examples, and active-recall practice questions with diagnostic answer keys.",
        "Pacing and prerequisite depth match the learner's stated level and timeline constraints.",
      );
      break;
    case "business_planning":
      criteria.push(
        "Includes concrete unit economics, customer acquisition workflow, milestone schedule, and risk mitigation grounded in the stated budget.",
        "Separates confirmed operational facts from modeled financial assumptions and flags unverified external costs with `[VERIFY: ...]`. ",
      );
      break;
    case "creative_work":
      criteria.push(
        "Delivers the complete creative work or structured narrative blueprint matching the specified tone, perspective, and world/character constraints.",
        "Avoids generic clichés and respects all stated stylistic exclusions.",
      );
      break;
    case "writing_editing":
      criteria.push(
        "Produces publication-ready prose matching the target audience, tone/register, structural outline, and length constraints.",
        "Eliminates filler, preserves factual accuracy without fabricated quotes/stats, and satisfies all editorial exclusions.",
      );
      break;
    case "data_analysis":
      criteria.push(
        "Specifies exact data cleaning, edge-case/missing-data handling, analytical methodology, and structured interpretation of results.",
        "Separates empirical observations from causal hypotheses and flags data-quality limitations transparently.",
      );
      break;
    case "general_purpose":
      criteria.push(
        "Provides a complete, actionable deliverable structured for immediate execution with explicit verification checkpoints.",
      );
      break;
  }

  return criteria;
}

/**
 * Generates all 7 model-specific prompts from the validated ProjectProfile / context.
 */
export function generateOptimizedPrompts(
  goal: string,
  facts: string[] = [],
  domain?: string,
  context?: OptimizationContext,
): MultiModelPrompts {
  const spec = buildCanonicalProjectSpec(goal, facts, domain, context);

  return {
    chatgpt: generateChatGPTNative(spec),
    claude: generateClaudeNative(spec),
    gemini: generateGeminiNative(spec),
    perplexity: generatePerplexityNative(spec),
    grok: generateGrokNative(spec),
    cursor: generateCursorNative(spec),
    windsurf: generateWindsurfNative(spec),
  };
}

/**
 * Ensures all 7 models have complete, genuinely distinct, context-rich prompts.
 * Preserves all confirmed requirements, exclusions, assumptions, and contradictions
 * from the canonical project specification across every target platform.
 */
export function ensureAllSevenModels(
  parsedPrompts: Partial<Record<ModelKey, string>>,
  context: {
    goal?: string;
    expertDomain?: string;
    facts?: string[];
    budget?: string;
    projectProfile?: ProjectProfile;
  },
): MultiModelPrompts {
  const anyExisting = Object.values(parsedPrompts).find(
    (p) => p && p.trim().length > 40,
  );

  const cleanGoal =
    context.projectProfile?.primaryGoal?.value ||
    context.goal?.trim() ||
    (anyExisting
      ? extractSection(anyExisting, [
          /(?:Goal|Objective|Target|Mission)\s*[:=-]\s*([^\n]+)/i,
          /<goal>([\s\S]*?)<\/goal>/i,
        ])
      : null) ||
    "Complete the specified project objective";

  const extractedFacts = [...(context.facts ?? [])];
  if (anyExisting && extractedFacts.length === 0) {
    const contextLines = extractContextLines(anyExisting);
    extractedFacts.push(...contextLines);
  }

  const optContext: OptimizationContext = {
    goal: cleanGoal,
    expertDomain: context.expertDomain,
    domain: context.expertDomain,
    facts: extractedFacts,
    budget: context.budget ?? context.projectProfile?.budget?.value,
    projectProfile: context.projectProfile,
  };

  const spec = buildCanonicalProjectSpec(
    cleanGoal,
    extractedFacts,
    context.expertDomain,
    optContext,
  );

  const generated = generateOptimizedPrompts(
    cleanGoal,
    extractedFacts,
    context.expertDomain,
    optContext,
  );

  const result = {} as MultiModelPrompts;

  for (const model of ALL_MODELS) {
    const existing = parsedPrompts[model.key]?.trim();
    if (existing && existing.length > 50) {
      result[model.key] = enforceCanonicalPreservation(
        existing,
        spec,
        model.key,
      );
    } else {
      result[model.key] = generated[model.key];
    }
  }

  return result;
}

/**
 * Ensures that a pre-existing / LLM-streamed platform prompt does not drop
 * critical canonical items (confirmed requirement values, explicit exclusions,
 * unresolved contradictions, or active assumptions).
 */
function enforceCanonicalPreservation(
  promptText: string,
  spec: CanonicalProjectSpec,
  modelKey: ModelKey,
): string {
  const lower = promptText.toLowerCase();

  // Check confirmed requirements by their value (not just the slot label!)
  const missingConfirmed = spec.confirmedRequirements.filter((req) => {
    const colonIdx = req.indexOf(":");
    const valPart = (colonIdx >= 0 ? req.slice(colonIdx + 1) : req)
      .trim()
      .toLowerCase();
    const probe = valPart.slice(0, Math.min(28, valPart.length));
    return probe.length > 2 && !lower.includes(probe);
  });

  // Check explicit exclusions
  const missingExclusions = spec.explicitExclusions.filter(
    (ex) => !lower.includes(ex.toLowerCase().slice(0, 18)),
  );

  // Check unresolved contradictions
  const missingConflicts = spec.unresolvedContradictions.filter(
    (c) => !lower.includes(c.split(":")[0].toLowerCase()),
  );

  // Check active assumptions
  const missingAssumptions = spec.unresolvedAssumptions.filter((a) => {
    const colonIdx = a.indexOf(":");
    const valPart = (colonIdx >= 0 ? a.slice(colonIdx + 1) : a)
      .replace(/\s*\((?:inferred|assumed)\)\s*$/i, "")
      .trim()
      .toLowerCase();
    const probe = valPart.slice(0, Math.min(24, valPart.length));
    return probe.length > 2 && !lower.includes(probe);
  });

  if (
    missingConfirmed.length === 0 &&
    missingExclusions.length === 0 &&
    missingConflicts.length === 0 &&
    missingAssumptions.length === 0
  ) {
    return promptText;
  }

  if (modelKey === "claude") {
    const xmlNodes: string[] = [];
    for (const req of missingConfirmed) {
      xmlNodes.push(`  <confirmed_requirement>${req}</confirmed_requirement>`);
    }
    for (const ex of missingExclusions) {
      xmlNodes.push(`  <explicit_exclusion>${ex}</explicit_exclusion>`);
    }
    for (const c of missingConflicts) {
      xmlNodes.push(`  <unresolved_conflict>${c}</unresolved_conflict>`);
    }
    for (const a of missingAssumptions) {
      xmlNodes.push(`  <active_assumption>${a}</active_assumption>`);
    }
    if (promptText.includes("</context>")) {
      return promptText.replace(
        "</context>",
        `${xmlNodes.join("\n")}\n</context>`,
      );
    }
    return `${promptText}\n<context>\n${xmlNodes.join("\n")}\n</context>`;
  }

  const missingBlocks: string[] = [];
  if (missingConfirmed.length > 0) {
    missingBlocks.push(missingConfirmed.map((r) => `- ${r}`).join("\n"));
  }
  if (missingExclusions.length > 0) {
    missingBlocks.push(
      `Explicit Exclusions:\n${missingExclusions.map((e) => `- ${e}`).join("\n")}`,
    );
  }
  if (missingConflicts.length > 0) {
    missingBlocks.push(
      `Unresolved Requirement Conflicts to Address:\n${missingConflicts.map((c) => `- ${c}`).join("\n")}`,
    );
  }
  if (missingAssumptions.length > 0) {
    missingBlocks.push(
      `Explicit Inferred / Assumed Parameters:\n${missingAssumptions.map((a) => `- ${a}`).join("\n")}`,
    );
  }

  return `${promptText}\n\n# CONTEXT & CONFIRMED REQUIREMENTS\n${missingBlocks.join("\n\n")}`;
}

// ----------------------------------------------------------------------------
// Shared Canonical Section Builders
// ----------------------------------------------------------------------------

function formatCanonicalContextBlock(spec: CanonicalProjectSpec): string {
  const lines: string[] = [];
  lines.push(`- Primary Objective: ${spec.objective}`);
  lines.push(`- Task Category: ${spec.taskCategoryLabel}`);
  if (spec.audience) {
    const tag =
      spec.audience.status === "confirmed"
        ? "Confirmed"
        : spec.audience.status === "inferred"
          ? "Inferred"
          : "Assumed";
    lines.push(`- Target Audience (${tag}): ${spec.audience.value}`);
  }
  if (spec.deliverable) {
    const tag =
      spec.deliverable.status === "confirmed"
        ? "Confirmed"
        : spec.deliverable.status === "inferred"
          ? "Inferred"
          : "Assumed";
    lines.push(
      `- Target Deliverable (${tag}): ${spec.deliverable.value}${spec.deliverable.format && spec.deliverable.format !== spec.deliverable.value ? ` (Format: ${spec.deliverable.format})` : ""}`,
    );
  }
  for (const req of spec.confirmedRequirements) {
    lines.push(`- Confirmed Requirement: ${req}`);
  }
  for (const fr of spec.functionalRequirements) {
    lines.push(`- Functional Requirement: ${fr}`);
  }
  for (const nfr of spec.nonFunctionalRequirements) {
    lines.push(`- Non-Functional Requirement: ${nfr}`);
  }
  return lines.join("\n");
}

function formatConstraintsAndExclusionsBlock(
  spec: CanonicalProjectSpec,
): string {
  const lines: string[] = [];
  if (spec.budget) {
    lines.push(
      `- Budget Boundary: ${spec.budget.value}${spec.budget.isZeroBudget ? " (Strictly $0 / Free-Tier only — no paid subscriptions or unverified billing requirements)" : ""}`,
    );
  }
  if (spec.timeline) {
    lines.push(`- Timeline / Schedule: ${spec.timeline.value}`);
  }
  for (const c of spec.constraints) {
    if (
      !lines.some((l) => l.toLowerCase().includes(c.toLowerCase().slice(0, 20)))
    ) {
      lines.push(`- Constraint: ${c}`);
    }
  }
  if (spec.explicitExclusions.length > 0) {
    for (const ex of spec.explicitExclusions) {
      lines.push(`- EXPLICIT EXCLUSION (Do Not Include): ${ex}`);
    }
  } else {
    lines.push(
      "- Scope Discipline: Do not invent unrequested features, unrelated tools, or speculative requirements.",
    );
  }
  return lines.join("\n");
}

function formatAssumptionsAndConflictsBlock(
  spec: CanonicalProjectSpec,
): string {
  const lines: string[] = [];
  if (spec.unresolvedAssumptions.length > 0) {
    lines.push(
      "Active Assumptions (Keep Labeled — Do Not Treat as Confirmed Facts):",
    );
    for (const a of spec.unresolvedAssumptions) {
      lines.push(`  • ${a}`);
    }
  }
  if (spec.unresolvedContradictions.length > 0) {
    lines.push("Unresolved Contradictions Requiring Transparent Handling:");
    for (const c of spec.unresolvedContradictions) {
      lines.push(`  • [UNRESOLVED CONFLICT DISCLOSURE] ${c}`);
    }
  }
  if (spec.unresolvedQuestions.length > 0) {
    lines.push("Open Questions / Unspecified Details:");
    for (const q of spec.unresolvedQuestions) {
      lines.push(`  • ${q}`);
    }
  }
  if (lines.length === 0) {
    return "- All core parameters are confirmed; no unresolved conflicts detected.";
  }
  return lines.join("\n");
}

function formatTaskSpecificStructure(spec: CanonicalProjectSpec): string {
  const sp = spec.softwareParams;
  switch (spec.taskCategory) {
    case "software_development":
      return `1. Architecture & Stack Specification:
   - Target Stack: ${sp?.stack}
   - Integrations & Storage: ${sp?.integrations}
   - Hosting & Runtime Target: ${sp?.hosting}
2. Component, Data Model & State Design:
   - Define concrete data structures/interfaces directly required by "${spec.objective}".
   - Implement runtime input validation (e.g., Zod schemas) on external inputs, forms, and API payloads.
   - Cover interactive UI/UX states where applicable: loading skeletons, informative empty states, and localized error boundaries/retry handlers.
3. Codebase Preservation & Security Hygiene:
   - Isolate private credentials in server-side routes; document required variables in \`.env.example\`.
   - Preserve existing application behavior outside the requested scope; make minimal, well-scoped edits.
4. Verification & Honest Test Reporting:
   - Separate Phase 1 MVP essentials from optional Phase 2 enhancements.
   - Specify exact verification commands (\`tsc --noEmit\`, \`npm run build\`, test runner) and report test outcomes honestly without claiming unexecuted checks passed.`;

    case "research_fact_checking":
      return `1. Primary Research Questions & Scope:
   - Break "${spec.objective}" into falsifiable sub-questions grounded in the confirmed context.
2. Source Standards & Credibility Hierarchy:
   - Prioritize primary empirical data, peer-reviewed literature, official documentation, and regulatory records.
   - Provide inline citations for every factual, historical, or quantitative claim.
3. Evidence vs. Inference Matrix:
   - Present a structured breakdown distinguishing:
     a) **Verified Evidence** (directly supported by cited primary sources),
     b) **Analytical Inference** (reasoned conclusions drawn from the evidence), and
     c) **Unverified / Open Claims** (marked with \`[VERIFY: specific source needed]\`).
4. Synthesis & Counter-Evidence Review:
   - Surface methodological limitations, conflicting studies, or recency gaps transparently.`;

    case "study_tutoring":
      return `1. Diagnostic Baseline & Learning Objectives:
   - Calibrate explanations to the learner's profile (${spec.audience?.value || "stated skill level"}) and timeline (${spec.timeline?.value || "structured progression"}).
2. Structured Concept Breakdown & Worked Examples:
   - Explain core principles concisely from first principles, followed immediately by step-by-step worked examples showing common pitfalls.
3. Active Recall & Practice Drills:
   - Provide graduated practice exercises (foundational -> applied -> synthesis) with diagnostic answer keys and explanations of why incorrect options fail.
4. Spaced Repetition & Mastery Checkpoints:
   - Define concrete self-assessment checkpoints and review intervals to verify retention before advancing.`;

    case "business_planning":
      return `1. Value Proposition & Target Segment Alignment:
   - Define the exact customer problem, target buyer persona (${spec.audience?.value || "core market segment"}), and offer positioning for "${spec.objective}".
2. Unit Economics & Budget-Realistic Financial Model:
   - Detail pricing structure, cost drivers, customer acquisition cost (CAC) assumptions, and margin targets within the stated budget (${spec.budget?.value || "lean capital constraints"}).
   - Clearly separate confirmed operational numbers from modeled projections; flag external pricing/regulatory figures with \`[VERIFY: current market rate]\`.
3. Go-To-Market & Execution Roadmap:
   - Provide a phased action plan (Phase 1 Validation MVP vs. Phase 2 Scale) with concrete acquisition channels and conversion milestones.
4. Operational Risks & Mitigation Matrix:
   - Identify top commercial, execution, and resource bottlenecks with concrete fallback triggers.`;

    case "creative_work":
      return `1. Creative Brief & Aesthetic Foundation:
   - Establish voice, point of view, tonal register, and world/setting rules tailored to "${spec.objective}".
2. Structural Arc & Scene / Concept Progression:
   - Organize the piece with purposeful pacing, tension, and sensory or conceptual specificity rather than generic exposition.
3. Character, Voice & Stylistic Discipline:
   - Honor all confirmed constraints and explicit exclusions (${spec.explicitExclusions.join("; ") || "avoid clichés and melodramatic filler"}).
4. Complete Creative Deliverable:
   - Produce the requested creative work directly in the target format (${spec.deliverable?.value || "complete draft / treatment"}) without meta-commentary.`;

    case "writing_editing":
      return `1. Editorial Brief, Audience & Register:
   - Target Reader: ${spec.audience?.value || "Intended readership"}
   - Tone & Format: ${spec.deliverable?.value || "Publication-ready prose"}
2. Thesis, Narrative Flow & Section Architecture:
   - Lead with a clear central argument or hook; structure transitions logically so every paragraph advances the core message.
3. Evidence & Clarity Rules:
   - Use concrete, concise language; eliminate throat-clearing, passive filler, and repetitive phrasing.
   - Never fabricate quotes, citations, or statistics; flag any placeholder fact with \`[VERIFY: source fact]\`.
4. Final Editorial Polish:
   - Verify compliance with all length, formatting, and exclusion constraints (${spec.explicitExclusions.join("; ") || "zero fluff"}).`;

    case "data_analysis":
      return `1. Analytical Objective & Dataset Schema Assumptions:
   - Define the exact questions, target metrics, and expected schema/variables for "${spec.objective}".
2. Data Quality, Cleaning & Edge-Case Protocol:
   - Specify checks for missing values, duplicates, outliers, sample-size sufficiency, and time-zone/unit normalization.
3. Methodology & Quantitative Execution:
   - Provide the exact queries, scripts, formulas, or statistical tests required, explaining why each method fits the data distribution.
4. Interpretation & Inference Boundary:
   - Separate observed descriptive findings from causal inferences; outline recommended visualizations and decision thresholds.`;

    case "general_purpose":
    default:
      return `1. Scope & Deliverable Definition:
   - Execute "${spec.objective}" directly in the requested format (${spec.deliverable?.value || "structured actionable output"}).
2. Step-by-Step Execution Plan:
   - Organize the response into logical, self-contained sections grounded in confirmed requirements.
3. Constraint & Assumption Handling:
   - Respect all stated constraints and exclusions; keep any necessary assumptions explicitly labeled.
4. Quality Verification Checklist:
   - Validate completeness, factual accuracy, and alignment with acceptance criteria before concluding.`;
  }
}

// ----------------------------------------------------------------------------
// 7 Distinct Model-Specific Prompt Generators
// ----------------------------------------------------------------------------

function generateChatGPTNative(spec: CanonicalProjectSpec): string {
  const roleTitle = getRoleForTask(spec);
  const feasibilityHeading =
    spec.taskCategory === "software_development" || spec.budget
      ? "# TECHNICAL FEASIBILITY, FREE-TIER & BUDGET GUARDRAILS"
      : "# OPERATIONAL FEASIBILITY, CONSTRAINTS & GUARDRAILS (TECHNICAL FEASIBILITY)";

  const feasibilityDetails =
    spec.taskCategory === "software_development"
      ? `- Stated Budget Constraint: ${spec.budget?.value || "Optimize for lean/free-tier execution"}
- Verified Free-Tier & Quota Guardrails: Use Supabase Free Tier (500MB PostgreSQL database storage limit, 1GB file storage) or local storage, and Vercel Free Tier / Cloudflare Pages for hosting when operating on a $0 budget. Mark unverified provider limits with \`[VERIFY: provider quota limits and commercial terms]\`.
- Secret Isolation: Never expose private API keys in client-side bundles; route secret calls through server-side proxy endpoints and document variables in \`.env.example\`.`
      : `${formatConstraintsAndExclusionsBlock(spec)}
- Verification Rule: Flag any unverified external quota, pricing, or empirical claim with \`[VERIFY: confirm current source/limit]\` rather than inventing figures.`;

  return `# ROLE & IDENTITY
Act as a ${roleTitle} specializing in ${spec.domainLabel}.

# PRIMARY OBJECTIVE
"${spec.objective}"

# CONTEXT & CONFIRMED REQUIREMENTS
${formatCanonicalContextBlock(spec)}

${feasibilityHeading}
${feasibilityDetails}

# CONSTRAINTS & EXPLICIT EXCLUSIONS
${formatConstraintsAndExclusionsBlock(spec)}

# UNRESOLVED ASSUMPTIONS & CONFLICTS
${formatAssumptionsAndConflictsBlock(spec)}

# TASK EXECUTION & DELIVERABLE STRUCTURE (${spec.taskCategoryLabel.toUpperCase()})
${formatTaskSpecificStructure(spec)}

# SAFETY, PRIVACY & ACCURACY REQUIREMENTS
${spec.safetyPrivacyAccuracy.map((r) => `- ${r}`).join("\n")}

# DELIVERABLES & DEFINITION OF DONE (ACCEPTANCE CRITERIA)
${spec.acceptanceCriteria.map((c, idx) => `${idx + 1}. [PASS/FAIL] ${c}`).join("\n")}

# ITERATION & REFINEMENT PROTOCOL
- Produce the complete primary deliverable first based on the confirmed specification above.
- At the end of the response, list up to 2 targeted follow-up refinement options in case the user wants to adjust any labeled assumption or deepen a specific section.`;
}

function generateClaudeNative(spec: CanonicalProjectSpec): string {
  const roleTitle = getRoleForTask(spec);

  return `<role>
You are a ${roleTitle} specializing in ${spec.domainLabel}. Execute the project specification below with precision, structural clarity, and strict fidelity to confirmed requirements.
</role>

<goal>
${spec.objective}
</goal>

<context>
${formatCanonicalContextBlock(spec)}
</context>

<priorities>
1. Honor Confirmed Facts & Explicit Exclusions: Never override user-confirmed requirements or reintroduce excluded items.
2. Task-Matched Execution (${spec.taskCategoryLabel}): Structure the deliverable specifically for ${spec.taskCategoryLabel.toLowerCase()} without injecting unrelated boilerplate.
3. Transparent Assumption & Conflict Handling: Keep inferred or assumed parameters explicitly labeled, and surface any unresolved conflicts directly.
</priorities>

<technical_feasibility>
${formatConstraintsAndExclusionsBlock(spec)}
${
  spec.taskCategory === "software_development"
    ? `- Target Stack: ${spec.softwareParams?.stack}
- Integrations & Quotas: ${spec.softwareParams?.integrations}
- Hosting Target: ${spec.softwareParams?.hosting}
- Secret Protection: Isolate private keys in server-side routes and document in .env.example.`
    : `- Accuracy & Feasibility Guardrails:\n${spec.safetyPrivacyAccuracy.map((r) => `  • ${r}`).join("\n")}`
}
</technical_feasibility>

<unresolved_assumptions_and_conflicts>
${formatAssumptionsAndConflictsBlock(spec)}
</unresolved_assumptions_and_conflicts>

<deliverable_structure>
${formatTaskSpecificStructure(spec)}
</deliverable_structure>

<verification_and_acceptance_criteria>
Verify that your output satisfies every criterion below before finalizing:
${spec.acceptanceCriteria.map((c) => `- [VERIFY PASS/FAIL] ${c}`).join("\n")}
</verification_and_acceptance_criteria>`;
}

function generateGeminiNative(spec: CanonicalProjectSpec): string {
  const roleTitle = getRoleForTask(spec);
  const multimodalSection = spec.hasMultimodalContext
    ? `\n## Multimodal Input & Artifact Handling
- This project involves multimodal assets or visual/document inputs. Inspect all attached images, PDFs, diagrams, audio, or video frames directly and ground your synthesis in the primary media.`
    : "";

  return `# System Role & Task Definition
- **Role:** ${roleTitle} (${spec.domainLabel})
- **Primary Objective:** "${spec.objective}"
- **Task Classification:** ${spec.taskCategoryLabel}

## Context Parameters & Confirmed Requirements
${formatCanonicalContextBlock(spec)}

## Constraints, Budget & Explicit Exclusions
${formatConstraintsAndExclusionsBlock(spec)}

## Unresolved Assumptions & Contradictions
${formatAssumptionsAndConflictsBlock(spec)}${multimodalSection}

## Task-Matched Execution Plan & Deliverable Specification
${formatTaskSpecificStructure(spec)}

## Safety, Privacy & Factual Accuracy Guardrails
${spec.safetyPrivacyAccuracy.map((r) => `- ${r}`).join("\n")}

## Acceptance Criteria & Verification Schema
| # | Verification Criterion | Status Requirement |
| :--- | :--- | :--- |
${spec.acceptanceCriteria.map((c, i) => `| ${i + 1} | ${c.replace(/\|/g, "/")} | Must Pass |`).join("\n")}`;
}

function generatePerplexityNative(spec: CanonicalProjectSpec): string {
  const researchQuestions = buildPerplexityResearchQuestions(spec);

  return `[SEARCH & VERIFICATION DIRECTIVES]
Primary Objective: "${spec.objective}"
Task Domain: ${spec.taskCategoryLabel} (${spec.domainLabel})

## 1. Confirmed Context & Scope Boundaries
${formatCanonicalContextBlock(spec)}

## 2. Constraints & Explicit Exclusions
${formatConstraintsAndExclusionsBlock(spec)}

## 3. Core Research & Verification Questions
${researchQuestions.map((q, i) => `${i + 1}. ${q}`).join("\n")}

## 4. Source Credibility & Citation Standards
- Prioritize primary sources: official documentation, peer-reviewed research, regulatory/standards bodies, and primary vendor pricing/quota pages.
- Include inline citations (e.g., [1], [2]) for every empirical, technical, or quantitative claim.
- Do not fabricate citations or URLs. If a specific figure or claim cannot be verified from retrieved sources, mark it explicitly with \`[VERIFY: primary source required]\`.

## 5. Evidence vs. Inference Separation Protocol
Structure your synthesis to clearly separate:
- **Verified Evidence:** Facts, quotas, benchmarks, or rules directly confirmed by cited sources.
- **Analytical Inference:** Reasoned recommendations or extrapolations derived from the evidence for "${spec.objective}" (explicitly labeled as inference).
- **Open Assumptions & Conflicts:**
${formatAssumptionsAndConflictsBlock(spec)}

## 6. Tooling & Integration Trade-Offs Matrix / Comparative Evidence Matrix
Provide a structured comparison table evaluating the relevant options, methodologies, or sources for "${spec.objective}" against the stated constraints (${spec.budget?.value || "project constraints"}), listing Verified Facts, Limitations/Quotas, and Citation References.

## 7. Deliverable & Acceptance Criteria
${spec.acceptanceCriteria.map((c, i) => `${i + 1}. ${c}`).join("\n")}`;
}

function buildPerplexityResearchQuestions(
  spec: CanonicalProjectSpec,
): string[] {
  const base = [
    `What authoritative primary sources, benchmarks, or official documentation govern "${spec.objective}"?`,
  ];
  if (spec.taskCategory === "software_development") {
    base.push(
      `What are the current official API rate limits, free-tier storage/bandwidth quotas, and commercial terms for ${spec.softwareParams?.integrations || "the target stack"} and ${spec.softwareParams?.hosting || "target hosting"}?`,
      "What documented breaking changes, security advisories, or edge cases affect this implementation?",
    );
  } else if (spec.taskCategory === "research_fact_checking") {
    base.push(
      "Where do primary empirical studies or official records agree, and where is the evidence contested or inconclusive?",
      "What methodological limitations or recency gaps apply to the available evidence?",
    );
  } else if (spec.taskCategory === "business_planning") {
    base.push(
      `What verified market benchmarks, unit economics (CAC/LTV), and regulatory/platform constraints apply to "${spec.objective}" under a ${spec.budget?.value || "lean"} budget?`,
      "What documented competitor pricing models and acquisition channels have verified traction in this segment?",
    );
  } else if (spec.taskCategory === "study_tutoring") {
    base.push(
      `What official syllabus standards, foundational prerequisites, and authoritative reference materials apply to "${spec.objective}"?`,
      "What are the most common documented misconceptions or exam pitfalls for this topic?",
    );
  } else if (spec.taskCategory === "data_analysis") {
    base.push(
      `What statistical methods, benchmark datasets, and validation checks are standard for analyzing "${spec.objective}"?`,
      "What confounding variables or sampling biases commonly distort conclusions in this domain?",
    );
  } else {
    base.push(
      `What verified factual constraints, best-practice standards, and domain rules apply to "${spec.objective}"?`,
      "Which assumptions in the project profile require external empirical verification?",
    );
  }
  return base;
}

function generateGrokNative(spec: CanonicalProjectSpec): string {
  return `[FIRST-PRINCIPLES STRATEGIC DIRECTIVE — ZERO FLUFF]
Objective: "${spec.objective}"
Task Category: ${spec.taskCategoryLabel} (${spec.domainLabel})

1. Confirmed Context & Requirements:
${formatCanonicalContextBlock(spec)}

2. Hard Constraints & Explicit Exclusions:
${formatConstraintsAndExclusionsBlock(spec)}

3. Evidence & Live Information Boundary:
- Do NOT assume access to live web or social data unless live search is actively enabled in this session.
- Distinguish verified facts from analytical estimates; mark any unverified external quota, price, or time-sensitive claim with \`[VERIFY: confirm current figure]\`.
${spec.safetyPrivacyAccuracy.map((r) => `- ${r}`).join("\n")}

4. First-Principles Assumption & Conflict Audit:
${formatAssumptionsAndConflictsBlock(spec)}
- Challenge any hidden bottleneck or overengineered requirement before generating the final deliverable.

5. Tactical Punch List (${spec.taskCategoryLabel}):
${formatTaskSpecificStructure(spec)}

6. Definition of Done & Acceptance Criteria:
${spec.acceptanceCriteria.map((c, i) => `- [${i + 1}] ${c}`).join("\n")}`;
}

function generateCursorNative(spec: CanonicalProjectSpec): string {
  if (
    spec.taskCategory !== "software_development" &&
    !spec.hasCodebaseModification
  ) {
    return `// CURSOR AI SYSTEM DIRECTIVES (.cursorrules / Composer Protocol)
// Project Objective: "${spec.objective}"
// Task Mode: ${spec.taskCategoryLabel} (Workspace Artifact & Document Authoring)

## CONTEXT & CONFIRMED REQUIREMENTS
${formatCanonicalContextBlock(spec)}

## CONSTRAINTS & EXPLICIT EXCLUSIONS
${formatConstraintsAndExclusionsBlock(spec)}

## UNRESOLVED ASSUMPTIONS & CONFLICTS
${formatAssumptionsAndConflictsBlock(spec)}

## WORKSPACE & FILE SCOPING RULES
1. Inspect existing workspace files before creating or modifying documents so you preserve existing structure and naming conventions.
2. Scope edits strictly to the target deliverable (${spec.deliverable?.value || spec.objective}); do not alter unrelated files in the repository.
3. Do not inject software test suites or code dependencies into non-coding deliverables.

## DELIVERABLE SPECIFICATION (${spec.taskCategoryLabel.toUpperCase()})
${formatTaskSpecificStructure(spec)}

## VERIFICATION & ACCEPTANCE CRITERIA
${spec.acceptanceCriteria.map((c, i) => `${i + 1}. [PASS/FAIL] ${c}`).join("\n")}`;
  }

  const sp = spec.softwareParams;
  return `// CURSOR AI SYSTEM DIRECTIVES (.cursorrules / Composer Agent Mode)
// Project Objective: "${spec.objective}"
// Domain: ${spec.domainLabel}

## CONTEXT & CONFIRMED REQUIREMENTS
${formatCanonicalContextBlock(spec)}

## TECHNICAL FEASIBILITY, STACK & CONSTRAINTS
- Budget Boundary: ${spec.budget?.value || "Lean / Free-Tier prioritized"}
- Target Stack: ${sp?.stack}
- Integrations, Rate Limits & Persistence Quotas: ${sp?.integrations} [VERIFY: provider rate limits and storage quotas]
- Hosting Target: ${sp?.hosting}
${formatConstraintsAndExclusionsBlock(spec)}

## UNRESOLVED ASSUMPTIONS & CONFLICTS
${formatAssumptionsAndConflictsBlock(spec)}

## REPOSITORY & MINIMAL-CHANGE IMPLEMENTATION RULES
1. Reconnaissance First: Inspect relevant files, existing types, and package.json before proposing edits.
2. Minimal Scoped Changes & Phased Delivery: Modify only the files necessary to achieve "${spec.objective}" (separating Phase 1 MVP essentials from Phase 2 enhancements). Preserve existing behavior, public interfaces, and user workflows outside the target scope.
3. Validation & Interactive States:
   - Enforce runtime schema validation (Zod) on external inputs, forms, and API payloads.
   - Implement explicit loading skeletons, empty states, and localized error handling where UI components are touched.
   - Enforce WCAG AA accessibility and responsive layout integrity when modifying frontend views.

## ENVIRONMENT VARIABLES & SECRETS (.env.example)
- Isolate all private API keys and database credentials (\`SECRET\`, \`API_SECRET_KEY\`, \`DATABASE_URL\`) inside server-side proxy routes; never expose secrets in client bundles.
- Document required public and server-only variables in \`.env.example\`.

## TESTING, VALIDATION & HONEST REPORTING PROTOCOL
1. Run relevant typechecks (\`tsc --noEmit\`), build checks (\`npm run build\`), and existing unit/integration tests for modified modules.
2. Honest Test Reporting: Report the exact commands executed and their real output. Never claim that tests or builds passed unless you actually executed them; if a check cannot be run in the current environment, state that explicitly.

## ACCEPTANCE CRITERIA & DEFINITION OF DONE
${spec.acceptanceCriteria.map((c, i) => `${i + 1}. [PASS/FAIL] ${c}`).join("\n")}`;
}

function generateWindsurfNative(spec: CanonicalProjectSpec): string {
  const sp = spec.softwareParams;
  const isCodeTask =
    spec.taskCategory === "software_development" ||
    spec.hasCodebaseModification;

  return `[WINDSURF CASCADE AGENT EXECUTION PROTOCOL]
Target Objective: "${spec.objective}"
Task Category: ${spec.taskCategoryLabel} (${spec.domainLabel})

Confirmed Context & Requirements:
${formatCanonicalContextBlock(spec)}

Constraints, Budget & Explicit Exclusions:
${formatConstraintsAndExclusionsBlock(spec)}
${
  isCodeTask && sp
    ? `- Target Stack: ${sp.stack}\n- Integrations: ${sp.integrations}\n- Hosting: ${sp.hosting}`
    : ""
}

Unresolved Assumptions & Conflicts:
${formatAssumptionsAndConflictsBlock(spec)}

--- CASCADE WORKFLOW PHASES ---

PHASE 1: RECONNAISSANCE & SCOPED IMPACT AUDIT
- Inspect existing workspace files, directory conventions, and relevant references before making changes.
- Identify the minimal set of files or artifacts required to fulfill "${spec.objective}" while preserving existing behavior.
- ${
    isCodeTask
      ? `Audit integrations and environment variables: verify free-tier/budget compliance (${spec.budget?.value || "lean execution"}; [VERIFY: provider quota limits and terms]) and ensure private keys in .env.example remain isolated from client bundles.`
      : `Verify all constraints, exclusions, and accuracy guardrails (${spec.safetyPrivacyAccuracy[0] || "factual fidelity"}).`
  }

PHASE 2: SCOPED STEP-BY-STEP EXECUTION
- Apply changes in clean, self-contained steps with zero placeholder comments.
${formatTaskSpecificStructure(spec)}

PHASE 3: VALIDATION & HONEST COMPLETION REPORTING
- Validate the completed deliverable against every acceptance criterion below.
- ${
    isCodeTask
      ? "Run typecheck, lint, and test suites (`tsc --noEmit`, `npm run build`, `npm test`) where available."
      : "Verify structural completeness, tone/register consistency, and adherence to all explicit exclusions."
  }
- Honest Completion Report: Summarize exactly what was changed, which validation checks were actually executed vs. unexecuted, and any open assumptions that remain.

DEFINITION OF DONE & OPERATIONAL SAFETY:
${spec.acceptanceCriteria.map((c) => `- ${c}`).join("\n")}`;
}

// ----------------------------------------------------------------------------
// Helper Utilities
// ----------------------------------------------------------------------------

function getRoleForTask(spec: CanonicalProjectSpec): string {
  switch (spec.taskCategory) {
    case "software_development":
      return "Principal Software Architect & Staff Full-Stack Engineer";
    case "research_fact_checking":
      return "Principal Research Methodologist & Evidence Verification Analyst";
    case "study_tutoring":
      return "Master Learning Scientist & Personalized Technical Tutor";
    case "business_planning":
      return "Principal Venture Strategist & Operations Architect";
    case "creative_work":
      return "Executive Creative Director & Master Narrative Architect";
    case "writing_editing":
      return "Senior Managing Editor & Strategic Communications Lead";
    case "data_analysis":
      return "Principal Data Scientist & Quantitative Analytics Lead";
    case "general_purpose":
    default:
      return "Principal Strategic Consultant & Execution Architect";
  }
}

function extractSection(text: string, regexes: RegExp[]): string | null {
  for (const re of regexes) {
    const m = re.exec(text);
    if (m && m[1] && m[1].trim().length > 3) {
      return m[1].trim();
    }
  }
  return null;
}

function extractContextLines(text: string): string[] {
  const lines = text.split("\n");
  const facts: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (
      (trimmed.startsWith("-") ||
        trimmed.startsWith("•") ||
        trimmed.startsWith("*")) &&
      trimmed.length > 8 &&
      !trimmed.includes("DELIVERABLE") &&
      !trimmed.includes("DELIMITER")
    ) {
      facts.push(trimmed.replace(/^[-•*]\s*/, ""));
    } else if (
      (trimmed.toLowerCase().startsWith("budget:") ||
        trimmed.toLowerCase().startsWith("audience:") ||
        trimmed.toLowerCase().startsWith("stack:") ||
        trimmed.toLowerCase().startsWith("timeline:") ||
        trimmed.toLowerCase().startsWith("market:")) &&
      trimmed.length > 10
    ) {
      facts.push(trimmed);
    }
  }

  return facts.slice(0, 6);
}
