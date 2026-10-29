import test from "node:test";
import assert from "node:assert/strict";
import type { UIMessage } from "ai";

import {
  createEmptyProjectProfile,
  updateProjectProfileTurn,
  buildProjectProfileFromMessages,
  validateProjectProfile,
  serializeProjectProfile,
  deserializeProjectProfile,
  formatProjectProfileForConsultant,
} from "../src/lib/project-understanding-engine";
import {
  analyzeInterview,
  selectNextInterviewSlot,
  buildAdaptiveConsultantPrompt,
} from "../src/lib/interview-intelligence";
import { EXPERTS } from "../src/lib/experts";
import { ensureAllSevenModels } from "../src/lib/ai-optimization-engine";
import { evaluatePromptQuality } from "../src/lib/prompt-evaluator";
import { normalizeThreadRecord } from "../src/lib/threads";

// ---------------------------------------------------------------------------
// 1. DETAILED INITIAL REQUEST
// ---------------------------------------------------------------------------

test("Project Understanding Engine — 1. Detailed initial request extracts rich structured fields and preserves origin boundaries", () => {
  const detailedText =
    "I want to build a full-stack B2B SaaS invoicing tool for freelance designers with a $0 budget in 2 weeks using React, TypeScript, Tailwind CSS, and Supabase, offline-first with IndexedDB, targeting Claude and Cursor, with no paid ads and without SMS notifications.";

  let profile = createEmptyProjectProfile("website");
  profile = updateProjectProfileTurn(profile, {
    turnIndex: 0,
    messageId: "msg-1",
    userText: detailedText,
    expertId: "website",
  });

  // Primary goal & evidence
  assert.ok(profile.primaryGoal, "Primary goal must be captured");
  assert.equal(profile.primaryGoal.origin, "explicit");
  assert.equal(profile.primaryGoal.confidence, "high");
  assert.equal(profile.primaryGoal.evidence.turnIndex, 0);
  assert.equal(profile.primaryGoal.evidence.quote, detailedText);

  // Audience
  assert.ok(profile.intendedAudience, "Intended audience must be extracted");
  assert.match(profile.intendedAudience.value, /freelance designers/i);
  assert.equal(profile.intendedAudience.origin, "explicit");

  // Desired deliverable
  assert.ok(
    profile.desiredDeliverable,
    "Desired deliverable must be extracted",
  );
  assert.match(profile.desiredDeliverable.value, /invoicing tool|saas/i);

  // Target AI platforms
  const platIds = profile.targetPlatforms.map((p) => p.id);
  assert.ok(
    platIds.includes("platform_claude"),
    "Should detect Claude platform",
  );
  assert.ok(
    platIds.includes("platform_cursor"),
    "Should detect Cursor platform",
  );

  // Budget & Timeline
  assert.ok(profile.budget, "Explicit $0 budget must be captured");
  assert.equal(profile.budget.origin, "explicit");
  assert.match(profile.budget.value, /\$0/);

  assert.ok(profile.timeline, "Explicit 2 weeks timeline must be captured");
  assert.equal(profile.timeline.origin, "explicit");
  assert.match(profile.timeline.value, /2 weeks/i);

  // Explicit exclusions
  assert.ok(
    profile.explicitExclusions.length >= 2,
    `Should capture explicit exclusions ('no paid ads', 'without SMS notifications'), got ${profile.explicitExclusions.length}`,
  );
  assert.ok(
    profile.explicitExclusions.some((e) => /no paid ads/i.test(e.value)),
  );
  assert.ok(
    profile.explicitExclusions.some((e) => /without sms/i.test(e.value)),
  );

  // Non-functional requirements & user preferences
  assert.ok(
    profile.nonFunctionalRequirements.some((n) => n.id === "nfr_offline"),
    "Offline-first NFR must be captured",
  );
  assert.ok(
    profile.userPreferences.some((p) => /React/i.test(p.value)),
    "Tech stack preferences must be captured",
  );

  // CRITICAL INVARIANT: Inferences must NEVER be silently converted into confirmedFacts
  assert.ok(
    profile.inferredAssumptions.length > 0,
    "Should infer technical proficiency from developer stack",
  );
  for (const inf of profile.inferredAssumptions) {
    assert.ok(
      inf.origin === "inferred" || inf.origin === "assumed",
      "Inferred assumptions must have origin 'inferred' or 'assumed'",
    );
    const leakedIntoConfirmed = profile.confirmedFacts.some(
      (cf) => cf.id === inf.id && cf.origin !== "explicit",
    );
    assert.equal(
      leakedIntoConfirmed,
      false,
      "Inferences must never be silently converted into confirmedFacts",
    );
  }
  for (const cf of profile.confirmedFacts) {
    assert.equal(
      cf.origin,
      "explicit",
      "Every item in confirmedFacts must have origin === 'explicit'",
    );
  }
});

