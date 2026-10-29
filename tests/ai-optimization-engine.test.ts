import test from "node:test";
import assert from "node:assert/strict";

import {
  ALL_MODELS,
  MODEL_OPTIMIZATION_PROFILES,
  buildCanonicalProjectSpec,
  classifyTaskCategory,
  ensureAllSevenModels,
  generateOptimizedPrompts,
  type ModelKey,
  type TaskCategory,
} from "../src/lib/ai-optimization-engine";
import {
  createEmptyProjectProfile,
  updateProjectProfileTurn,
  type ProjectProfile,
} from "../src/lib/project-understanding-engine";
import { evaluatePromptQuality } from "../src/lib/prompt-evaluator";

function buildPopulatedProfile(options: {
  expertId?: "website" | "business" | "study" | "creator" | null;
  turns: Array<{
    userText: string;
    slotId?: string | null;
    slotLabel?: string | null;
  }>;
}): ProjectProfile {
  let profile = createEmptyProjectProfile(options.expertId ?? null);
  options.turns.forEach((t, idx) => {
    profile = updateProjectProfileTurn(profile, {
      turnIndex: idx,
      userText: t.userText,
      slotId: t.slotId ?? null,
      slotLabel: t.slotLabel ?? null,
      expertId: options.expertId ?? null,
    });
  });
  return profile;
}

test("1. Canonical Project Specification: builds from validated ProjectProfile without inventing unrequested requirements", () => {
  let profile = buildPopulatedProfile({
    expertId: "creator",
    turns: [
      {
        userText:
          "Write a 1,200-word investigative op-ed on municipal water pricing for urban homeowners. Exclude partisan slogans and do not use AI buzzwords.",
      },
      {
        userText:
          "My budget is $0 and I need it structured as a 4-part markdown article within 3 days.",
        slotId: "format",
        slotLabel: "Format & Structure",
      },
      {
        userText: "You decide the publishing cadence and subheadings.",
        slotId: "cadence",
        slotLabel: "Publishing Cadence",
      },
    ],
  });

  // Add an unresolved contradiction to verify conflict propagation
  profile = updateProjectProfileTurn(profile, {
    turnIndex: 3,
    userText:
      "I have a $0 budget and zero money, and I want to run paid ads and hire an agency.",
    slotId: "budget",
    slotLabel: "Budget",
    expertId: "creator",
  });

  const spec = buildCanonicalProjectSpec(
    profile.primaryGoal?.value || "",
    [],
    "creator",
    { projectProfile: profile },
  );

  assert.equal(spec.taskCategory, "writing_editing");
  assert.match(
    spec.objective,
    /investigative op-ed on municipal water pricing/i,
  );
  assert.ok(spec.audience, "Should capture target audience from profile");
  assert.match(spec.audience?.value || "", /homeowners/i);
  assert.ok(
    spec.explicitExclusions.some((e) => /partisan slogans|buzzwords/i.test(e)),
    "Should preserve explicit exclusions in canonical spec",
  );
  assert.ok(
    spec.unresolvedAssumptions.length > 0,
    "Should preserve active inferred/assumed items in unresolvedAssumptions",
  );
  assert.ok(
    spec.unresolvedContradictions.length > 0,
    "Should preserve unresolved contradictions in canonical spec",
  );
  assert.equal(
    spec.softwareParams,
    undefined,
    "Non-software writing task must not invent softwareParams (stack/hosting/DB)",
  );
});

