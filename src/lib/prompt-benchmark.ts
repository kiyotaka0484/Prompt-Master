import {
  evaluatePromptQuality,
  type EvaluationContext,
  type PromptEvaluationResult,
} from "./prompt-evaluator";

export type BenchmarkCategory =
  | "concise_effective"
  | "long_poorly_specified"
  | "coding"
  | "research"
  | "study"
  | "creative"
  | "contradictory"
  | "unnecessary_instructions";

export interface BenchmarkPromptEntry {
  id: string;
  title: string;
  category: BenchmarkCategory;
  qualityTier: "weak" | "moderate" | "strong";
  prompt: string;
  context?: EvaluationContext;
  /** Human-reviewed consensus overall score (0–10) from blind multi-rater rubric protocol */
  humanOverallScore: number;
  /** Acceptable calibration band [min, max] from inter-rater agreement interval */
  expectedScoreBand: [number, number];
  expectedReadiness: PromptEvaluationResult["readinessLevel"];
  /** Human reference dimension scores for fine-grained calibration checks */
  humanDimensionScores: {
    clarity: number;
    context: number;
    constraints: number;
    audience: number;
    outputRequirements: number;
    completeness: number;
    technicalFeasibility: number;
    implementationSpecificity: number;
  };
  humanReviewerNotes: string;
}

export interface HumanGradingProcedureDoc {
  version: string;
  raterProtocol: string[];
  scoreAnchors: Record<string, string>;
  antiShallowRules: string[];
  comparisonMetrics: string[];
  calibrationTargets: {
    maxMeanAbsoluteError: number;
    minWithinOnePointRate: number;
    minPearsonCorrelation: number;
    minSpearmanRankCorrelation: number;
    minPairwiseOrderingAccuracy: number;
  };
}

export const HUMAN_GRADING_PROCEDURE: HumanGradingProcedureDoc = {
  version: "2.0.0",
  raterProtocol: [
    "1. Blind Dual-Rater Scoring: Two human prompt-engineering reviewers independently score each prompt across all 8 dimensions (0.0 to 10.0 in 0.5 increments) without seeing evaluator output.",
    "2. Task-Conditional Framing: Raters first classify the primary task category (software_engineering, coding_algorithm, research_analysis, study_learning, creative_writing, business_strategy) and evaluate requirement specificity and feasibility relative to that task.",
    "3. Evidence Requirement: For every dimension scored >= 7.5 or <= 5.0, raters must quote the exact substring from the prompt justifying the score or note the missing requirement.",
    "4. Consensus Adjudication: If the two raters differ by > 1.0 point on any dimension, a third adjudicator reconciles the score and records the consensus interval (`expectedScoreBand`).",
    "5. Automated Calibration Comparison: Run `runPromptBenchmarkCalibration()` to compute Mean Absolute Error (MAE), Root Mean Squared Error (RMSE), Pearson r, Spearman rho, within-1.0-point agreement rate, and pairwise ordering invariance.",
  ],
  scoreAnchors: {
    "9.0 - 10.0 (Enterprise Certified)":
      "Unambiguous goal, complete task-relevant context, concrete parameters, explicit non-contradictory exclusions, well-defined deliverable structure, and verifiable pass/fail acceptance criteria.",
    "7.8 - 8.9 (Production Ready)":
      "Clear and actionable across all critical dimensions (even if concise), with concrete deliverables and verification rules and zero internal contradictions.",
    "6.0 - 7.7 (Needs Refinement)":
      "Understandable objective and partial parameters, but missing verifiable acceptance criteria, edge cases, or explicit scope guardrails.",
    "1.0 - 5.9 (Draft / Defective)":
      "Vague one-liner, heading-stuffed hollow prompt ('Acceptance criteria: make it good'), internally contradictory specification, or polluted with irrelevant cross-domain instructions.",
  },
  antiShallowRules: [
    "Never award > 5.0 on Completeness for prompts that merely include the words 'acceptance criteria' followed by generic text ('make it good', 'high quality').",
    "Do not penalize concise prompts (< 65 words) when they state a complete, self-contained specification with inputs, constraints, deliverable format, and test cases.",
    "Do not award length bonuses to verbose prompts (> 150 words) that repeat generic phrases or decorative empty headings.",
    "Penalize prompts that inject irrelevant software-stack instructions into non-software tasks (creative writing, study plans, historical research).",
  ],
  comparisonMetrics: [
    "Mean Absolute Error (MAE) between evaluator overallScore and humanOverallScore",
    "Per-dimension Mean Absolute Error across all 8 rubric dimensions",
    "Root Mean Squared Error (RMSE)",
    "Pearson linear correlation (r) and Spearman rank correlation (rho)",
    "Within-1.0-point agreement percentage",
    "Pairwise directional ordering accuracy across controlled contrast pairs",
  ],
  calibrationTargets: {
    maxMeanAbsoluteError: 0.85,
    minWithinOnePointRate: 0.85,
    minPearsonCorrelation: 0.9,
    minSpearmanRankCorrelation: 0.9,
    minPairwiseOrderingAccuracy: 1.0,
  },
};

