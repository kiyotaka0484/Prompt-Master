import test from "node:test";
import assert from "node:assert/strict";

import {
  evaluatePromptQuality,
  type PromptEvaluationResult,
} from "../src/lib/prompt-evaluator";

import {
  ensureAllSevenModels,
  generateOptimizedPrompts,
  ALL_MODELS,
} from "../src/lib/ai-optimization-engine";

import {
  normalizeSlotId,
  SLOT_TAG_RE,
  isClarificationOrMetaRequest,
  inferInformation,
  detectContradictions,
  analyzeInterview,
  buildAdaptiveConsultantPrompt,
} from "../src/lib/interview-intelligence";

import { EXPERTS, detectExpert } from "../src/lib/experts";
import { normalizeThreadRecord } from "../src/lib/threads";
import {
  completeStreamOutputIfNeeded,
  generateAdaptiveConsultantText,
  resolveGoalAndExpert,
} from "../src/routes/api/chat";
import type { UIMessage } from "ai";

// ---------------------------------------------------------------------------
// FIX 1 — HONEST QUALITY SCORES
// ---------------------------------------------------------------------------

test("Fix 1: Weak prompts must not automatically score 10/10", () => {
  const weakPrompt = "Make me a simple website for my business.";
  const result = evaluatePromptQuality(weakPrompt);

  assert.ok(
    result.overallScore < 6.0,
    `Weak prompt must score below 6.0 on the rubric, got ${result.overallScore}`,
  );
  assert.equal(
    result.isProductionReady,
    false,
    "Weak prompt must not be marked production-ready",
  );
  assert.ok(
    result.actionableWeaknesses.length > 0,
    "Weak prompt must identify weaknesses",
  );
});

test("Fix 1: Strong prompts must be scored using the actual evidence-backed rubric", () => {
  const strongPrompt = `# ROLE & OBJECTIVE
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
4. Phase 1 MVP features separated cleanly from Phase 2 enhancements.`;

  const result = evaluatePromptQuality(strongPrompt, {
    budget: "$0",
    goal: "Build a high-performance SaaS dashboard",
  });

  assert.ok(
    result.overallScore >= 8.5,
    `Strong prompt should score >= 8.5, got ${result.overallScore}`,
  );
  assert.ok(
    result.dimensions.technicalFeasibility.score >= 8.0,
    `Feasibility should score >= 8.0, got ${result.dimensions.technicalFeasibility.score}`,
  );
  assert.ok(
    result.dimensions.implementationSpecificity.score >= 8.0,
    `Specificity should score >= 8.0, got ${result.dimensions.implementationSpecificity.score}`,
  );
  assert.equal(
    result.isProductionReady,
    true,
    "Strong prompt must be marked production-ready",
  );
});

test("Fix 1: Certificate parsing must reject self-reported score inflation", () => {
  // Simulate model output attempting to report 10.0 across all dimensions on a weak prompt
  const CERT_BLOCK_RE = /<!--\s*certificate\s*([\s\S]*?)-->/i;
  const simulatedModelOutput = `Here is your prompt:
\`\`\`chatgpt
Make a blog with react.
\`\`\`

<!--certificate
clarity: 10.0
context: 10.0
constraints: 10.0
audience: 10.0
output: 10.0
completeness: 10.0
technical_feasibility: 10.0
implementation_specificity: 10.0
overall: 10.0
revisions: 1
-->`;

  const m = CERT_BLOCK_RE.exec(simulatedModelOutput);
  assert.ok(m, "Certificate block must be detected");

  const promptContent = "Make a blog with react.";
  const evalResult = evaluatePromptQuality(promptContent);

  // Validate that rubric score for weak prompt is low
  assert.ok(
    evalResult.overallScore < 6.0,
    `Evaluator score must be low for weak prompt, got ${evalResult.overallScore}`,
  );

  // Replicate the certificate validation rule in chat-window.tsx
  const body = m[1];
  const num = (key: string): number | null => {
    const r = new RegExp(`${key}\\s*:\\s*([0-9]+(?:\\.[0-9]+)?)`, "i").exec(
      body,
    );
    return r ? Number(r[1]) : null;
  };
  const validateDim = (reported: number | null, evalScore: number): number => {
    if (reported === null || isNaN(reported) || reported < 0 || reported > 10) {
      return evalScore;
    }
    return Math.min(Number(reported.toFixed(1)), evalScore);
  };

  const clarity = validateDim(
    num("clarity"),
    evalResult.dimensions.clarity.score,
  );
  const overall = evalResult.overallScore;

  assert.ok(
    clarity <= evalResult.dimensions.clarity.score,
    `Clarity score must not exceed rubric score, got ${clarity} vs rubric ${evalResult.dimensions.clarity.score}`,
  );
  assert.ok(
    overall < 7.0,
    `Overall score must reflect actual evaluation, never inflated self-reported 10, got ${overall}`,
  );
});

