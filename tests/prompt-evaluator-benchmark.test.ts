import test from "node:test";
import assert from "node:assert/strict";

import {
  evaluatePromptQuality,
  evaluatePromptQualityWithAI,
  detectHollowConstructs,
  auditInternalConsistency,
  auditRelevanceAndEfficiency,
  classifyEvaluatorTaskCategory,
  RUBRIC_MAPPING_DOCUMENTATION,
  EXECUTION_QUALITY_DISCLAIMER,
} from "../src/lib/prompt-evaluator";
import {
  PROMPT_EVALUATION_BENCHMARK,
  HUMAN_GRADING_PROCEDURE,
  runPromptBenchmarkCalibration,
  type BenchmarkCategory,
} from "../src/lib/prompt-benchmark";

test("1. Rubric Preservation & Documentation: preserves 8 dimensions and documents mapping to meaningful qualities", () => {
  const samplePrompt =
    "Write a pure TypeScript function `parseIsoDate(input: string): Date | null` for API callers. Reject invalid calendar dates like 2025-02-29 without external libraries, and return the code block with 4 unit tests.";
  const result = evaluatePromptQuality(samplePrompt);

  const expectedDimKeys = [
    "clarity",
    "context",
    "constraints",
    "audience",
    "outputRequirements",
    "completeness",
    "technicalFeasibility",
    "implementationSpecificity",
  ] as const;

  for (const key of expectedDimKeys) {
    const dim = result.dimensions[key];
    assert.ok(dim, `Dimension ${key} must exist`);
    assert.equal(typeof dim.score, "number");
    assert.ok(dim.score >= 1.0 && dim.score <= 10.0);
    assert.ok(
      dim.workingWell.length > 5,
      `${key} must state what is workingWell`,
    );
    assert.ok(
      Array.isArray(dim.evidence) && dim.evidence.length > 0,
      `${key} must provide evidence`,
    );
    assert.ok(
      dim.primaryWeakness.length > 5,
      `${key} must provide primaryWeakness`,
    );
    assert.ok(
      dim.concreteImprovement.length > 5,
      `${key} must provide concreteImprovement`,
    );
    assert.ok(
      RUBRIC_MAPPING_DOCUMENTATION[key],
      `Dimension ${key} must be documented in RUBRIC_MAPPING_DOCUMENTATION`,
    );
  }

  // Verify all 8 meaningful qualities are explicitly scored
  const mq = result.meaningfulQualities;
  assert.equal(typeof mq.goalClarity, "number");
  assert.equal(typeof mq.contextSufficiency, "number");
  assert.equal(typeof mq.requirementSpecificity, "number");
  assert.equal(typeof mq.constraintQuality, "number");
  assert.equal(typeof mq.deliverableDefinition, "number");
  assert.equal(typeof mq.testabilityAndAcceptance, "number");
  assert.equal(typeof mq.internalConsistency, "number");
  assert.equal(typeof mq.relevanceAndEfficiency, "number");
});

test("2. Anti-Shallow Heuristics: phrase 'acceptance criteria' or empty headings never earn automatic high scores", () => {
  const superficialPrompt = `Write a marketing plan for a coffee shop.
# Context
Context: standard.
# Constraints
Constraints: best practices.
# Output Format
Output: make it good.
# Acceptance Criteria
Acceptance criteria: make it good and high quality.`;

  const hollow = detectHollowConstructs(superficialPrompt);
  assert.equal(hollow.hasHollowAcceptanceCriteria, true);
  assert.equal(hollow.hasHollowConstraints, true);
  assert.equal(hollow.hasHollowContext, true);
  assert.equal(hollow.hasHollowOutput, true);
  assert.ok(hollow.hollowConstructs.length >= 4);

  const result = evaluatePromptQuality(superficialPrompt);
  assert.ok(
    result.dimensions.completeness.score <= 5.0,
    `Hollow 'Acceptance criteria: make it good' must not score above 5.0, got ${result.dimensions.completeness.score}`,
  );
  assert.ok(
    result.dimensions.constraints.score <= 5.0,
    `Hollow 'Constraints: best practices' must not score above 5.0, got ${result.dimensions.constraints.score}`,
  );
  assert.ok(
    result.overallScore < 5.6,
    `Superficial heading-stuffed prompt must score below 5.6, got ${result.overallScore}`,
  );
  assert.equal(result.isProductionReady, false);
});

