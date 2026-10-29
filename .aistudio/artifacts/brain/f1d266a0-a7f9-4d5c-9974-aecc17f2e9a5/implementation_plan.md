# Prompt Master — Architectural Audit & Phased Implementation Plan

## 1. Current Architecture & Data Flow

Prompt Master is a full-stack TanStack Start + React 19 application that conducts adaptive, domain-specific discovery interviews and synthesizes tailored prompts across **7 target AI platforms** (`chatgpt`, `claude`, `gemini`, `perplexity`, `grok`, `cursor`, `windsurf`) accompanied by an **8-dimension Quality & Feasibility Certificate**.

### Core Module Topology
- **Domain & Persona Layer (`/src/lib/experts.ts`)**:
  - Defines 4 domain consultants (`ExpertId`: `business`, `website`, `study`, `creator`), each with prioritized discovery slots (`critical | important | optional`) and `criticalSlots` arrays.
  - Defines `BASE_INSTRUCTIONS` (Adaptive Interview Intelligence rules, Human Understanding Engine, Prompt Reflection Engine, 7-Model Output Format, `<!--slot:slot_id-->` and `<!--certificate ...-->` machine tags) and `TRIAGE_PROMPT` for initial goal clarification when no domain is yet assigned.
  - Provides `isVagueIntent()` and `detectExpert()` keyword-based intent classification.
- **Interview Intelligence Engine (`/src/lib/interview-intelligence.ts`)**:
  - Runs on every turn via `analyzeInterview(messages, expertId)` to compute `IntelligenceAnalysis`:
    - Extracts `inferredFacts` (`inferInformation()`) across 8 heuristic categories (technical proficiency, target audience, product/site archetype, content format, budget/free-tier constraints, external integrations, hosting/deployment, timeline/urgency).
    - Extracts `confirmedFacts` by scanning assistant messages for `<!--slot:slot_id-->` tags and pairing each with the next user reply (skipping meta/clarification questions detected by `isClarificationOrMetaRequest()`).
    - Computes `activeSignals` via `detectVagueness()`, `detectContradictions()`, `detectUnrealisticExpectations()`, and `detectKnowledgeGaps()`.
    - Calculates `readinessScore` (up to 40 pts from `confirmedFacts`, 30 pts from `inferredFacts`, 30 pts from `criticalSlots` coverage) and gates master prompt generation on `isReadyForMasterPrompt` (`readinessScore >= 80 && confirmedFacts + inferredFacts >= 4 && criticalRatio >= 0.75`).
  - Serializes the analysis into the runtime system prompt via `buildAdaptiveConsultantPrompt()`.
- **Multi-Platform Optimization Engine (`/src/lib/ai-optimization-engine.ts`)**:
  - Defines `MODEL_OPTIMIZATION_PROFILES` and `generateOptimizedPrompts()` to construct structurally distinct prompts for all 7 platforms:
    - **ChatGPT**: Markdown CO-STAR blueprint with Phased Action Plan, Free-Tier Matrix, and Acceptance Criteria.
    - **Claude**: Strict XML hierarchy (`<system_instructions>`, `<context>`, `<technical_feasibility_and_quotas>`, `<implementation_specification>`, `<self_verification_protocol>`).
    - **Gemini**: Multimodal Workspace & Research Systems Architect layout with structured comparison tables.
    - **Perplexity**: Live Web Citation & Deep Research mode (`[VERIFY: ...]` markers, source verification protocols).
    - **Grok**: First-principles contrarian stress-test & failure-mode teardown.
    - **Cursor**: `.cursorrules` agentic IDE file layout, zero-placeholder mandate, and terminal verification protocol.
    - **Windsurf**: Cascade 3-phase execution loop (Reconnaissance -> Atomic Implementation -> Terminal Verification).
  - Provides `ensureAllSevenModels()` to backfill or repair missing/thin model code blocks and enforce fact retention.