// ---------------------------------------------------------------------------
// 2. VAGUE REQUEST
// ---------------------------------------------------------------------------

test("Project Understanding Engine — 2. Vague initial request and vague slot answers do not pollute confirmedFacts", () => {
  let profile = createEmptyProjectProfile(null);

  // Turn 0: Vague greeting/opener
  profile = updateProjectProfileTurn(profile, {
    turnIndex: 0,
    userText: "hi bro help",
  });
  assert.equal(
    profile.primaryGoal,
    undefined,
    "Vague greeting must not be locked as primaryGoal",
  );
  assert.equal(profile.confirmedFacts.length, 0);

  // Turn 1: User gives a real goal, then Turn 2 gives a vague answer ("idk") to audience slot
  profile = updateProjectProfileTurn(profile, {
    turnIndex: 1,
    userText: "I want to build a portfolio website",
    expertId: "website",
  });
  assert.ok(profile.primaryGoal);
  assert.equal(
    profile.primaryGoal.value,
    "I want to build a portfolio website",
  );

  profile = updateProjectProfileTurn(profile, {
    turnIndex: 2,
    userText: "idk not sure",
    askedSlotId: "audience",
    expertId: "website",
  });

  assert.equal(
    profile.intendedAudience,
    undefined,
    "Vague answer 'idk not sure' must not populate intendedAudience",
  );
  assert.equal(
    profile.confirmedFacts.some((f) => f.slotId === "audience"),
    false,
    "Vague answer must not be added to confirmedFacts",
  );
  const audienceUnresolved = profile.unresolvedQuestions.find(
    (q) => q.slotId === "audience",
  );
  assert.ok(
    audienceUnresolved,
    "Audience slot must remain in unresolvedQuestions",
  );
  assert.equal(
    audienceUnresolved.reason,
    "vague_answer",
    "Unresolved question should record reason as 'vague_answer'",
  );
});

// ---------------------------------------------------------------------------
// 3. NEW REQUIREMENTS ARRIVING OVER SEVERAL TURNS & RESOLVING STALE ASSUMPTIONS
// ---------------------------------------------------------------------------

test("Project Understanding Engine — 3. Incremental multi-turn updates preserve earlier facts and resolve stale assumptions", () => {
  let profile = createEmptyProjectProfile("website");

  // Turn 0: Goal without budget -> creates an assumed budget baseline
  profile = updateProjectProfileTurn(profile, {
    turnIndex: 0,
    userText: "Create a SaaS analytics dashboard",
    expertId: "website",
  });

  const initialBudgetAssumption = profile.inferredAssumptions.find(
    (a) => a.category === "budget" && a.origin === "assumed",
  );
  assert.ok(
    initialBudgetAssumption,
    "Missing budget on Turn 0 should record an explicit low-confidence 'assumed' entry",
  );
  assert.equal(initialBudgetAssumption.status, "active");

  // Turn 1: Audience provided
  profile = updateProjectProfileTurn(profile, {
    turnIndex: 1,
    userText: "B2B marketing agencies managing 10+ client accounts",
    askedSlotId: "audience",
    expertId: "website",
  });
  assert.equal(
    profile.intendedAudience?.value,
    "B2B marketing agencies managing 10+ client accounts",
  );

  // Turn 2: Features provided
  profile = updateProjectProfileTurn(profile, {
    turnIndex: 2,
    userText:
      "Automated weekly PDF client reports and multi-tenant role permissions",
    askedSlotId: "features",
    expertId: "website",
  });
  assert.equal(profile.functionalRequirements.length, 1);
  // Audience from Turn 1 is still preserved untouched
  assert.equal(
    profile.intendedAudience?.value,
    "B2B marketing agencies managing 10+ client accounts",
  );
  assert.equal(profile.intendedAudience?.evidence.turnIndex, 1);

  // Turn 3: User provides explicit budget -> resolves the stale budget assumption
  profile = updateProjectProfileTurn(profile, {
    turnIndex: 3,
    userText: "Our budget is $250/mo for cloud infrastructure",
    askedSlotId: "budget",
    expertId: "website",
  });
  assert.ok(profile.budget);
  assert.equal(profile.budget.origin, "explicit");
  assert.equal(profile.budget.evidence.turnIndex, 3);

  const updatedBudgetAssumption = profile.inferredAssumptions.find(
    (a) => a.id === "assumed_budget_lean",
  );
  assert.equal(
    updatedBudgetAssumption?.status,
    "resolved",
    "Stale budget assumption must be marked 'resolved' once explicit budget arrives",
  );
  assert.equal(updatedBudgetAssumption?.resolvedByTurn, 3);
});

