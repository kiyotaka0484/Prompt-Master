import test from "node:test";
import assert from "node:assert/strict";
import type { UIMessage } from "ai";

import { EXPERTS } from "../src/lib/experts";
import {
  analyzeInterview,
  buildAdaptiveConsultantPrompt,
  selectNextInterviewSlot,
} from "../src/lib/interview-intelligence";
import { generateAdaptiveConsultantText } from "../src/routes/api/chat";

interface SimpleTurn {
  role: "user" | "assistant";
  content: string;
}

function toUiMessages(messages: SimpleTurn[]): UIMessage[] {
  return messages.map((m, idx) => ({
    id: `msg-${idx + 1}`,
    role: m.role,
    parts: [{ type: "text" as const, text: m.content }],
  }));
}

// ---------------------------------------------------------------------------
// 1. Vague idea needing clarification
// ---------------------------------------------------------------------------
test("Adaptive Interview-Intelligence — 1. Vague idea needing clarification: selects highest information-value question and explains why it matters", () => {
  const uiMessages = toUiMessages([
    { role: "user", content: "I want to build an app" },
  ]);

  const analysis = analyzeInterview(uiMessages, "website");

  assert.ok(analysis.stoppingPolicy, "Stopping policy must be evaluated");
  assert.equal(analysis.stoppingPolicy.outcome, "ask_clarification");
  assert.equal(analysis.stoppingPolicy.shouldStop, false);
  assert.equal(analysis.isReadyForMasterPrompt, false);

  const selected = analysis.stoppingPolicy.selectedQuestion;
  assert.ok(selected, "A high-value clarification question must be selected");
  assert.equal(selected.alreadyPresent, false);
  assert.ok(
    selected.importance >= 8.5,
    `Selected question importance should be >= 8.5, got ${selected.importance}`,
  );
  assert.ok(
    selected.promptImpact >= 8.0,
    `Selected question promptImpact should be >= 8.0, got ${selected.promptImpact}`,
  );
  assert.ok(
    selected.expectedNetValue > 1.5,
    `Selected question expectedNetValue should exceed stopping threshold (1.5), got ${selected.expectedNetValue}`,
  );
  assert.ok(
    selected.whyItMatters.length > 15,
    "Selected question must include a plain-English explanation of why it matters",
  );

  const nextSlot = selectNextInterviewSlot(EXPERTS.website, analysis);
  assert.equal(nextSlot.id, selected.slotId);

  // Verify UX output explains why the question matters without exposing internal numeric scores
  const responseText = generateAdaptiveConsultantText("website", uiMessages, 0);
  assert.match(responseText, /\*\*Question 1:\*\*/);
  assert.ok(responseText.includes(`<!--slot:${nextSlot.id}-->`));
  assert.match(responseText, /matters because|helps because/i);
  assert.doesNotMatch(responseText, /expectedNetValue|overlapPenalty/i);
});