- **Deterministic Rubric Evaluator (`/src/lib/prompt-evaluator.ts`)**:
  - Evaluates prompts via `evaluatePromptQuality()` across 8 weighted dimensions:
    - `clarity` (10%), `context` (10%), `constraints` (10%), `audience` (10%), `outputFormat` (10%), `completeness` (10%), `technicalFeasibility` (20%), and `implementationSpecificity` (20%).
  - Applies hard score caps when critical feasibility or specificity signals are absent (e.g., capping `technicalFeasibility` at `6.5` if fewer than 2 feasibility checks pass or `5.5` if a `$0` budget is ignored).
- **Chat API & Fallback Engine (`/src/routes/api/chat.ts` & `/src/lib/ai-provider.ts`)**:
  - Validates the server-side Gemini API key (`GEMINI_API_KEY` or `GOOGLE_GENERATIVE_AI_API_KEY`) and defaults to `gemini-2.5-flash-lite`.
  - Streams responses via the Vercel AI SDK (`streamText` -> `toUIMessageStream`). Inspects the first two stream chunks for immediate startup errors; falls back to the deterministic `generateAdaptiveConsultantText()` engine when the key is missing or stream initialization fails.
- **State Persistence (`/src/lib/threads.ts` & `/src/lib/cloud-db.ts`)**:
  - Stores guest sessions in `localStorage` (`prompt-master.threads.v1` and `prompt-master.saved-prompts.v1`).
  - Syncs authenticated users' profiles, threads, and saved prompts to Cloud Firestore (`users`, `threads`, `saved_prompts`) with real-time `onSnapshot` listeners and guest-to-cloud migration (`syncLocalToCloud`).

---

## 2. Existing Behavior That Must Be Preserved

1. **4 Domain Consultants & Slot Taxonomies**: All 4 expert personas (`business`, `website`, `study`, `creator`), their slot IDs, priorities, and human-friendly `why` explanations in `/src/lib/experts.ts`.
2. **Machine-Readable Protocol Tags**:
   - `<!--slot:slot_id-->` at the end of interview question turns so the UI and intelligence engine track slot progression.
   - `<!--certificate ...-->` at the end of master prompt synthesis turns so the UI renders the 8-dimension Quality & Feasibility Certificate.
3. **7-Platform Distinct Prompt Synthesis**: Native, non-identical prompt generation across `chatgpt`, `claude`, `gemini`, `perplexity`, `grok`, `cursor`, and `windsurf`.
4. **Silent Deterministic Fallback Mode**: Seamless fallback to the server-side Adaptive Consultant Engine when the Gemini API encounters rate limits, missing keys, or stream failures.
5. **Hybrid Local + Cloud Persistence**: `localStorage` guest persistence paired with Firebase Auth + Firestore synchronization (`users`, `threads`, `saved_prompts`).
6. **Server-Side API Key Security**: Strict server-only access to `GEMINI_API_KEY` / `GOOGLE_GENERATIVE_AI_API_KEY` with sanitized error messages (`sanitizeAIErrorMessage`).

---

## 3. Confirmed Defects (Verified with File Paths & Code Evidence)

### Defect 1 (Critical — Data Loss & Bypassed Intelligence): `detectExpert()` gate in `threads.ts` and `chat.ts` wipes valid sessions and skips `analyzeInterview()`
- **Location**:
  - `/src/lib/threads.ts` lines 32–47 (`normalizeThreadRecord`)
  - `/src/routes/api/chat.ts` lines 73–99 (`POST` handler)
  - `/src/lib/experts.ts` lines 956–958 (`detectExpert`)