test("3. Concise Prompt Fairness vs. Long Verbose Filler: concise effective prompt outscores long poorly specified prompt", () => {
  const conciseEffective =
    "Write a pure TypeScript function `parseStrictIsoDate(input: string): Date | null` for Node.js API callers. Reject calendar-invalid dates like 2025-02-29 or month 13 without using external libraries. Return a single code block containing the function and 4 Vitest unit test cases covering valid leap years, invalid months, empty strings, and malformed formats.";

  const longPoorlySpecified = `Please write a comprehensive strategy for my new company so we can succeed in the market and beat all of our competitors quickly. It is very important that this strategy is high quality, well thought out, and covers everything we need to know to succeed in the market and beat all of our competitors quickly. Please make sure the output is very detailed and uses best practices for business strategy so we can succeed in the market and beat all of our competitors quickly. Include acceptance criteria so we know it is good. The deliverable should be great, clear, actionable, and professional at all times so that everyone on the team likes it and we can grow fast.`;

  const conciseEval = evaluatePromptQuality(conciseEffective);
  const longWeakEval = evaluatePromptQuality(longPoorlySpecified);

  assert.ok(
    conciseEval.overallScore >= 8.2,
    `Concise effective prompt should score >= 8.2, got ${conciseEval.overallScore}`,
  );
  assert.ok(
    longWeakEval.overallScore <= 5.5,
    `Long poorly specified filler prompt should score <= 5.5, got ${longWeakEval.overallScore}`,
  );
  assert.ok(
    conciseEval.overallScore - longWeakEval.overallScore >= 3.0,
    `Concise effective prompt (${conciseEval.overallScore}) must outscore long poorly specified prompt (${longWeakEval.overallScore}) by at least 3.0 points`,
  );
});

test("4. Relevance & Efficiency: detects and penalizes unnecessary cross-domain software boilerplate in non-software prompts", () => {
  const crossDomainPoetryPrompt = `Objective: Write a 14-line Shakespearean sonnet about autumn leaves for literary magazine readers.
Constraints & Stack: Must use React 19, Next.js, Tailwind CSS, TanStack Query, and Zod schemas on all form submissions. Isolate secrets in .env.example, enforce a 500MB PostgreSQL database quota on Cloudflare Pages, include a React error boundary, and ensure tsc --noEmit exits 0 with WCAG AA compliance.`;

  const taskCat = classifyEvaluatorTaskCategory(crossDomainPoetryPrompt, {
    goal: "Write a 14-line Shakespearean sonnet about autumn leaves",
  });
  assert.equal(taskCat, "creative_writing");

  const result = evaluatePromptQuality(crossDomainPoetryPrompt, {
    goal: "Write a 14-line Shakespearean sonnet about autumn leaves",
  });

  assert.equal(
    result.relevanceAndEfficiencyAudit.isRelevantAndEfficient,
    false,
  );
  assert.ok(
    result.relevanceAndEfficiencyAudit.unnecessaryInstructions.length > 0,
    "Must flag irrelevant software-engineering boilerplate in a creative poetry prompt",
  );
  assert.ok(
    result.overallScore <= 6.4,
    `Cross-domain polluted prompt must be capped <= 6.4, got ${result.overallScore}`,
  );
  assert.equal(result.isProductionReady, false);
});

test("5. Internal Consistency: detects contradictory requirements and prevents Production Ready status", () => {
  const contradictoryPrompt = `Build a customer support portal for startup teams.
Constraints: Strictly $0 budget with zero cost, and you must use paid Twilio SMS, provision a dedicated GPU cluster, and hire a full-time paid agency with no organic fallback. Use vanilla JavaScript only with zero external dependencies, and you must use React 19, Tailwind CSS, Zod, and TanStack Query.`;

  const consistency = auditInternalConsistency(contradictoryPrompt, {
    budget: "$0",
  });
  assert.equal(consistency.isConsistent, false);
  assert.ok(
    consistency.contradictions.length >= 2,
    `Expected >= 2 contradictions (budget + dependency), got ${consistency.contradictions.length}`,
  );

  const result = evaluatePromptQuality(contradictoryPrompt, { budget: "$0" });
  assert.equal(result.internalConsistencyAudit.isConsistent, false);
  assert.equal(result.isProductionReady, false);
  assert.ok(
    result.overallScore <= 5.8,
    `Contradictory prompt must be capped <= 5.8, got ${result.overallScore}`,
  );
  assert.match(result.dimensions.constraints.primaryWeakness, /contradiction/i);
});

test("6. Actionable Scoring & Execution Quality Distinction: prioritizes 1-3 highest-leverage changes and includes disclaimer", () => {
  const moderatePrompt =
    "Create a 4-week study plan to learn JLPT N5 Japanese vocabulary and basic grammar for a complete beginner who can study 5 hours per week. Organize the output as a weekly Markdown schedule.";

  const result = evaluatePromptQuality(moderatePrompt);

  assert.ok(
    result.prioritizedImprovements.length >= 1 &&
      result.prioritizedImprovements.length <= 3,
    `Should recommend 1 to 3 highest-leverage improvements, got ${result.prioritizedImprovements.length}`,
  );
  assert.ok(
    result.actionableWeaknesses.length <= 3,
    `Actionable weaknesses should be capped at top 3 highest-leverage items, got ${result.actionableWeaknesses.length}`,
  );
  assert.equal(result.executionQualityDisclaimer, EXECUTION_QUALITY_DISCLAIMER);
  assert.ok(
    result.qualityDistinction.promptQualityMeasures.length >= 3 &&
      result.qualityDistinction.executionQualityRequires.length >= 2,
  );
});

