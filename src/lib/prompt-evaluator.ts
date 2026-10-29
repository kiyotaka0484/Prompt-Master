import type { ProjectProfile } from "./project-understanding-engine";
import { DEFAULT_GEMINI_MODEL, getModel, validateApiKey } from "./ai-provider";
import { generateText } from "ai";

export type EvaluatorTaskCategory =
  | "software_engineering"
  | "coding_algorithm"
  | "research_analysis"
  | "study_learning"
  | "creative_writing"
  | "business_strategy"
  | "general";

export interface ScoreDimension {
  id: string;
  name: string;
  score: number; // 0 to 10
  weight: number; // 0 to 1 (sums to 1.0)
  /** Whether this dimension is directly applicable to the detected task type */
  applicable: boolean;
  /** What is already working well in this dimension */
  workingWell: string;
  /** Specific verbatim quotes or concrete evidence spans from the prompt */
  evidence: string[];
  /** The single most important weakness for this dimension */
  primaryWeakness: string;
  /** Backward-compatible list of weaknesses */
  weaknesses: string[];
  /** A concrete, task-specific improvement recommendation */
  concreteImprovement: string;
  rubricNotes: string;
}

export interface PrioritizedImprovement {
  rank: number;
  dimensionId: keyof PromptEvaluationResult["dimensions"];
  dimensionName: string;
  issue: string;
  recommendation: string;
  expectedImpact: "high" | "medium";
  estimatedScoreGain: number;
}

export interface InternalConsistencyAudit {
  isConsistent: boolean;
  score: number; // 0 to 10
  contradictions: string[];
}

export interface RelevanceAndEfficiencyAudit {
  isRelevantAndEfficient: boolean;
  score: number; // 0 to 10
  taskCategory: EvaluatorTaskCategory;
  unnecessaryInstructions: string[];
  hollowConstructs: string[];
  bloatIndicators: string[];
}

export interface RubricDimensionMappingDoc {
  dimensionId: string;
  preservedName: string;
  meaningfulQualityAssessed: string;
  legacyMeaning: string;
  updatedMeaning: string;
}

export const RUBRIC_MAPPING_DOCUMENTATION: Record<
  string,
  RubricDimensionMappingDoc
> = {
  clarity: {
    dimensionId: "clarity",
    preservedName: "Clarity & Intent",
    meaningfulQualityAssessed: "Goal clarity",
    legacyMeaning:
      "Checked for literal persona/role keywords ('act as', 'objective:').",
    updatedMeaning:
      "Evaluates whether the primary objective, intended action, and target subject are unambiguous and concrete—without requiring formulaic 'Act as' phrasing.",
  },
  context: {
    dimensionId: "context",
    preservedName: "Context & Background",
    meaningfulQualityAssessed: "Context sufficiency",
    legacyMeaning:
      "Counted occurrences of generic words like 'context', 'background', or 'scenario'.",
    updatedMeaning:
      "Assesses whether task-critical background, inputs, or domain framing are provided, while distinguishing genuinely missing context from details not needed for self-contained prompts.",
  },
  constraints: {
    dimensionId: "constraints",
    preservedName: "Constraints & Guardrails",
    meaningfulQualityAssessed: "Constraint quality & Internal consistency",
    legacyMeaning:
      "Counted words like 'must', 'never', or 'limit' regardless of substance or internal conflict.",
    updatedMeaning:
      "Evaluates whether scope boundaries, exclusions, and operational limits are specific and internally consistent—heavily penalizing unaddressed contradictions.",
  },
  audience: {
    dimensionId: "audience",
    preservedName: "Target Audience",
    meaningfulQualityAssessed:
      "Relevance, efficiency & target audience calibration",
    legacyMeaning:
      "Checked for literal words like 'audience', 'user', or 'beginner'.",
    updatedMeaning:
      "Assesses target audience/level calibration AND prompt relevance and efficiency—penalizing filler bloat, repetitive instructions, and cross-domain irrelevant boilerplate.",
  },
  outputRequirements: {
    dimensionId: "outputRequirements",
    preservedName: "Output Format & Structure",
    meaningfulQualityAssessed: "Deliverable definition",
    legacyMeaning:
      "Rewarded any mention of 'output', 'format', 'table', or 'markdown'.",
    updatedMeaning:
      "Evaluates whether the expected deliverable artifact, structure, schema, or response organization is concretely specified for the task.",
  },
  completeness: {
    dimensionId: "completeness",
    preservedName: "Completeness & Edge Cases",
    meaningfulQualityAssessed: "Testability and acceptance criteria",
    legacyMeaning:
      "Gave automatic credit for the phrase 'acceptance criteria' or 'definition of done'.",
    updatedMeaning:
      "Requires verifiable pass/fail conditions, concrete edge-case handling, or measurable quality checks; explicitly rejects hollow phrases like 'Acceptance criteria: make it good'.",
  },
  technicalFeasibility: {
    dimensionId: "technicalFeasibility",
    preservedName: "Technical Feasibility",
    meaningfulQualityAssessed: "Operational feasibility & internal consistency",
    legacyMeaning:
      "Checked software-specific free-tier and secret keywords across all prompts.",
    updatedMeaning:
      "Evaluates task-appropriate operational realism (budget vs. paid service compatibility, secret isolation for apps, source verification for research, realistic pacing for study) and flags contradictory resource claims.",
  },
  implementationSpecificity: {
    dimensionId: "implementationSpecificity",
    preservedName: "Implementation Specificity",
    meaningfulQualityAssessed: "Requirement specificity",
    legacyMeaning:
      "Rewarded software framework names (React, Tailwind, Zod) or domain keywords.",
    updatedMeaning:
      "Evaluates whether functional requirements, parameters, inputs/outputs, and domain constraints are concrete and relevant to the actual task without enforcing a single universal template.",
  },
};

export const EXECUTION_QUALITY_DISCLAIMER =
  "Prompt Quality vs. Execution Quality: This score measures the clarity, completeness, internal consistency, and verifiability of the prompt specification itself. A high prompt score reduces ambiguity and hallucination risk, but does not guarantee flawless execution—actual output quality also depends on the target AI model's reasoning capabilities, runtime environment, and external data availability.";

export interface PromptEvaluationResult {
  overallScore: number; // 0 to 10 (1 decimal place)
  readinessLevel:
    "Draft" | "Needs Refinement" | "Production Ready" | "Enterprise Certified";
  isProductionReady: boolean;
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
  /** Explicit scores for the 8 meaningful qualities */
  meaningfulQualities: {
    goalClarity: number;
    contextSufficiency: number;
    requirementSpecificity: number;
    constraintQuality: number;
    deliverableDefinition: number;
    testabilityAndAcceptance: number;
    internalConsistency: number;
    relevanceAndEfficiency: number;
  };
  /** Smallest number of highest-leverage changes (1 to 3) that would most improve the prompt */
  prioritizedImprovements: PrioritizedImprovement[];
  /** Backward-compatible list of top actionable weaknesses (capped to top highest-leverage items) */
  actionableWeaknesses: string[];
  /** Genuinely missing task-relevant requirements (without prescribing a rigid universal template) */
  missingRequirements: string[];
  summaryEvidence: string[];
  detectedBudgetConstraint?: string;
  internalConsistencyAudit: InternalConsistencyAudit;
  relevanceAndEfficiencyAudit: RelevanceAndEfficiencyAudit;
  executionQualityDisclaimer: string;
  qualityDistinction: {
    promptQualityMeasures: string[];
    executionQualityRequires: string[];
    disclaimer: string;
  };
  rubricMappingDocumentation: Record<string, RubricDimensionMappingDoc>;
  evaluationMethod: "deterministic" | "hybrid_ai_validated";
}

export interface EvaluationContext {
  budget?: string;
  experienceLevel?: string;
  domain?: string;
  goal?: string;
  projectProfile?: ProjectProfile;
  /** Optional hook for semantic AI scorer override in tests or server routes */
  semanticScorer?: (
    prompt: string,
    deterministicBaseline: PromptEvaluationResult,
  ) => Promise<Partial<
    Record<
      keyof PromptEvaluationResult["dimensions"],
      {
        score?: number;
        workingWell?: string;
        evidence?: string[];
        primaryWeakness?: string;
        concreteImprovement?: string;
      }
    >
  > | null>;
}

// ============================================================================
// HELPER UTILITIES: EVIDENCE EXTRACTION & TASK CLASSIFICATION
// ============================================================================

function clampScore(value: number): number {
  return Number(Math.max(1.0, Math.min(10.0, value)).toFixed(1));
}

