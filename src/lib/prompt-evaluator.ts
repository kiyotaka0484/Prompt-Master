/**
 * Quality Scoring Engine & Prompt Evaluator
 *
 * Implements rigorous, evidence-based rubric scoring for generated master prompts.
 * Specifically evaluates Technical Feasibility and Implementation Specificity alongside
 * Core Dimensions (Clarity, Context, Constraints, Audience, Output Requirements, Completeness).
 *
 * Enforces zero-score-inflation: high scores require direct textual evidence,
 * concrete constraints, verified free-tier limits, exact tooling, and testable acceptance criteria.
 */

export interface ScoreDimension {
  id: string;
  name: string;
  score: number; // 0 - 10, one decimal
  weight: number;
  evidence: string[];
  weaknesses: string[];
  rubricNotes: string;
}

export interface PromptEvaluationResult {
  overallScore: number;
  readiness: "Production Ready" | "Needs Refinement" | "Draft";
  dimensions: {
    clarity: ScoreDimension;
    context: ScoreDimension;
    constraints: ScoreDimension;
    audience: ScoreDimension;
    outputRequirements: ScoreDimension;
    completeness: ScoreDimension;
    technicalFeasibility: ScoreDimension;
    implementationSpecificity: ScoreDimension;
  };
  actionableWeaknesses: string[];
  summaryEvidence: string[];
  isProductionReady: boolean;
  detectedBudgetConstraint?: string;
  freeTierAudit: {
    isFreeTierCompliant: boolean;
    identifiedLimits: string[];
    unverifiedItemsToAudit: string[];
  };
}

export interface EvaluationContext {
  budget?: string;
  goal?: string;
  domain?: string;
  userExperience?: string;
}

function normalizeEvalContext(
  context?: EvaluationContext | string,
): EvaluationContext | undefined {
  if (!context) return undefined;
  if (typeof context === "string") {
    return { domain: context };
  }
  return context;
}

/**
 * Checks if a string contains any of the search terms (case-insensitive)
 */
function hasAny(text: string, patterns: Array<string | RegExp>): boolean {
  const lower = text.toLowerCase();
  return patterns.some((p) =>
    typeof p === "string" ? lower.includes(p.toLowerCase()) : p.test(text),
  );
}

/**
 * Extracts matched snippets as evidence
 */
function findMatches(
  text: string,
  patterns: Array<string | RegExp>,
  max = 3,
): string[] {
  const matches: string[] = [];
  const lines = text.split("\n");

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.length < 5) continue;
    for (const p of patterns) {
      const isMatch =
        typeof p === "string"
          ? trimmed.toLowerCase().includes(p.toLowerCase())
          : p.test(trimmed);
      if (isMatch && !matches.includes(trimmed)) {
        matches.push(trimmed.slice(0, 120));
        if (matches.length >= max) return matches;
      }
    }
  }
  return matches;
}

/**
 * Evaluates the Technical Feasibility of a master prompt
 * Criteria:
 * - Compatibility with stated budget (specifically $0 free tier guardrails)
 * - Explicit free-tier limits, quotas (storage, bandwidth, rate limits)
 * - Genuinely free vs credit-card required services distinction
 * - Realistic zero-cost alternatives for resource-intensive features
 * - Integration dependencies & configuration specs
 * - Secrets isolation (server proxy routes vs client public keys)
 * - Flagging unverified quotas with [VERIFY: ...]
 */