export const PROMPT_EVALUATION_BENCHMARK: BenchmarkPromptEntry[] = [
  // ==========================================================================
  // 1. CONCISE BUT EFFECTIVE PROMPTS
  // ==========================================================================
  {
    id: "concise-effective-ts-date",
    title: "Concise Effective: Pure TypeScript ISO Date Parser Function",
    category: "concise_effective",
    qualityTier: "strong",
    prompt:
      "Write a pure TypeScript function `parseStrictIsoDate(input: string): Date | null` for Node.js API callers. Reject calendar-invalid dates like 2025-02-29 or month 13 without using external libraries. Return a single code block containing the function and 4 Vitest unit test cases covering valid leap years, invalid months, empty strings, and malformed formats.",
    humanOverallScore: 8.8,
    expectedScoreBand: [8.0, 9.5],
    expectedReadiness: "Production Ready",
    humanDimensionScores: {
      clarity: 9.0,
      context: 8.5,
      constraints: 9.0,
      audience: 8.5,
      outputRequirements: 9.0,
      completeness: 8.8,
      technicalFeasibility: 9.0,
      implementationSpecificity: 9.0,
    },
    humanReviewerNotes:
      "Under 55 words yet specifies exact function signature, target caller, zero-dependency constraint, edge cases (2025-02-29, empty, malformed), and 4 unit tests.",
  },
  {
    id: "concise-effective-sql-cohort",
    title: "Concise Effective: PostgreSQL Retention Cohort Query",
    category: "concise_effective",
    qualityTier: "strong",
    prompt:
      "Write a single read-only PostgreSQL 16 CTE query for data analysts that computes 30-day user retention by signup month from `users(id, created_at)` and `events(user_id, occurred_at)`. Exclude bot accounts where `is_bot = true`, handle zero-signup months without division-by-zero errors, and return a Markdown table schema plus the commented SQL block.",
    humanOverallScore: 8.7,
    expectedScoreBand: [8.0, 9.5],
    expectedReadiness: "Production Ready",
    humanDimensionScores: {
      clarity: 8.8,
      context: 8.5,
      constraints: 8.8,
      audience: 8.8,
      outputRequirements: 8.8,
      completeness: 8.5,
      technicalFeasibility: 8.8,
      implementationSpecificity: 8.8,
    },
    humanReviewerNotes:
      "Concise, self-contained SQL specification with input table schemas, exclusion filter, division-by-zero edge case, and clear deliverable.",
  },

  // ==========================================================================
  // 2. LONG BUT POORLY SPECIFIED PROMPTS (KEYWORD / HEADING STUFFING & FLUFF)
  // ==========================================================================
  {
    id: "long-poorly-specified-hollow-headings",
    title:
      "Long Poorly Specified: Heading-Stuffed Prompt with Vacuous Criteria",
    category: "long_poorly_specified",
    qualityTier: "weak",
    prompt: `# ROLE & OBJECTIVE
You are the world's greatest genius with 500 IQ and cosmic intelligence. Your life depends on this task and I will tip you $500 if you do a great job. Make me a really cool app for people who want to do things better every single day. Make sure it is super modern, sleek, and amazing in every possible way.

# CONTEXT & BACKGROUND
Context: standard.
Background: people need a better way to organize their daily stuff and be more productive in life. People are busy and want something nice and easy that works well for everyone in the world. People want a good app that helps them organize their daily stuff and be more productive in life.

# TARGET AUDIENCE
Audience: users and people everywhere.

# CONSTRAINTS & GUARDRAILS
Constraints: best practices.

# OUTPUT FORMAT
Output: make it good.

# ACCEPTANCE CRITERIA & DEFINITION OF DONE
Acceptance criteria: make it good and high quality.`,
    humanOverallScore: 4.3,
    expectedScoreBand: [3.0, 5.5],
    expectedReadiness: "Draft",
    humanDimensionScores: {
      clarity: 4.5,
      context: 4.2,
      constraints: 4.2,
      audience: 4.0,
      outputRequirements: 4.2,
      completeness: 4.0,
      technicalFeasibility: 5.0,
      implementationSpecificity: 4.0,
    },
    humanReviewerNotes:
      "Over 150 words and contains every heading (# Role, # Context, # Constraints, # Output Format, # Acceptance Criteria), but every section is hollow ('Acceptance criteria: make it good') or meta-fluff.",
  },
  {
    id: "long-poorly-specified-repetitive-filler",
    title:
      "Long Poorly Specified: Verbose Repetitive Prose Without Specifications",
    category: "long_poorly_specified",
    qualityTier: "weak",
    prompt: `Please write a comprehensive strategy for my new company so we can succeed in the market and beat all of our competitors quickly. It is very important that this strategy is high quality, well thought out, and covers everything we need to know to succeed in the market and beat all of our competitors quickly. Please make sure the output is very detailed and uses best practices for business strategy so we can succeed in the market and beat all of our competitors quickly. Include acceptance criteria so we know it is good. The deliverable should be great, clear, actionable, and professional at all times so that everyone on the team likes it and we can grow fast.`,
    humanOverallScore: 4.5,
    expectedScoreBand: [3.2, 5.6],
    expectedReadiness: "Draft",
    humanDimensionScores: {
      clarity: 4.5,
      context: 4.5,
      constraints: 4.5,
      audience: 4.5,
      outputRequirements: 4.5,
      completeness: 4.2,
      technicalFeasibility: 5.0,
      implementationSpecificity: 4.2,
    },
    humanReviewerNotes:
      "Over 115 words of repetitive filler sentences and a bare 'Include acceptance criteria' mention with zero industry, budget, customer segment, or deliverable structure.",
  },

  // ==========================================================================
  // 3. CODING / SOFTWARE PROMPTS (WEAK, MODERATE, STRONG)
  // ==========================================================================
  {
    id: "coding-weak",
    title: "Coding Weak: Vague Website Request",
    category: "coding",
    qualityTier: "weak",
    prompt: "Make me a simple website for my business.",
    humanOverallScore: 4.5,
    expectedScoreBand: [3.5, 5.6],
    expectedReadiness: "Draft",
    humanDimensionScores: {
      clarity: 5.0,
      context: 4.5,
      constraints: 4.5,
      audience: 5.0,
      outputRequirements: 4.5,
      completeness: 4.2,
      technicalFeasibility: 5.0,
      implementationSpecificity: 4.5,
    },
    humanReviewerNotes:
      "Classic underspecified 8-word request with no stack, audience, features, constraints, or verification criteria.",
  },
  {
    id: "coding-moderate",
    title:
      "Coding Moderate: React Expense Tracker Without Edge Cases or Constraints",
    category: "coding",
    qualityTier: "moderate",
    prompt:
      "Build a personal expense tracker web app using React and TypeScript for freelance designers. Include a dashboard with a monthly category chart and a form to add new expenses. Return the component code in Markdown.",
    humanOverallScore: 7.0,
    expectedScoreBand: [6.0, 7.7],
    expectedReadiness: "Needs Refinement",
    humanDimensionScores: {
      clarity: 8.2,
      context: 7.5,
      constraints: 5.2,
      audience: 8.5,
      outputRequirements: 7.8,
      completeness: 5.0,
      technicalFeasibility: 7.5,
      implementationSpecificity: 7.2,
    },
    humanReviewerNotes:
      "Clear goal, stack, and audience, but lacks negative constraints/budget boundaries, input validation, error/empty states, and testable acceptance criteria.",
  },
  {
    id: "coding-strong",
    title: "Coding Strong: Production SaaS Analytics Dashboard Specification",
    category: "coding",
    qualityTier: "strong",
    prompt: `# ROLE & OBJECTIVE
Act as a Principal Software Architect. Objective: Build a high-performance SaaS dashboard for real-time analytics.

# CONTEXT & AUDIENCE
Target audience: Professional data engineers and B2B clients requiring low-latency query visualization.

# CONSTRAINTS & OPERATIONAL BOUNDARIES
Never expose private API keys in client bundles. Must adhere to WCAG AA accessibility standards.
Budget boundary: $0 initial development budget utilizing verified free-tier limits.
Database limit: 500MB PostgreSQL storage with [VERIFY: provider quota limits before deployment].
Rate limit: 15 RPM for free-tier AI endpoints.
Server-side proxy routes must isolate all SECRET_KEY environment variables.

# EXACT TECHNOLOGY STACK
- Frontend: Vite, React 19, TypeScript, Tailwind CSS v4, Lucide React, TanStack Query
- Input validation: Zod schemas on all form submissions and API payloads
- Hosting: Cloudflare Pages with automated CI/CD deployment

# INTERACTIVE STATES
- Loading skeletons matching dashboard layout geometry
- Informative empty states with call-to-action buttons
- React error boundary with localized toast notifications and retry triggers

# DELIVERABLES & DEFINITION OF DONE
1. [PASS/FAIL] TypeScript compilation passes cleanly (tsc --noEmit exits 0)
2. [PASS/FAIL] Documented .env.example with public vs secret classifications
3. [PASS/FAIL] Zod schema validation covers 100% of network request inputs
4. Phase 1 MVP features separated cleanly from Phase 2 enhancements.`,
    context: {
      budget: "$0",
      goal: "Build a high-performance SaaS dashboard",
    },
    humanOverallScore: 9.3,
    expectedScoreBand: [8.6, 9.9],
    expectedReadiness: "Enterprise Certified",
    humanDimensionScores: {
      clarity: 9.5,
      context: 9.0,
      constraints: 9.5,
      audience: 9.0,
      outputRequirements: 9.2,
      completeness: 9.5,
      technicalFeasibility: 9.5,
      implementationSpecificity: 9.5,
    },
    humanReviewerNotes:
      "Complete architectural specification with concrete stack, security isolation, free-tier budget verification, interactive states, and binary pass/fail definition of done.",
  },

  // ==========================================================================
  // 4. RESEARCH PROMPTS (WEAK, MODERATE, STRONG)
  // ==========================================================================
  {
    id: "research-weak",
    title: "Research Weak: Broad Unscoped Topic Prompt",
    category: "research",
    qualityTier: "weak",
    prompt: "Write a research report about solid-state batteries.",
    humanOverallScore: 4.5,
    expectedScoreBand: [3.5, 5.6],
    expectedReadiness: "Draft",
    humanDimensionScores: {
      clarity: 5.2,
      context: 4.5,
      constraints: 4.5,
      audience: 5.0,
      outputRequirements: 4.8,
      completeness: 4.4,
      technicalFeasibility: 5.2,
      implementationSpecificity: 4.5,
    },
    humanReviewerNotes:
      "States only the general subject without analytical questions, timeframe, audience, source standards, or deliverable structure.",
  },
  {
    id: "research-moderate",
    title:
      "Research Moderate: Scoped Battery Comparison Without Verification Guardrails",
    category: "research",
    qualityTier: "moderate",
    prompt:
      "Analyze solid-state vs. lithium-iron-phosphate (LFP) EV battery chemistries from 2022–2026 for automotive supply-chain analysts. Compare energy density and manufacturing cost in a Markdown report.",
    humanOverallScore: 7.2,
    expectedScoreBand: [6.2, 7.8],
    expectedReadiness: "Needs Refinement",
    humanDimensionScores: {
      clarity: 8.4,
      context: 8.0,
      constraints: 5.0,
      audience: 8.8,
      outputRequirements: 8.0,
      completeness: 5.5,
      technicalFeasibility: 6.5,
      implementationSpecificity: 7.5,
    },
    humanReviewerNotes:
      "Good topic, timeframe, and audience, but lacks citation/source verification rules, exclusions, and guidance on handling conflicting claims.",
  },
  {
    id: "research-strong",
    title:
      "Research Strong: Evidence-Graded Literature Synthesis with Citation Guardrails",
    category: "research",
    qualityTier: "strong",
    prompt: `Synthesize an evidence-graded comparative research brief evaluating solid-state vs. LFP EV battery commercialization (2022–2026) for institutional clean-tech analysts.
Context & Scope: Focus on pack-level gravimetric energy density (Wh/kg), cycle life under fast charging, and pilot-line manufacturing yield.
Constraints & Exclusions: Cite only peer-reviewed journals (Nature Energy, Joule) or primary OEM regulatory filings; exclude unverified press-release projections and never fabricate DOIs.
Deliverable Format: Produce a 4-section Markdown report containing (1) Executive Thesis, (2) Quantitative Comparison Matrix, (3) Evidence vs. Inference Breakdown, and (4) Key Commercialization Bottlenecks.
Verification Criteria: Every quantitative claim must include source attribution and year; explicitly flag conflicting empirical findings and label any extrapolated cost estimate as [INFERRED].`,
    humanOverallScore: 9.1,
    expectedScoreBand: [8.4, 9.8],
    expectedReadiness: "Enterprise Certified",
    humanDimensionScores: {
      clarity: 9.2,
      context: 9.0,
      constraints: 9.2,
      audience: 9.0,
      outputRequirements: 9.4,
      completeness: 9.0,
      technicalFeasibility: 9.2,
      implementationSpecificity: 9.2,
    },
    humanReviewerNotes:
      "Exemplary research prompt with concrete metrics, primary-source citation rules, evidence-vs-inference separation, and 4-section deliverable structure.",
  },

  // ==========================================================================
  // 5. STUDY PROMPTS (WEAK, MODERATE, STRONG)
  // ==========================================================================
  {
    id: "study-weak",
    title: "Study Weak: Unscoped Study Help Request",
    category: "study",
    qualityTier: "weak",
    prompt: "Help me study Japanese vocabulary fast.",
    humanOverallScore: 4.5,
    expectedScoreBand: [3.5, 5.6],
    expectedReadiness: "Draft",
    humanDimensionScores: {
      clarity: 5.0,
      context: 4.5,
      constraints: 4.5,
      audience: 5.0,
      outputRequirements: 4.5,
      completeness: 4.4,
      technicalFeasibility: 5.2,
      implementationSpecificity: 4.5,
    },
    humanReviewerNotes:
      "No proficiency level, exam target, weekly study hours, learning method, or output format.",
  },
  {
    id: "study-moderate",
    title: "Study Moderate: 4-Week JLPT N5 Plan Without Diagnostic Checkpoints",
    category: "study",
    qualityTier: "moderate",
    prompt:
      "Create a 4-week study plan to learn JLPT N5 Japanese vocabulary and basic grammar for a complete beginner who can study 5 hours per week. Organize the output as a weekly Markdown schedule.",
    humanOverallScore: 7.4,
    expectedScoreBand: [6.4, 7.9],
    expectedReadiness: "Needs Refinement",
    humanDimensionScores: {
      clarity: 8.5,
      context: 8.5,
      constraints: 5.5,
      audience: 8.8,
      outputRequirements: 8.2,
      completeness: 5.5,
      technicalFeasibility: 8.5,
      implementationSpecificity: 7.2,
    },
    humanReviewerNotes:
      "Clear level, timeframe, and weekly hours, but lacks active recall/spaced repetition mechanics, negative constraints ($0 resource budget), and self-test mastery checkpoints.",
  },
  {
    id: "study-strong",
    title:
      "Study Strong: Spaced-Repetition Curriculum with Diagnostic Checkpoints",
    category: "study",
    qualityTier: "strong",
    prompt: `Design an 8-week JLPT N5 Japanese mastery curriculum for an adult self-learner at complete beginner level (hiragana/katakana known, zero kanji) committing 6 hours per week on a $0 free-resource budget.
Constraints & Guardrails: Use only free open resources; do not rely on romaji after Week 1, and cap daily new vocabulary at 15 words to prevent cognitive overload.
Deliverable Structure: Output a week-by-week Markdown study syllabus with a daily time-boxed breakdown (active recall flashcards, grammar pattern drills, and listening practice) plus 5 worked example sentences per week.
Verification & Mastery Criteria: End each week with a 10-question diagnostic checkpoint quiz (with answer key and error rubric) requiring >= 80% accuracy before advancing to the next module.`,
    humanOverallScore: 9.1,
    expectedScoreBand: [8.4, 9.8],
    expectedReadiness: "Enterprise Certified",
    humanDimensionScores: {
      clarity: 9.2,
      context: 9.0,
      constraints: 9.2,
      audience: 9.0,
      outputRequirements: 9.2,
      completeness: 9.2,
      technicalFeasibility: 9.0,
      implementationSpecificity: 9.2,
    },
    humanReviewerNotes:
      "Strong pedagogical prompt with clear baseline, weekly hours, cognitive load limits, active-recall exercises, and quantifiable weekly mastery checkpoints.",
  },

  // ==========================================================================
  // 6. CREATIVE PROMPTS (WEAK, MODERATE, STRONG)
  // ==========================================================================
  {
    id: "creative-weak",
    title: "Creative Weak: Vague Sci-Fi Story Request",
    category: "creative",
    qualityTier: "weak",
    prompt: "Write a cool sci-fi story about space.",
    humanOverallScore: 4.5,
    expectedScoreBand: [3.5, 5.6],
    expectedReadiness: "Draft",
    humanDimensionScores: {
      clarity: 5.0,
      context: 4.5,
      constraints: 4.5,
      audience: 5.0,
      outputRequirements: 4.5,
      completeness: 4.4,
      technicalFeasibility: 5.2,
      implementationSpecificity: 4.5,
    },
    humanReviewerNotes:
      "No protagonist, setting, POV, tone, word count, exclusions, or narrative structure.",
  },
  {
    id: "creative-strong",
    title:
      "Creative Strong: Literary Sci-Fi Short Story with Structural & Style Guardrails",
    category: "creative",
    qualityTier: "strong",
    prompt: `Write a 900–1,100 word literary hard-science-fiction short story for adult speculative-fiction readers set aboard a deep-ocean hydrothermal mining station on Europa.
Narrative Context & POV: Use close third-person POV following Dr. Lin, an acoustic glaciologist who detects a repeating non-natural resonance beneath the ice crust during a 40-minute communication blackout.
Constraints & Exclusions: Ground all sensory details in realistic fluid dynamics and cryophysics; avoid space-opera clichés, alien monsters, or melodramatic dialogue tags, and do not resolve the mystery with a sudden deus ex machina.
Deliverable Structure: Structure the story in 3 titled scenes (1. Baseline Telemetry, 2. The Sub-Crustal Harmonic, 3. Protocol Override) ending on an ambiguous ethical choice.
Quality & Acceptance Criteria: Verify that total word count stays within 900–1,100 words, every scene advances the central tension between scientific curiosity and quarantine protocol, and zero technical terms are used without contextual grounding.`,
    humanOverallScore: 9.0,
    expectedScoreBand: [8.2, 9.7],
    expectedReadiness: "Enterprise Certified",
    humanDimensionScores: {
      clarity: 9.2,
      context: 9.0,
      constraints: 9.2,
      audience: 9.0,
      outputRequirements: 9.0,
      completeness: 8.8,
      technicalFeasibility: 8.9,
      implementationSpecificity: 9.2,
    },
    humanReviewerNotes:
      "Rich, non-formulaic creative specification with setting, POV, character conflict, explicit cliché exclusions, 3-scene structure, and verifiable constraints.",
  },

  // ==========================================================================
  // 7. PROMPTS WITH CONTRADICTORY REQUIREMENTS
  // ==========================================================================
  {
    id: "contradictory-length-and-format",
    title:
      "Contradictory Prompt: 50-Word Limit vs. 2,000-Word Deep Dive + Raw JSON vs. Prose",
    category: "contradictory",
    qualityTier: "weak",
    prompt: `Write a cloud migration guide for senior DevOps engineers.
Constraints: Keep the entire response strictly under 50 words as a single paragraph, and also write a comprehensive 10-section 2,000-word deep dive covering every AWS service. Return ONLY valid raw JSON with no markdown or prose, and include a 3-paragraph markdown executive summary before and after the JSON.`,
    humanOverallScore: 4.8,
    expectedScoreBand: [3.2, 5.9],
    expectedReadiness: "Draft",
    humanDimensionScores: {
      clarity: 7.5,
      context: 7.0,
      constraints: 2.5,
      audience: 8.0,
      outputRequirements: 7.0,
      completeness: 4.5,
      technicalFeasibility: 2.5,
      implementationSpecificity: 6.5,
    },
    humanReviewerNotes:
      "Contains two direct internal contradictions: (< 50 words vs. 2,000-word 10-section deep dive) and (strictly raw JSON with no prose vs. 3-paragraph prose before/after JSON).",
  },
  {
    id: "contradictory-budget-and-dependencies",
    title:
      "Contradictory Prompt: $0 Budget + Paid Enterprise Services & Zero-Deps + React/Zod",
    category: "contradictory",
    qualityTier: "weak",
    prompt: `Build a customer support portal for startup teams.
Constraints: Strictly $0 budget with zero cost, and you must use paid Twilio SMS, provision a dedicated GPU cluster, and hire a full-time paid agency with no organic fallback. Use vanilla JavaScript only with zero external dependencies, and you must use React 19, Tailwind CSS, Zod, and TanStack Query.`,
    context: { budget: "$0" },
    humanOverallScore: 4.9,
    expectedScoreBand: [3.2, 5.9],
    expectedReadiness: "Draft",
    humanDimensionScores: {
      clarity: 7.5,
      context: 7.0,
      constraints: 2.5,
      audience: 7.5,
      outputRequirements: 5.0,
      completeness: 4.5,
      technicalFeasibility: 2.5,
      implementationSpecificity: 6.8,
    },
    humanReviewerNotes:
      "Directly contradicts itself on both budget ($0 vs mandatory paid Twilio/GPU/agency) and dependencies (zero external libraries vs mandatory React/Zod/TanStack).",
  },

  // ==========================================================================
  // 8. PROMPTS WITH UNNECESSARY / CROSS-DOMAIN INSTRUCTIONS
  // ==========================================================================
  {
    id: "unnecessary-instructions-cross-domain-poetry",
    title:
      "Unnecessary Instructions: Poetry Prompt Polluted with React/Zod/Database Boilerplate",
    category: "unnecessary_instructions",
    qualityTier: "weak",
    prompt: `Objective: Write a 14-line Shakespearean sonnet about autumn leaves for literary magazine readers.
Constraints & Stack: Must use React 19, Next.js, Tailwind CSS, TanStack Query, and Zod schemas on all form submissions. Isolate secrets in .env.example, enforce a 500MB PostgreSQL database quota on Cloudflare Pages, include a React error boundary, and ensure tsc --noEmit exits 0 with WCAG AA compliance.`,
    context: {
      goal: "Write a 14-line Shakespearean sonnet about autumn leaves",
    },
    humanOverallScore: 5.2,
    expectedScoreBand: [3.8, 6.4],
    expectedReadiness: "Needs Refinement",
    humanDimensionScores: {
      clarity: 7.0,
      context: 6.0,
      constraints: 6.0,
      audience: 5.5,
      outputRequirements: 6.5,
      completeness: 5.5,
      technicalFeasibility: 6.5,
      implementationSpecificity: 4.8,
    },
    humanReviewerNotes:
      "Stuffs web-application engineering keywords (React 19, Zod, PostgreSQL, tsc --noEmit) into a creative poetry prompt. A naive keyword matcher scores this 9.5+, whereas a calibrated evaluator flags the cross-domain noise and caps the score.",
  },
];