function splitSentencesAndLines(prompt: string): string[] {
  return prompt
    .split(/\n+|(?<=[.!?])\s+/)
    .map((s) => s.replace(/^[#*\->\d.)\s]+/, "").trim())
    .filter((s) => s.length >= 6);
}

/**
 * Extracts verbatim evidence spans from the prompt matching any of the provided patterns,
 * filtering out hollow headings or vacuous statements.
 */
function extractEvidenceQuotes(
  prompt: string,
  patterns: RegExp[],
  maxQuotes = 3,
): string[] {
  const candidates = splitSentencesAndLines(prompt);
  const found: string[] = [];

  for (const line of candidates) {
    if (found.length >= maxQuotes) break;
    // Skip lines that are just a heading label or hollow filler
    if (
      /^(role|objective|context|constraints?|acceptance criteria|output|deliverables?|definition of done)\s*:?$/i.test(
        line,
      )
    ) {
      continue;
    }
    if (isVacuousStatement(line)) {
      continue;
    }
    for (const pat of patterns) {
      if (pat.test(line)) {
        const snippet =
          line.length > 130 ? `${line.slice(0, 127).trim()}...` : line;
        if (
          !found.some(
            (existing) => existing.toLowerCase() === snippet.toLowerCase(),
          )
        ) {
          found.push(`"${snippet}"`);
        }
        break;
      }
    }
  }
  return found;
}

const VACUOUS_VALUE_RE =
  /^(make it good|make it great|make it nice|be good|high quality|best quality|do a good job|do your best|best practices|standard|normal|default|none|n\/a|na|tbd|todo|anything|whatever|up to you|it should work|works well|looks good|fast and good|accurate and good|clear and concise|someone|somebody|anyone|users?|people|stuff|things)\.?$/i;

function isVacuousStatement(text: string): boolean {
  const cleaned = text
    .replace(
      /^(acceptance criteria|definition of done|constraints?|context|audience|target audience|output|deliverables?|format|goal|objective|requirements?)\s*:\s*/i,
      "",
    )
    .trim();
  if (!cleaned) return true;
  if (VACUOUS_VALUE_RE.test(cleaned)) return true;
  if (
    cleaned.split(/\s+/).length <= 3 &&
    /^(good|great|nice|best|clean|modern|simple|easy|fast|proper|correct|fine)\b/i.test(
      cleaned,
    )
  ) {
    return true;
  }
  return false;
}

export interface HollowDetectionResult {
  hollowConstructs: string[];
  hasHollowAcceptanceCriteria: boolean;
  hasHollowConstraints: boolean;
  hasHollowContext: boolean;
  hasHollowOutput: boolean;
  emptyHeadingCount: number;
  substantiveHeadingCount: number;
  cleanedPromptForScoring: string;
}

/**
 * Detects shallow keyword stuffing, empty markdown headings, and vacuous label:value pairs
 * (e.g. "Acceptance criteria: make it good") and strips them from the text used for positive scoring.
 */
export function detectHollowConstructs(prompt: string): HollowDetectionResult {
  const hollowConstructs: string[] = [];
  let hasHollowAcceptanceCriteria = false;
  let hasHollowConstraints = false;
  let hasHollowContext = false;
  let hasHollowOutput = false;
  let emptyHeadingCount = 0;
  let substantiveHeadingCount = 0;

  const lines = prompt.split(/\r?\n/);
  const cleanedLines: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) {
      cleanedLines.push("");
      continue;
    }

    // Check inline "Label: value" constructs
    const inlineMatch =
      /^(?:#+\s*)?\*{0,2}(acceptance criteria|definition of done|testability|verification|constraints?|guardrails?|context|background|target audience|audience|output(?: format)?|deliverables?)\*{0,2}\s*:\s*(.*)$/i.exec(
        line,
      );
    if (inlineMatch) {
      const label = inlineMatch[1].toLowerCase();
      const val = inlineMatch[2].trim();
      if (!val || isVacuousStatement(val)) {
        // Check if next line has substantive content (in case colon was followed by newline list)
        const nextLine = (lines[i + 1] || "").trim();
        const nextIsHeading =
          /^#+\s+/.test(nextLine) ||
          /^(context|constraints?|output|acceptance criteria|role|objective)\s*:/i.test(
            nextLine,
          );
        if (
          !val &&
          nextLine &&
          !nextIsHeading &&
          !isVacuousStatement(nextLine)
        ) {
          substantiveHeadingCount++;
          cleanedLines.push(lines[i]);
          continue;
        }
        hollowConstructs.push(
          `Hollow "${inlineMatch[1]}" declaration ("${line.slice(0, 80)}") provides no concrete specification.`,
        );
        if (
          /acceptance|definition of done|testability|verification/.test(label)
        ) {
          hasHollowAcceptanceCriteria = true;
        } else if (/constraint|guardrail/.test(label)) {
          hasHollowConstraints = true;
        } else if (/context|background|audience/.test(label)) {
          hasHollowContext = true;
        } else if (/output|deliverable/.test(label)) {
          hasHollowOutput = true;
        }
        // Omit from cleanedLines so shallow keyword matchers cannot reward it
        continue;
      }
    }

    // Check Markdown Headings (# Heading)
    const headingMatch = /^(#{1,4})\s+(.+)$/.exec(line);
    if (headingMatch) {
      const headingTitle = headingMatch[2].trim();
      // Gather body until next heading
      const bodyLines: string[] = [];
      let j = i + 1;
      while (j < lines.length && !/^#{1,4}\s+/.test(lines[j].trim())) {
        if (lines[j].trim()) bodyLines.push(lines[j].trim());
        j++;
      }
      const bodyText = bodyLines.join(" ").trim();
      if (!bodyText || isVacuousStatement(bodyText) || bodyText.length < 12) {
        emptyHeadingCount++;
        hollowConstructs.push(
          `Heading "${headingTitle}" has an empty or vacuous section body (${bodyText ? `"${bodyText}"` : "empty"}).`,
        );
        if (
          /acceptance|definition of done|deliverable|verification|test/i.test(
            headingTitle,
          )
        ) {
          hasHollowAcceptanceCriteria = true;
        }
        if (/constraint|boundary|guardrail/i.test(headingTitle)) {
          hasHollowConstraints = true;
        }
        if (/context|background/i.test(headingTitle)) {
          hasHollowContext = true;
        }
        if (/output|format/i.test(headingTitle)) {
          hasHollowOutput = true;
        }
        // Skip heading and its vacuous body
        i = j - 1;
        continue;
      } else {
        substantiveHeadingCount++;
      }
    }

    cleanedLines.push(lines[i]);
  }

  // Also check inline mentions like "Include acceptance criteria." or "Must have acceptance criteria" with no actual criteria
  const cleanedPrompt = cleanedLines.join("\n");
  const lowerCleaned = cleanedPrompt.toLowerCase();
  if (
    lowerCleaned.includes("acceptance criteria") &&
    !/(\[pass\/fail\]|pass\/fail|given\s+.+when\s+.+then|must\s+(return|render|compile|pass|reject|output|complete|include|validate)|exits?\s+0|100%|test\s+cases?|assert|verify\s+that|\b\d+\s+(tests?|cases?|examples?|questions?|sections?|words?))/i.test(
      cleanedPrompt,
    )
  ) {
    // Check if the sentence containing "acceptance criteria" is just a bare mention
    const acSentences = splitSentencesAndLines(cleanedPrompt).filter((s) =>
      /acceptance criteria/i.test(s),
    );
    const allBare =
      acSentences.length > 0 &&
      acSentences.every(
        (s) =>
          s.split(/\s+/).length < 9 ||
          /make it good|high quality|works? well|be clear|include acceptance criteria\.?$/i.test(
            s,
          ),
      );
    if (allBare) {
      hasHollowAcceptanceCriteria = true;
      hollowConstructs.push(
        `Mentions the phrase "acceptance criteria" without defining any verifiable pass/fail conditions.`,
      );
    }
  }

  return {
    hollowConstructs,
    hasHollowAcceptanceCriteria,
    hasHollowConstraints,
    hasHollowContext,
    hasHollowOutput,
    emptyHeadingCount,
    substantiveHeadingCount,
    cleanedPromptForScoring: cleanedPrompt,
  };
}

/**
 * Classifies the actual primary task category of a prompt so that non-software tasks
 * are not penalized for lacking software stacks, and cross-domain irrelevant boilerplate
 * is accurately detected.
 */
export function classifyEvaluatorTaskCategory(
  prompt: string,
  context?: EvaluationContext,
): EvaluatorTaskCategory {
  const goalHeaderMatch =
    /(?:primary\s+objective|objective|goal|<goal>)\s*:?\s*([^\n<]{10,240})/i.exec(
      prompt,
    );
  const firstMeaningfulLines = prompt
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(
      (l) => l.length > 10 && !/^#+\s*(role|context|constraints)/i.test(l),
    )
    .slice(0, 3)
    .join(" ");

  // Prioritize explicit goal context or primary objective statement over boilerplate body
  const primarySignalText = [
    context?.goal || "",
    context?.projectProfile?.primaryGoal?.value || "",
    goalHeaderMatch?.[1] || "",
    firstMeaningfulLines,
  ]
    .join(" ")
    .toLowerCase();

  const fullLower = prompt.toLowerCase();

  // 1. Study / Learning / Curriculum
  if (
    /\b(study\s+plan|curriculum|syllabus|flashcards?|spaced\s+repetition|active\s+recall|exam\s+prep|learn(?:ing)?\s+roadmap|practice\s+problems?|tutor(?:ing)?|quiz|master\s+the\s+fundamentals|jlpt|ap\s+biology|calculus|linear\s+algebra|lsat|mcat)\b/i.test(
      primarySignalText,
    ) ||
    context?.domain === "study"
  ) {
    // Exception: if the goal is explicitly to build a software app FOR flashcards/study
    if (
      /\b(build|develop|code|implement)\s+(a|an)\s+(full-stack|web\s+app|mobile\s+app|react|saas|platform|tool)\b/i.test(
        primarySignalText,
      )
    ) {
      return "software_engineering";
    }
    return "study_learning";
  }

  // 2. Research / Synthesis / Literature Review
  if (
    /\b(literature\s+review|research\s+(report|brief|synthesis|questions|paper)|systematic\s+review|comparative\s+analysis|analyze\s+[^\n]+?\s+vs\.?\s+|cite\s+primary\s+sources|peer-reviewed|meta-analysis|investigative\s+report|evidence\s+synthesis|market\s+intelligence\s+report|fact-check)\b/i.test(
      primarySignalText,
    )
  ) {
    return "research_analysis";
  }

  // 3. Creative Writing / Content / Editorial
  if (
    /\b(short\s+story|novel|poem|poetry|sonnet|screenplay|dialogue|fiction|narrative|op-ed|blog\s+post|newsletter\s+issue|youtube\s+script|video\s+script|monologue|essay|copywriting|brand\s+story|lyrics)\b/i.test(
      primarySignalText,
    ) ||
    (context?.domain === "creator" &&
      !/\b(web\s+app|saas|react|database|api)\b/i.test(primarySignalText))
  ) {
    return "creative_writing";
  }

  // 4. Focused Coding / Algorithm / Function / Script / SQL Query
  if (
    /\b(function|algorithm|regex|regular\s+expression|sql\s+query|cte\s+query|postgresql\s+\d*\s*(?:cte\s+)?query|select\s+query|python\s+script|typescript\s+function|unit\s+tests?|parse|refactor|class|method|leetcode|data\s+structure|cli\s+script)\b/i.test(
      primarySignalText,
    ) &&
    !/\b(full-stack|saas|landing\s+page|hosting|vercel|cloudflare|supabase|stripe\s+checkout)\b/i.test(
      primarySignalText,
    )
  ) {
    return "coding_algorithm";
  }

  // 5. Business / GTM / Operations Strategy (checked before software_engineering so "B2B SaaS pricing playbook" is classified as business_strategy)
  if (
    (/\b(business\s+plan|go-to-market|gtm|pricing\s+(?:strategy|playbook|model)|monetization|unit\s+economics|customer\s+acquisition|b2b\s+sales|pitch\s+deck|financial\s+model|onboarding\s+playbook)\b/i.test(
      primarySignalText,
    ) ||
      context?.domain === "business") &&
    !/\b(build|develop|code|implement)\s+(?:a|an|the)?\s*(?:full-stack|web\s+app|mobile\s+app|react|next\.js|typescript|software\s+application)\b/i.test(
      primarySignalText,
    )
  ) {
    return "business_strategy";
  }

  // 6. Software Engineering / Web App / System Architecture
  if (
    /\b(web\s+app|website|full-stack|frontend|backend|saas|dashboard|portfolio\s+site|e-commerce|react|next\.js|typescript|tailwind|api|database|supabase|postgres|microservice|mobile\s+app)\b/i.test(
      primarySignalText,
    ) ||
    context?.domain === "website"
  ) {
    return "software_engineering";
  }

  // Fallback inspection of full prompt
  if (
    /\b(study\s+plan|flashcards?|curriculum|spaced\s+repetition)\b/i.test(
      fullLower,
    )
  ) {
    return "study_learning";
  }
  if (
    /\b(cite\s+sources|peer-reviewed|research\s+synthesis|primary\s+sources)\b/i.test(
      fullLower,
    )
  ) {
    return "research_analysis";
  }
  if (
    /\b(short\s+story|protagonist|narrative\s+arc|poem|stanza|screenplay)\b/i.test(
      fullLower,
    )
  ) {
    return "creative_writing";
  }
  if (
    /\b(function\s+\w+|unit\s+test|time\s+complexity|o\(n)\b/i.test(fullLower)
  ) {
    return "coding_algorithm";
  }
  if (
    /\b(react|typescript|tailwind|database|endpoint|component|hosting)\b/i.test(
      fullLower,
    )
  ) {
    return "software_engineering";
  }

  return "general";
}

// ============================================================================
// INTERNAL CONSISTENCY & CONTRADICTION AUDITOR
// ============================================================================

/**
 * Checks whether a prompt contains internal contradictions across length, budget,
 * dependencies, connectivity, audience calibration, or output format.
 * Distinguishes prompts that *explicitly flag* a user contradiction as a guardrail
 * (e.g., "[CONFLICT REQUIRING RESOLUTION]") from prompts that blindly demand conflicting instructions.
 */
export function auditInternalConsistency(
  prompt: string,
  context?: EvaluationContext,
): InternalConsistencyAudit {
  const contradictions: string[] = [];
  const lower = prompt.toLowerCase();

  // Check if the prompt explicitly frames conflicts inside a resolution/guardrail block
  const hasExplicitConflictGuardrail =
    /(\[conflict\s+requiring\s+resolution|unresolved\s+contradictions?\s+requiring|\[unresolved\s+conflict\s+disclosure\]|conflict\s+guardrail|contradiction\s+detected)/i.test(
      prompt,
    );

  // 1. Length / Word-Count Contradictions
  const demandsVeryShort =
    /\b(under\s+(?:50|75|100|150)\s+words|maximum\s+(?:of\s+)?(?:50|75|100)\s+words|at\s+most\s+(?:50|100)\s+words|single\s+tweet|one-sentence\s+response|1-sentence\s+summary|strictly\s+1\s+paragraph|exact(?:ly)?\s+3\s+bullet\s+points\s+only)\b/i.test(
      prompt,
    );
  const demandsVeryLong =
    /\b(at\s+least\s+(?:1,?000|1,?500|2,?000|3,?000|5,?000)\s+words|(?:2,?000|3,?000|5,?000)-word\s+(?:deep\s+dive|essay|guide|manual|report)|comprehensive\s+10-section|exhaustive\s+multi-chapter|minimum\s+(?:of\s+)?(?:1,?000|2,?000)\s+words)\b/i.test(
      prompt,
    );
  if (demandsVeryShort && demandsVeryLong) {
    contradictions.push(
      "Length contradiction: Prompt simultaneously demands an ultra-short output (e.g., under 100 words / single paragraph) and an extensive long-form deliverable (e.g., 1,500–3,000+ words or multi-section manual).",
    );
  }

  // 2. Budget vs. Mandatory Paid Infrastructure / Ad Spend (when not framed as a conflict guardrail)
  const isZeroBudget =
    /\b(\$0\s+budget|zero\s+budget|strictly\s+\$0|100%\s+free(?:\s+tier)?\s+only|zero\s+cost|no\s+money|without\s+spending\s+any\s+money)\b/i.test(
      prompt,
    ) ||
    context?.budget === "$0" ||
    context?.budget?.toLowerCase().includes("free");

  const demandsPaidWithoutFallback =
    /\b(must\s+use\s+paid|require(?:s|d)?\s+paid\s+(?:ads|linkedin|google\s+ads|twilio|agency)|hire\s+a\s+full-time\s+paid\s+agency|provision\s+a\s+dedicated\s+gpu\s+cluster|use\s+aws\s+rds\s+enterprise|mandatory\s+\$500\/mo|run\s+paid\s+ad\s+campaigns\s+with\s+no\s+organic\s+fallback)\b/i.test(
      prompt,
    );

  if (
    isZeroBudget &&
    demandsPaidWithoutFallback &&
    !hasExplicitConflictGuardrail
  ) {
    contradictions.push(
      "Budget contradiction: Prompt specifies a $0 / free-only budget constraint while mandating paid services, paid ad spend, or enterprise infrastructure without a free-tier fallback.",
    );
  }

  // 3. Dependency / Library Contradictions
  const forbidsExternalLibraries =
    /\b(zero\s+external\s+dependencies|no\s+external\s+(?:libraries|packages|dependencies)|standard\s+library\s+only|vanilla\s+(?:javascript|js|python|css)\s+only\s+with\s+no\s+(?:frameworks|libraries)|do\s+not\s+import\s+any\s+third-party\s+packages)\b/i.test(
      prompt,
    );
  const requiresThirdPartyPackages =
    /\b(must\s+use\s+(?:react|next\.js|zod|tanstack|tailwind|prisma|sqlalchemy|pandas|numpy|express|lodash|axios)|import\s+zod\s+and\s+tanstack|use\s+react\s+19\s+and\s+tailwind)\b/i.test(
      prompt,
    );
  if (
    forbidsExternalLibraries &&
    requiresThirdPartyPackages &&
    !hasExplicitConflictGuardrail
  ) {
    contradictions.push(
      "Dependency contradiction: Prompt forbids external third-party libraries/frameworks ('standard library / vanilla only') while simultaneously requiring third-party packages (e.g., React, Zod, TanStack, Pandas).",
    );
  }

  // 4. Connectivity / Runtime Environment Contradictions
  const requiresStrictOffline =
    /\b(100%\s+offline|strictly\s+offline|air-gapped|zero\s+network\s+calls|no\s+internet\s+access|never\s+make\s+network\s+requests)\b/i.test(
      prompt,
    );
  const requiresLiveCloudApis =
    /\b(fetch\s+live\s+real-time\s+data\s+from|call\s+the\s+live\s+(?:openai|stripe|weather|stock)\s+api|stream\s+live\s+webhook\s+events|query\s+live\s+web\s+search)\b/i.test(
      prompt,
    );
  if (
    requiresStrictOffline &&
    requiresLiveCloudApis &&
    !hasExplicitConflictGuardrail
  ) {
    contradictions.push(
      "Runtime connectivity contradiction: Prompt requires 100% offline / zero-network execution while simultaneously requiring live external cloud API calls or webhooks.",
    );
  }

  // Static hosting vs persistent backend server
  const requiresStaticOnly =
    /\b(github\s+pages\s+static\s+html\s+only|purely\s+static\s+html\s+hosting\s+with\s+no\s+server)\b/i.test(
      prompt,
    );
  const requiresPersistentServer =
    /\b(run\s+a\s+persistent\s+express\s+server|local\s+sqlite\s+database\s+server\s+with\s+python\s+backend|long-running\s+websocket\s+daemon)\b/i.test(
      prompt,
    );
  if (
    requiresStaticOnly &&
    requiresPersistentServer &&
    !hasExplicitConflictGuardrail
  ) {
    contradictions.push(
      "Deployment architecture contradiction: Prompt mandates static-only HTML hosting (e.g., GitHub Pages) alongside a persistent stateful backend server (e.g., Express/SQLite/Python daemon).",
    );
  }

  // 5. Output Format Contradictions (e.g., "Return ONLY raw JSON, no prose" + "Include a 3-paragraph prose introduction outside the JSON")
  const demandsOnlyRawJson =
    /\b(return\s+only\s+(?:raw|valid)\s+json|output\s+strictly\s+raw\s+json\s+with\s+no\s+markdown\s+or\s+prose|do\s+not\s+include\s+any\s+text\s+outside\s+the\s+json)\b/i.test(
      prompt,
    );
  const demandsProseOutsideJson =
    /\b(include\s+a\s+(?:\d+-paragraph|detailed)\s+(?:markdown\s+)?(?:executive\s+summary|introduction|explanation)\s+(?:before|after|outside)\s+the\s+json|write\s+a\s+conversational\s+essay\s+followed\s+by)\b/i.test(
      prompt,
    );
  if (demandsOnlyRawJson && demandsProseOutsideJson) {
    contradictions.push(
      "Output format contradiction: Prompt demands strictly raw JSON with zero surrounding prose while also requiring prose paragraphs outside the JSON payload.",
    );
  }

  // 6. Audience / Complexity Calibration Contradictions
  const targetsYoungChildOrCompleteNovice =
    /\b(explain\s+for\s+a\s+(?:5|6|7|8)-year-old|complete\s+beginner\s+with\s+zero\s+(?:coding|math|technical)\s+background|avoid\s+all\s+technical\s+jargon\s+and\s+formulas)\b/i.test(
      prompt,
    );
  const demandsUnexplainedAdvancedFormalism =
    /\b(use\s+unexplained\s+graduate-level\s+(?:stochastic\s+calculus|tensor\s+calculus|measure\s+theory)|write\s+raw\s+x86\s+assembly\s+and\s+kernel\s+ring-0\s+drivers\s+without\s+beginner\s+explanations|provide\s+only\s+formal\s+pde\s+proofs\s+with\s+no\s+plain-english\s+intuition)\b/i.test(
      prompt,
    );
  if (
    targetsYoungChildOrCompleteNovice &&
    demandsUnexplainedAdvancedFormalism
  ) {
    contradictions.push(
      "Audience calibration contradiction: Prompt targets a young child or complete novice with no jargon while requiring unexplained graduate-level formalism or low-level kernel code.",
    );
  }

  // Also check if lower text has direct "do not include X" and "must include X" on common patterns
  if (
    /\bdo\s+not\s+use\s+code\s+examples\b/i.test(lower) &&
    /\bprovide\s+complete\s+working\s+code\s+examples\b/i.test(lower)
  ) {
    contradictions.push(
      "Instruction contradiction: Prompt both forbids code examples ('do not use code examples') and requires complete working code examples.",
    );
  }

  const score =
    contradictions.length === 0 ? 9.5 : contradictions.length === 1 ? 3.8 : 2.2;

  return {
    isConsistent: contradictions.length === 0,
    score: clampScore(score),
    contradictions,
  };
}

// ============================================================================
// RELEVANCE, EFFICIENCY & ANTI-BLOAT AUDITOR
// ============================================================================

/**
 * Evaluates whether all requirements in the prompt are relevant to the actual task,
 * flags cross-domain boilerplate (e.g., React/SQL/Zod instructions in a poetry or study prompt),
 * and detects repetitive or vacuous verbosity.
 */
export function auditRelevanceAndEfficiency(
  prompt: string,
  taskCategory: EvaluatorTaskCategory,
  hollowResult: HollowDetectionResult,
): RelevanceAndEfficiencyAudit {
  const unnecessaryInstructions: string[] = [];
  const bloatIndicators: string[] = [];

  // 1. Cross-Domain Irrelevant Instruction Detection
  const hasWebAppStackBoilerplate =
    /\b(react\s+19|next\.js|tailwind\s+css|tanstack\s+query|zod\s+schemas?|\.env\.example|tsc\s+--noemit|cloudflare\s+pages|postgresql\s+500mb|react\s+error\s+boundary|wcag\s+aa)\b/i.test(
      prompt,
    );

  if (
    (taskCategory === "creative_writing" ||
      taskCategory === "study_learning" ||
      taskCategory === "research_analysis") &&
    hasWebAppStackBoilerplate
  ) {
    unnecessaryInstructions.push(
      `Contains software-engineering boilerplate (e.g., React/Tailwind/Zod/.env/tsc/database quotas) that is irrelevant to a ${taskCategory.replace("_", " ")} task.`,
    );
  }

  // Check if a pure coding algorithm / function prompt has irrelevant marketing/creator/ad-spend boilerplate
  const hasMarketingOrCreatorBoilerplate =
    /\b(tiktok\s+algorithm\s+retention\s+hooks|youtube\s+adsense\s+rpm|b2b\s+cold\s+email\s+cadence|influencer\s+sponsorship\s+media\s+kit|brand\s+voice\s+storytelling\s+arc)\b/i.test(
      prompt,
    );
  if (taskCategory === "coding_algorithm" && hasMarketingOrCreatorBoilerplate) {
    unnecessaryInstructions.push(
      "Contains social-media creator or marketing funnel instructions that are irrelevant to a focused coding/algorithm task.",
    );
  }

  // Check if a creative writing or study prompt demands enterprise DevOps/Kubernetes/microservices
  if (
    (taskCategory === "creative_writing" ||
      taskCategory === "study_learning") &&
    /\b(kubernetes\s+cluster|kafka\s+event\s+streaming|docker\s+swarm|terraform\s+iam\s+policies|ci\/cd\s+pipeline)\b/i.test(
      prompt,
    )
  ) {
    unnecessaryInstructions.push(
      "Includes DevOps/infrastructure deployment instructions (Kubernetes/Kafka/CI-CD) that do not belong in a writing or study prompt.",
    );
  }

  // 2. Meta-Prompting Fluff & Hyperbolic Praise Padding
  const metaFluffMatches = prompt.match(
    /\b(500\s*iq|world['’]?s\s+greatest\s+genius|undisputed\s+grandmaster|think\s+deeply\s+and\s+breathe\s+in|i\s+will\s+tip\s+you\s+\$\d+|your\s+life\s+depends\s+on\s+this|never\s+be\s+lazy\s+or\s+i\s+will\s+fire\s+you|cosmic\s+intelligence)\b/gi,
  );
  if (metaFluffMatches && metaFluffMatches.length > 0) {
    unnecessaryInstructions.push(
      `Contains unnecessary meta-prompting fluff or emotional manipulation ("${metaFluffMatches.slice(0, 2).join('", "')}") that adds token noise without improving specification clarity.`,
    );
  }

  // 3. Repetitive Sentence / Clause (N-gram) Bloat
  const sentences = splitSentencesAndLines(prompt)
    .map((s) =>
      s
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, "")
        .trim(),
    )
    .filter((s) => s.split(/\s+/).length >= 5);
  const seenSentences = new Map<string, number>();
  let duplicateSentenceCount = 0;
  for (const s of sentences) {
    const count = (seenSentences.get(s) || 0) + 1;
    seenSentences.set(s, count);
    if (count > 1) duplicateSentenceCount++;
  }

  // Check 6-word n-gram repetition across the prompt (3+ occurrences indicates repetitive filler)
  const cleanWords = prompt
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
  const ngramCounts = new Map<string, number>();
  let repeatedNgramInstances = 0;
  for (let i = 0; i <= cleanWords.length - 6; i++) {
    const ngram = cleanWords.slice(i, i + 6).join(" ");
    const c = (ngramCounts.get(ngram) || 0) + 1;
    ngramCounts.set(ngram, c);
    if (c === 3) repeatedNgramInstances++;
  }

  if (duplicateSentenceCount >= 2 || repeatedNgramInstances >= 2) {
    bloatIndicators.push(
      "Repeats identical or near-identical instruction clauses unnecessarily across sentences.",
    );
  }

  // 4. Long but Poorly Specified Detection (high word count, low information density)
  const words = prompt.trim().split(/\s+/).filter(Boolean);
  const wordCount = words.length;
  const hasConcreteNumbersOridentifiers = (
    prompt.match(
      /\b(\d+|json|markdown|table|typescript|python|react|sql|wcag|zod|apa|doi|jlpt|cefr|csv|yaml|html|css|vitest|jest|pytest)\b/gi,
    ) || []
  ).length;

  if (wordCount >= 80 && hasConcreteNumbersOridentifiers <= 1) {
    bloatIndicators.push(
      `High word count (${wordCount} words) with very low specification density—uses verbose filler prose without concrete parameters, metrics, or testable requirements.`,
    );
  }

  // 5. Empty or Decorative Heading Bloat
  if (
    hollowResult.emptyHeadingCount > 0 &&
    hollowResult.emptyHeadingCount >= hollowResult.substantiveHeadingCount
  ) {
    bloatIndicators.push(
      `Contains ${hollowResult.emptyHeadingCount} empty or vacuous section headings that add structural noise without usable content.`,
    );
  }

  let score = 9.2;
  score -= unnecessaryInstructions.length * 2.4;
  score -= bloatIndicators.length * 1.8;
  score -= Math.min(3.0, hollowResult.hollowConstructs.length * 1.1);

  return {
    isRelevantAndEfficient:
      unnecessaryInstructions.length === 0 &&
      bloatIndicators.length === 0 &&
      hollowResult.emptyHeadingCount === 0,
    score: clampScore(score),
    taskCategory,
    unnecessaryInstructions,
    hollowConstructs: hollowResult.hollowConstructs,
    bloatIndicators,
  };
}

// ============================================================================
// DIMENSION EVALUATORS (MEANINGFUL QUALITIES, TASK-ADAPTIVE, EVIDENCE-BACKED)
// ============================================================================

/**
 * 1. CLARITY (Goal Clarity) — Weight: 0.15
 * Assesses whether the prompt states an unambiguous objective, action verb, and target subject/outcome.
 * Does NOT require formulaic "Act as a..." phrasing if the objective itself is crystal clear.
 */
function evaluateGoalClarity(
  rawPrompt: string,
  cleanedPrompt: string,
  taskCategory: EvaluatorTaskCategory,
  relevanceAudit: RelevanceAndEfficiencyAudit,
): ScoreDimension {
  const words = cleanedPrompt.trim().split(/\s+/).filter(Boolean);
  const hasActionVerb =
    /\b(build|create|write|design|develop|implement|analyze|synthesize|generate|draft|refactor|architect|explain|compare|construct|formulate|compile|optimize|audit|solve|parse|plan|prepare)\b/i.test(
      cleanedPrompt,
    );
  const hasSpecificSubject =
    words.length >= 7 &&
    !/^(make|build|create|write)\s+(me\s+)?(a\s+)?(simple\s+|good\s+|nice\s+)?(website|app|business|story|code|prompt|study\s+plan|essay|article|blog|script)(\s+for\s+my\s+\w+)?\.?$/i.test(
      cleanedPrompt.trim(),
    );
  const hasRoleOrPerspective =
    /\b(act\s+as|you\s+are\s+a|role\s*:|<role>|principal|senior|architects?|engineers?|researchers?|tutors?|editors?|strategists?|analysts?)\b/i.test(
      cleanedPrompt,
    );
  const hasExplicitObjectiveFraming =
    /\b(objective\s*:|primary\s+objective|goal\s*:|<goal>|mission\s*:|task\s*:)\b/i.test(
      cleanedPrompt,
    );
  const hasVagueHedgingGoal =
    /\b(make\s+something\s+cool|do\s+whatever\s+you\s+think|help\s+me\s+with\s+stuff|tell\s+me\s+everything\s+about|write\s+something\s+good)\b/i.test(
      cleanedPrompt,
    );

  const evidence = extractEvidenceQuotes(cleanedPrompt, [
    /\b(objective|goal|mission|task)\s*:/i,
    /\b(act\s+as|you\s+are\s+a)\b/i,
    /\b(build|create|write|design|develop|implement|analyze|synthesize|refactor|parse|draft|construct|compare|formulate)\b/i,
  ]);

  let score = 5.0;
  if (hasActionVerb && hasSpecificSubject) {
    score = 8.4;
  } else if (hasActionVerb) {
    score = 5.4;
  } else {
    score = 3.8;
  }

  if (hasExplicitObjectiveFraming && hasSpecificSubject) {
    score += 0.6;
  }
  if (hasRoleOrPerspective && hasSpecificSubject) {
    score += 0.5;
  }
  if (hasVagueHedgingGoal) {
    score -= 2.5;
  }
  if (relevanceAudit.bloatIndicators.length > 0) {
    score -= 1.2;
  }
  if (relevanceAudit.unnecessaryInstructions.length > 0) {
    score -= 1.0;
  }

  score = clampScore(score);

  const workingWell =
    score >= 8.0
      ? `Clearly defines the primary ${taskCategory.replace("_", " ")} objective and target outcome without ambiguity.`
      : hasActionVerb
        ? "Includes an action verb indicating the general type of request."
        : "Provides an initial topic seed that can be expanded into a concrete objective.";

  const primaryWeakness =
    score >= 8.0
      ? "None — the primary objective is specific and unambiguous."
      : !hasSpecificSubject
        ? "The objective is too broad or generic (e.g., 'make a website' or 'write a blog') without specifying the concrete problem, subject, or scope."
        : relevanceAudit.bloatIndicators.length > 0
          ? "Core objective is obscured by repetitive filler or unfocused prose."
          : "Goal statement lacks concrete scope boundaries or target domain framing.";

  const concreteImprovement =
    score >= 8.0
      ? "Maintain the current direct objective statement."
      : "State the exact deliverable, subject matter, and concrete job-to-be-done in the opening sentence (e.g., 'Implement a TypeScript rate-limiter middleware...' or 'Synthesize a comparative research brief on...').";

  return {
    id: "clarity",
    name: "Clarity & Intent",
    score,
    weight: 0.15,
    applicable: true,
    workingWell,
    evidence:
      evidence.length > 0 ? evidence : [`"${rawPrompt.trim().slice(0, 90)}"`],
    primaryWeakness,
    weaknesses: score >= 8.0 ? [] : [primaryWeakness],
    concreteImprovement,
    rubricNotes:
      score >= 8.0
        ? "Unambiguous primary objective and task intent."
        : "Objective needs sharper specificity and concrete scope.",
  };
}

/**
 * 2. CONTEXT (Context Sufficiency) — Weight: 0.10
 * Distinguishes genuinely missing task-critical context from information that is not needed
 * for self-contained tasks (e.g., pure algorithms or self-contained creative/study prompts).
 */
function evaluateContextSufficiency(
  cleanedPrompt: string,
  taskCategory: EvaluatorTaskCategory,
  hollowResult: HollowDetectionResult,
): { dimension: ScoreDimension; missingContextItems: string[] } {
  const missingContextItems: string[] = [];

  // Check substantive context signals by task category
  const hasInputOrDomainData =
    /\b(input\s*:|given\s+|background\s*:|context(?:\s*&\s*\w+)?\s*:|<context>|scenario\s*:|dataset|schema|signature|parameters?|source\s+material|prerequisite|current\s+level|market|industry|domain|users?\s+currently|problem\s*:)\b/i.test(
      cleanedPrompt,
    );

  // A self-contained coding function or focused creative/research/study prompt has sufficient context
  // if it specifies the concrete domain/inputs/parameters directly in the prompt!
  const hasSelfContainedParameters =
    (taskCategory === "coding_algorithm" &&
      /\b(input|parameter|argument|string|array|number|object|return|type|interface|function\s+\w+\s*\(|cte|query|users\s*\(|events\s*\(|schema|table)\b/i.test(
        cleanedPrompt,
      )) ||
    (taskCategory === "research_analysis" &&
      /\b(time\s+period|region|sector|peer-reviewed|20\d\d|compare|evaluate|metrics?|sources?)\b/i.test(
        cleanedPrompt,
      )) ||
    (taskCategory === "study_learning" &&
      /\b(beginner|intermediate|advanced|hours?\s*(?:\/|\s+per\s+)\s*week|weeks?|days?|exam|prerequisite|background)\b/i.test(
        cleanedPrompt,
      )) ||
    (taskCategory === "creative_writing" &&
      /\b(setting|protagonist|character|tone|pov|point\s+of\s+view|perspective|theme|era|genre|reader)\b/i.test(
        cleanedPrompt,
      )) ||
    ((taskCategory === "software_engineering" ||
      taskCategory === "business_strategy") &&
      /\b(users?|customers?|clients?|workflow|b2b|b2c|saas|traffic|budget|team|platform|environment|offline|cloud)\b/i.test(
        cleanedPrompt,
      ));

  const evidence = extractEvidenceQuotes(cleanedPrompt, [
    /\b(context|background|scenario|environment|domain|input|parameters?|current\s+level|prerequisite|setting)\b/i,
    /\b(for\s+[a-z0-9\s-]{4,40}(?:users|clients|students|engineers|readers|teams|mothers|clinics|brokers|managers|analysts))\b/i,
    /\b(function\s+\w+|takes?\s+a\s+|given\s+a\s+|from\s+\w+\s*\()/i,
  ]);

  let score = 4.5;
  if (hasInputOrDomainData && hasSelfContainedParameters) {
    score = 9.2;
  } else if (
    hasSelfContainedParameters ||
    (hasInputOrDomainData && evidence.length > 0)
  ) {
    score = 8.5;
  } else {
    score = 4.5;
  }

  if (hollowResult.hasHollowContext) {
    score = Math.min(score, 4.8);
  }

  if (score < 7.5) {
    if (taskCategory === "coding_algorithm") {
      missingContextItems.push(
        "Expected input types/shapes and runtime environment (e.g., Node.js, browser, Python 3.12).",
      );
    } else if (taskCategory === "software_engineering") {
      missingContextItems.push(
        "Operational context (target users, core workflow, and deployment/budget environment).",
      );
    } else if (taskCategory === "research_analysis") {
      missingContextItems.push(
        "Research scope context (geographic/temporal boundaries, domain focus, or baseline assumptions).",
      );
    } else if (taskCategory === "study_learning") {
      missingContextItems.push(
        "Learner baseline context (current proficiency level, weekly time availability, and target deadline).",
      );
    } else if (taskCategory === "creative_writing") {
      missingContextItems.push(
        "Narrative/editorial framing (setting, perspective/POV, or thematic context).",
      );
    } else {
      missingContextItems.push(
        "Domain background and situational context needed to ground the response.",
      );
    }
  }

  score = clampScore(score);

  const workingWell =
    score >= 8.0
      ? "Supplies sufficient task-relevant background, input framing, or domain parameters without requiring unnecessary boilerplate."
      : "Mentions the general topic area.";

  const primaryWeakness = hollowResult.hasHollowContext
    ? "Contains a hollow 'Context' label or heading with vacuous filler instead of real situational details."
    : score >= 8.0
      ? "None — context is sufficient for the scope of this task."
      : missingContextItems[0] ||
        "Missing situational background or input assumptions required to execute the task accurately.";

  const concreteImprovement =
    score >= 8.0
      ? "Context is already well-calibrated to the task scope."
      : `Add 1–2 sentences specifying ${missingContextItems[0]?.replace(/\.$/, "") || "the concrete domain background and input assumptions"}.`;

  return {
    dimension: {
      id: "context",
      name: "Context & Background",
      score,
      weight: 0.1,
      applicable: true,
      workingWell,
      evidence:
        evidence.length > 0
          ? evidence
          : ["No task-specific background or input framing found in prompt."],
      primaryWeakness,
      weaknesses: score >= 8.0 ? [] : [primaryWeakness],
      concreteImprovement,
      rubricNotes:
        score >= 8.0
          ? "Context is sufficient for the task scope."
          : "Needs task-relevant domain or input context.",
    },
    missingContextItems,
  };
}

/**
 * 3. CONSTRAINTS (Constraint Quality & Internal Consistency) — Weight: 0.12
 * Evaluates explicit exclusions, operational boundaries, scope guardrails, AND internal consistency.
 */
function evaluateConstraintQuality(
  cleanedPrompt: string,
  consistencyAudit: InternalConsistencyAudit,
  hollowResult: HollowDetectionResult,
): { dimension: ScoreDimension; missingConstraintItems: string[] } {
  const missingConstraintItems: string[] = [];

  const hasConcreteExclusions =
    /\b(do\s+not|don't|never|avoid|exclude|excluding|without|forbid|prohibit|strictly\s+no|must\s+not|reject)\s+[a-z0-9\s,'"-]{5,}/i.test(
      cleanedPrompt,
    );
  const hasQuantifiedOrTechnicalLimits =
    /\b(under\s+\d+|maximum\s+\d+|at\s+most\s+\d+|at\s+least\s+\d+|\d+\s*-\s*\d+\s+words|cap\s+daily|\$0\b|\$\d+|free\s+(?:tier|open\s+resources)|cite\s+only|peer-reviewed|rate\s+limit|\d+\s*mb|\d+\s*ms|wh\/kg|o\([n1log\s]+\)|strict\s+mode|wcag|zero\s+dependencies|read-only|immutable)\b/i.test(
      cleanedPrompt,
    );
  const hasRequirementModal =
    /\b(must\s+[a-z]+|required\s+to|shall\s+not|non-negotiable|boundary|constraint)\b/i.test(
      cleanedPrompt,
    );

  const evidence = extractEvidenceQuotes(cleanedPrompt, [
    /\b(do\s+not|never|avoid|exclude|without|must\s+not|reject)\b/i,
    /\b(constraint|boundary|limit|budget|wcag|strictly|maximum|minimum)\b/i,
  ]);

  let score = 4.8;
  if (hasConcreteExclusions && hasQuantifiedOrTechnicalLimits) {
    score = 9.3;
  } else if (hasConcreteExclusions || hasQuantifiedOrTechnicalLimits) {
    score = 8.4;
  } else if (hasRequirementModal && evidence.length > 0) {
    score = 7.4;
  } else {
    score = 4.6;
  }

  if (hollowResult.hasHollowConstraints) {
    score = Math.min(score, 4.5);
  }

  // Internal contradictions severely degrade constraint quality
  if (!consistencyAudit.isConsistent) {
    score = Math.min(score, consistencyAudit.score);
  }

  if (score < 7.5 && consistencyAudit.isConsistent) {
    missingConstraintItems.push(
      "Explicit scope boundaries or negative constraints (what to exclude, avoid, or bound in length/complexity).",
    );
  }

  score = clampScore(score);

  const workingWell = !consistencyAudit.isConsistent
    ? "Attempts to state constraints, but introduces conflicting instructions."
    : score >= 8.0
      ? "Defines concrete boundaries, explicit exclusions, or measurable limits that remain internally consistent."
      : "Leaves scope boundaries open-ended.";

  const primaryWeakness = !consistencyAudit.isConsistent
    ? consistencyAudit.contradictions[0]
    : hollowResult.hasHollowConstraints
      ? "Includes a superficial 'Constraints' heading or label without specifying actual boundaries or exclusions."
      : score >= 8.0
        ? "None — constraints and exclusions are clear and internally consistent."
        : "Lacks explicit negative constraints (what to avoid/exclude) or measurable operational bounds.";

  const concreteImprovement = !consistencyAudit.isConsistent
    ? `Resolve the internal contradiction: ${consistencyAudit.contradictions[0]}`
    : score >= 8.0
      ? "Constraints are well-specified and consistent."
      : "Add 1–2 explicit guardrails or exclusions (e.g., 'Do not use external libraries', 'Exclude unverified claims', or 'Keep total length under 600 words').";

  return {
    dimension: {
      id: "constraints",
      name: "Constraints & Guardrails",
      score,
      weight: 0.12,
      applicable: true,
      workingWell,
      evidence:
        evidence.length > 0
          ? evidence
          : [
              "No concrete exclusions or operational constraints found in prompt.",
            ],
      primaryWeakness,
      weaknesses: score >= 8.0 ? [] : [primaryWeakness],
      concreteImprovement,
      rubricNotes: !consistencyAudit.isConsistent
        ? "Internal contradiction detected between prompt constraints."
        : score >= 8.0
          ? "Concrete, non-contradictory guardrails and exclusions."
          : "Add explicit boundaries and negative constraints.",
    },
    missingConstraintItems,
  };
}

/**
 * 4. AUDIENCE (Target Calibration, Relevance & Efficiency) — Weight: 0.08
 * Assesses whether the target audience/consumer or complexity level is calibrated
 * AND whether the prompt is focused, relevant, and free of cross-domain bloat.
 */
function evaluateAudienceAndRelevance(
  cleanedPrompt: string,
  taskCategory: EvaluatorTaskCategory,
  relevanceAudit: RelevanceAndEfficiencyAudit,
): ScoreDimension {
  const hasExplicitAudienceOrLevel =
    /\b(audience\s*:|target\s+audience|for\s+(?:senior|junior|beginner|intermediate|advanced|executive|b2b|b2c|freelance|postpartum|dental|enterprise|high-school|undergraduate|clinical|non-technical|technical|data)\s+[a-z\s]+|persona|readers?|viewers?|students?|engineers?|developers?|clients?|stakeholders?|practitioners?|homeowners?|brokers?|managers?|analysts?)\b/i.test(
      cleanedPrompt,
    );

  // For pure coding_algorithm tasks, specifying the developer/API caller or TypeScript/Python typing contract calibrates the target consumer
  const hasImplicitTechnicalCalibration =
    taskCategory === "coding_algorithm" &&
    /\b(typescript|python\s+3|rust|go|sql|postgresql|strict\s+types?|production-grade|pure\s+function|library\s+consumer|api\s+caller|data\s+analysts?)\b/i.test(
      cleanedPrompt,
    );

  const evidence = extractEvidenceQuotes(cleanedPrompt, [
    /\b(audience|persona|target|beginner|intermediate|advanced|senior|engineers|students|clients|readers|mothers|clinics|brokers|managers|homeowners|analysts)\b/i,
    /\b(tone|style|calibrated\s+for|written\s+for)\b/i,
  ]);

  let score = 5.5;
  if (hasExplicitAudienceOrLevel) {
    score = 9.0;
  } else if (hasImplicitTechnicalCalibration) {
    score = 8.4;
  } else {
    score = 5.5;
  }

  // Blend in Relevance & Efficiency penalties so bloated or cross-domain-polluted prompts are penalized
  if (!relevanceAudit.isRelevantAndEfficient) {
    score = Math.min(score, relevanceAudit.score);
  }

  score = clampScore(score);

  const workingWell = !relevanceAudit.isRelevantAndEfficient
    ? "Identifies a general audience, but includes irrelevant or bloated instructions."
    : score >= 8.0
      ? "Calibrates complexity and tone to the target audience/consumer while keeping instructions focused and task-relevant."
      : "Keeps instructions concise, though target audience or proficiency calibration is implicit.";

  const primaryWeakness =
    relevanceAudit.unnecessaryInstructions.length > 0
      ? relevanceAudit.unnecessaryInstructions[0]
      : relevanceAudit.bloatIndicators.length > 0
        ? relevanceAudit.bloatIndicators[0]
        : score >= 8.0
          ? "None — audience calibration and instruction relevance are strong."
          : "Does not specify the target audience, reader persona, or technical proficiency level.";

  const concreteImprovement =
    relevanceAudit.unnecessaryInstructions.length > 0
      ? "Remove cross-domain boilerplate and meta-fluff that do not serve the primary task."
      : relevanceAudit.bloatIndicators.length > 0
        ? "Trim repetitive sentences and empty headings so every instruction adds distinct value."
        : score >= 8.0
          ? "Audience calibration and instruction efficiency are well-maintained."
          : "Specify who will consume or use the output and their expected technical/domain familiarity.";

  return {
    id: "audience",
    name: "Target Audience",
    score,
    weight: 0.08,
    applicable: true,
    workingWell,
    evidence:
      evidence.length > 0
        ? evidence
        : ["Target audience or consumer calibration is not explicitly stated."],
    primaryWeakness,
    weaknesses: score >= 8.0 ? [] : [primaryWeakness],
    concreteImprovement,
    rubricNotes: !relevanceAudit.isRelevantAndEfficient
      ? "Penalized for irrelevant cross-domain instructions or repetitive bloat."
      : score >= 8.0
        ? "Clear target calibration and high instruction efficiency."
        : "Specify target audience or proficiency level.",
  };
}

/**
 * 5. OUTPUT REQUIREMENTS (Deliverable Definition) — Weight: 0.15
 * Evaluates whether the expected deliverable structure, artifact format, or response layout is concrete.
 */
function evaluateDeliverableDefinition(
  cleanedPrompt: string,
  hollowResult: HollowDetectionResult,
): { dimension: ScoreDimension; missingDeliverableItems: string[] } {
  const missingDeliverableItems: string[] = [];

  // Look for concrete structural or artifact specifications, not just the bare word "output"
  const hasConcreteDeliverableSpec =
    /\b(json\s+schema|markdown\s+(?:table|report|playbook|article|document|schedule|syllabus)|table\s+schema|sql\s+block|code\s+block|function\s+signature|return\s+type|file\s+tree|directory\s+structure|\d+-section|\d+-part|\d+-week|\d+\s+flashcards?|\d+\s+unit\s+tests?|step-by-step|bulleted\s+list|comparison\s+matrix|trade-offs?\s+matrix|executive\s+summary|punch\s+list|phase\s+1|deliverables?\s*:|<output_format>|<deliverables>)\b/i.test(
      cleanedPrompt,
    );

  const hasConcreteArtifactNoun =
    /\b(produce|return|output|deliver|generate|write)\s+(?:a|an|the)?\s*(?:single\s+|read-only\s+|complete\s+|working\s+|structured\s+|commented\s+|\d+-section\s+|week-by-week\s+)*(typescript\s+function|python\s+module|sql\s+(?:migration|block|query)|postgresql\s+\d*\s*cte\s+query|cte\s+query|markdown\s+(?:report|syllabus|schedule|brief|playbook|table)|dashboard|study\s+(?:schedule|syllabus)|research\s+brief|op-ed|short\s+story|sonnet|api\s+specification|playbook|test\s+suite|table\s+schema)\b/i.test(
      cleanedPrompt,
    );

  const evidence = extractEvidenceQuotes(cleanedPrompt, [
    /\b(deliverables?|output\s+format|structure|return\s+type|schema|matrix|table|sections?|phases?)\b/i,
    /\b(produce|return|deliver|format\s+as)\b/i,
  ]);

  let score = 4.6;
  if (hasConcreteDeliverableSpec && hasConcreteArtifactNoun) {
    score = 9.4;
  } else if (hasConcreteDeliverableSpec || hasConcreteArtifactNoun) {
    score = 8.5;
  } else if (evidence.length > 0) {
    score = 6.8;
  } else {
    score = 4.5;
  }

  if (hollowResult.hasHollowOutput) {
    score = Math.min(score, 4.6);
  }

  if (score < 7.5) {
    missingDeliverableItems.push(
      "Concrete deliverable definition (expected artifact format, sections, schema, or structure).",
    );
  }

  score = clampScore(score);

  const workingWell =
    score >= 8.0
      ? "Clearly specifies the expected deliverable artifact and how the output should be structured."
      : "Implies a general response type, but leaves the deliverable structure open to guesswork.";

  const primaryWeakness = hollowResult.hasHollowOutput
    ? "Contains a hollow 'Output' or 'Deliverable' label without specifying any concrete format or structure."
    : score >= 8.0
      ? "None — deliverable structure and format are clearly defined."
      : "Does not define the expected deliverable format, structure, or artifact organization.";

  const concreteImprovement =
    score >= 8.0
      ? "Deliverable format and structure are clearly defined."
      : "Specify the exact deliverable structure (e.g., 'Return a TypeScript module + 4 unit tests', 'Format as a 4-section Markdown brief with a comparison table', or 'Return a JSON object matching {...}').";

  return {
    dimension: {
      id: "outputRequirements",
      name: "Output Format & Structure",
      score,
      weight: 0.15,
      applicable: true,
      workingWell,
      evidence:
        evidence.length > 0
          ? evidence
          : [
              "No concrete deliverable structure or format specification found.",
            ],
      primaryWeakness,
      weaknesses: score >= 8.0 ? [] : [primaryWeakness],
      concreteImprovement,
      rubricNotes:
        score >= 8.0
          ? "Concrete deliverable definition and output structure."
          : "Specify the expected deliverable artifact and layout.",
    },
    missingDeliverableItems,
  };
}

/**
 * 6. COMPLETENESS (Testability & Acceptance Criteria) — Weight: 0.10
 * Requires genuinely verifiable pass/fail conditions, concrete edge-case coverage, or measurable
 * evaluation criteria. Explicitly rejects shallow keyword stuffing like "Acceptance criteria: make it good".
 */
function evaluateTestabilityAndCompleteness(
  cleanedPrompt: string,
  taskCategory: EvaluatorTaskCategory,
  hollowResult: HollowDetectionResult,
): { dimension: ScoreDimension; missingTestabilityItems: string[] } {
  const missingTestabilityItems: string[] = [];

  // Genuine verifiable criteria checks
  const hasVerifiablePassFail =
    /(\[pass\/fail\]|tsc\s+--noemit|exits?\s+0|unit\s+tests?\s+covering|test\s+cases?\s+(?:for|covering|including)|assert(?:s|ion)?|100%\s+of\s+|must\s+pass|verify\s+that|(?:acceptance|verification|mastery|quality(?:\s*&\s*acceptance)?)\s+criteria\s*:\s*[^\n]{20,}|every\s+quantitative\s+claim\s+must|requiring\s*>=\s*\d+%|definition\s+of\s+done)/i.test(
      cleanedPrompt,
    );

  const hasConcreteEdgeCasesOrVerification =
    /\b(edge\s+cases?|invalid\s+(?:input|dates?|months?|payloads?)|empty\s+(?:state|input|array|string)|zero-signup|division-by-zero|null|nan|timeout|rate\s+limit|fallback|error\s+handling|error\s+boundary|leap\s+year|boundary\s+conditions?|counterarguments?|conflicting\s+(?:empirical\s+)?(?:evidence|findings)|\[inferred\]|diagnostic\s+checkpoint|self-assessment|rubric|word\s+count\s+(?:between|stays\s+within))\b/i.test(
      cleanedPrompt,
    );

  const evidence = extractEvidenceQuotes(cleanedPrompt, [
    /(\[pass\/fail\]|acceptance\s+criteria|definition\s+of\s+done|test\s+cases?|unit\s+tests?)/i,
    /\b(edge\s+cases?|invalid|empty\s+state|division-by-zero|zero-signup|error\s+boundary|fallback|verify|checkpoint|diagnostic|citation)\b/i,
  ]);

  let score = 4.4;
  if (hasVerifiablePassFail && hasConcreteEdgeCasesOrVerification) {
    score = 9.4;
  } else if (
    hasConcreteEdgeCasesOrVerification ||
    (hasVerifiablePassFail && evidence.length > 0)
  ) {
    score = 8.5;
  } else if (evidence.length > 0) {
    score = 6.8;
  } else {
    score = 4.4;
  }

  // Anti-shallow heuristic: if acceptance criteria was hollow ("Acceptance criteria: make it good"), cap strictly!
  if (
    hollowResult.hasHollowAcceptanceCriteria &&
    !hasConcreteEdgeCasesOrVerification
  ) {
    score = Math.min(score, 4.2);
  } else if (hollowResult.hasHollowAcceptanceCriteria) {
    score = Math.min(score, 5.8);
  }

  if (score < 7.5) {
    if (
      taskCategory === "coding_algorithm" ||
      taskCategory === "software_engineering"
    ) {
      missingTestabilityItems.push(
        "Verifiable acceptance criteria and edge-case handling (e.g., invalid/empty inputs, error states, or concrete test cases).",
      );
    } else if (taskCategory === "research_analysis") {
      missingTestabilityItems.push(
        "Verification criteria (e.g., source citation standards, handling conflicting evidence, and distinguishing fact from inference).",
      );
    } else if (taskCategory === "study_learning") {
      missingTestabilityItems.push(
        "Mastery verification criteria (e.g., practice problems, diagnostic self-tests, or milestone checkpoints).",
      );
    } else {
      missingTestabilityItems.push(
        "Concrete success/acceptance criteria to verify that the final output meets expectations.",
      );
    }
  }

  score = clampScore(score);

  const workingWell =
    hollowResult.hasHollowAcceptanceCriteria && score < 6.0
      ? "Includes an acceptance-criteria heading/label, but its content is vacuous and non-testable."
      : score >= 8.0
        ? "Defines concrete, verifiable acceptance conditions and explicitly addresses edge cases or failure modes."
        : "States the desired happy-path output without defining edge cases or verification criteria.";

  const primaryWeakness = hollowResult.hasHollowAcceptanceCriteria
    ? "Contains a superficial 'acceptance criteria' phrase (e.g., 'make it good' or an empty section) without any verifiable pass/fail conditions."
    : score >= 8.0
      ? "None — testability, edge cases, and acceptance criteria are concrete."
      : missingTestabilityItems[0] ||
        "Lacks verifiable acceptance criteria or edge-case requirements.";

  const concreteImprovement =
    score >= 8.0
      ? "Testability and edge-case criteria are already well-specified."
      : `Add 2–3 verifiable pass/fail conditions and edge cases (e.g., ${
          taskCategory === "coding_algorithm" ||
          taskCategory === "software_engineering"
            ? "how to handle invalid/empty inputs and required unit tests"
            : taskCategory === "research_analysis"
              ? "requiring primary-source citations and flagging unverified claims"
              : "concrete quality checks the output must satisfy"
        }).`;

  return {
    dimension: {
      id: "completeness",
      name: "Completeness & Edge Cases",
      score,
      weight: 0.1,
      applicable: true,
      workingWell,
      evidence:
        evidence.length > 0
          ? evidence
          : [
              "No verifiable acceptance criteria or edge-case specifications found.",
            ],
      primaryWeakness,
      weaknesses: score >= 8.0 ? [] : [primaryWeakness],
      concreteImprovement,
      rubricNotes: hollowResult.hasHollowAcceptanceCriteria
        ? "Rejected shallow 'acceptance criteria' phrase without verifiable conditions."
        : score >= 8.0
          ? "Verifiable acceptance criteria and edge cases defined."
          : "Needs concrete, testable pass/fail criteria and edge cases.",
    },
    missingTestabilityItems,
  };
}

/**
 * 7. TECHNICAL FEASIBILITY (Operational & Resource Feasibility) — Weight: 0.15
 * Task-adaptive feasibility check:
 * - Software/Web: budget vs. paid service alignment, free-tier quota verification, secret isolation, lean architecture.
 * - Coding/Algorithm: computational/runtime realism, type safety, no conflicting library constraints.
 * - Research: source verifiability, separation of evidence vs. inference, no fabricated citations.
 * - Study: realistic weekly time pacing vs. syllabus scope.
 * - Creative/Business: realistic scope/word-count alignment and operational unit economics.
 */
function evaluateOperationalFeasibility(
  cleanedPrompt: string,
  taskCategory: EvaluatorTaskCategory,
  consistencyAudit: InternalConsistencyAudit,
  context?: EvaluationContext,
): ScoreDimension {
  const lower = cleanedPrompt.toLowerCase();
  let score = 7.5;
  const evidence: string[] = [];
  const weaknesses: string[] = [];

  if (!consistencyAudit.isConsistent) {
    return {
      id: "technicalFeasibility",
      name: "Technical Feasibility",
      score: clampScore(Math.min(4.2, consistencyAudit.score)),
      weight: 0.15,
      applicable: true,
      workingWell:
        "Specifies operational targets, but introduces contradictory resource or runtime constraints.",
      evidence: ["Contradictory operational instructions detected in prompt."],
      primaryWeakness: consistencyAudit.contradictions[0],
      weaknesses: [...consistencyAudit.contradictions],
      concreteImprovement: `Eliminate the conflicting constraint: ${consistencyAudit.contradictions[0]}`,
      rubricNotes: "Feasibility compromised by internal contradiction.",
    };
  }

  if (taskCategory === "software_engineering") {
    const isZeroBudget =
      context?.budget === "$0" ||
      lower.includes("$0") ||
      lower.includes("zero budget") ||
      lower.includes("free tier");
    const hasFreeTierAlignment =
      /\b(free[- ]tier|supabase|vercel|cloudflare|netlify|indexeddb|local\s*storage|500mb|rate\s+limit|\[verify:)\b/i.test(
        cleanedPrompt,
      );
    const hasSecretSecurity =
      /\b(\.env\.example|server-side\s+proxy|secret|api\s+key|never\s+expose|environment\s+variables?)\b/i.test(
        cleanedPrompt,
      );
    const hasLeanStack =
      /\b(react|next\.js|vite|typescript|tailwind|supabase|postgresql|sqlite|cloudflare|vercel)\b/i.test(
        cleanedPrompt,
      );

    if (isZeroBudget && hasFreeTierAlignment) {
      score += 1.0;
      evidence.push(
        "Aligns $0 budget with concrete free-tier platforms/quotas.",
      );
    } else if (!isZeroBudget) {
      score += 0.6;
    }
    if (hasSecretSecurity) {
      score += 0.8;
      evidence.push("Enforces API key / environment secret isolation.");
    }
    if (hasLeanStack) {
      score += 0.6;
      evidence.push("Specifies a cohesive, deployable application stack.");
    }
    if (cleanedPrompt.trim().split(/\s+/).length < 15 && !hasLeanStack) {
      score = 5.2;
      weaknesses.push(
        "Does not specify deployment constraints, budget boundaries, or runtime architecture.",
      );
    }
  } else if (taskCategory === "coding_algorithm") {
    const hasWellDefinedContract =
      /\b(function|return|input|output|type|interface|error|null|exception|boolean|number|string|array|date|cte|query|sql|read-only|division-by-zero|schema)\b/i.test(
        cleanedPrompt,
      );
    const hasRealisticComplexity =
      !/\b(solve\s+halting\s+problem|o\(1\)\s+comparison\s+sort\s+for\s+arbitrary\s+strings|100%\s+bug-free\s+ai\s+compiler\s+in\s+5\s+lines)\b/i.test(
        cleanedPrompt,
      );
    if (hasWellDefinedContract && hasRealisticComplexity) {
      score = 9.0;
      evidence.push(
        ...extractEvidenceQuotes(cleanedPrompt, [
          /\b(function|parse|return|input|reject|valid|test|query|cte|read-only|division-by-zero)\b/i,
        ]),
      );
    } else {
      score = 5.8;
      weaknesses.push(
        "Algorithmic contract (input/output types and failure behavior) is underspecified.",
      );
    }
  } else if (taskCategory === "research_analysis") {
    const hasSourceVerification =
      /\b(cite|citation|peer-reviewed|primary\s+sources?|doi|evidence|inference|unverified|credible|methodology|empirical)\b/i.test(
        cleanedPrompt,
      );
    if (hasSourceVerification) {
      score = 9.1;
      evidence.push(
        ...extractEvidenceQuotes(cleanedPrompt, [
          /\b(cite|citation|peer-reviewed|primary\s+sources?|evidence|inference|credible)\b/i,
        ]),
      );
    } else {
      score = 5.6;
      weaknesses.push(
        "Does not establish source credibility rules or require separating verified evidence from inference.",
      );
    }
  } else if (taskCategory === "study_learning") {
    const hasRealisticSchedule =
      /\b(\d+\s*hours?\s*(?:\/|\s+per\s+)\s*(?:week|day)|\d+\s*weeks?|\d+\s*days?|milestone|spaced\s+repetition|practice|checkpoint|diagnostic)\b/i.test(
        cleanedPrompt,
      );
    if (hasRealisticSchedule) {
      score = 9.0;
      evidence.push(
        ...extractEvidenceQuotes(cleanedPrompt, [
          /\b(hours?|weeks?|milestone|spaced\s+repetition|practice|checkpoint)\b/i,
        ]),
      );
    } else {
      score = 5.6;
      weaknesses.push(
        "Lacks realistic time-allocation bounds (hours/week or target duration) to pace the curriculum.",
      );
    }
  } else if (
    taskCategory === "creative_writing" ||
    taskCategory === "business_strategy"
  ) {
    const hasFeasibleScope =
      /\b(\d+(?:,\d+)?\s*words?|\d+\s*(?:sections?|parts?|scenes?|stanzas?|chapters?|paragraphs?|slides?|emails?)|budget|unit\s+economics|cac|ltv|timeline|tone|pov)\b/i.test(
        cleanedPrompt,
      );
    if (hasFeasibleScope) {
      score = 8.9;
      evidence.push(
        ...extractEvidenceQuotes(cleanedPrompt, [
          /\b(words?|sections?|parts?|budget|timeline|tone|pov|unit\s+economics)\b/i,
        ]),
      );
    } else {
      score = 5.2;
      weaknesses.push(
        "Lacks concrete scope, length, or operational resource parameters.",
      );
    }
  } else {
    const hasOperationalBounds =
      /\b(\d+\s*(?:words?|sections?|steps?|items?|days?|weeks?|hours?)|budget|\$\d+|timeline|constraint|format|schema|table)\b/i.test(
        cleanedPrompt,
      );
    if (hasOperationalBounds) {
      score = 7.8;
    } else {
      score = 5.0;
      weaknesses.push(
        "Operational boundaries and feasibility constraints are underspecified.",
      );
    }
  }

  score = clampScore(score);
  const primaryWeakness =
    weaknesses[0] ||
    (score >= 8.0
      ? "None — operational and resource constraints are realistic and consistent."
      : "Operational constraints and feasibility boundaries need concrete specification.");

  return {
    id: "technicalFeasibility",
    name: "Technical Feasibility",
    score,
    weight: 0.15,
    applicable: true,
    workingWell:
      score >= 8.0
        ? `Establishes realistic, non-contradictory operational boundaries appropriate for a ${taskCategory.replace("_", " ")} task.`
        : "Avoids direct contradictions, though operational boundaries remain high-level.",
    evidence:
      evidence.length > 0
        ? evidence
        : ["No explicit operational or resource feasibility guardrails found."],
    primaryWeakness,
    weaknesses: score >= 8.0 ? [] : [primaryWeakness],
    concreteImprovement:
      score >= 8.0
        ? "Operational feasibility guardrails are well-calibrated."
        : taskCategory === "software_engineering"
          ? "Specify budget/hosting boundaries, API key isolation, and lean stack constraints."
          : taskCategory === "research_analysis"
            ? "Require primary-source citations and explicit separation of verified data from inference."
            : "Specify realistic scope, resource, or pacing constraints for the task.",
    rubricNotes:
      score >= 8.0
        ? "Feasible and internally consistent operational boundaries."
        : "Operational or resource feasibility needs tighter specification.",
  };
}

/**
 * 8. IMPLEMENTATION SPECIFICITY (Requirement Specificity) — Weight: 0.15
 * Evaluates whether functional and domain requirements are concrete, actionable, and relevant
 * to the actual task category—without forcing software stacks onto non-software tasks.
 */
function evaluateRequirementSpecificity(
  cleanedPrompt: string,
  taskCategory: EvaluatorTaskCategory,
  relevanceAudit: RelevanceAndEfficiencyAudit,
): { dimension: ScoreDimension; missingSpecificityItems: string[] } {
  const missingSpecificityItems: string[] = [];
  let score = 5.0;
  let evidence: string[] = [];

  if (taskCategory === "software_engineering") {
    const hasConcreteStack =
      /\b(react|next\.js|vue|svelte|typescript|tailwind|node\.js|python|go|rust|postgres|postgresql|supabase|sqlite|indexeddb|prisma|drizzle)\b/i.test(
        cleanedPrompt,
      );
    const hasValidationOrSecurity =
      /\b(zod|valibot|yup|schema\s+validation|input\s+validation|auth|jwt|oauth|rbac|csrf|rate\s+limit)\b/i.test(
        cleanedPrompt,
      );
    const hasInteractiveOrUiStates =
      /\b(loading\s+(?:state|skeleton)|empty\s+state|error\s+(?:state|boundary)|toast|retry|pagination|accessibility|wcag|responsive)\b/i.test(
        cleanedPrompt,
      );
    const hasFeatureWorkflows =
      /\b(feature|workflow|endpoint|route|component|dashboard|checkout|sync|export|filter|search)\b/i.test(
        cleanedPrompt,
      );

    score = 4.8;
    if (hasConcreteStack) score += 1.6;
    if (hasValidationOrSecurity) score += 1.4;
    if (hasInteractiveOrUiStates) score += 1.2;
    if (hasFeatureWorkflows) score += 0.8;

    evidence = extractEvidenceQuotes(cleanedPrompt, [
      /\b(react|typescript|tailwind|zod|supabase|postgresql|indexeddb|vite)\b/i,
      /\b(loading|empty\s+state|error\s+boundary|validation|workflow)\b/i,
    ]);

    if (score < 7.5) {
      missingSpecificityItems.push(
        "Concrete technical requirements (stack libraries, input validation, and loading/empty/error UI states).",
      );
    }
  } else if (taskCategory === "coding_algorithm") {
    const hasSignatureOrTypes =
      /\b(function\s+\w+|\w+\s*\([^)]*\)\s*:|typescript|python|rust|go|sql|postgresql|cte|string|number|boolean|date|null|array|map|set|users\s*\(|events\s*\()\b/i.test(
        cleanedPrompt,
      );
    const hasBehavioralRules =
      /\b(parse|reject|validate|return|throw|sort|filter|compute|retention|cohort|signup|is_bot|leap\s+year|iso|yyyy-mm-dd|time\s+complexity|space\s+complexity|immutable|pure|read-only)\b/i.test(
        cleanedPrompt,
      );
    const hasTestSpec =
      /\b(unit\s+tests?|test\s+cases?|assert|valid|invalid|edge\s+cases?|division-by-zero|zero-signup)\b/i.test(
        cleanedPrompt,
      );

    score = 4.8;
    if (hasSignatureOrTypes) score += 1.8;
    if (hasBehavioralRules) score += 1.8;
    if (hasTestSpec) score += 1.0;

    evidence = extractEvidenceQuotes(cleanedPrompt, [
      /\b(function\s+\w+|parse|return|reject|validate|unit\s+test|yyyy-mm-dd|cte|retention|division-by-zero)\b/i,
    ]);

    if (score < 7.5) {
      missingSpecificityItems.push(
        "Specific function/algorithm behavior (exact input/output signature, validation rules, and boundary cases).",
      );
    }
  } else if (taskCategory === "research_analysis") {
    const hasSpecificResearchQuestions =
      /\b(compare|evaluate|analyze|quantify|question|hypothesis|methodology|empirical|dataset|sample\s+size|time\s+horizon|20\d\d)\b/i.test(
        cleanedPrompt,
      );
    const hasEvidenceStandards =
      /\b(peer-reviewed|primary\s+source|citation|doi|meta-analysis|systematic|confidence\s+level|evidence\s+vs\.?\s+inference|limitations)\b/i.test(
        cleanedPrompt,
      );

    score = 4.8;
    if (hasSpecificResearchQuestions) score += 2.4;
    if (hasEvidenceStandards) score += 2.2;

    evidence = extractEvidenceQuotes(cleanedPrompt, [
      /\b(compare|evaluate|analyze|peer-reviewed|primary\s+source|citation|evidence|methodology)\b/i,
    ]);

    if (score < 7.5) {
      missingSpecificityItems.push(
        "Specific research parameters (exact analytical questions, comparison dimensions, and source quality standards).",
      );
    }
  } else if (taskCategory === "study_learning") {
    const hasLearningMechanics =
      /\b(spaced\s+repetition|active\s+recall|practice\s+problems?|flashcards?|worked\s+examples?|diagnostic|milestone|project-based|feynman|rubric)\b/i.test(
        cleanedPrompt,
      );
    const hasCurriculumBreakdown =
      /\b(week\s+\d+|day\s+\d+|module|unit|topic|prerequisite|hours?\s*(?:\/|\s+per\s+)\s*week|jlpt|ap\s+|calculus|python|sql)\b/i.test(
        cleanedPrompt,
      );

    score = 4.8;
    if (hasLearningMechanics) score += 2.3;
    if (hasCurriculumBreakdown) score += 2.2;

    evidence = extractEvidenceQuotes(cleanedPrompt, [
      /\b(spaced\s+repetition|active\s+recall|practice|diagnostic|milestone|week|hours?)\b/i,
    ]);

    if (score < 7.5) {
      missingSpecificityItems.push(
        "Specific pedagogical requirements (study schedule breakdown, active practice exercises, and mastery checks).",
      );
    }
  } else if (taskCategory === "creative_writing") {
    const hasEditorialOrNarrativeSpec =
      /\b(tone|voice|pov|first-person|third-person|protagonist|setting|pacing|imagery|dialogue|narrative\s+arc|hook|call-to-action|stanza|meter|word\s+count|\d+(?:,\d+)?\s*words?)\b/i.test(
        cleanedPrompt,
      );
    const hasConcreteThemeOrStructure =
      /\b(scene|act|section|opening|ending|climax|argument|counterargument|example|metaphor|constraint)\b/i.test(
        cleanedPrompt,
      );

    score = 4.8;
    if (hasEditorialOrNarrativeSpec) score += 2.4;
    if (hasConcreteThemeOrStructure) score += 2.0;

    evidence = extractEvidenceQuotes(cleanedPrompt, [
      /\b(tone|voice|pov|protagonist|setting|narrative|scene|words?|section|hook)\b/i,
    ]);

    if (score < 7.5) {
      missingSpecificityItems.push(
        "Specific creative/editorial parameters (voice/POV, structural beats, concrete imagery/examples, and target length).",
      );
    }
  } else {
    // Business strategy or general
    const hasBusinessOrDomainSpec =
      /\b(pricing|tier|onboarding|cac|ltv|churn|conversion|channel|outreach|playbook|kpi|metric|milestone|segment|workflow|step-by-step)\b/i.test(
        cleanedPrompt,
      );
    if (hasBusinessOrDomainSpec) {
      score = 8.6;
      evidence = extractEvidenceQuotes(cleanedPrompt, [
        /\b(pricing|onboarding|cac|ltv|channel|playbook|kpi|metric|segment)\b/i,
      ]);
    } else {
      score = 4.5;
      missingSpecificityItems.push(
        "Concrete domain requirements, metrics, or operational steps.",
      );
    }
  }

  // Penalize cross-domain irrelevant instructions or verbose low-density bloat
  if (relevanceAudit.unnecessaryInstructions.length > 0) {
    score -= 2.2;
  }
  if (relevanceAudit.bloatIndicators.length > 0) {
    score -= 1.5;
  }

  score = clampScore(score);

  const workingWell =
    score >= 8.0
      ? `Specifies concrete, task-relevant ${taskCategory.replace("_", " ")} requirements and parameters without relying on generic filler.`
      : "Identifies the high-level topic, but omits concrete functional or domain parameters.";

  const primaryWeakness =
    relevanceAudit.unnecessaryInstructions.length > 0
      ? relevanceAudit.unnecessaryInstructions[0]
      : score >= 8.0
        ? "None — requirements are specific and well-matched to the task."
        : missingSpecificityItems[0] ||
          "Requirements are too abstract to guide deterministic execution.";

  const concreteImprovement =
    relevanceAudit.unnecessaryInstructions.length > 0
      ? "Replace irrelevant cross-domain boilerplate with requirements specific to your actual task."
      : score >= 8.0
        ? "Requirement specificity is strong for this task category."
        : `Specify ${missingSpecificityItems[0]?.replace(/\.$/, "") || "concrete functional requirements and domain parameters"}.`;

  return {
    dimension: {
      id: "implementationSpecificity",
      name: "Implementation Specificity",
      score,
      weight: 0.15,
      applicable: true,
      workingWell,
      evidence:
        evidence.length > 0
          ? evidence
          : [
              "No concrete task-specific functional requirements or parameters found.",
            ],
      primaryWeakness,
      weaknesses: score >= 8.0 ? [] : [primaryWeakness],
      concreteImprovement,
      rubricNotes:
        score >= 8.0
          ? "High requirement specificity tailored to the task category."
          : "Add concrete, task-relevant functional requirements.",
    },
    missingSpecificityItems,
  };
}

// ============================================================================
// MAIN DETERMINISTIC EVALUATOR
// ============================================================================

export function evaluatePromptQuality(
  prompt: string,
  context?: EvaluationContext,
): PromptEvaluationResult {
  const trimmed = (prompt || "").trim();
  const wordCount = trimmed ? trimmed.split(/\s+/).length : 0;
  const effectiveBudget =
    context?.budget ?? context?.projectProfile?.budget?.value;
  const lowerTrimmed = trimmed.toLowerCase();
  const isZeroBudget =
    effectiveBudget === "$0" ||
    effectiveBudget?.toLowerCase().includes("free") ||
    effectiveBudget?.toLowerCase().includes("$0") ||
    lowerTrimmed.includes("$0") ||
    lowerTrimmed.includes("zero budget") ||
    lowerTrimmed.includes("free tier");
  const detectedBudgetConstraint = isZeroBudget
    ? "$0 (Free Tier / Zero-Cost Only)"
    : effectiveBudget || undefined;

  // Only truly empty or 1-3 word non-sentence stubs trigger the minimal fallback
  if (!trimmed || trimmed.length < 12 || wordCount < 4) {
    const emptyDim = (
      id: string,
      name: string,
      weight: number,
      improvement: string,
    ): ScoreDimension => ({
      id,
      name,
      score: 2.5,
      weight,
      applicable: true,
      workingWell: "Minimal topic seed provided.",
      evidence: trimmed ? [`"${trimmed}"`] : ["Prompt is empty."],
      primaryWeakness:
        "Prompt is too brief to specify a clear objective, context, constraints, or deliverable.",
      weaknesses: [
        "Prompt is too brief to specify a clear objective, context, constraints, or deliverable.",
      ],
      concreteImprovement: improvement,
      rubricNotes: "Unformed prompt stub.",
    });

    const dimensions = {
      clarity: emptyDim(
        "clarity",
        "Clarity & Intent",
        0.15,
        "State a complete sentence describing the specific action and target deliverable you want.",
      ),
      context: emptyDim(
        "context",
        "Context & Background",
        0.1,
        "Add the key background, inputs, or target scenario for the request.",
      ),
      constraints: emptyDim(
        "constraints",
        "Constraints & Guardrails",
        0.12,
        "Specify at least 1–2 boundaries or exclusions (e.g., length, scope, or budget).",
      ),
      audience: emptyDim(
        "audience",
        "Target Audience",
        0.08,
        "Identify who the output is for and the desired complexity level.",
      ),
      outputRequirements: emptyDim(
        "outputRequirements",
        "Output Format & Structure",
        0.15,
        "Specify the exact output format or deliverable structure.",
      ),
      completeness: emptyDim(
        "completeness",
        "Completeness & Edge Cases",
        0.1,
        "Define 2–3 verifiable acceptance criteria or edge cases.",
      ),
      technicalFeasibility: emptyDim(
        "technicalFeasibility",
        "Technical Feasibility",
        0.15,
        "Specify realistic operational, resource, or verification boundaries.",
      ),
      implementationSpecificity: emptyDim(
        "implementationSpecificity",
        "Implementation Specificity",
        0.15,
        "Add concrete requirements and parameters relevant to your task.",
      ),
    };

    const prioritizedImprovements: PrioritizedImprovement[] = [
      {
        rank: 1,
        dimensionId: "clarity",
        dimensionName: "Clarity & Intent",
        issue: dimensions.clarity.primaryWeakness,
        recommendation: dimensions.clarity.concreteImprovement,
        expectedImpact: "high",
        estimatedScoreGain: 2.5,
      },
      {
        rank: 2,
        dimensionId: "implementationSpecificity",
        dimensionName: "Implementation Specificity",
        issue: dimensions.implementationSpecificity.primaryWeakness,
        recommendation:
          dimensions.implementationSpecificity.concreteImprovement,
        expectedImpact: "high",
        estimatedScoreGain: 2.0,
      },
      {
        rank: 3,
        dimensionId: "outputRequirements",
        dimensionName: "Output Format & Structure",
        issue: dimensions.outputRequirements.primaryWeakness,
        recommendation: dimensions.outputRequirements.concreteImprovement,
        expectedImpact: "high",
        estimatedScoreGain: 1.8,
      },
    ];

    return {
      overallScore: 2.5,
      readinessLevel: "Draft",
      isProductionReady: false,
      dimensions,
      meaningfulQualities: {
        goalClarity: 2.5,
        contextSufficiency: 2.5,
        requirementSpecificity: 2.5,
        constraintQuality: 2.5,
        deliverableDefinition: 2.5,
        testabilityAndAcceptance: 2.5,
        internalConsistency: 8.0,
        relevanceAndEfficiency: 5.0,
      },
      prioritizedImprovements,
      actionableWeaknesses: prioritizedImprovements.map(
        (p) => `${p.dimensionName}: ${p.recommendation}`,
      ),
      missingRequirements: [
        "Clear primary objective and target deliverable",
        "Concrete task requirements and constraints",
        "Verifiable acceptance criteria",
      ],
      summaryEvidence: [],
      detectedBudgetConstraint,
      internalConsistencyAudit: {
        isConsistent: true,
        score: 8.0,
        contradictions: [],
      },
      relevanceAndEfficiencyAudit: {
        isRelevantAndEfficient: false,
        score: 5.0,
        taskCategory: "general",
        unnecessaryInstructions: [],
        hollowConstructs: [],
        bloatIndicators: [
          "Prompt is a minimal fragment lacking actionable specification.",
        ],
      },
      executionQualityDisclaimer: EXECUTION_QUALITY_DISCLAIMER,
      qualityDistinction: {
        promptQualityMeasures: [
          "Goal clarity and unambiguous intent",
          "Context sufficiency and requirement specificity",
          "Internal consistency and verifiable acceptance criteria",
        ],
        executionQualityRequires: [
          "Target AI model reasoning and instruction adherence",
          "Runtime compilation, test execution, or primary-source verification",
        ],
        disclaimer: EXECUTION_QUALITY_DISCLAIMER,
      },
      rubricMappingDocumentation: RUBRIC_MAPPING_DOCUMENTATION,
      evaluationMethod: "deterministic",
    };
  }

  // Step 1: Detect hollow constructs, empty headings, and phrase stuffing
  const hollowResult = detectHollowConstructs(trimmed);
  const cleanedPrompt = hollowResult.cleanedPromptForScoring;

  // Step 2: Classify actual task category
  const taskCategory = classifyEvaluatorTaskCategory(trimmed, context);

  // Step 3: Run Internal Consistency & Contradiction Audit
  const consistencyAudit = auditInternalConsistency(trimmed, context);

  // Step 4: Run Relevance, Efficiency & Anti-Bloat Audit
  const relevanceAudit = auditRelevanceAndEfficiency(
    trimmed,
    taskCategory,
    hollowResult,
  );

  // Step 5: Evaluate all 8 dimensions using substantive evidence
  const clarity = evaluateGoalClarity(
    trimmed,
    cleanedPrompt,
    taskCategory,
    relevanceAudit,
  );
  const { dimension: contextDim, missingContextItems } =
    evaluateContextSufficiency(cleanedPrompt, taskCategory, hollowResult);
  const { dimension: constraints, missingConstraintItems } =
    evaluateConstraintQuality(cleanedPrompt, consistencyAudit, hollowResult);
  const audience = evaluateAudienceAndRelevance(
    cleanedPrompt,
    taskCategory,
    relevanceAudit,
  );
  const { dimension: outputRequirements, missingDeliverableItems } =
    evaluateDeliverableDefinition(cleanedPrompt, hollowResult);
  const { dimension: completeness, missingTestabilityItems } =
    evaluateTestabilityAndCompleteness(
      cleanedPrompt,
      taskCategory,
      hollowResult,
    );
  const technicalFeasibility = evaluateOperationalFeasibility(
    cleanedPrompt,
    taskCategory,
    consistencyAudit,
    context,
  );
  const { dimension: implementationSpecificity, missingSpecificityItems } =
    evaluateRequirementSpecificity(cleanedPrompt, taskCategory, relevanceAudit);

  const dimensions = {
    clarity,
    context: contextDim,
    constraints,
    audience,
    outputRequirements,
    completeness,
    technicalFeasibility,
    implementationSpecificity,
  };

  // Calculate weighted overall score
  let weightedSum = 0;
  for (const dim of Object.values(dimensions)) {
    weightedSum += dim.score * dim.weight;
  }

  // Apply structural usability bonus ONLY when headings organize substantive multi-section content
  if (
    hollowResult.substantiveHeadingCount >= 3 &&
    hollowResult.emptyHeadingCount === 0 &&
    consistencyAudit.isConsistent &&
    relevanceAudit.isRelevantAndEfficient
  ) {
    weightedSum = Math.min(10.0, weightedSum + 0.2);
  }

  // Hard guardrails for severe defects:
  // 1. Unaddressed internal contradictions cannot be "Production Ready"
  if (!consistencyAudit.isConsistent) {
    weightedSum = Math.min(weightedSum, 5.8);
  }
  // 2. Severe cross-domain irrelevant instructions or hollow stuffing cap overall score
  if (relevanceAudit.unnecessaryInstructions.length > 0) {
    weightedSum = Math.min(weightedSum, 6.4);
  }
  if (
    hollowResult.hollowConstructs.length >= 2 &&
    implementationSpecificity.score < 7.0
  ) {
    weightedSum = Math.min(weightedSum, 5.6);
  }
  if (
    relevanceAudit.bloatIndicators.length > 0 &&
    implementationSpecificity.score < 6.0
  ) {
    weightedSum = Math.min(weightedSum, 5.0);
  }

  const overallScore = clampScore(weightedSum);

  let readinessLevel: PromptEvaluationResult["readinessLevel"] = "Draft";
  if (overallScore >= 9.0) readinessLevel = "Enterprise Certified";
  else if (overallScore >= 7.8) readinessLevel = "Production Ready";
  else if (overallScore >= 6.0) readinessLevel = "Needs Refinement";

  const isProductionReady =
    overallScore >= 7.8 &&
    consistencyAudit.isConsistent &&
    relevanceAudit.unnecessaryInstructions.length === 0;

  // Build prioritized improvements: select the smallest number of highest-leverage changes (max 3)
  const candidateImprovements: Array<{
    dimensionId: keyof PromptEvaluationResult["dimensions"];
    dimensionName: string;
    score: number;
    weight: number;
    leverage: number;
    issue: string;
    recommendation: string;
  }> = [];

  for (const [key, dim] of Object.entries(dimensions) as Array<
    [keyof PromptEvaluationResult["dimensions"], ScoreDimension]
  >) {
    if (dim.score < 8.2) {
      const deficit = 10 - dim.score;
      const leverage = Number((deficit * (dim.weight + 0.05)).toFixed(2));
      candidateImprovements.push({
        dimensionId: key,
        dimensionName: dim.name,
        score: dim.score,
        weight: dim.weight,
        leverage,
        issue: dim.primaryWeakness,
        recommendation: dim.concreteImprovement,
      });
    }
  }

  candidateImprovements.sort((a, b) => b.leverage - a.leverage);

  // Deduplicate recommendations so we never suggest redundant edits
  const seenRecs = new Set<string>();
  const prioritizedImprovements: PrioritizedImprovement[] = [];
  for (const item of candidateImprovements) {
    if (prioritizedImprovements.length >= 3) break;
    const normRec = item.recommendation.toLowerCase();
    if (seenRecs.has(normRec)) continue;
    seenRecs.add(normRec);
    prioritizedImprovements.push({
      rank: prioritizedImprovements.length + 1,
      dimensionId: item.dimensionId,
      dimensionName: item.dimensionName,
      issue: item.issue,
      recommendation: item.recommendation,
      expectedImpact: item.score < 6.5 ? "high" : "medium",
      estimatedScoreGain: Number(
        Math.max(0.3, (9.0 - item.score) * item.weight).toFixed(1),
      ),
    });
  }

  const actionableWeaknesses = prioritizedImprovements.map(
    (p) => `${p.dimensionName}: ${p.recommendation}`,
  );

  const missingRequirements = Array.from(
    new Set([
      ...missingSpecificityItems,
      ...missingDeliverableItems,
      ...missingTestabilityItems,
      ...missingConstraintItems,
      ...missingContextItems,
    ]),
  ).slice(0, 4);

  const summaryEvidence: string[] = [];
  for (const dim of Object.values(dimensions)) {
    for (const ev of dim.evidence) {
      if (
        !ev.startsWith("No ") &&
        !ev.startsWith("Target audience or consumer") &&
        !ev.startsWith("Contradictory")
      ) {
        summaryEvidence.push(`${dim.name}: ${ev}`);
      }
    }
  }

  return {
    overallScore,
    readinessLevel,
    isProductionReady,
    dimensions,
    meaningfulQualities: {
      goalClarity: clarity.score,
      contextSufficiency: contextDim.score,
      requirementSpecificity: implementationSpecificity.score,
      constraintQuality: constraints.score,
      deliverableDefinition: outputRequirements.score,
      testabilityAndAcceptance: completeness.score,
      internalConsistency: consistencyAudit.score,
      relevanceAndEfficiency: relevanceAudit.score,
    },
    prioritizedImprovements,
    actionableWeaknesses,
    missingRequirements,
    summaryEvidence: summaryEvidence.slice(0, 8),
    detectedBudgetConstraint,
    internalConsistencyAudit: consistencyAudit,
    relevanceAndEfficiencyAudit: relevanceAudit,
    executionQualityDisclaimer: EXECUTION_QUALITY_DISCLAIMER,
    qualityDistinction: {
      promptQualityMeasures: [
        "Goal clarity and unambiguous intent",
        "Context sufficiency and task-relevant requirement specificity",
        "Constraint quality and internal consistency across requirements",
        "Deliverable definition and verifiable acceptance criteria",
      ],
      executionQualityRequires: [
        "Target AI model reasoning accuracy and instruction adherence",
        "External runtime verification (e.g., code compilation, test execution, or primary-source fact checking)",
      ],
      disclaimer: EXECUTION_QUALITY_DISCLAIMER,
    },
    rubricMappingDocumentation: RUBRIC_MAPPING_DOCUMENTATION,
    evaluationMethod: "deterministic",
  };
}

// ============================================================================
// HYBRID AI-VALIDATED SEMANTIC EVALUATOR (WITH DETERMINISTIC GUARDRAILS)
// ============================================================================

/**
 * Evaluates a prompt using both the deterministic rubric engine and optional semantic
 * AI validation via the configured server-side Gemini provider (`src/lib/ai-provider.ts`).
 *
 * Security & Calibration Guardrails:
 * - Never exposes or accepts API keys from the client.
 * - Validates and clamps any AI-returned dimension scores so the model cannot inflate
 *   prompts that fail deterministic checks (e.g., hollow acceptance criteria, internal
 *   contradictions, or cross-domain bloat).
 * - Falls back cleanly to deterministic evaluation if the AI provider is unconfigured,
 *   rate-limited, or returns malformed output.
 */
export async function evaluatePromptQualityWithAI(
  prompt: string,
  context?: EvaluationContext,
): Promise<PromptEvaluationResult> {
  const deterministic = evaluatePromptQuality(prompt, context);

  // Allow injected semanticScorer (for deterministic unit testing of the hybrid pipeline)
  // or use server-side Gemini model if API key is valid
  let semanticOverrides: Awaited<
    ReturnType<NonNullable<EvaluationContext["semanticScorer"]>>
  > = null;

  if (context?.semanticScorer) {
    try {
      semanticOverrides = await context.semanticScorer(prompt, deterministic);
    } catch {
      return deterministic;
    }
  } else {
    const keyCheck = validateApiKey();
    if (!keyCheck.valid) {
      return deterministic;
    }
    try {
      const model = getModel({ model: DEFAULT_GEMINI_MODEL });
      const { text } = await generateText({
        model,
        system: `You are a strict, calibrated prompt-quality auditor. Evaluate the user's prompt across the 8 dimensions (clarity, context, constraints, audience, outputRequirements, completeness, technicalFeasibility, implementationSpecificity).
Rules:
- Never reward hollow phrases like "Acceptance criteria: make it good" or empty headings.
- Do not penalize concise prompts if they are complete and unambiguous for their task.
- Penalize internal contradictions and irrelevant cross-domain instructions.
- Return ONLY valid JSON matching:
{
  "dimensions": {
    "<dimensionId>": {
      "score": number (1.0 to 10.0),
      "workingWell": string,
      "evidence": string[],
      "primaryWeakness": string,
      "concreteImprovement": string
    }
  }
}`,
        prompt: `Task Category: ${deterministic.relevanceAndEfficiencyAudit.taskCategory}\nPrompt to evaluate:\n${prompt}`,
      });

      const jsonMatch = /\{[\s\S]*\}/.exec(text || "");
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]) as {
          dimensions?: NonNullable<typeof semanticOverrides>;
        };
        if (parsed && typeof parsed.dimensions === "object") {
          semanticOverrides = parsed.dimensions;
        }
      }
    } catch {
      return deterministic;
    }
  }

  if (!semanticOverrides || typeof semanticOverrides !== "object") {
    return deterministic;
  }

  // Merge AI semantic judgments with deterministic guardrails:
  // Any AI score cannot deviate by more than +-1.2 from deterministic baseline,
  // and cannot exceed deterministic hard caps when contradictions or hollow constructs exist.
  const mergedDimensions = { ...deterministic.dimensions };
  let weightedSum = 0;

  for (const key of Object.keys(mergedDimensions) as Array<
    keyof PromptEvaluationResult["dimensions"]
  >) {
    const baseDim = mergedDimensions[key];
    const aiDim = semanticOverrides[key];
    if (!aiDim || typeof aiDim !== "object") {
      weightedSum += baseDim.score * baseDim.weight;
      continue;
    }

    let nextScore = baseDim.score;
    if (
      typeof aiDim.score === "number" &&
      !Number.isNaN(aiDim.score) &&
      aiDim.score >= 1 &&
      aiDim.score <= 10
    ) {
      // Bound within +-1.2 of deterministic score
      const boundedAi = Math.max(
        baseDim.score - 1.2,
        Math.min(baseDim.score + 1.2, aiDim.score),
      );
      nextScore = clampScore(baseDim.score * 0.6 + boundedAi * 0.4);

      // Enforce hard cap if deterministic audit detected a contradiction or hollow construct
      if (
        !deterministic.internalConsistencyAudit.isConsistent &&
        (key === "constraints" || key === "technicalFeasibility")
      ) {
        nextScore = Math.min(nextScore, baseDim.score);
      }
      if (
        deterministic.relevanceAndEfficiencyAudit.hollowConstructs.length > 0 &&
        key === "completeness"
      ) {
        nextScore = Math.min(nextScore, baseDim.score);
      }
    }

    mergedDimensions[key] = {
      ...baseDim,
      score: nextScore,
      workingWell:
        typeof aiDim.workingWell === "string" &&
        aiDim.workingWell.trim().length > 8
          ? aiDim.workingWell.trim()
          : baseDim.workingWell,
      evidence:
        Array.isArray(aiDim.evidence) && aiDim.evidence.length > 0
          ? aiDim.evidence.slice(0, 3)
          : baseDim.evidence,
      primaryWeakness:
        typeof aiDim.primaryWeakness === "string" &&
        aiDim.primaryWeakness.trim().length > 5
          ? aiDim.primaryWeakness.trim()
          : baseDim.primaryWeakness,
      concreteImprovement:
        typeof aiDim.concreteImprovement === "string" &&
        aiDim.concreteImprovement.trim().length > 8
          ? aiDim.concreteImprovement.trim()
          : baseDim.concreteImprovement,
    };

    weightedSum += mergedDimensions[key].score * mergedDimensions[key].weight;
  }

  if (!deterministic.internalConsistencyAudit.isConsistent) {
    weightedSum = Math.min(weightedSum, 5.8);
  }
  if (
    deterministic.relevanceAndEfficiencyAudit.unnecessaryInstructions.length > 0
  ) {
    weightedSum = Math.min(weightedSum, 6.4);
  }

  const overallScore = clampScore(weightedSum);
  let readinessLevel: PromptEvaluationResult["readinessLevel"] = "Draft";
  if (overallScore >= 9.0) readinessLevel = "Enterprise Certified";
  else if (overallScore >= 7.8) readinessLevel = "Production Ready";
  else if (overallScore >= 6.0) readinessLevel = "Needs Refinement";

  return {
    ...deterministic,
    overallScore,
    readinessLevel,
    isProductionReady:
      overallScore >= 7.8 &&
      deterministic.internalConsistencyAudit.isConsistent &&
      deterministic.relevanceAndEfficiencyAudit.unnecessaryInstructions
        .length === 0,
    dimensions: mergedDimensions,
    evaluationMethod: "hybrid_ai_validated",
  };
}