- **Evidence**:
  - In `/src/lib/experts.ts` lines 956–958:
    ```ts
    // Require either a keyword hit OR a reasonably long sentence to commit.
    if (bestScore === 0 && t.split(/\s+/).length < 4) return null;
    return bestScore === 0 ? null : best;
    ```
    Despite the comment on line 956, line 958 unconditionally returns `null` whenever `bestScore === 0`, even for detailed multi-word goals that don't happen to match the hardcoded keyword list (e.g., *"I want to prepare for a marathon in 12 weeks"* or *"Help me design a workflow for a dental clinic"*).
  - In `/src/lib/threads.ts` lines 33–38:
    ```ts
    const goalIndex = thread.messages.findIndex(
      (m) => m.role === "user" && detectExpert(messageText(m)),
    );
    if (goalIndex === -1) {
      return { ...thread, expert: null, title: "New session", messages: [] };
    }
    ```
    When `loadThreads()` runs on reload or during `createFreshSession()`, any thread whose user messages did not match a hardcoded keyword in `detectExpert()` has its `messages` array wiped to `[]` and its `expert` reset to `null` — even if `thread.expert` was explicitly selected by the user!
  - In `/src/routes/api/chat.ts` lines 73–99:
    ```ts
    const goalIndex = expert
      ? uiMessages.findIndex(
          (m) => m.role === "user" && detectExpert(messageTextFromUi(m)),
        )
      : -1;
    ...
    if (expert && EXPERTS[expert] && goalIndex >= 0) {
      const relevantMessages = uiMessages.slice(goalIndex);
      const intelligenceAnalysis = analyzeInterview(relevantMessages, expert);
      ...
    ```
    When a user manually selects an expert pill in the UI and enters a valid non-vague goal that doesn't trigger `detectExpert()`, `goalIndex` is `-1`, completely bypassing `analyzeInterview()` and `buildAdaptiveConsultantPrompt()` on the live LLM path.

### Defect 2 (Critical — Stream Resilience): Mid-stream interruptions close silently with truncated output instead of completing all 7 platform blocks
- **Location**: `/src/routes/api/chat.ts` lines 128–161
- **Evidence**:
  ```ts
  const reader = rawStream.getReader();
  const firstChunk = await reader.read();
  const secondChunk = await reader.read();
  ...
  const healthyStream = new ReadableStream({
    async start(controller) {
      if (!firstChunk.done && firstChunk.value) controller.enqueue(firstChunk.value);
      if (!secondChunk.done && secondChunk.value) controller.enqueue(secondChunk.value);
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          controller.enqueue(value);
        }
      } catch {
        // Handled silently
      } finally {
        controller.close();
      }
    },
  });
  ```
  - Only the first two stream chunks are checked for errors. If Gemini drops mid-stream, hits a token/rate limit during 7-model synthesis, or emits only 2–3 of the 7 platform blocks, the `catch {}` block closes the stream silently.
  - Furthermore, live LLM responses bypass `ensureAllSevenModels()` and deterministic rubric validation altogether (`ensureAllSevenModels()` and `evaluatePromptQuality()` are only called inside the fallback function `generateAdaptiveConsultantText()` at lines 245–315).

### Defect 3 (High — Scoring Divergence): Live LLM self-scores `<!--certificate-->` instead of using deterministic `evaluatePromptQuality()`, and `BASE_INSTRUCTIONS` omits 2 of the 8 dimensions in Step 2
- **Location**:
  - `/src/lib/experts.ts` lines 153–160 vs lines 269–282
  - `/src/routes/api/chat.ts` lines 111–161 vs lines 267–314
- **Evidence**:
  - In `/src/lib/experts.ts` lines 153–160 (`STEP 2 — Quality Evaluation`), `BASE_INSTRUCTIONS` instructs the LLM to score only **6 criteria** (`Clarity, Context completeness, Constraint precision, Target audience definition, Output format structure, Overall completeness`), omitting `feasibility` and `specificity` which are later requested in the `<!--certificate-->` block at lines 276–277.
  - On the live LLM path, the UI parses whatever numbers the LLM self-reports in `<!--certificate ...-->`. On the fallback path (`/src/routes/api/chat.ts` line 267), scores are computed by `evaluatePromptQuality(prompts.chatgpt, ...)` in `/src/lib/prompt-evaluator.ts`. This causes identical prompts to receive completely different scores depending on whether the live LLM or deterministic engine emitted the certificate.