// ---------------------------------------------------------------------------
// 2. Comprehensive initial brief requiring almost no questions
// ---------------------------------------------------------------------------
test("Adaptive Interview-Intelligence — 2. Comprehensive initial brief requiring almost no questions: stops immediately without forcing unnecessary slots", () => {
  const uiMessages = toUiMessages([
    {
      role: "user",
      content:
        "Build a full-stack B2B SaaS invoicing tool for freelance designers with automated recurring invoices, Stripe checkout, and PDF export, built with React, TypeScript, Tailwind CSS, and Supabase deployed on Vercel on a $0 free-tier budget, launching in 3 weeks.",
    },
  ]);

  const analysis = analyzeInterview(uiMessages, "website");

  // Verify rich initial extraction populated the profile
  assert.ok(analysis.projectProfile.primaryGoal?.value);
  assert.ok(
    analysis.projectProfile.intendedAudience?.value,
    "Intended audience must be extracted from comprehensive brief",
  );
  assert.ok(
    analysis.projectProfile.budget?.value,
    "Budget must be extracted from comprehensive brief",
  );
  assert.ok(
    analysis.projectProfile.timeline?.value,
    "Timeline must be extracted from comprehensive brief",
  );
  assert.ok(
    analysis.projectProfile.functionalRequirements.length > 0,
    "Functional requirements must be extracted",
  );
  assert.ok(
    analysis.projectProfile.userPreferences.length > 0,
    "Tech stack / hosting preferences must be extracted",
  );

  // Candidate questions for already supplied slots must be marked alreadyPresent
  const audienceCandidate = analysis.candidateQuestions?.find(
    (q) => q.slotId === "audience",
  );
  const budgetCandidate = analysis.candidateQuestions?.find(
    (q) => q.slotId === "budget",
  );
  const stackCandidate = analysis.candidateQuestions?.find(
    (q) => q.slotId === "tech_stack",
  );
  assert.equal(audienceCandidate?.alreadyPresent, true);
  assert.equal(budgetCandidate?.alreadyPresent, true);
  assert.equal(stackCandidate?.alreadyPresent, true);

  // Stopping policy should immediately stop on Turn 0 without forcing optional questions
  assert.equal(
    analysis.stoppingPolicy?.shouldStop,
    true,
    `Comprehensive brief should stop immediately, but got outcome=${analysis.stoppingPolicy?.outcome}, selected=${analysis.stoppingPolicy?.selectedQuestion?.slotId} (netValue=${analysis.stoppingPolicy?.selectedQuestion?.expectedNetValue})`,
  );
  assert.ok(
    analysis.stoppingPolicy?.outcome === "generate_final_prompt" ||
      analysis.stoppingPolicy?.outcome === "proceed_with_assumptions",
  );
  assert.equal(analysis.isReadyForMasterPrompt, true);

  // Consultant text immediately generates the 7 platform prompts
  const responseText = generateAdaptiveConsultantText("website", uiMessages, 0);
  assert.ok(responseText.includes("```chatgpt"));
  assert.ok(responseText.includes("```claude"));
  assert.ok(responseText.includes("<!--certificate"));
});

// ---------------------------------------------------------------------------
// 3. User provides multiple requirements in one answer
// ---------------------------------------------------------------------------
test("Adaptive Interview-Intelligence — 3. User provides multiple requirements in one answer: extracts all requirements and never re-asks covered slots", () => {
  const uiMessages = toUiMessages([
    {
      role: "user",
      content: "I want to build a web application.",
    },
    {
      role: "assistant",
      content:
        "Question 1: What is the main purpose of your web app?\n\n<!--slot:purpose-->",
    },
    {
      role: "user",
      content:
        "It is a client portal for independent dental clinics with automated appointment reminders and Stripe billing, built with React, TypeScript, Tailwind CSS, and Supabase on Vercel with a $0 budget.",
    },
  ]);

  const analysis = analyzeInterview(uiMessages, "website");

  // Verify multi-requirement turn populated purpose, audience, features/integrations, tech_stack, hosting, and budget
  const confirmedSlotIds = new Set(
    analysis.projectProfile.confirmedFacts.map((f) => f.slotId || f.id),
  );
  assert.ok(confirmedSlotIds.has("purpose"), "Purpose must be confirmed");
  assert.ok(
    Boolean(analysis.projectProfile.intendedAudience) ||
      confirmedSlotIds.has("audience"),
    "Audience ('independent dental clinics') must be extracted from multi-requirement answer",
  );
  assert.ok(
    confirmedSlotIds.has("tech_stack"),
    "Tech stack must be extracted from multi-requirement answer",
  );
  assert.ok(
    confirmedSlotIds.has("hosting"),
    "Hosting ('Vercel') must be extracted from multi-requirement answer",
  );
  assert.ok(
    Boolean(analysis.projectProfile.budget) || confirmedSlotIds.has("budget"),
    "Budget ('$0') must be extracted from multi-requirement answer",
  );

  // Verify none of those covered slots are marked missing or selected as the next question
  for (const coveredSlot of [
    "purpose",
    "audience",
    "tech_stack",
    "hosting",
    "budget",
  ]) {
    const candidate = analysis.candidateQuestions?.find(
      (q) => q.slotId === coveredSlot,
    );
    assert.equal(
      candidate?.alreadyPresent,
      true,
      `Slot "${coveredSlot}" was answered in multi-requirement message and must be marked alreadyPresent`,
    );
  }

  if (!analysis.isReadyForMasterPrompt) {
    const nextSlot = selectNextInterviewSlot(EXPERTS.website, analysis);
    assert.ok(
      !["purpose", "audience", "tech_stack", "hosting", "budget"].includes(
        nextSlot.id,
      ),
      `Next slot must not re-ask covered slot, got ${nextSlot.id}`,
    );
  } else {
    assert.equal(analysis.stoppingPolicy?.shouldStop, true);
  }
});