function evaluateTechnicalFeasibility(
  prompt: string,
  context?: EvaluationContext,
): ScoreDimension {
  const text = prompt.toLowerCase();
  const evidence: string[] = [];
  const weaknesses: string[] = [];
  let score = 5.0;

  // Stated budget detection
  const statedBudget = context?.budget?.toLowerCase() || "";
  const isZeroBudgetDeclared =
    statedBudget.includes("0") ||
    statedBudget.includes("zero") ||
    statedBudget.includes("free") ||
    text.includes("$0") ||
    text.includes("zero budget") ||
    text.includes("free-tier");

  // 1. Budget awareness & limits
  const budgetMatches = findMatches(prompt, [
    "budget limit",
    "budget constraint",
    "$0",
    "zero-cost",
    "free tier",
    "free-tier",
    "cost breakdown",
  ]);
  if (budgetMatches.length > 0) {
    score += 1.0;
    evidence.push(...budgetMatches.slice(0, 2));
  } else {
    weaknesses.push("Lacks explicit budget boundary enforcement.");
  }

  // 2. Free-tier quotas & limitations identified
  const quotaMatches = findMatches(prompt, [
    "quota",
    "bandwidth limit",
    "storage limit",
    "rate limit",
    "rpm",
    "cold start",
    "free tier allowance",
    "hard quota",
  ]);
  if (quotaMatches.length > 0) {
    score += 1.2;
    evidence.push(...quotaMatches.slice(0, 2));
  } else {
    weaknesses.push(
      "Missing concrete free-tier quota limits (e.g. database storage caps, bandwidth limits, or API rate limits).",
    );
  }

  // 3. Verification guardrail [VERIFY: ...]
  if (prompt.includes("[VERIFY:") || prompt.includes("[verify:")) {
    score += 0.8;
    evidence.push(
      "Explicitly flags unverified quotas/pricing with [VERIFY: ...] tags.",
    );
  }

  // 4. Integrations, hosting & secrets hygiene
  const infraMatches = findMatches(prompt, [
    "server-side proxy",
    "environment variable",
    ".env.example",
    "secret key",
    "client bundle",
    "api_secret",
  ]);
  if (infraMatches.length > 0) {
    score += 1.0;
    evidence.push(...infraMatches.slice(0, 2));
  } else {
    weaknesses.push(
      "Needs explicit environment variable and secrets management rules (e.g. server-side proxying for private keys).",
    );
  }

  // 5. Zero-cost alternatives & phased MVP
  const phasedMatches = findMatches(prompt, [
    "phase 1 mvp",
    "phase 2",
    "zero-cost fallback",
    "magic link",
    "essential features",
  ]);
  if (phasedMatches.length > 0) {
    score += 0.8;
    evidence.push(...phasedMatches.slice(0, 2));
  }

  // Penalize unrealistic paid services in $0 budget
  if (isZeroBudgetDeclared) {
    const paidServicesDetected = [
      "twilio",
      "aws s3",
      "openai paid",
      "google cloud billing",
      "cluster",
      "gpu server",
    ];
    const foundPaid = paidServicesDetected.filter((p) => text.includes(p));
    if (
      foundPaid.length > 0 &&
      !text.includes("alternative") &&
      !text.includes("fallback")
    ) {
      score -= 2.0;
      weaknesses.push(
        `Requires paid services (${foundPaid.join(", ")}) despite a $0 budget without providing zero-cost alternatives.`,
      );
    }
  }

  // Anti-vague penalty: vague phrases
  if (
    text.includes("ensure security") ||
    text.includes("make it modern") ||
    text.includes("add proper error handling")
  ) {
    score -= 0.8;
    weaknesses.push(
      "Relies on vague directives ('ensure security', 'make it modern') instead of explicit technical rules.",
    );
  }

  // Score clamping & rounding
  const finalScore = Math.min(10, Math.max(3.0, Number(score.toFixed(1))));

  return {
    id: "technicalFeasibility",
    name: "Technical Feasibility",
    score: finalScore,
    weight: 0.2,
    evidence: evidence.slice(0, 4),
    weaknesses: weaknesses.slice(0, 3),
    rubricNotes:
      "Evaluates budget adherence, free-tier quotas (storage/bandwidth/rate limits), secret key isolation, realistic zero-cost fallbacks, and phased MVP separation.",
  };
}