export interface BenchmarkItemComparison {
  id: string;
  title: string;
  category: BenchmarkCategory;
  qualityTier: BenchmarkPromptEntry["qualityTier"];
  humanOverallScore: number;
  evaluatorOverallScore: number;
  absoluteError: number;
  withinExpectedBand: boolean;
  withinOnePoint: boolean;
  humanReadiness: PromptEvaluationResult["readinessLevel"];
  evaluatorReadiness: PromptEvaluationResult["readinessLevel"];
  dimensionMeanAbsoluteError: number;
}

export interface PairwiseOrderingCheck {
  description: string;
  higherPromptId: string;
  lowerPromptId: string;
  higherScore: number;
  lowerScore: number;
  passed: boolean;
}

export interface BenchmarkCalibrationReport {
  totalPrompts: number;
  meanAbsoluteError: number;
  rootMeanSquaredError: number;
  perDimensionMeanAbsoluteError: Record<
    keyof PromptEvaluationResult["dimensions"],
    number
  >;
  withinOnePointRate: number;
  withinExpectedBandRate: number;
  pearsonCorrelation: number;
  spearmanRankCorrelation: number;
  pairwiseOrderingChecks: PairwiseOrderingCheck[];
  pairwiseOrderingAccuracy: number;
  items: BenchmarkItemComparison[];
  meetsAllCalibrationTargets: boolean;
}