// ---------------------------------------------------------------------------
// 4. User changes an earlier requirement and pivots direction
// ---------------------------------------------------------------------------
test("Adaptive Interview-Intelligence — 4. User changes an earlier requirement and pivots direction: updates profile, preserves history, and avoids re-asking", () => {
  const uiMessages = toUiMessages([
    {
      role: "user",
      content: "I want to launch a B2C fitness mobile app.",
    },
    {
      role: "assistant",
      content:
        "Question 1: Who is your target audience?\n\n<!--slot:audience-->",
    },
    {
      role: "user",
      content: "College athletes looking for strength training.",
    },
    {
      role: "assistant",
      content: "Question 2: What is your budget?\n\n<!--slot:budget-->",
    },
    {
      role: "user",
      content:
        "Actually, instead of a B2C mobile app, let's pivot to a B2B SaaS analytics dashboard, and change target audience to enterprise physical therapy clinics with a budget of $2,500.",
    },
  ]);

  const analysis = analyzeInterview(uiMessages, "website");

  // Primary goal pivoted and recorded previous value
  assert.match(
    analysis.projectProfile.primaryGoal?.value ?? "",
    /b2b saas analytics dashboard/i,
  );
  assert.ok(
    (analysis.projectProfile.primaryGoal?.previousValues?.length ?? 0) > 0,
    "Previous goal before pivot must be preserved in previousValues",
  );

  // Audience was updated to enterprise physical therapy clinics with history preserved
  assert.match(
    analysis.projectProfile.intendedAudience?.value ?? "",
    /enterprise physical therapy clinics/i,
  );
  assert.ok(
    analysis.projectProfile.intendedAudience?.previousValues?.some((p) =>
      /college athletes/i.test(p.value),
    ),
    "Previous audience value must be preserved in previousValues",
  );

  // Budget was also captured from the same turn
  assert.match(analysis.projectProfile.budget?.value ?? "", /\$2,500/);

  // Neither audience nor budget is re-asked
  const nextSlot = selectNextInterviewSlot(EXPERTS.website, analysis);
  assert.notEqual(nextSlot.id, "audience");
  assert.notEqual(nextSlot.id, "budget");
});