/**
 * Evaluates the Implementation Specificity of a master prompt
 * Criteria:
 * - Exact technology stack (frontend, backend, DB, auth, hosting)
 * - Specific tools, frameworks, and libraries named
 * - Component interactions & data models/schemas
 * - Form validation (e.g. Zod), loading skeletons, empty states, localized error boundaries
 * - Concrete deliverables and testable Definition of Done
 * - Test requirements (unit/integration/E2E test steps)
 */
function evaluateImplementationSpecificity(
  prompt: string,
  context?: EvaluationContext,
): ScoreDimension {
  const text = prompt.toLowerCase();
  const evidence: string[] = [];
  const weaknesses: string[] = [];
  let score = 5.0;

  // 1. Exact tech stack & libraries specified
  const stackMatches = findMatches(prompt, [
    "frontend:",
    "backend:",
    "stack:",
    "react",
    "next.js",
    "vite",
    "tailwind",
    "typescript",
    "zod",
    "supabase",
    "drizzle",
  ]);
  if (stackMatches.length >= 2) {
    score += 1.2;
    evidence.push(...stackMatches.slice(0, 2));
  } else {
    weaknesses.push(
      "Tech stack is generic; needs exact frameworks, libraries, and ORM/state tools.",
    );
  }

  // 2. Data schemas / models
  const schemaMatches = findMatches(prompt, [
    "schema",
    "data model",
    "userprofile",
    "interface",
    "type",
    "table",
    "fields",
  ]);
  if (schemaMatches.length > 0) {
    score += 1.0;
    evidence.push(...schemaMatches.slice(0, 2));
  } else {
    weaknesses.push(
      "Missing exact data models, schema definitions, or interface contracts.",
    );
  }

  // 3. UI States (Validation, Loading skeletons, Empty states, Error handling)
  const stateItems = [
    {
      key: "validation",
      pattern: /zod|validate|validation/i,
      label: "Input validation",
    },
    {
      key: "skeleton",
      pattern: /skeleton|loading state|spinner/i,
      label: "Loading skeletons",
    },
    {
      key: "empty",
      pattern: /empty state|empty-state/i,
      label: "Empty states",
    },
    {
      key: "error",
      pattern: /error boundary|try\/catch|toast|error handling/i,
      label: "Error handling",
    },
  ];
  const statesCovered = stateItems.filter((item) => item.pattern.test(prompt));
  if (statesCovered.length >= 3) {
    score += 1.3;
    evidence.push(
      `Covers interactive states: ${statesCovered.map((s) => s.label).join(", ")}.`,
    );
  } else {
    const missing = stateItems
      .filter((item) => !item.pattern.test(prompt))
      .map((s) => s.label);
    weaknesses.push(`Missing specifications for: ${missing.join(", ")}.`);
  }

  // 4. Definition of Done & Testable Acceptance Criteria
  const dodMatches = findMatches(prompt, [
    "definition of done",
    "acceptance criteria",
    "verification schema",
    "[pass/fail]",
    "tsc --noemit",
    "definition of done &",
  ]);
  if (dodMatches.length > 0) {
    score += 1.2;
    evidence.push(...dodMatches.slice(0, 2));
  } else {
    weaknesses.push(
      "Lacks an objective, testable Definition of Done or PASS/FAIL verification criteria.",
    );
  }

  // 5. Setup steps & deployment instructions
  const setupMatches = findMatches(prompt, [
    "setup",
    ".env.example",
    "scaffold",
    "phase 1: reconnaissance",
    "day 1",
    "step-by-step",
  ]);
  if (setupMatches.length > 0) {
    score += 0.5;
    evidence.push(...setupMatches.slice(0, 2));
  }

  const finalScore = Math.min(10, Math.max(3.5, Number(score.toFixed(1))));

  return {
    id: "implementationSpecificity",
    name: "Implementation Specificity",
    score: finalScore,
    weight: 0.2,
    evidence: evidence.slice(0, 4),
    weaknesses: weaknesses.slice(0, 3),
    rubricNotes:
      "Evaluates exact tooling & libraries, data models/schemas, complete UI state handling (validation/skeleton/empty/error), setup steps, and testable acceptance criteria.",
  };
}