test("2. Task Classification & Structure: supports all 8 task categories without cross-domain pollution", () => {
  const cases: Array<{
    expectedCategory: TaskCategory;
    goal: string;
    facts: string[];
    domain?: string;
    mustIncludeRegex: RegExp;
    mustNotIncludeRegex: RegExp;
  }> = [
    {
      expectedCategory: "software_development",
      goal: "Build a TypeScript Express API and React dashboard for tracking server uptime with SQLite",
      facts: ["Budget: $0 free tier", "Exclude GraphQL and paid APM agents"],
      domain: "website",
      mustIncludeRegex: /preserve existing|honest|\.env\.example|zod/i,
      // Coding prompt in ChatGPT/Claude/Cursor must not mandate academic peer-reviewed literature citations
      mustNotIncludeRegex: /peer-reviewed literature|systematic review/i,
    },
    {
      expectedCategory: "research_fact_checking",
      goal: "Fact-check claims about solid-state battery degradation rates using peer-reviewed literature and primary sources",
      facts: [
        "Target Audience: Battery materials engineers",
        "Exclude unverified blog posts and marketing press releases",
      ],
      domain: "study",
      mustIncludeRegex:
        /credible|primary sources|inline citations|Verified Evidence[\s\S]*Analytical Inference/i,
      mustNotIncludeRegex:
        /tsc --noEmit|TanStack Query|React Error Boundaries|\.env\.example/i,
    },
    {
      expectedCategory: "study_tutoring",
      goal: "Create a 4-week study plan and tutoring guide to master linear algebra eigenvalues for my university exam",
      facts: [
        "Target Audience: Sophomore engineering student",
        "Timeline: 4 weeks, 5 hours per week",
      ],
      domain: "study",
      mustIncludeRegex:
        /worked examples|active recall|spaced repetition|checkpoint/i,
      mustNotIncludeRegex:
        /tsc --noEmit|TanStack Query|\.env\.example|peer-reviewed literature/i,
    },
    {
      expectedCategory: "business_planning",
      goal: "Develop a 90-day B2B go-to-market strategy and unit economics plan for a boutique cybersecurity consultancy",
      facts: [
        "Target Audience: Regional healthcare CTOs",
        "Budget: $1,500 bootstrapped marketing budget",
        "Exclude cold robocalls",
      ],
      domain: "business",
      mustIncludeRegex: /unit economics|CAC|Go-To-Market|milestone/i,
      mustNotIncludeRegex:
        /tsc --noEmit|TanStack Query|IndexedDB|\.env\.example/i,
    },
    {
      expectedCategory: "creative_work",
      goal: "Write a dark fantasy short story set in a sunken clockwork city with a deaf horologist protagonist",
      facts: [
        "Tone: Atmospheric, melancholic, tactile sensory detail",
        "Exclude chosen-one prophecies and modern slang",
      ],
      domain: "creator",
      mustIncludeRegex: /Creative Brief|Structural Arc|Stylistic Discipline/i,
      mustNotIncludeRegex:
        /tsc --noEmit|Zod|TanStack Query|\.env\.example|peer-reviewed/i,
    },
    {
      expectedCategory: "writing_editing",
      goal: "Write a persuasive 900-word executive memo proposing a 4-day workweek pilot for an accounting firm",
      facts: [
        "Target Audience: Managing partners and HR directors",
        "Exclude casual idioms and unverified productivity statistics",
      ],
      domain: "creator",
      mustIncludeRegex:
        /Editorial Brief|Narrative Flow|Factual & Editorial Integrity/i,
      mustNotIncludeRegex: /tsc --noEmit|Zod|TanStack Query|\.env\.example/i,
    },
    {
      expectedCategory: "data_analysis",
      goal: "Analyze our SaaS Q3 customer churn CSV dataset to identify cohort retention drop-offs and statistical significance",
      facts: [
        "Target Audience: Product analytics team",
        "Dataset columns: user_id, signup_date, plan_tier, churned_at, monthly_active_days",
      ],
      domain: "business",
      mustIncludeRegex:
        /missing values|outliers|statistical|descriptive findings[\s\S]*causal/i,
      mustNotIncludeRegex:
        /TanStack Query|Lucide React|WCAG AA|\.env\.example/i,
    },
    {
      expectedCategory: "general_purpose",
      goal: "Organize a neighborhood tool-lending library governance checklist and volunteer rotation schedule",
      facts: [
        "Target Audience: 40 local household members",
        "Exclude paid membership fees",
      ],
      mustIncludeRegex:
        /Scope & Deliverable|Step-by-Step Execution|Quality Verification/i,
      mustNotIncludeRegex: /tsc --noEmit|TanStack Query|Zod|\.env\.example/i,
    },
  ];

  for (const tc of cases) {
    const detected = classifyTaskCategory(tc.goal, tc.facts, tc.domain);
    assert.equal(
      detected,
      tc.expectedCategory,
      `Goal "${tc.goal}" should classify as "${tc.expectedCategory}", got "${detected}"`,
    );

    const prompts = generateOptimizedPrompts(tc.goal, tc.facts, tc.domain);
    assert.match(
      prompts.chatgpt,
      tc.mustIncludeRegex,
      `ChatGPT prompt for ${tc.expectedCategory} must include task-appropriate structure`,
    );
    assert.doesNotMatch(
      prompts.chatgpt,
      tc.mustNotIncludeRegex,
      `ChatGPT prompt for ${tc.expectedCategory} must NOT contain irrelevant domain boilerplate`,
    );
    assert.doesNotMatch(
      prompts.claude,
      tc.mustNotIncludeRegex,
      `Claude prompt for ${tc.expectedCategory} must NOT contain irrelevant domain boilerplate`,
    );
  }
});