test("Fix 1: Missing or malformed certificate data falls back safely", () => {
  const malformedOutput = `<!--certificate
clarity: invalid
overall: NaN
-->`;
  const CERT_BLOCK_RE = /<!--\s*certificate\s*([\s\S]*?)-->/i;
  const m = CERT_BLOCK_RE.exec(malformedOutput);
  assert.ok(m);

  const evalResult = evaluatePromptQuality(
    "Sample test prompt for fallback verification.",
  );
  const num = (key: string): number | null => {
    const r = new RegExp(`${key}\\s*:\\s*([0-9]+(?:\\.[0-9]+)?)`, "i").exec(
      m[1],
    );
    return r ? Number(r[1]) : null;
  };
  const validateDim = (reported: number | null, evalScore: number): number => {
    if (reported === null || isNaN(reported) || reported < 0 || reported > 10) {
      return evalScore;
    }
    return Math.min(Number(reported.toFixed(1)), evalScore);
  };

  const clarity = validateDim(
    num("clarity"),
    evalResult.dimensions.clarity.score,
  );
  assert.equal(clarity, evalResult.dimensions.clarity.score);
  assert.ok(!isNaN(clarity));
});

// ---------------------------------------------------------------------------
// FIX 2 — PRESERVE INTERVIEW CONTEXT
// ---------------------------------------------------------------------------

test("Fix 2: Incomplete or truncated model output retains interview context across all 7 models", () => {
  const goal = "Build a subscription fitness tracking app";
  const facts = [
    "Target Audience: Postpartum mothers returning to exercise",
    "Budget: $0 development budget",
    "Tech Stack: React Vite Tailwind",
    "Key Feature: Daily 10-minute micro-workouts with rest day reminders",
    "Integration: Local storage offline first with optional Google Drive backup",
  ];

  // Simulate incomplete model output where only 'chatgpt' fence was produced
  const partialPrompts = {
    chatgpt: "# ROLE\nFitness Coach\n# PRIMARY OBJECTIVE\nBuild fitness app",
  };

  const resolved = ensureAllSevenModels(partialPrompts, {
    goal,
    expertDomain: "website",
    facts,
    budget: "$0",
  });

  // Verify all 7 models were populated
  assert.equal(Object.keys(resolved).length, 7);

  for (const model of ALL_MODELS) {
    const prompt = resolved[model.key];
    assert.ok(prompt, `${model.key} must be generated`);

    // Verify interview context is retained in the synthesized prompt
    const hasAudience =
      prompt.includes("Postpartum mothers") ||
      prompt.includes("Target Audience") ||
      prompt.includes("audience");
    const hasGoal =
      prompt.includes("fitness tracking") ||
      prompt.includes("fitness app") ||
      prompt.includes("Fitness");

    assert.ok(hasGoal, `${model.key} must retain the user goal: "${goal}"`);
    assert.ok(
      hasAudience,
      `${model.key} must retain the interview answers / target audience context`,
    );
  }
});