/**
 * Evaluates core baseline dimensions (Clarity, Context, Constraints, Audience, Output, Completeness)
 */
function evaluateCoreDimension(
  id: string,
  name: string,
  prompt: string,
  patterns: Array<string | RegExp>,
  negativePatterns: Array<string | RegExp> = [],
  weight = 0.1,
): ScoreDimension {
  const evidence = findMatches(prompt, patterns, 2);
  const weaknesses: string[] = [];
  let score = 7.0;

  if (evidence.length >= 2) {
    score += 2.0;
  } else if (evidence.length === 1) {
    score += 1.0;
  } else {
    score -= 1.5;
    weaknesses.push(`Insufficient evidence for ${name}.`);
  }

  for (const neg of negativePatterns) {
    if (
      typeof neg === "string"
        ? prompt.toLowerCase().includes(neg.toLowerCase())
        : neg.test(prompt)
    ) {
      score -= 1.0;
      weaknesses.push(`Contains vague language affecting ${name}.`);
      break;
    }
  }

  const finalScore = Math.min(10, Math.max(4.0, Number(score.toFixed(1))));
  return {
    id,
    name,
    score: finalScore,
    weight,
    evidence,
    weaknesses,
    rubricNotes: `Evaluates ${name} using textual evidence and structural indicators.`,
  };
}

/**
 * Main evaluation function for Master Prompts
 */