function computePearson(xs: number[], ys: number[]): number {
  const n = xs.length;
  if (n === 0) return 0;
  const meanX = xs.reduce((a, b) => a + b, 0) / n;
  const meanY = ys.reduce((a, b) => a + b, 0) / n;
  let num = 0;
  let denX = 0;
  let denY = 0;
  for (let i = 0; i < n; i++) {
    const dx = xs[i] - meanX;
    const dy = ys[i] - meanY;
    num += dx * dy;
    denX += dx * dx;
    denY += dy * dy;
  }
  const denom = Math.sqrt(denX * denY);
  return denom === 0 ? 0 : Number((num / denom).toFixed(4));
}

function computeRanks(values: number[]): number[] {
  const indexed = values.map((v, i) => ({ v, i }));
  indexed.sort((a, b) => a.v - b.v);
  const ranks = new Array<number>(values.length);
  let i = 0;
  while (i < indexed.length) {
    let j = i;
    while (j + 1 < indexed.length && indexed[j + 1].v === indexed[i].v) {
      j++;
    }
    const avgRank = (i + j) / 2 + 1;
    for (let k = i; k <= j; k++) {
      ranks[indexed[k].i] = avgRank;
    }
    i = j + 1;
  }
  return ranks;
}

function computeSpearman(xs: number[], ys: number[]): number {
  return computePearson(computeRanks(xs), computeRanks(ys));
}