// ---------------------------------------------------------------------------
// 4. CONTRADICTORY ANSWERS
// ---------------------------------------------------------------------------

test("Project Understanding Engine — 4. Contradictory answers across turns are detected with traceable evidence", () => {
  let profile = createEmptyProjectProfile("business");

  profile = updateProjectProfileTurn(profile, {
    turnIndex: 0,
    userText: "Launch a new B2B software consultancy",
    expertId: "business",
  });

  profile = updateProjectProfileTurn(profile, {
    turnIndex: 1,
    userText: "I have a $0 zero budget and no money to spend",
    askedSlotId: "budget",
    expertId: "business",
  });

  profile = updateProjectProfileTurn(profile, {
    turnIndex: 2,
    userText:
      "We will run paid Google Ads and hire an agency for lead generation",
    askedSlotId: "model",
    expertId: "business",
  });

  const unresolved = profile.contradictions.filter(
    (c) => c.status === "unresolved",
  );
  assert.equal(
    unresolved.length,
    1,
    "Should detect unresolved contradiction between $0 budget and paid ads/agency",
  );
  assert.equal(unresolved[0].field, "budget");
  assert.equal(unresolved[0].earlierEvidence.turnIndex, 1);
  assert.equal(unresolved[0].conflictingEvidence.turnIndex, 2);
  assert.match(unresolved[0].earlierEvidence.quote, /\$0/);
  assert.match(unresolved[0].conflictingEvidence.quote, /Google Ads/i);
});

// ---------------------------------------------------------------------------
// 5. USER CORRECTING AN EARLIER ANSWER
// ---------------------------------------------------------------------------

test("Project Understanding Engine — 5. Explicit user corrections replace earlier values, preserve history, and resolve contradictions", () => {
  let profile = createEmptyProjectProfile("business");

  profile = updateProjectProfileTurn(profile, {
    turnIndex: 0,
    userText: "Launch a B2B SaaS product",
    expertId: "business",
  });

  profile = updateProjectProfileTurn(profile, {
    turnIndex: 1,
    userText: "$0 zero budget",
    askedSlotId: "budget",
    expertId: "business",
  });

  profile = updateProjectProfileTurn(profile, {
    turnIndex: 2,
    userText: "We will run paid Facebook Ads and hire an agency",
    askedSlotId: "model",
    expertId: "business",
  });

  assert.equal(
    profile.contradictions.filter((c) => c.status === "unresolved").length,
    1,
  );

  // Turn 3: User explicitly corrects their acquisition strategy & budget
  profile = updateProjectProfileTurn(profile, {
    turnIndex: 3,
    userText:
      "Actually, correction: instead of paid ads, we will use 100% organic community outreach and free channels.",
    askedSlotId: "model",
    expertId: "business",
  });

  // Contradiction is now marked resolved
  const unresolvedAfter = profile.contradictions.filter(
    (c) => c.status === "unresolved",
  );
  assert.equal(
    unresolvedAfter.length,
    0,
    "Contradiction must be marked resolved after explicit correction",
  );
  assert.equal(profile.contradictions[0].status, "resolved");
  assert.equal(profile.contradictions[0].resolvedAtTurn, 3);

  // Model slot in domainExtensions replaced earlier value and recorded previousValues
  const modelExt = profile.domainExtensions["model"];
  assert.ok(modelExt);
  assert.match(modelExt.value, /organic community outreach/i);
  assert.ok(
    modelExt.previousValues && modelExt.previousValues.length === 1,
    "Should preserve replaced value in previousValues history",
  );
  assert.match(modelExt.previousValues[0].value, /Facebook Ads/i);
});