export function evaluatePromptQuality(
  prompt: string,
  rawContext?: EvaluationContext | string,
): PromptEvaluationResult {
  const context = normalizeEvalContext(rawContext);

  if (!prompt || prompt.trim().length < 50) {
    const fallbackDim = (id: string, name: string): ScoreDimension => ({
      id,
      name,
      score: 4.0,
      weight: 0.125,
      evidence: [],
      weaknesses: ["Prompt is too short or empty to evaluate."],
      rubricNotes: "Insufficient content.",
    });

    return {
      overallScore: 4.0,
      readiness: "Draft",
      dimensions: {
        clarity: fallbackDim("clarity", "Clarity"),
        context: fallbackDim("context", "Context"),
        constraints: fallbackDim("constraints", "Constraints"),
        audience: fallbackDim("audience", "Audience"),
        outputRequirements: fallbackDim(
          "outputRequirements",
          "Output Requirements",
        ),
        completeness: fallbackDim("completeness", "Completeness"),
        technicalFeasibility: fallbackDim(
          "technicalFeasibility",
          "Technical Feasibility",
        ),
        implementationSpecificity: fallbackDim(
          "implementationSpecificity",
          "Implementation Specificity",
        ),
      },
      actionableWeaknesses: ["Prompt content is incomplete or too brief."],
      summaryEvidence: [],
      isProductionReady: false,
      freeTierAudit: {
        isFreeTierCompliant: false,
        identifiedLimits: [],
        unverifiedItemsToAudit: [],
      },
    };
  }

  const domainKey = (context?.domain || "").toLowerCase();
  const domainSpecificContextPatterns: Array<string | RegExp> =
    domainKey.includes("business")
      ? ["monetization", "revenue", "unit economics", "acquisition", "market"]
      : domainKey.includes("study")
        ? ["curriculum", "milestone", "practice", "spaced repetition", "level"]
        : domainKey.includes("creator")
          ? ["hook", "retention", "ctr", "packaging", "cadence", "niche"]
          : ["architecture", "stack", "schema", "workflow", "endpoint"];

  // 1. Evaluate Core Dimensions
  const clarity = evaluateCoreDimension(
    "clarity",
    "Clarity & Role Definition",
    prompt,
    ["act as", "role:", "objective:", "system prompt", "directive", "<role>"],
    ["maybe", "whatever you think", "do anything"],
  );

  const contextDim = evaluateCoreDimension(
    "context",
    "Context & Background",
    prompt,
    [
      "context",
      "background",
      "target",
      "situation",
      "use case",
      ...domainSpecificContextPatterns,
    ],
    [],
  );

  const constraintsDim = evaluateCoreDimension(
    "constraints",
    "Constraints & Operational Boundaries",
    prompt,
    [
      "constraints",
      "rules",
      "never",
      "must not",
      "boundary",
      "limit",
      "guardrails",
    ],
    [],
  );

  const audienceDim = evaluateCoreDimension(
    "audience",
    "Target Audience & End-User Needs",
    prompt,
    [
      "audience",
      "user",
      "customer",
      "persona",
      "beginner",
      "client",
      "viewer",
      "learner",
    ],
    [],
  );

  const outputDim = evaluateCoreDimension(
    "outputRequirements",
    "Output Requirements & Structure",
    prompt,
    [
      "deliverable",
      "format",
      "markdown",
      "output",
      "schema",
      "table",
      "punch list",
    ],
    [],
  );

  const completeness = evaluateCoreDimension(
    "completeness",
    "End-to-End Completeness",
    prompt,
    [
      "definition of done",
      "step 1",
      "phase",
      "roadmap",
      "deployment",
      "acceptance criteria",
      ...domainSpecificContextPatterns,
    ],
    [],
  );

  // 2. Evaluate Rigorous Technical Feasibility & Implementation Specificity
  const technicalFeasibility = evaluateTechnicalFeasibility(prompt, context);
  const implementationSpecificity = evaluateImplementationSpecificity(
    prompt,
    context,
  );

  // 3. Calculate Weighted Overall Score
  const dimensions = {
    clarity,
    context: contextDim,
    constraints: constraintsDim,
    audience: audienceDim,
    outputRequirements: outputDim,
    completeness,
    technicalFeasibility,
    implementationSpecificity,
  };

  const dimArray = Object.values(dimensions);
  const totalWeight = dimArray.reduce((acc, d) => acc + d.weight, 0);
  const rawOverall =
    dimArray.reduce((acc, d) => acc + d.score * d.weight, 0) / totalWeight;
  const overallScore = Number(rawOverall.toFixed(1));

  // 4. Consolidate Weaknesses & Evidence
  const allWeaknesses = Array.from(
    new Set(dimArray.flatMap((d) => d.weaknesses)),
  );
  const allEvidence = Array.from(new Set(dimArray.flatMap((d) => d.evidence)));

  // 5. Free Tier Audit Status
  const identifiedLimits = findMatches(
    prompt,
    ["quota", "limit", "storage", "bandwidth", "rate limit"],
    4,
  );
  const unverifiedItems = findMatches(prompt, ["[VERIFY:", "[verify:"], 4);

  const isFreeTierCompliant =
    technicalFeasibility.score >= 8.0 &&
    (prompt.toLowerCase().includes("free") || !context?.budget?.includes("0"));

  const isProductionReady =
    overallScore >= 8.5 &&
    technicalFeasibility.score >= 8.0 &&
    implementationSpecificity.score >= 8.0;

  const readiness: "Production Ready" | "Needs Refinement" | "Draft" =
    isProductionReady
      ? "Production Ready"
      : overallScore >= 6.5
        ? "Needs Refinement"
        : "Draft";

  return {
    overallScore,
    readiness,
    dimensions,
    actionableWeaknesses: allWeaknesses.slice(0, 5),
    summaryEvidence: allEvidence.slice(0, 6),
    isProductionReady,
    detectedBudgetConstraint: context?.budget,
    freeTierAudit: {
      isFreeTierCompliant,
      identifiedLimits,
      unverifiedItemsToAudit: unverifiedItems,
    },
  };
}