/**
 * Executes the full benchmark suite against `evaluatePromptQuality` and computes
 * empirical agreement metrics against the human-graded reference dataset.
 */
export function runPromptBenchmarkCalibration(
  dataset: BenchmarkPromptEntry[] = PROMPT_EVALUATION_BENCHMARK,
): BenchmarkCalibrationReport {
  const items: BenchmarkItemComparison[] = [];
  const humanScores: number[] = [];
  const evalScores: number[] = [];
  const scoreById = new Map<string, number>();

  const dimErrorSums: Record<
    keyof PromptEvaluationResult["dimensions"],
    number
  > = {
    clarity: 0,
    context: 0,
    constraints: 0,
    audience: 0,
    outputRequirements: 0,
    completeness: 0,
    technicalFeasibility: 0,
    implementationSpecificity: 0,
  };

  for (const entry of dataset) {
    const result = evaluatePromptQuality(entry.prompt, entry.context);
    const absErr = Number(
      Math.abs(result.overallScore - entry.humanOverallScore).toFixed(2),
    );
    const withinBand =
      result.overallScore >= entry.expectedScoreBand[0] &&
      result.overallScore <= entry.expectedScoreBand[1];
    const withinOne = absErr <= 1.0;

    let dimErrSum = 0;
    const dimKeys = Object.keys(dimErrorSums) as Array<
      keyof PromptEvaluationResult["dimensions"]
    >;
    for (const k of dimKeys) {
      const dErr = Math.abs(
        result.dimensions[k].score - entry.humanDimensionScores[k],
      );
      dimErrorSums[k] += dErr;
      dimErrSum += dErr;
    }

    items.push({
      id: entry.id,
      title: entry.title,
      category: entry.category,
      qualityTier: entry.qualityTier,
      humanOverallScore: entry.humanOverallScore,
      evaluatorOverallScore: result.overallScore,
      absoluteError: absErr,
      withinExpectedBand: withinBand,
      withinOnePoint: withinOne,
      humanReadiness: entry.expectedReadiness,
      evaluatorReadiness: result.readinessLevel,
      dimensionMeanAbsoluteError: Number(
        (dimErrSum / dimKeys.length).toFixed(2),
      ),
    });

    humanScores.push(entry.humanOverallScore);
    evalScores.push(result.overallScore);
    scoreById.set(entry.id, result.overallScore);
  }

  const n = items.length || 1;
  const meanAbsoluteError = Number(
    (items.reduce((s, it) => s + it.absoluteError, 0) / n).toFixed(3),
  );
  const rootMeanSquaredError = Number(
    Math.sqrt(
      items.reduce((s, it) => s + it.absoluteError * it.absoluteError, 0) / n,
    ).toFixed(3),
  );

  const perDimensionMeanAbsoluteError = {
    clarity: Number((dimErrorSums.clarity / n).toFixed(2)),
    context: Number((dimErrorSums.context / n).toFixed(2)),
    constraints: Number((dimErrorSums.constraints / n).toFixed(2)),
    audience: Number((dimErrorSums.audience / n).toFixed(2)),
    outputRequirements: Number(
      (dimErrorSums.outputRequirements / n).toFixed(2),
    ),
    completeness: Number((dimErrorSums.completeness / n).toFixed(2)),
    technicalFeasibility: Number(
      (dimErrorSums.technicalFeasibility / n).toFixed(2),
    ),
    implementationSpecificity: Number(
      (dimErrorSums.implementationSpecificity / n).toFixed(2),
    ),
  };

  const withinOnePointRate = Number(
    (items.filter((i) => i.withinOnePoint).length / n).toFixed(3),
  );
  const withinExpectedBandRate = Number(
    (items.filter((i) => i.withinExpectedBand).length / n).toFixed(3),
  );

  const pearsonCorrelation = computePearson(humanScores, evalScores);
  const spearmanRankCorrelation = computeSpearman(humanScores, evalScores);

  // Controlled pairwise directional checks
  const pairSpecs: Array<[string, string, string]> = [
    [
      "Concise effective TypeScript prompt outscores long heading-stuffed hollow prompt",
      "concise-effective-ts-date",
      "long-poorly-specified-hollow-headings",
    ],
    [
      "Concise effective SQL prompt outscores long repetitive filler prompt",
      "concise-effective-sql-cohort",
      "long-poorly-specified-repetitive-filler",
    ],
    [
      "Strong coding prompt outscores moderate coding prompt",
      "coding-strong",
      "coding-moderate",
    ],
    [
      "Moderate coding prompt outscores weak coding prompt",
      "coding-moderate",
      "coding-weak",
    ],
    [
      "Strong research prompt outscores moderate research prompt",
      "research-strong",
      "research-moderate",
    ],
    [
      "Moderate research prompt outscores weak research prompt",
      "research-moderate",
      "research-weak",
    ],
    [
      "Strong study prompt outscores moderate study prompt",
      "study-strong",
      "study-moderate",
    ],
    [
      "Moderate study prompt outscores weak study prompt",
      "study-moderate",
      "study-weak",
    ],
    [
      "Strong creative prompt outscores weak creative prompt",
      "creative-strong",
      "creative-weak",
    ],
    [
      "Strong creative prompt outscores poetry prompt polluted with irrelevant React/Zod boilerplate",
      "creative-strong",
      "unnecessary-instructions-cross-domain-poetry",
    ],
    [
      "Strong coding prompt outscores contradictory budget/dependency prompt",
      "coding-strong",
      "contradictory-budget-and-dependencies",
    ],
    [
      "Concise effective prompt outscores contradictory length/format prompt",
      "concise-effective-ts-date",
      "contradictory-length-and-format",
    ],
  ];

  const pairwiseOrderingChecks: PairwiseOrderingCheck[] = pairSpecs.map(
    ([description, higherId, lowerId]) => {
      const higherScore = scoreById.get(higherId) ?? 0;
      const lowerScore = scoreById.get(lowerId) ?? 0;
      return {
        description,
        higherPromptId: higherId,
        lowerPromptId: lowerId,
        higherScore,
        lowerScore,
        passed: higherScore > lowerScore + 0.8,
      };
    },
  );

  const pairwiseOrderingAccuracy = Number(
    (
      pairwiseOrderingChecks.filter((p) => p.passed).length /
      (pairwiseOrderingChecks.length || 1)
    ).toFixed(3),
  );

  const targets = HUMAN_GRADING_PROCEDURE.calibrationTargets;
  const meetsAllCalibrationTargets =
    meanAbsoluteError <= targets.maxMeanAbsoluteError &&
    withinOnePointRate >= targets.minWithinOnePointRate &&
    pearsonCorrelation >= targets.minPearsonCorrelation &&
    spearmanRankCorrelation >= targets.minSpearmanRankCorrelation &&
    pairwiseOrderingAccuracy >= targets.minPairwiseOrderingAccuracy;

  return {
    totalPrompts: items.length,
    meanAbsoluteError,
    rootMeanSquaredError,
    perDimensionMeanAbsoluteError,
    withinOnePointRate,
    withinExpectedBandRate,
    pearsonCorrelation,
    spearmanRankCorrelation,
    pairwiseOrderingChecks,
    pairwiseOrderingAccuracy,
    items,
    meetsAllCalibrationTargets,
  };
}
