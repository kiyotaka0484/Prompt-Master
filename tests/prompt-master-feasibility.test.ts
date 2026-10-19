import test from "node:test";
import assert from "node:assert/strict";

import {
  evaluatePromptQuality,
  type PromptEvaluationResult,
} from "../src/lib/prompt-evaluator";

import {
  generateOptimizedPrompts,
  ensureAllSevenModels,
  ALL_MODELS,
  MODEL_OPTIMIZATION_PROFILES,
} from "../src/lib/ai-optimization-engine";

import {
  detectContradictions,
  detectVagueness,
  inferInformation,
  analyzeInterview,
} from "../src/lib/interview-intelligence";

test("Scenario 1: Beginner building a website with a $0 budget", () => {
  const goal =
    "I am a beginner and I want to build a free portfolio website with a $0 budget";
  const userAnswers = [
    "I have literally zero money ($0 budget)",
    "I want a clean portfolio to showcase my design work to freelance clients",
  ];

  // 1. Check inference
  const inferred = inferInformation(goal, userAnswers, "website");
  assert.ok(inferred.length > 0, "Should infer background facts");
  const budgetFact = inferred.find(
    (f) => f.id.includes("budget") || f.category === "business",
  );
  assert.ok(budgetFact, "Should infer budget constraint as $0 / Free Tier");
  assert.match(budgetFact.value.toLowerCase(), /free|0/);

  // 2. Generate multi-model prompts
  const multiPrompts = generateOptimizedPrompts(
    goal,
    [
      "Stated Budget: $0 (Free Tier only)",
      "Target Audience: Freelance design clients",
      "Tech Stack: React Vite Tailwind",
    ],
    "website",
    { budget: "$0", goal, domain: "website" },
  );

  // Verify all 7 models exist and are distinct
  assert.equal(Object.keys(multiPrompts).length, 7);
  for (const model of ALL_MODELS) {
    const prompt = multiPrompts[model.key];
    assert.ok(prompt, `Model ${model.key} prompt should not be empty`);
    assert.ok(
      prompt.length > 100,
      `Model ${model.key} prompt should have sufficient depth`,
    );
  }

  // Verify distinct prompts (Never generate identical prompts)
  const promptList = Object.values(multiPrompts);
  const uniquePrompts = new Set(promptList);
  assert.equal(
    uniquePrompts.size,
    7,
    "Every AI model must receive a unique prompt",
  );

  // 3. Evaluate prompt quality for ChatGPT
  const evalResult = evaluatePromptQuality(multiPrompts.chatgpt, {
    budget: "$0",
    goal,
  });
  assert.ok(
    evalResult.dimensions.technicalFeasibility.score >= 8.0,
    `Technical Feasibility score should be >= 8.0, got ${evalResult.dimensions.technicalFeasibility.score}`,
  );
  assert.ok(
    evalResult.dimensions.implementationSpecificity.score >= 8.0,
    `Implementation Specificity score should be >= 8.0, got ${evalResult.dimensions.implementationSpecificity.score}`,
  );
  assert.ok(
    evalResult.overallScore >= 8.0,
    `Overall score should be >= 8.0, got ${evalResult.overallScore}`,
  );

  // Free-tier audit checks
  assert.ok(
    multiPrompts.chatgpt.includes("Supabase") ||
      multiPrompts.chatgpt.includes("Vercel"),
    "Prompt should reference verified free-tier platforms",
  );
  assert.ok(
    multiPrompts.chatgpt.includes("500MB") ||
      multiPrompts.chatgpt.includes("Free Tier"),
    "Prompt should reference concrete free-tier quotas",
  );
});

test("Scenario 2: Project requiring third-party API integrations and secrets security", () => {
  const goal =
    "Build a subscription SaaS tool with Stripe billing and OpenAI/Gemini integration";
  const userAnswers = [
    "I need Stripe subscription checkout and OpenAI API key integration",
    "Target is B2B freelancers paying $19/mo",
  ];

  const multiPrompts = generateOptimizedPrompts(
    goal,
    [
      "Stated Budget: Low startup budget",
      "Integrations: Stripe Checkout, OpenAI / Gemini API, Supabase Database",
      "Hosting: Vercel / Cloudflare",
    ],
    "business",
    { budget: "$50", goal, domain: "business" },
  );

  const cursorPrompt = multiPrompts.cursor;
  assert.ok(
    cursorPrompt.includes(".env.example"),
    "Cursor prompt must include .env.example guidance",
  );
  assert.ok(
    cursorPrompt.includes("SECRET") ||
      cursorPrompt.includes("server-side proxy"),
    "Cursor prompt must mandate server-side secret protection",
  );
  assert.ok(
    cursorPrompt.includes("Zod"),
    "Cursor prompt must specify Zod input validation",
  );

  const evalResult = evaluatePromptQuality(cursorPrompt, {
    budget: "$50",
    goal,
  });
  assert.ok(evalResult.dimensions.technicalFeasibility.score >= 8.0);
  assert.ok(evalResult.dimensions.implementationSpecificity.score >= 8.0);
  assert.ok(evalResult.dimensions.technicalFeasibility.evidence.length > 0);
});