// ---------------------------------------------------------------------------
// 5. Conflicting constraints
// ---------------------------------------------------------------------------
test("Adaptive Interview-Intelligence — 5. Conflicting constraints: prioritizes resolving contradiction first, and discloses unresolved conflict if user forces generation", () => {
  const conflictingMessages: SimpleTurn[] = [
    {
      role: "user",
      content:
        "Build a SaaS web app and send SMS notifications via Twilio and fine tune GPT-4 on a dedicated GPU cluster.",
    },
    {
      role: "assistant",
      content: "Question 1: What is your budget?\n\n<!--slot:budget-->",
    },
    {
      role: "user",
      content:
        "My budget is strictly $0 free tier only with no money to spend.",
    },
  ];

  const analysis = analyzeInterview(
    toUiMessages(conflictingMessages),
    "website",
  );

  // Contradiction detected in ProjectProfile
  const unresolvedConflicts = analysis.projectProfile.contradictions.filter(
    (c) => c.status === "unresolved",
  );
  assert.ok(
    unresolvedConflicts.length > 0,
    "Unresolved contradiction ($0 free tier vs Twilio SMS / dedicated GPU cluster) must be detected",
  );

  // Stopping policy must NOT stop while high-impact contradiction is unresolved and user hasn't forced generation
  assert.equal(analysis.stoppingPolicy?.outcome, "ask_clarification");
  assert.equal(analysis.stoppingPolicy?.shouldStop, false);
  assert.equal(
    analysis.stoppingPolicy?.selectedQuestion?.coverageStatus,
    "contradictory",
  );
  assert.ok(
    (analysis.stoppingPolicy?.selectedQuestion?.expectedNetValue ?? 0) >= 7.5,
    "Contradictory question must have top priority net value",
  );

  // Now test when the user chooses to proceed without resolving the conflict
  const forcedMessages: SimpleTurn[] = [
    ...conflictingMessages,
    {
      role: "assistant",
      content:
        "Before generating your prompt, let's clarify that conflict.\n\n<!--slot:integrations-->",
    },
    {
      role: "user",
      content: "Skip the questions and generate the prompt now as is.",
    },
  ];

  const forcedUiMessages = toUiMessages(forcedMessages);
  const forcedAnalysis = analyzeInterview(forcedUiMessages, "website");
  assert.equal(forcedAnalysis.stoppingPolicy?.shouldStop, true);
  assert.equal(
    forcedAnalysis.stoppingPolicy?.outcome,
    "proceed_with_assumptions",
  );
  assert.ok(
    (forcedAnalysis.stoppingPolicy?.unresolvedConflictsToDisclose.length ?? 0) >
      0,
    "Unresolved conflict must be queued for disclosure when user forces generation",
  );

  const generatedOutput = generateAdaptiveConsultantText(
    "website",
    forcedUiMessages,
    0,
  );
  assert.ok(
    generatedOutput.includes("Unresolved Requirement Conflicts"),
    "Assistant response must disclose unresolved conflict above prompts",
  );
  assert.ok(
    generatedOutput.includes("UNRESOLVED CONFLICT DISCLOSURE"),
    "Synthesized platform prompts must disclose unresolved conflict",
  );
  assert.ok(generatedOutput.includes("```chatgpt"));
});

// ---------------------------------------------------------------------------
// 6. User wants to skip the interview or says "you decide" / "I don't know"
// ---------------------------------------------------------------------------
test("Adaptive Interview-Intelligence — 6. User who wants to skip questions or says 'you decide' / 'I don't know': records labeled assumptions, avoids re-asking, and stops cleanly", () => {
  // Part A: User says "you decide" / "I don't know" to individual questions
  const delegatedMessages = toUiMessages([
    {
      role: "user",
      content: "I want to build a SaaS landing page for my AI writing tool.",
    },
    {
      role: "assistant",
      content:
        "Question 1: Who is your target audience?\n\n<!--slot:audience-->",
    },
    {
      role: "user",
      content: "You decide, pick whatever makes the most sense.",
    },
    {
      role: "assistant",
      content:
        "Question 2: What is your preferred tech stack?\n\n<!--slot:tech_stack-->",
    },
    {
      role: "user",
      content: "I don't know, not sure.",
    },
  ]);

  const delegatedAnalysis = analyzeInterview(delegatedMessages, "website");

  // Both audience and tech_stack have active 'assumed' entries in inferredAssumptions
  const assumedAudience =
    delegatedAnalysis.projectProfile.inferredAssumptions.find(
      (a) => a.id === "assumed_slot_audience" && a.origin === "assumed",
    );
  const assumedStack =
    delegatedAnalysis.projectProfile.inferredAssumptions.find(
      (a) => a.id === "assumed_slot_tech_stack" && a.origin === "assumed",
    );
  assert.ok(
    assumedAudience,
    "Delegated audience slot must be recorded as an explicit assumption",
  );
  assert.ok(
    assumedStack,
    "Uncertain tech_stack slot must be recorded as an explicit assumption",
  );

  // Candidate questions for audience and tech_stack are marked assumed_by_user and never re-asked
  const audienceQ = delegatedAnalysis.candidateQuestions?.find(
    (q) => q.slotId === "audience",
  );
  const stackQ = delegatedAnalysis.candidateQuestions?.find(
    (q) => q.slotId === "tech_stack",
  );
  assert.equal(audienceQ?.coverageStatus, "assumed_by_user");
  assert.equal(audienceQ?.alreadyPresent, true);
  assert.equal(stackQ?.coverageStatus, "assumed_by_user");
  assert.equal(stackQ?.alreadyPresent, true);

  const nextSlot = selectNextInterviewSlot(EXPERTS.website, delegatedAnalysis);
  assert.notEqual(nextSlot.id, "audience");
  assert.notEqual(nextSlot.id, "tech_stack");

  // Part B: User explicitly asks to skip the interview and generate now
  const skipInterviewMessages = toUiMessages([
    {
      role: "user",
      content: "I want to launch an online newsletter about biotech.",
    },
    {
      role: "assistant",
      content:
        "Question 1: Who is your target audience?\n\n<!--slot:audience-->",
    },
    {
      role: "user",
      content:
        "Skip the interview and generate the prompt now with sensible assumptions.",
    },
  ]);

  const skipAnalysis = analyzeInterview(skipInterviewMessages, "creator");
  assert.equal(skipAnalysis.stoppingPolicy?.shouldStop, true);
  assert.equal(
    skipAnalysis.stoppingPolicy?.outcome,
    "proceed_with_assumptions",
  );
  assert.ok(
    (skipAnalysis.stoppingPolicy?.assumptionsToDisclose.length ?? 0) > 0,
    "Must disclose explicit assumptions when skipping the interview",
  );
  assert.equal(skipAnalysis.isReadyForMasterPrompt, true);

  const finalOutput = generateAdaptiveConsultantText(
    "creator",
    skipInterviewMessages,
    0,
  );
  assert.ok(finalOutput.includes("Explicit Assumptions Applied"));
  assert.ok(finalOutput.includes("```chatgpt"));
});