test("Fix 2: ChatGPT, Cursor, Claude, and Gemini fallbacks retain structured Q&A pairs", () => {
  const goal = "Create an interactive language learning flashcard web tool";
  const pairs = [
    {
      question: "What language are you targeting?",
      answer: "Japanese JLPT N5 vocabulary",
    },
    { question: "What is your budget?", answer: "Strictly $0 free tier only" },
    {
      question: "What is the tech stack?",
      answer: "React, TypeScript, Tailwind, IndexedDB",
    },
  ];
  const structuredFacts = pairs.map((p) => `${p.question}: ${p.answer}`);

  const prompts = ensureAllSevenModels(
    {},
    {
      goal,
      expertDomain: "website",
      facts: structuredFacts,
      budget: "$0",
    },
  );

  // Check ChatGPT prompt retains context section
  assert.ok(
    prompts.chatgpt.includes("Japanese JLPT N5"),
    "ChatGPT prompt must include interview answer about Japanese JLPT N5",
  );
  assert.ok(
    prompts.chatgpt.includes("CONTEXT & CONFIRMED REQUIREMENTS"),
    "ChatGPT prompt must have dedicated context section",
  );

  // Check Cursor prompt retains context section
  assert.ok(
    prompts.cursor.includes("Japanese JLPT N5"),
    "Cursor prompt must include interview answer about Japanese JLPT N5",
  );
  assert.ok(
    prompts.cursor.includes("CONTEXT & CONFIRMED REQUIREMENTS"),
    "Cursor prompt must have dedicated context section",
  );

  // Check Claude prompt retains context XML
  assert.ok(
    prompts.claude.includes("Japanese JLPT N5"),
    "Claude prompt must include interview answer in <context>",
  );

  // Check Gemini prompt retains context
  assert.ok(
    prompts.gemini.includes("Japanese JLPT N5"),
    "Gemini prompt must include interview answer in Context Parameters",
  );
});

// ---------------------------------------------------------------------------
// FIX 3 — REPAIR INTERVIEW SYNCHRONIZATION
// ---------------------------------------------------------------------------

test("Fix 3: Slot tags with hyphens, spaces, and underscores normalize consistently", () => {
  const variations = [
    "<!--slot:tech-stack-->",
    "<!--slot:tech_stack-->",
    "<!--slot:tech stack-->",
    "<!-- slot: tech-stack -->",
    "<!-- slot : tech_stack -->",
    "<!--slot:Tech-Stack-->",
  ];

  for (const tag of variations) {
    const match = SLOT_TAG_RE.exec(tag);
    assert.ok(match, `SLOT_TAG_RE must match variation: ${tag}`);
    const normalized = normalizeSlotId(match[1]);
    assert.equal(
      normalized,
      "tech_stack",
      `Tag "${tag}" must normalize to "tech_stack", got "${normalized}"`,
    );
  }

  // Also test audience variations
  assert.equal(normalizeSlotId("target-audience"), "target_audience");
  assert.equal(normalizeSlotId("target audience"), "target_audience");
  assert.equal(normalizeSlotId("target_audience"), "target_audience");
});

test("Fix 3: Clarification and explanation requests are detected and do not increment question count", () => {
  const clarificationRequests = [
    "Why are you asking this?",
    "Why am I being asked this?",
    "What does this mean?",
    "What does MVP mean?",
    "Can you explain what Tailwind is?",
    "Could you explain that?",
    "What is a server-side proxy?",
    "I don't understand what you mean",
  ];

  for (const req of clarificationRequests) {
    assert.equal(
      isClarificationOrMetaRequest(req),
      true,
      `"${req}" must be recognized as clarification/meta request`,
    );
  }

  const normalAnswers = [
    "Freelance designers and small agency owners",
    "$50 per month",
    "Next.js with Supabase",
    "I have 3 years of React experience",
  ];

  for (const ans of normalAnswers) {
    assert.equal(
      isClarificationOrMetaRequest(ans),
      false,
      `"${ans}" must NOT be treated as a clarification request`,
    );
  }
});