### Defect 4 (High — False-Positive Budget Inference): `inferInformation()` misclassifies any number (500, 1000, 10k, or earlier numerals) as the user's starting budget
- **Location**: `/src/lib/interview-intelligence.ts` lines 439–455 and 1221–1223
- **Evidence**:
  ```ts
  } else if (
    /\$?[0-9]+k?\s*(budget|dollars|usd)/.test(clean) ||
    clean.includes("10k") ||
    clean.includes("500") ||
    clean.includes("1000")
  ) {
    const match = clean.match(/(\$?[0-9]+k?)\s*(budget|dollars|usd)?/);
    if (match) {
      add({
        id: "budget_constraint",
        label: "Starting Budget",
        value: `Approx. ${match[1].toUpperCase()}`,
  ```
  - Because `clean.includes("10k") || clean.includes("500") || clean.includes("1000")` triggers on revenue/audience goals (e.g., *"I want to reach 1,000 subscribers in 2 months"* or *"Make $10k/month"*), and `(budget|dollars|usd)?` in `clean.match(...)` is optional (`?`), `match[1]` captures the **very first number anywhere in the conversation** (e.g., `"1"` or `"2"` from `"2 months"`) and records `Starting Budget: Approx. 2`.
  - Worse, because `budget_constraint` has `category: "business"`, lines 1221–1223 add `"budget constraint (already inferred)"` to `unnecessaryTopics` (`❌ DO NOT ASK ABOUT: budget constraint`), preventing the consultant from ever asking about the user's actual starting budget!

### Defect 5 (High — Slot Extraction & Readiness Inflation): Vague answers and repeated slots inflate `confirmedFacts` and `readinessScore`
- **Location**: `/src/lib/interview-intelligence.ts` lines 1185–1208 and 1262–1285
- **Evidence**:
  - `analyzeInterview()` iterates over all assistant messages with a `<!--slot:slot_id-->` tag and pushes every non-clarification user reply into `confirmedFacts` without checking `detectVagueness(userAns)` or deduplicating by `slotId`.
  - If a user answers `"idk"` or `"everyone"` to `<!--slot:audience-->`, and the consultant re-asks `<!--slot:audience-->` on the next turn, `confirmedFacts` stores **both** `{ slotId: "audience", value: "idk" }` and `{ slotId: "audience", value: "Freelance designers" }`.
  - Because `confirmedScore = Math.min(40, confirmedFacts.length * 10)` and `questionNumber: confirmedFacts.length`, vague answers prematurely increment question numbers and inflate `readinessScore` by +10 points per vague reply.

### Defect 6 (Medium-High — Fact Retention Bug in `ensureAllSevenModels`): Substring check matches slot labels instead of user values and injects Markdown into XML/IDE blocks
- **Location**: `/src/lib/ai-optimization-engine.ts` lines 328–361
- **Evidence**:
  ```ts
  const missingFacts = confirmedFacts.filter(
    (f) =>
      !rawPrompt
        .toLowerCase()
        .includes(f.toLowerCase().split(/[:-]/)[0].trim()),
  );
  ```
  - `confirmedFacts` entries are formatted as `"Label: Value"` (e.g., `"Starting Budget: $250"` or `"Target Audience: Indie game devs"`).
  - `f.toLowerCase().split(/[:-]/)[0].trim()` extracts **only the label** (`"starting budget"` or `"target audience"`), NOT the user's value (`"$250"` or `"indie game devs"`). If a template already contains the words `"target audience"`, `missingFacts` assumes the user's answer is present even when the user's actual value was omitted!
  - Conversely, when `missingFacts` is non-empty, lines 346–352 append `# CONFIRMED INTERVIEW REQUIREMENTS & CONTEXT` in raw Markdown to every model block — breaking Claude's strict XML hierarchy (`<context>`) and Cursor/Windsurf's native rule structure.