test("7. Hybrid AI Validation Guardrails: clamps inflated semantic scores on hollow/contradictory prompts and falls back safely on error", async () => {
  const hollowContradictoryPrompt = `Write a cloud guide.
Constraints: Keep under 50 words and write a 2,000-word deep dive.
Acceptance criteria: make it good.`;

  // 1. Test guardrail clamping when a mock semantic AI attempts to return 10.0 across all dimensions
  const guardedResult = await evaluatePromptQualityWithAI(
    hollowContradictoryPrompt,
    {
      semanticScorer: async () => ({
        clarity: { score: 10.0, workingWell: "Inflated AI praise" },
        constraints: { score: 10.0, workingWell: "Inflated AI praise" },
        completeness: { score: 10.0, workingWell: "Inflated AI praise" },
        technicalFeasibility: {
          score: 10.0,
          workingWell: "Inflated AI praise",
        },
      }),
    },
  );

  assert.equal(guardedResult.evaluationMethod, "hybrid_ai_validated");
  assert.equal(guardedResult.isProductionReady, false);
  assert.ok(
    guardedResult.overallScore <= 5.8,
    `Deterministic guardrails must prevent AI score inflation on contradictory/hollow prompts, got ${guardedResult.overallScore}`,
  );
  assert.ok(
    guardedResult.dimensions.completeness.score <= 5.0,
    `Hollow acceptance criteria guardrail must hold even under AI override, got ${guardedResult.dimensions.completeness.score}`,
  );

  // 2. Test fallback when semanticScorer throws an error
  const fallbackResult = await evaluatePromptQualityWithAI(
    hollowContradictoryPrompt,
    {
      semanticScorer: async () => {
        throw new Error("Simulated provider network failure");
      },
    },
  );
  assert.equal(fallbackResult.evaluationMethod, "deterministic");
  assert.equal(fallbackResult.isProductionReady, false);
});

test("8. Empirical Benchmark Calibration Suite: verifies all 8 prompt categories and meets human-agreement calibration targets", () => {
  // Verify all 8 required benchmark categories exist in PROMPT_EVALUATION_BENCHMARK
  const requiredCategories: BenchmarkCategory[] = [
    "concise_effective",
    "long_poorly_specified",
    "coding",
    "research",
    "study",
    "creative",
    "contradictory",
    "unnecessary_instructions",
  ];

  for (const cat of requiredCategories) {
    const count = PROMPT_EVALUATION_BENCHMARK.filter(
      (b) => b.category === cat,
    ).length;
    assert.ok(
      count >= 1,
      `Benchmark dataset must include category "${cat}", found ${count}`,
    );
  }

  // Verify human grading procedure is documented
  assert.ok(HUMAN_GRADING_PROCEDURE.raterProtocol.length >= 4);
  assert.ok(HUMAN_GRADING_PROCEDURE.antiShallowRules.length >= 3);

  // Run empirical calibration
  const report = runPromptBenchmarkCalibration();

  // Check every individual benchmark item falls within its human expectedScoreBand
  for (const item of report.items) {
    assert.ok(
      item.withinExpectedBand,
      `Benchmark item "${item.id}" scored ${item.evaluatorOverallScore}, outside human band for its tier (human: ${item.humanOverallScore}, absErr: ${item.absoluteError})`,
    );
  }

  // Check all 12 pairwise ordering invariants
  for (const pair of report.pairwiseOrderingChecks) {
    assert.equal(
      pair.passed,
      true,
      `Pairwise ordering check failed: ${pair.description} (${pair.higherPromptId}=${pair.higherScore} vs ${pair.lowerPromptId}=${pair.lowerScore})`,
    );
  }

  // Verify global calibration metrics against targets
  assert.ok(
    report.meanAbsoluteError <=
      HUMAN_GRADING_PROCEDURE.calibrationTargets.maxMeanAbsoluteError,
    `MAE (${report.meanAbsoluteError}) must be <= ${HUMAN_GRADING_PROCEDURE.calibrationTargets.maxMeanAbsoluteError}`,
  );
  assert.ok(
    report.withinOnePointRate >=
      HUMAN_GRADING_PROCEDURE.calibrationTargets.minWithinOnePointRate,
    `Within-1.0-point agreement rate (${report.withinOnePointRate}) must be >= ${HUMAN_GRADING_PROCEDURE.calibrationTargets.minWithinOnePointRate}`,
  );
  assert.ok(
    report.pearsonCorrelation >=
      HUMAN_GRADING_PROCEDURE.calibrationTargets.minPearsonCorrelation,
    `Pearson r (${report.pearsonCorrelation}) must be >= ${HUMAN_GRADING_PROCEDURE.calibrationTargets.minPearsonCorrelation}`,
  );
  assert.ok(
    report.spearmanRankCorrelation >=
      HUMAN_GRADING_PROCEDURE.calibrationTargets.minSpearmanRankCorrelation,
    `Spearman rho (${report.spearmanRankCorrelation}) must be >= ${HUMAN_GRADING_PROCEDURE.calibrationTargets.minSpearmanRankCorrelation}`,
  );
  assert.equal(report.pairwiseOrderingAccuracy, 1.0);
  assert.equal(report.meetsAllCalibrationTargets, true);
});