test("Scenario 3: Project with unclear or incompatible deployment requirements", () => {
  // Test contradiction detector catching static hosting trying to run dynamic server runtime
  const conflictAnswers = [
    "I want to host this on GitHub Pages static HTML only",
    "I need an Express server with SQLite database and Python backend",
  ];

  const contradiction = detectContradictions(conflictAnswers);
  assert.ok(
    contradiction.contradiction,
    "Should detect deployment runtime incompatibility",
  );
  assert.equal(contradiction.contradiction?.type, "contradiction_detected");
  assert.match(contradiction.contradiction?.title || "", /Deployment|Runtime/i);
  assert.match(
    contradiction.contradiction?.recommendation || "",
    /serverless|Vercel|Cloudflare/i,
  );
});

test("Scenario 4: Project with an unnecessarily complex technology stack (Overengineering)", () => {
  const answers = [
    "I am building a simple portfolio landing page MVP for my photography",
    "I want to use Kubernetes microservices architecture with Kafka distributed streaming and Cassandra",
  ];

  const contradiction = detectContradictions(answers);
  assert.ok(
    contradiction.contradiction,
    "Should detect overengineering mismatch",
  );
  assert.equal(contradiction.contradiction?.type, "contradiction_detected");
  assert.match(contradiction.contradiction?.title || "", /Overengineering/i);
  assert.match(
    contradiction.contradiction?.recommendation || "",
    /unified|lean|modern/i,
  );
});

test("Scenario 5: Project whose requested features exceed free-tier constraints", () => {
  const answers = [
    "My budget is literally $0 with zero money",
    "I need to send automated SMS notifications via Twilio and run heavy video transcoding with a dedicated GPU cluster",
  ];

  const contradiction = detectContradictions(answers);
  assert.ok(
    contradiction.contradiction,
    "Should detect free-tier limit violation",
  );
  assert.equal(contradiction.contradiction?.type, "contradiction_detected");
  assert.match(contradiction.contradiction?.title || "", /Free-Tier Limit/i);
  assert.match(
    contradiction.contradiction?.recommendation || "",
    /magic link|email|WebPush/i,
  );
});

test("Model-specific optimization differences and recommendations", () => {
  const goal = "Build a modern note-taking app";
  const facts = ["Stack: React Vite Tailwind", "Offline first IndexedDB"];
  const prompts = generateOptimizedPrompts(goal, facts, "website");

  // Verify model profiles contain whyItDiffers and recommendations
  for (const model of ALL_MODELS) {
    const profile = model;
    assert.ok(
      profile.whyItDiffers.length > 20,
      `${model.key} should have whyItDiffers explanation`,
    );
    assert.ok(
      profile.recommendations.bestEngine.length > 0,
      `${model.key} should have recommended engine`,
    );
    assert.ok(
      profile.strengths.length >= 2,
      `${model.key} should have key strengths`,
    );
  }

  // Model-specific structure verification
  assert.match(
    prompts.claude,
    /<role>[\s\S]*<goal>[\s\S]*<technical_feasibility>/,
    "Claude must use XML tags",
  );
  assert.match(
    prompts.chatgpt,
    /# ROLE & IDENTITY[\s\S]*# TECHNICAL FEASIBILITY/,
    "ChatGPT must use markdown headings",
  );
  assert.match(
    prompts.windsurf,
    /\[WINDSURF CASCADE AGENT EXECUTION PROTOCOL\][\s\S]*PHASE 1/,
    "Windsurf must use Cascade protocol",
  );
  assert.match(
    prompts.cursor,
    /\/\/ CURSOR AI SYSTEM DIRECTIVES[\s\S]*\.cursorrules/,
    "Cursor must use .cursorrules style",
  );
  assert.match(
    prompts.grok,
    /\[FIRST-PRINCIPLES STRATEGIC DIRECTIVE[\s\S]*Tactical Punch List/,
    "Grok must use first-principles punch list",
  );
  assert.match(
    prompts.perplexity,
    /\[SEARCH & VERIFICATION DIRECTIVES\][\s\S]*Tooling & Integration Trade-Offs Matrix/,
    "Perplexity must use search matrix",
  );
});

test("Interview Intelligence: Vague answer detection with concrete anchors", () => {
  const vagueResult = detectVagueness("I want to make money fast");
  assert.ok(vagueResult.isVague, "Should detect 'make money fast' as vague");
  assert.ok(
    vagueResult.concreteAnchors && vagueResult.concreteAnchors.length >= 3,
    "Should provide concrete anchors",
  );
});
