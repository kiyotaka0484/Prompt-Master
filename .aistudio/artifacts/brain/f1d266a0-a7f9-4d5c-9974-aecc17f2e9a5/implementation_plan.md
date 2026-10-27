# Prompt Master — Consultant Interview & Quality Rubric Enhancement Plan

This plan elevates Prompt Master's adaptive consultant interviewing capabilities and evidence-backed prompt quality evaluation rubrics while preserving silent failover resiliency on top of `gemini-3.5-flash-lite`.

## User Review & Critical Decisions

> [!IMPORTANT]
> The following architectural and UX decisions incorporate your confirmed selections from the planning interview:

- **Confirmed Decision 1 — Consultant & Rubric Enhancement Scope**: Expand adaptive consultant follow-up question synthesis, domain-specific probing (Business, Website/App, Study, Content Creator), and evidence-based rubric evaluation across all 8 scoring dimensions.
- **Confirmed Decision 2 — Silent Resilient Fallback**: Maintain silent failover to the built-in Adaptive Consultant Engine whenever the Gemini API encounters temporary rate limits, quota exhaustion, or network interruptions, ensuring zero interruption to user interviews or 7-model prompt generation.
- **Confirmed Decision 3 — Active Default Model**: Keep `gemini-3.5-flash-lite` as the central default model in the server-side Gemini provider, preserving compatibility with `@ai-sdk/google` and server-side secret isolation.

---

## 1. Overview & Core Concept

- **What It Does**: Prompt Master interviews users like a senior domain strategist, infers known context automatically, detects vague answers or contradictions, and synthesizes seven distinct, platform-native master prompts (`ChatGPT`, `Claude`, `Gemini`, `Perplexity`, `Grok`, `Cursor`, and `Windsurf`) accompanied by an evidence-verified quality certificate.
- **Target Audience / Persona**: Founders, full-stack developers, students, and content creators who want production-grade, model-tailored prompts without mastering prompt engineering syntax for every AI platform.
- **Key Value**: Transforms brief, unstructured project ideas into comprehensive, architecture-verified specifications with honest, non-inflated rubric scoring and zero downtime.

---

## 2. User Experience & Visual Design

- **Key User Flows**:
  1. **Intent Discovery & Consultant Lock**: The user enters an initial goal; the system detects the domain consultant (Business, Website/App, Study, or Creator) and locks the primary objective.
  2. **Adaptive Focus & Stream Interview**: In Focus Mode or Stream Mode, the consultant asks one high-leverage question at a time with contextual bridges, concrete option anchors for vague inputs, and inline explanations when the user clicks "Why are you asking this?".
  3. **Multi-Model Master Prompt Synthesis**: Once critical slots are satisfied (or when the user triggers generation), the engine outputs seven distinct, platform-native prompts alongside an interactive 8-dimension Quality Certificate and Free-Tier Feasibility Audit.
- **Visual Identity & Theme**:
  - *Aesthetic Direction*: High-craft SaaS workspace with clean single-elevation surfaces, crisp 1px structural borders (`--border`), and zero visual bloat.
  - *Color Palette & Mood*: Deep slate/obsidian dark posture paired with domain-semantic accents (`--accent-violet` for Business, `--accent-cyan` for Website/App, `--accent-amber` for Study, `--accent-rose` for Creator) following a strict 60-30-10 neutral-to-accent budget.
  - *Typography & Hierarchy*: Crisp display headers paired with high-scannability body prose and strict tabular numerals (`tabular-nums`) across all quality scores, readiness percentages, question counters, and dimension metrics.
  - *Component Styling & Layout*: Unboxed metadata with subtle `·` separators, single-line interactive controls (`whitespace-nowrap shrink-0`), and clear visual separation between the interview stage and the 7-model output tabs.
- **Interactive Feedback & Motion**: Smooth streaming text deltas, responsive slot progress indicators, instant model-tab switching, one-click copy confirmation toasts, and seamless silent fallback recovery.

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Evidence-Backed Rubric Scoring with Domain-Aware Criteria**
  - *Chosen Approach*: Enhance the 8-dimension evaluator (`Clarity`, `Context`, `Constraints`, `Audience`, `Output Requirements`, `Completeness`, `Technical Feasibility`, and `Implementation Specificity`) to cross-check domain-specific deliverables (unit economics and acquisition channels for Business; schema, state handling, and secret isolation for Website; active recall and milestone projects for Study; retention hooks and packaging for Creator).
  - *Why*: Prevents generic score inflation and gives users concrete, actionable feedback tied directly to their project domain.
  - *Alternatives Considered*: Relying on LLM self-reported certificate scores, which frequently inflate weak prompts to 9.5+/10 without textual evidence.