### Defect 7 (Medium — Contradiction Persistence & Single-Signal Truncation): Resolved contradictions never clear, and multiple simultaneous signals are dropped
- **Location**: `/src/lib/interview-intelligence.ts` lines 667–1161
- **Evidence**:
  - `detectContradictions(allUserAnswers)` joins all user messages from Turn 1 onward (`allUserAnswers.join(" ")`). If a user states a contradiction on Turn 2 (e.g., `$0 budget` + `Facebook ads`) and resolves it on Turn 3 (`"Got it, let's use organic community outreach instead"`), the earlier phrase `"facebook ads"` remains in `allUserAnswers`, causing `contradiction_detected` to fire on every subsequent turn.
  - `detectContradictions()`, `detectUnrealisticExpectations()`, and `detectKnowledgeGaps()` each return at most 1 signal due to early `return` statements instead of collecting all active signals.

### Defect 8 (Medium — Domain Bias in `prompt-evaluator.ts`): Non-technical domains (`business`, `study`, `creator`) are penalized by hardcoded web-stack rubric checks
- **Location**: `/src/lib/prompt-evaluator.ts` lines 112–398 (`evaluateTechnicalFeasibility` & `evaluateImplementationSpecificity`)
- **Evidence**:
  - `technicalFeasibility` (20% weight) and `implementationSpecificity` (20% weight) check for web-engineering strings (`react`, `next.js`, `vite`, `tailwind`, `typescript`, `zod`, `supabase`, `drizzle`, `loading skeletons`, `.env.example`, `tsc --noemit`).
  - While appropriate for `website` / software prompts or coding models (`cursor`, `windsurf`), applying these exact checks to `study`, `creator`, or non-software `business` prompts artificially penalizes live LLM prompts that use domain-appropriate terminology (e.g., study schedules, spaced repetition rubrics, retention hooks, unit economics) rather than React/TypeScript/Zod boilerplate.

---

## 4. Risks & Hypotheses Requiring Verification Testing

1. **Test Suite Execution Verification (Blocked by transient container RPC rate-limit during audit)**:
   - *Status*: Executing `npx vitest run` during this audit turn encountered a transient container control-plane rate limit (`UNAVAILABLE: QPS or BW/in or BW/out quota exceeded`).
   - *Action in Phase 1*: Execute `npx vitest run` as the first step of implementation to baseline all existing unit/integration tests before and after each code change.
2. **Firestore Security Rules & Ownership Enforcement (`firestore.rules` / `/src/lib/cloud-db.ts`)**:
   - *Risk*: In `/src/lib/cloud-db.ts`, `renameThreadInCloud()`, `toggleThreadFavoriteInCloud()`, and `deleteThreadFromCloud()` accept `userId` as a parameter (lines 136, 148, 160) but do not use it in the client query, relying entirely on `firestore.rules` to enforce `resource.data.userId == request.auth.uid`. Furthermore, `togglePromptFavoriteInCloud(promptId, isFavorite)` and `deletePromptFromCloud(promptId)` do not validate ownership client-side.
   - *Verification Needed*: Inspect `firestore.rules` to verify strict `request.auth.uid == resource.data.userId` enforcement on `users`, `threads`, and `saved_prompts`.
3. **Request Payload Validation in `/api/chat` (`/src/routes/api/chat.ts` lines 55–72)**:
   - *Risk*: `POST /api/chat` checks `Array.isArray(messages)` but does not validate message structure, cap message count/size, or validate `expert` against `["business", "website", "study", "creator"]` before passing `uiMessages` to `convertToModelMessages()`. Malformed `parts` arrays in `messages` can throw unhandled exceptions in `messageText()` (`m.parts.map is not a function`).

---

## 5. Recommended Changes Ranked by Impact & Implementation Risk