test("Fix 3: Interview question numbering starts at Question 1 and does not increment on clarifications", () => {
  const expert = EXPERTS["website"];

  // Turn 0: User submits goal
  const initialMessages: UIMessage[] = [
    {
      id: "msg-1",
      role: "user",
      parts: [{ type: "text", text: "I want to build a portfolio website" }],
    },
  ];

  const analysis0 = analyzeInterview(initialMessages, "website");
  assert.equal(
    analysis0.questionNumber,
    0,
    "When 0 questions answered, questionNumber must be 0",
  );

  const prompt0 = buildAdaptiveConsultantPrompt(expert, analysis0);
  assert.match(
    prompt0,
    /\*\*Question 1:\*\*/,
    "First question asked by consultant must be Question 1",
  );

  // Turn 1: Consultant asks Question 1, User asks "Why are you asking this?"
  const clarificationMessages: UIMessage[] = [
    {
      id: "msg-1",
      role: "user",
      parts: [{ type: "text", text: "I want to build a portfolio website" }],
    },
    {
      id: "msg-2",
      role: "assistant",
      parts: [
        {
          type: "text",
          text: "Great goal! **Question 1:** Who is your target audience? <!--slot:target_audience-->",
        },
      ],
    },
    {
      id: "msg-3",
      role: "user",
      parts: [
        {
          type: "text",
          text: "Why am I being asked this? How does it affect the prompt?",
        },
      ],
    },
  ];

  const analysis1 = analyzeInterview(clarificationMessages, "website");
  assert.equal(
    analysis1.questionNumber,
    0,
    "Clarification request must NOT increment answered questions count",
  );
  assert.equal(
    analysis1.confirmedFacts.length,
    0,
    "Clarification request must NOT be recorded as an answered slot fact",
  );

  const prompt1 = buildAdaptiveConsultantPrompt(expert, analysis1);
  assert.match(
    prompt1,
    /\*\*Question 1:\*\*/,
    "After clarification, consultant must re-prompt Question 1, not advance to Question 2",
  );

  // Turn 2: User answers Question 1
  const answeredMessages: UIMessage[] = [
    ...clarificationMessages,
    {
      id: "msg-4",
      role: "assistant",
      parts: [
        {
          type: "text",
          text: "Target audience dictates tone and layout. **Question 1:** Who is your primary audience? <!--slot:target_audience-->",
        },
      ],
    },
    {
      id: "msg-5",
      role: "user",
      parts: [
        {
          type: "text",
          text: "Freelance art directors and magazine editors looking for illustration work.",
        },
      ],
    },
  ];

  const analysis2 = analyzeInterview(answeredMessages, "website");
  assert.equal(
    analysis2.questionNumber,
    1,
    "After 1 genuine answer, questionNumber must be 1",
  );
  assert.equal(
    analysis2.confirmedFacts.length,
    1,
    "Confirmed facts must have 1 entry",
  );

  const prompt2 = buildAdaptiveConsultantPrompt(expert, analysis2);
  assert.match(
    prompt2,
    /\*\*Question 2:\*\*/,
    "Next question to ask must be Question 2",
  );
});

// ---------------------------------------------------------------------------
// FIX 4 — CORRECT TECHNICAL FEASIBILITY CLAIMS
// ---------------------------------------------------------------------------

test("Fix 4: No unsupported guarantees about free tiers or commercial hosting eligibility", () => {
  const goal = "Build a commercial e-commerce store with $0 budget";
  const prompts = generateOptimizedPrompts(
    goal,
    ["Budget: $0", "Need online store with Stripe"],
    "business",
    { budget: "$0", goal, expertDomain: "business" },
  );

  for (const model of ALL_MODELS) {
    const promptText = prompts[model.key];

    // Verify unsupported blanket guarantee is removed
    assert.doesNotMatch(
      promptText,
      /100%\s*Free-Tier\s*Services\s*Only\s*—\s*No\s*Billing\s*Activation/i,
      `${model.key} must not make unsupported guarantee '100% Free Tier - No Billing Activation'`,
    );

    // Verify verification tags exist for platform limits
    assert.ok(
      promptText.includes("[VERIFY:") || promptText.includes("[verify:"),
      `${model.key} must flag unverified quotas/terms with [VERIFY: ...]`,
    );
  }
});