// ---------------------------------------------------------------------------
// 6. DUPLICATE INFORMATION
// ---------------------------------------------------------------------------

test("Project Understanding Engine — 6. Duplicate requirements across turns are merged without duplication", () => {
  let profile = createEmptyProjectProfile("website");

  profile = updateProjectProfileTurn(profile, {
    turnIndex: 0,
    userText:
      "Build a portfolio website using React and TypeScript with no paid ads",
    expertId: "website",
  });

  profile = updateProjectProfileTurn(profile, {
    turnIndex: 1,
    userText: "Freelance illustrators and art directors",
    askedSlotId: "audience",
    expertId: "website",
  });

  // Repeat identical audience, tech stack, and exclusion on Turn 2
  profile = updateProjectProfileTurn(profile, {
    turnIndex: 2,
    userText: "Freelance illustrators and art directors",
    askedSlotId: "audience",
    expertId: "website",
  });

  profile = updateProjectProfileTurn(profile, {
    turnIndex: 3,
    userText: "React, TypeScript",
    askedSlotId: "tech_stack",
    expertId: "website",
  });

  const audienceFacts = profile.confirmedFacts.filter(
    (f) => f.slotId === "audience",
  );
  assert.equal(
    audienceFacts.length,
    1,
    "Duplicate audience answer must not create duplicate entries in confirmedFacts",
  );
  assert.equal(
    audienceFacts[0].evidence.turnIndex,
    1,
    "Should preserve original turn evidence when duplicate answer arrives",
  );

  const techPrefs = profile.userPreferences.filter(
    (p) => p.slotId === "tech_stack",
  );
  assert.equal(
    techPrefs.length,
    1,
    "Duplicate tech_stack preference must be merged cleanly",
  );
});

// ---------------------------------------------------------------------------
// 7. MISSING OPTIONAL FIELDS
// ---------------------------------------------------------------------------

test("Project Understanding Engine — 7. Missing optional fields are not forced into profile and validate cleanly", () => {
  let profile = createEmptyProjectProfile("study");

  profile = updateProjectProfileTurn(profile, {
    turnIndex: 0,
    userText: "Learn Rust systems programming for embedded devices",
    expertId: "study",
  });

  // Budget, intendedAudience, and desiredDeliverable were never mentioned
  assert.equal(profile.budget, undefined);
  assert.equal(profile.intendedAudience, undefined);
  assert.equal(profile.desiredDeliverable, undefined);
  assert.equal(profile.explicitExclusions.length, 0);

  const validation = validateProjectProfile(profile);
  assert.equal(
    validation.valid,
    true,
    `Profile with omitted optional fields must validate cleanly, errors: ${validation.errors.join(", ")}`,
  );
});

// ---------------------------------------------------------------------------
// 8. UNKNOWN CONSULTANT-SPECIFIC FIELDS & END-TO-END INTEGRATION
// ---------------------------------------------------------------------------