- **Decision 2: Context-Aware Adaptive Consultant Fallback Questions**
  - *Chosen Approach*: Upgrade the server-side Adaptive Consultant Engine so its interview questions dynamically reference the user's confirmed facts, inferred constraints, and active intelligence signals (vagueness, contradiction, or unrealistic scope) both in live Gemini system prompts and during silent fallback streaming.
  - *Why*: Ensures every consultant question feels tailored to the user's exact answers rather than reading like a static form.
  - *Alternatives Considered*: Surfacing raw HTTP 429/503 error banners and halting the interview until the user manually retries.

---

## 4. Technical Architecture & Data Strategy *(Technical Reference)*

- **Architecture & Component Diagram**:

```
┌──────────────────────────────────────────────────────────────────────────┐
│                        Client Workspace (React SPA)                      │
│                                                                          │
│  ┌─────────────────────────┐          ┌───────────────────────────────┐  │
│  │   Interview Workspace   │          │   7-Model Output & Rubric     │  │
│  │  • Focus / Stream Toggle│          │  • Platform Tabs (7 Models)   │  │
│  │  • Slot Progress Tracker│─────────▶│  • Evidence Quality Scorecard │  │
│  │  • "Why Ask?" Trigger   │          │  • Free-Tier Feasibility Audit│  │
│  └────────────┬────────────┘          └───────────────▲───────────────┘  │
└───────────────┼───────────────────────────────────────┼──────────────────┘
                │ POST /api/chat (SSE Stream)           │
                ▼                                       │
┌───────────────────────────────────────────────────────┴──────────────────┐
│                     Server-Side Chat Proxy & Intelligence                │
│                                                                          │
│  ┌─────────────────────────┐          ┌───────────────────────────────┐  │
│  │ Interview Intelligence  │          │   Gemini Provider (Server)    │  │
│  │  • Fact Inference       │─────────▶│  • Model: gemini-3.5-flash-lite│  │
│  │  • Signal Detection     │          │  • Early Stream Health Check  │  │
│  │  • Slot Normalization   │          └───────────────┬───────────────┘  │
│  └────────────┬────────────┘                          │                  │
│               │ Silent Failover (if rate-limited)     ▼                  │
│               └──────────────────────▶┌───────────────────────────────┐  │
│                                       │  Adaptive Consultant Engine   │  │
│                                       │  • Contextual Slot Synthesis  │  │
│                                       │  • 7-Model Native Generators  │  │
│                                       └───────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────────┘
```

- **Data Model & State**:
  - **Interview Thread State**: Stores locked user goal, active expert domain, message history, confirmed slot-value pairs, and inferred facts, persisted to Firestore with local storage fallback.
  - **Intelligence Analysis State**: Tracks `inferredFacts`, `confirmedFacts`, `activeSignals` (`vagueness_detected`, `contradiction_detected`, `unrealistic_expectation`, `knowledge_gap`), `readinessScore` (0–100), and `questionNumber`.
  - **Evaluation Rubric State**: Computes weighted 0–10 scores (`tabular-nums`), extracted textual evidence snippets, actionable weaknesses, and free-tier compliance audits.
- **Interactive Component & State Mapping**:
  - **User Message Submission**: Validates non-empty input, locks expert domain on first goal, normalizes slot tags across hyphens/underscores, and streams the next consultant response.
  - **Clarification ("Why Ask?") Flow**: Detects meta-questions without incrementing the question counter, explains the strategic purpose of the current slot, and re-prompts with concrete examples.
  - **Silent Stream Failover**: Inspects initial stream chunks from `gemini-3.5-flash-lite`; if an upstream quota or transient error chunk occurs, seamlessly transitions to the context-aware Adaptive Consultant Engine stream without emitting stderr alerts or breaking client state.
  - **Quality Certificate & Model Switcher**: Evaluates generated prompts against the enhanced domain-aware rubric, caps self-reported scores at the evidence-verified ceiling, and renders dimension breakdowns with tabular numerals.