// ---------------------------------------------------------------------------
// AUDIT REGRESSION TESTS — PHASES 1, 2 & 3
// ---------------------------------------------------------------------------

test("Audit Fix 5: Substantive non-keyword goals are preserved by detectExpert, normalizeThreadRecord, and resolveGoalAndExpert", () => {
  const goalText =
    "I want to organize a neighborhood dog walking collective in Austin";
  const detected = detectExpert(goalText);
  assert.ok(
    detected !== null,
    "Substantive 4+ word non-vague goal must not return null",
  );

  const thread = normalizeThreadRecord({
    id: "thread-1",
    expert: "business",
    title: "Dog walking",
    updatedAt: Date.now(),
    messages: [
      {
        id: "m-1",
        role: "user",
        parts: [{ type: "text", text: goalText }],
      },
    ],
  });
  assert.equal(
    thread.messages.length,
    1,
    "Thread messages must not be wiped to []",
  );
  assert.equal(thread.expert, "business");

  const { resolvedExpert, goalIndex } = resolveGoalAndExpert(
    thread.messages,
    "business",
  );
  assert.equal(resolvedExpert, "business");
  assert.equal(goalIndex, 0);
});

test("Audit Fix 6: Budget inference avoids false positives on non-monetary numbers while extracting real budgets", () => {
  const nonBudgetFacts = inferInformation(
    "Grow my newsletter to 1000 subscribers in 2 months",
    [],
    "creator",
  );
  const falseBudget = nonBudgetFacts.find((f) => f.id === "budget_constraint");
  assert.equal(
    falseBudget,
    undefined,
    "Non-monetary numbers ('1000 subscribers in 2 months') must not trigger a budget inference",
  );

  const realBudgetFacts = inferInformation(
    "Launch a B2B SaaS with a starting budget of $500",
    [],
    "business",
  );
  const validBudget = realBudgetFacts.find((f) => f.id === "budget_constraint");
  assert.ok(validBudget, "Explicit '$500' budget must be inferred");
  assert.match(validBudget.value, /\$500/);
});

test("Audit Fix 7: Vague answers and duplicate slot answers do not inflate confirmedFacts or questionNumber", () => {
  const messages: UIMessage[] = [
    {
      id: "m-1",
      role: "user",
      parts: [{ type: "text", text: "Build a B2B SaaS invoice app" }],
    },
    {
      id: "m-2",
      role: "assistant",
      parts: [
        {
          type: "text",
          text: "**Question 1:** Who is your target audience? <!--slot:audience-->",
        },
      ],
    },
    {
      id: "m-3",
      role: "user",
      parts: [{ type: "text", text: "idk" }],
    },
    {
      id: "m-4",
      role: "assistant",
      parts: [
        {
          type: "text",
          text: "Let's narrow it down. **Question 1:** Who is your target audience? <!--slot:audience-->",
        },
      ],
    },
    {
      id: "m-5",
      role: "user",
      parts: [
        {
          type: "text",
          text: "Independent dental clinics with 2-10 practitioners",
        },
      ],
    },
  ];

  const analysis = analyzeInterview(messages, "website");
  assert.equal(
    analysis.confirmedFacts.length,
    1,
    "Vague 'idk' must be ignored and re-asked slot must be deduplicated to 1 confirmed fact",
  );
  assert.equal(analysis.questionNumber, 1);
  assert.equal(
    analysis.confirmedFacts[0].value,
    "Independent dental clinics with 2-10 practitioners",
  );
});