| Rank | Recommendation | Impact | Implementation Risk | Target Files |
| :--- | :--- | :--- | :--- | :--- |
| **1** | **Fix Goal Detection & Thread Normalization Gate**: Decouple valid non-vague user goals from keyword-only `detectExpert()` in `threads.ts` and `chat.ts` so manual expert selection and non-keyword goals never wipe thread history or skip `analyzeInterview()`. | **Critical** (Prevents data loss & restores intelligence engine for all goals) | **Low** | `/src/lib/experts.ts`, `/src/lib/threads.ts`, `/src/routes/api/chat.ts` |
| **2** | **Harden Stream Resilience & Post-Stream 7-Model Completion**: Buffer/monitor the stream in `/api/chat`; if a mid-stream error occurs or a master-prompt synthesis turn finishes with fewer than 7 valid model blocks, automatically repair/complete all 7 blocks via `ensureAllSevenModels()` and append the deterministic `<!--certificate-->`. | **Critical** (Guarantees 100% complete 7-platform output & no silent truncation) | **Low-Medium** | `/src/routes/api/chat.ts`, `/src/lib/ai-optimization-engine.ts` |
| **3** | **Enforce Authoritative Deterministic Scoring (`evaluatePromptQuality`)**: Always compute or overwrite the `<!--certificate-->` block using `evaluatePromptQuality()` across both live LLM and fallback paths, and align `BASE_INSTRUCTIONS` Step 2 with all 8 dimensions. | **High** (Eliminates hallucinated/divergent LLM self-scores) | **Low** | `/src/routes/api/chat.ts`, `/src/lib/prompt-evaluator.ts`, `/src/lib/experts.ts` |
| **4** | **Fix Slot Extraction, Budget Inference Regex & Contradiction Resolution**: Fix the false-positive numeric budget regex in `inferInformation()`, deduplicate `confirmedFacts` by `slotId` (updating with latest non-vague answer), and allow later turns to resolve earlier contradictions. | **High** (Directly improves interview accuracy & readiness gating) | **Low** | `/src/lib/interview-intelligence.ts` |
| **5** | **Fix Fact Retention Value Matching & Format-Native Injection in `ensureAllSevenModels`**: Check for the user's actual fact *value* (not just the slot label) and inject missing facts using format-native sections (XML tags for Claude, rule blocks for Cursor/Windsurf). | **Medium-High** (Preserves user facts without breaking model-native formatting) | **Low** | `/src/lib/ai-optimization-engine.ts` |
| **6** | **Calibrate Domain-Aware Scoring in `prompt-evaluator.ts` & Harden Input Validation**: Support domain-aware feasibility/specificity signals for `business`, `study`, and `creator` prompts while keeping strict web-stack checks for `website`/coding prompts, and add defensive `parts` validation in `threads.ts` and `/api/chat`. | **Medium** (Fairer scoring across all 4 consultants + API safety) | **Low** | `/src/lib/prompt-evaluator.ts`, `/src/lib/threads.ts`, `/src/routes/api/chat.ts` |

---

## 6. Phased Implementation Plan & Acceptance Criteria

### Phase 1: Interview Accuracy, Slot Extraction & Stream Fallback Resilience (Top Priority)
1. **Goal Detection & Thread Preservation (`/src/lib/experts.ts`, `/src/lib/threads.ts`, `/src/routes/api/chat.ts`)**:
   - Update `detectExpert()` in `/src/lib/experts.ts` and `normalizeThreadRecord()` in `/src/lib/threads.ts` so any non-vague user message (`!isVagueIntent(text)`) is preserved as a valid goal when `thread.expert` is set or when the user enters a substantive sentence, never wiping `messages` to `[]`.
   - Update `/src/routes/api/chat.ts` so `goalIndex` falls back to the first non-vague user message when `expert` is active, ensuring `analyzeInterview()` and `buildAdaptiveConsultantPrompt()` always run.
2. **Accurate Slot Extraction & Inference (`/src/lib/interview-intelligence.ts`)**:
   - Fix `inferInformation()` budget extraction so it requires explicit currency/budget indicators (`$500`, `500 budget`, `10k budget`) and never matches bare audience/timeline numbers (`1000 users`, `2 weeks`).
   - Update `analyzeInterview()` so `confirmedFacts` ignores vague placeholder replies (`detectVagueness(userAns).isVague`) until clarified, and deduplicates by `slotId` (retaining the latest substantive answer per slot) so `readinessScore` and `questionNumber` are never artificially inflated.
   - Update `detectContradictions()` so latest user answers can resolve earlier contradictions (e.g., adopting organic outreach or scoping down to an MVP clears earlier warnings).