// ---------------------------------------------------------------------------
// 7. Unfamiliar task outside existing consultant categories
// ---------------------------------------------------------------------------
test("Adaptive Interview-Intelligence — 7. Unfamiliar task outside existing consultant categories: suppresses irrelevant commercial slots and selects task-adaptive questions", () => {
  const unfamiliarMessages = toUiMessages([
    {
      role: "user",
      content:
        "Write a tabletop D&D 5e one-shot dungeon module set in a sunken clockwork monastery for 4 level-5 players.",
    },
  ]);

  // Even if routed under 'business', the engine detects the unfamiliar domain
  const analysis = analyzeInterview(unfamiliarMessages, "business");

  assert.equal(
    analysis.isUnfamiliarDomain,
    true,
    "D&D dungeon module must be recognized as an unfamiliar domain outside business/website/study/creator",
  );

  // Commercial/business-specific slots like country, model, risk, skills must be suppressed as domain_irrelevant
  const countryCandidate = analysis.candidateQuestions?.find(
    (q) => q.slotId === "country",
  );
  const modelCandidate = analysis.candidateQuestions?.find(
    (q) => q.slotId === "model",
  );
  assert.equal(countryCandidate?.coverageStatus, "domain_irrelevant");
  assert.ok((countryCandidate?.expectedNetValue ?? 0) <= 0);
  assert.equal(modelCandidate?.coverageStatus, "domain_irrelevant");
  assert.ok((modelCandidate?.expectedNetValue ?? 0) <= 0);

  // Selected question comes from the task-adaptive slots (audience, deliverable_format, constraints_scope, or success_criteria)
  const nextSlot = selectNextInterviewSlot(EXPERTS.business, analysis);
  assert.ok(
    [
      "audience",
      "deliverable_format",
      "constraints_scope",
      "success_criteria",
    ].includes(nextSlot.id),
    `Expected task-adaptive slot, got ${nextSlot.id}`,
  );
  assert.ok(!["country", "model", "risk", "skills"].includes(nextSlot.id));

  // Prompt instructions reflect the stopping policy & unfamiliar task handling cleanly
  const systemPrompt = buildAdaptiveConsultantPrompt(
    EXPERTS.business,
    analysis,
  );
  assert.ok(systemPrompt.includes("STOPPING POLICY DECISION:"));
  assert.ok(systemPrompt.includes("RECOMMENDED NEXT QUESTION TOPIC:"));
});