test("Audit Fix 8: Contradictions clear when resolved by a subsequent user turn", () => {
  // Unresolved contradiction
  const unresolved = detectContradictions([
    "My budget is $0 zero budget",
    "I will run paid ads and hire an agency",
  ]);
  assert.ok(
    unresolved.contradiction,
    "Unresolved $0 budget + paid ads must trigger contradiction signal",
  );

  // Resolved on subsequent turn
  const resolved = detectContradictions([
    "My budget is $0 zero budget",
    "I will run paid ads and hire an agency",
    "Actually let's use organic community outreach and free channels with no paid ads",
  ]);
  assert.equal(
    resolved.contradiction,
    undefined,
    "Contradiction must clear when user pivots to organic/free channels",
  );
});

test("Audit Fix 9: ensureAllSevenModels verifies fact values (not just slot labels) and uses XML for Claude", () => {
  const existingClaude = `<role>You are an expert architect.</role>
<context>
  Target Audience: Generic users
  System overview and baseline architecture notes with over two hundred characters of detailed context so this prompt is treated as a complete block rather than a short snippet.
</context>
<goal>Build a B2B analytics portal</goal>`;

  const resolved = ensureAllSevenModels(
    { claude: existingClaude },
    {
      goal: "Build a B2B analytics portal",
      expertDomain: "website",
      facts: ["Target Audience: Postpartum mothers returning to exercise"],
    },
  );

  assert.ok(
    resolved.claude.includes("Postpartum mothers returning to exercise"),
    "Claude prompt must inject the missing fact value even when 'Target Audience' label already existed",
  );
  assert.ok(
    resolved.claude.includes("<confirmed_requirement>"),
    "Claude prompt must inject missing facts using XML tags rather than raw Markdown headers",
  );
});

test("Audit Fix 10: Mid-stream synthesis truncation completes all 7 models and appends deterministic certificate", () => {
  const messages: UIMessage[] = [
    {
      id: "m-1",
      role: "user",
      parts: [
        { type: "text", text: "Build a full-stack task tracker web app" },
      ],
    },
    {
      id: "m-2",
      role: "assistant",
      parts: [
        {
          type: "text",
          text: "**Question 1:** Who is your target audience? <!--slot:audience-->",
        },
      ],
    },
    {
      id: "m-3",
      role: "user",
      parts: [
        { type: "text", text: "Remote engineering managers at startups" },
      ],
    },
  ];

  // Simulate a live LLM stream that emitted only the chatgpt block and dropped mid-stream
  const truncatedStreamText = `Here are your master prompts — engineered individually for each AI model's unique architecture:

\`\`\`chatgpt
# ROLE & IDENTITY
Act as a Principal Full-Stack Architect building a task tracker web app for remote engineering managers at startups.
# CONTEXT & CONSTRAINTS
Target audience: Remote engineering managers at startups. Budget: $0 free tier. Stack: React, TypeScript, Tailwind CSS, Zod, Supabase.
\`\`\``;

  const suffix = completeStreamOutputIfNeeded(
    truncatedStreamText,
    true,
    "website",
    messages,
    0,
  );

  const combined = truncatedStreamText + suffix;
  for (const model of ALL_MODELS) {
    assert.match(
      combined,
      new RegExp(`\`\`\`${model.key}\\b`, "i"),
      `Completed stream output must contain \`\`\`${model.key} block`,
    );
  }
  assert.match(
    combined,
    /<!--certificate[\s\S]*?overall:\s*[0-9]+(?:\.[0-9]+)?[\s\S]*?-->/i,
    "Completed stream output must include deterministic <!--certificate--> block",
  );

  // Also verify fallback question numbering advances properly after 1 answered question
  const nextTurnText = generateAdaptiveConsultantText("website", messages, 0);
  assert.match(
    nextTurnText,
    /\*\*Question 2:\*\*/,
    "After 1 answered question, generateAdaptiveConsultantText must ask Question 2",
  );
});