test("Project Understanding Engine — 8. Unknown consultant-specific fields are preserved across serialization, thread migration, prompt generation, and evaluation", () => {
  let profile = createEmptyProjectProfile("website");

  profile = updateProjectProfileTurn(profile, {
    turnIndex: 0,
    userText:
      "Build a clinical appointment portal for dental practices with $0 budget",
    expertId: "website",
    customFields: {
      regulatory_compliance: {
        label: "Regulatory Compliance Standard",
        value: "HIPAA & HITECH patient data isolation",
        origin: "explicit",
        confidence: "high",
      },
      ehr_interoperability: "HL7 FHIR R4 read-only patient sync",
    },
  });

  // Also test answering an unknown slot tag in conversation
  const messages: UIMessage[] = [
    {
      id: "m-1",
      role: "user",
      parts: [
        {
          type: "text",
          text: "Build a clinical appointment portal for dental practices with $0 budget",
        },
      ],
    },
    {
      id: "m-2",
      role: "assistant",
      parts: [
        {
          type: "text",
          text: "**Question 1:** What clinical workflow protocol do you need? <!--slot:clinical_workflow_protocol-->",
        },
      ],
    },
    {
      id: "m-3",
      role: "user",
      parts: [
        {
          type: "text",
          text: "Automated chairside intake triage with digital consent signatures",
        },
      ],
    },
  ];

  const mergedProfile = buildProjectProfileFromMessages(
    messages,
    "website",
    profile,
  );

  assert.ok(
    mergedProfile.domainExtensions["regulatory_compliance"],
    "Custom field 'regulatory_compliance' must be preserved in domainExtensions",
  );
  assert.ok(
    mergedProfile.domainExtensions["ehr_interoperability"],
    "Custom field 'ehr_interoperability' must be preserved in domainExtensions",
  );
  assert.ok(
    mergedProfile.domainExtensions["clinical_workflow_protocol"],
    "Unknown consultant slot 'clinical_workflow_protocol' from conversation must be captured in domainExtensions",
  );
  assert.equal(
    mergedProfile.domainExtensions["clinical_workflow_protocol"].value,
    "Automated chairside intake triage with digital consent signatures",
  );

  // Serialization & Deserialization round-trip
  const serialized = serializeProjectProfile(mergedProfile);
  const restored = deserializeProjectProfile(serialized);
  assert.equal(
    restored.domainExtensions["regulatory_compliance"].value,
    "HIPAA & HITECH patient data isolation",
  );
  assert.equal(
    restored.domainExtensions["clinical_workflow_protocol"].value,
    "Automated chairside intake triage with digital consent signatures",
  );

  // Consultant reasoning prompt includes the structured profile and unknown fields
  const analysis = analyzeInterview(messages, "website", restored);
  const consultantPrompt = buildAdaptiveConsultantPrompt(
    EXPERTS["website"],
    analysis,
  );
  assert.ok(
    consultantPrompt.includes("STRUCTURED PROJECT PROFILE"),
    "Consultant prompt must include the structured project profile section",
  );
  assert.ok(
    consultantPrompt.includes("HIPAA & HITECH patient data isolation"),
    "Consultant prompt must surface custom domain extensions",
  );

  // Question selection uses the profile
  const nextSlot = selectNextInterviewSlot(EXPERTS["website"], analysis);
  assert.ok(
    nextSlot.id,
    "selectNextInterviewSlot must return a valid next slot",
  );

  // Final prompt generation weaves in the profile & custom extensions across all 7 models
  const allPrompts = ensureAllSevenModels(
    {},
    {
      expertDomain: "website",
      projectProfile: analysis.projectProfile,
    },
  );
  assert.ok(
    allPrompts.chatgpt.includes("HIPAA & HITECH patient data isolation"),
    "Generated ChatGPT prompt must retain custom domainExtensions from ProjectProfile",
  );
  assert.ok(
    allPrompts.claude.includes("Automated chairside intake triage"),
    "Generated Claude prompt must retain unknown slot values from ProjectProfile",
  );

  // Prompt Evaluator consumes projectProfile
  const evalResult = evaluatePromptQuality(allPrompts.chatgpt, {
    projectProfile: analysis.projectProfile,
  });
  assert.equal(
    evalResult.detectedBudgetConstraint,
    "$0 (Free Tier / Zero-Cost Only)",
  );
  assert.ok(evalResult.overallScore >= 8.0);

  // Legacy Thread Migration (stored thread without projectProfile)
  const migratedThread = normalizeThreadRecord({
    id: "legacy-thread-1",
    expert: "website",
    title: "Legacy clinical thread",
    updatedAt: Date.now(),
    messages,
  });
  assert.ok(
    migratedThread.projectProfile,
    "normalizeThreadRecord must safely migrate legacy threads by constructing projectProfile",
  );
  assert.equal(
    migratedThread.projectProfile?.domainExtensions[
      "clinical_workflow_protocol"
    ]?.value,
    "Automated chairside intake triage with digital consent signatures",
  );
});