3. **Stream Interruption Recovery & 7-Platform Validation (`/src/routes/api/chat.ts`)**:
   - Enhance `/api/chat` stream handling so that if the live LLM stream errors mid-way or emits a synthesis response missing any of the 7 platform blocks (`chatgpt`, `claude`, `gemini`, `perplexity`, `grok`, `cursor`, `windsurf`), the stream seamlessly appends/completes the missing platform blocks and certificate via the deterministic optimization engine (`ensureAllSevenModels` + `generateAdaptiveConsultantText`).
- **Phase 1 Acceptance Criteria**:
  - Non-keyword goals with a selected expert retain 100% of messages across `loadThreads()` and trigger `analyzeInterview()`.
  - Mentioning `"1000 subscribers in 2 months"` does not infer `"Starting Budget: Approx. 2"`.
  - Replying `"idk"` followed by a real answer to the same slot results in 1 deduplicated `confirmedFact` for that `slotId`.
  - Simulated mid-stream interruption or partial LLM output still delivers all 7 valid platform blocks to the client.

### Phase 2: Authoritative Deterministic Scoring & Multi-Platform Synthesis Fidelity
1. **Authoritative `evaluatePromptQuality()` Certificate Enforcement (`/src/routes/api/chat.ts`, `/src/lib/prompt-evaluator.ts`, `/src/lib/experts.ts`)**:
   - Update `BASE_INSTRUCTIONS` Step 2 in `/src/lib/experts.ts` to list all 8 rubric dimensions consistently.
   - Ensure `/api/chat` always computes/replaces the `<!--certificate ...-->` block using `evaluatePromptQuality()` from `/src/lib/prompt-evaluator.ts` so UI certificate scores are 100% deterministic and authoritative across both live LLM and fallback modes.
2. **Domain-Aware Rubric Calibration (`/src/lib/prompt-evaluator.ts`)**:
   - Preserve strict web-stack checks for `website` and IDE blocks while recognizing domain-appropriate feasibility and specificity markers (unit economics, CAC/LTV, spaced-repetition schedules, hook/retention packaging, free-tier tool quotas) so `business`, `study`, and `creator` prompts are scored accurately.
3. **Value-Based Fact Retention & Format-Native Injection (`/src/lib/ai-optimization-engine.ts`)**:
   - Update `ensureAllSevenModels()` to verify presence of the user's actual fact *value* (not just the slot label) and inject any missing facts using the target model's native syntax (e.g., inside `<context>` for Claude XML, rule directives for Cursor/Windsurf, Markdown for ChatGPT/Gemini/Perplexity/Grok).
- **Phase 2 Acceptance Criteria**:
  - Live LLM and fallback responses produce identical deterministic `<!--certificate-->` scores for identical prompt content.
  - `ensureAllSevenModels()` checks user fact values and preserves valid XML in the `claude` block.

### Phase 3: Defensive Validation, Security Audit & Regression Test Suite
1. **Input & State Hardening (`/src/routes/api/chat.ts`, `/src/lib/threads.ts`, `/src/lib/cloud-db.ts`)**:
   - Make `messageText()` resilient to missing/malformed `parts` arrays (`Array.isArray(m?.parts)`).
   - Validate `expert` and `messages` structure in `POST /api/chat`.
2. **Automated Verification & Regression Tests (`/src/__tests__/`)**:
   - Run `npx vitest run` and add unit tests covering:
     - Non-keyword goal preservation in `loadThreads()`.
     - False-positive budget regex prevention in `inferInformation()`.
     - Slot deduplication and vague-answer filtering in `analyzeInterview()`.
     - Value-based fact retention and XML preservation in `ensureAllSevenModels()`.
     - Mid-stream fallback completion and deterministic `evaluatePromptQuality()` certificate replacement in `/api/chat`.
- **Phase 3 Acceptance Criteria**:
  - All existing and new Vitest test suites pass (`npx vitest run` and `compile_applet` succeed with zero errors).