test("3. Genuine Platform Strategies: identical ProjectProfile produces 7 distinct, honest platform strategies", () => {
  const profile = buildPopulatedProfile({
    expertId: "website",
    turns: [
      {
        userText:
          "Build a keyboard-centric markdown release-notes generator web app for open-source maintainers.",
      },
      {
        userText:
          "Budget is $0 free tier. Stack: React, TypeScript, Tailwind. Exclude paid analytics and do not require user accounts.",
        slotId: "tech_stack",
        slotLabel: "Tech Stack & Constraints",
      },
    ],
  });

  const prompts = generateOptimizedPrompts(
    profile.primaryGoal?.value || "",
    [],
    "website",
    { projectProfile: profile, budget: "$0" },
  );

  // 1. All 7 platforms exist and are pairwise distinct
  const keys = Object.keys(prompts) as ModelKey[];
  assert.equal(keys.length, 7);
  const uniqueOutputs = new Set(Object.values(prompts));
  assert.equal(
    uniqueOutputs.size,
    7,
    "All 7 platform prompts must be distinct",
  );

  // 2. ChatGPT strategy: structured markdown sections + iteration protocol
  assert.match(prompts.chatgpt, /# ROLE & IDENTITY/);
  assert.match(prompts.chatgpt, /# CONTEXT & CONFIRMED REQUIREMENTS/);
  assert.match(prompts.chatgpt, /# ITERATION & REFINEMENT PROTOCOL/);

  // 3. Claude strategy: semantic XML organization + explicit <priorities> + no fake hidden-reasoning claims
  assert.match(
    prompts.claude,
    /<role>[\s\S]*<goal>[\s\S]*<context>[\s\S]*<priorities>[\s\S]*<technical_feasibility>[\s\S]*<verification_and_acceptance_criteria>/,
  );
  assert.doesNotMatch(
    MODEL_OPTIMIZATION_PROFILES.claude.whyItDiffers,
    /activates its deepest reasoning chains/i,
    "Claude profile must not claim wording tricks activate hidden reasoning",
  );

  // 4. Gemini strategy: includes multimodal section ONLY when task involves multimodal inputs
  assert.doesNotMatch(
    prompts.gemini,
    /Multimodal Input & Artifact Handling/,
    "Text/code-only project must NOT inject multimodal instructions into Gemini prompt",
  );

  const multimodalPrompts = generateOptimizedPrompts(
    "Analyze uploaded architectural floorplan PDFs and site photos to flag accessibility bottlenecks",
    ["Inputs: PDF floorplans and smartphone site photos"],
    "website",
  );
  assert.match(
    multimodalPrompts.gemini,
    /Multimodal Input & Artifact Handling/,
    "Multimodal project MUST include multimodal instructions in Gemini prompt",
  );

  // 5. Perplexity strategy: research questions, source standards, citations, and evidence vs inference separation
  assert.match(
    prompts.perplexity,
    /Core Research & Verification Questions[\s\S]*Source Credibility & Citation Standards[\s\S]*Evidence vs\. Inference Separation Protocol/,
  );

  // 6. Grok strategy: clear objective, first-principles audit, and explicit live-information boundary
  assert.match(
    prompts.grok,
    /Do NOT assume access to live web or social data unless live search is actively enabled/i,
  );

  // 7. Cursor strategy: repository-aware minimal changes, preserve existing behavior, honest test reporting
  assert.match(
    prompts.cursor,
    /Minimal Scoped Changes[\s\S]*Preserve existing behavior[\s\S]*Honest Test Reporting[\s\S]*Never claim that tests or builds passed unless you actually executed them/i,
  );

  // 8. Windsurf strategy: Cascade phased reconnaissance, scoped execution, validation & honest completion reporting
  assert.match(
    prompts.windsurf,
    /PHASE 1: RECONNAISSANCE & SCOPED IMPACT AUDIT[\s\S]*PHASE 2: SCOPED STEP-BY-STEP EXECUTION[\s\S]*PHASE 3: VALIDATION & HONEST COMPLETION REPORTING/,
  );
});

test("4. Regression Test: no requirement, exclusion, assumption, or contradiction is lost across any of the 7 platforms", () => {
  const profile = buildPopulatedProfile({
    expertId: "business",
    turns: [
      {
        userText:
          "Create a research-backed B2B SaaS pricing and onboarding playbook for independent freight brokers.",
      },
      {
        userText:
          "Budget is strictly $0. Deliverable must be a 5-section Markdown playbook. Exclude enterprise multi-year contracts and do not use cold SMS outreach.",
        slotId: "model",
        slotLabel: "Business Model & Deliverable",
      },
      {
        userText: "You decide the exact onboarding email cadence.",
        slotId: "cadence",
        slotLabel: "Cadence",
      },
      {
        userText:
          "Keep the $0 budget, and also run paid LinkedIn ad campaigns and paid Google Search ads.",
        slotId: "budget",
        slotLabel: "Budget",
      },
    ],
  });

  const prompts = ensureAllSevenModels(
    {},
    {
      goal: profile.primaryGoal?.value,
      expertDomain: "business",
      budget: "$0",
      projectProfile: profile,
    },
  );

  for (const model of ALL_MODELS) {
    const p = prompts[model.key];

    // 1. Primary objective preserved
    assert.match(
      p,
      /freight brokers/i,
      `${model.key} must preserve the primary objective and audience ("freight brokers")`,
    );

    // 2. Budget constraint preserved
    assert.match(
      p,
      /\$0/,
      `${model.key} must preserve the $0 budget constraint`,
    );

    // 3. Explicit exclusions preserved
    assert.match(
      p,
      /enterprise multi-year contracts|cold SMS/i,
      `${model.key} must preserve explicit exclusions`,
    );

    // 4. Labeled assumption preserved (not silently dropped or turned into unlabelled fact)
    assert.match(
      p,
      /Assumed|Inferred/i,
      `${model.key} must preserve explicit labeling on assumed/inferred parameters`,
    );

    // 5. Unresolved contradiction disclosed
    assert.match(
      p,
      /CONFLICT|Contradiction|paid/i,
      `${model.key} must surface the unresolved contradiction between $0 budget and paid ads`,
    );

    // 6. Rubric evaluation passes cleanly on every generated platform prompt
    const evaluation = evaluatePromptQuality(p, {
      budget: "$0",
      goal: profile.primaryGoal?.value,
      domain: "business",
      projectProfile: profile,
    });
    assert.ok(
      evaluation.overallScore >= 8.0,
      `${model.key} should score >= 8.0 on deterministic quality rubric, got ${evaluation.overallScore}`,
    );
  }
});

test("5. Regression Test: ensureAllSevenModels repairs partial LLM outputs that dropped exclusions or conflicts", () => {
  const profile = buildPopulatedProfile({
    expertId: "website",
    turns: [
      {
        userText:
          "Build a local-first markdown journal app. Exclude cloud sync and do not include third-party telemetry.",
      },
      {
        userText:
          "My budget is $0 and I also require dedicated GPU cluster hosting and paid Twilio SMS.",
        slotId: "budget",
        slotLabel: "Budget",
      },
    ],
  });

  // Simulate a partial LLM output for chatgpt that forgot the exclusion and conflict
  const partialPrompts: Partial<Record<ModelKey, string>> = {
    chatgpt:
      "# ROLE & IDENTITY\nAct as a Lead Engineer.\n# PRIMARY OBJECTIVE\nBuild a local-first markdown journal app with React and IndexedDB.",
  };

  const repaired = ensureAllSevenModels(partialPrompts, {
    goal: profile.primaryGoal?.value,
    expertDomain: "website",
    budget: "$0",
    projectProfile: profile,
  });

  assert.match(
    repaired.chatgpt,
    /cloud sync|third-party telemetry/i,
    "Repaired ChatGPT prompt must restore missing explicit exclusions from CanonicalProjectSpec",
  );
  assert.match(
    repaired.chatgpt,
    /Free-Tier Limit|Twilio|GPU/i,
    "Repaired ChatGPT prompt must restore missing unresolved contradictions from CanonicalProjectSpec",
  );
});
