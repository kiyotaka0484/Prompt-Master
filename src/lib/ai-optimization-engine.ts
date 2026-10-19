/**
 * AI Optimization Engine
 *
 * Provides model-specific prompt architectures, optimization rationale,
 * and execution recommendations across 7 leading AI models:
 * ChatGPT, Claude, Gemini, Perplexity, Grok, Cursor, and Windsurf.
 */

export type ModelKey =
  | "chatgpt"
  | "claude"
  | "gemini"
  | "perplexity"
  | "grok"
  | "cursor"
  | "windsurf";

export interface MultiModelPrompts {
  chatgpt: string;
  claude: string;
  gemini: string;
  perplexity: string;
  grok: string;
  cursor: string;
  windsurf: string;
}

export interface ModelOptimizationProfile {
  key: ModelKey;
  name: string;
  developer: string;
  tagline: string;
  emoji: string;
  accent: string;
  tint: string;
  badgeBg: string;
  badgeBorder: string;
  badgeText: string;
  strengths: string[];
  whyItDiffers: string;
  recommendations: {
    bestEngine: string;
    idealTemperature: string;
    contextWindow: string;
    bestUseCase: string;
    proTip: string;
    fileTarget: string;
  };
}

export const MODEL_OPTIMIZATION_PROFILES: Record<
  ModelKey,
  ModelOptimizationProfile
> = {
  chatgpt: {
    key: "chatgpt",
    name: "ChatGPT",
    developer: "OpenAI",
    tagline: "Role-Based Framing & Markdown Delimiters",
    emoji: "🟢",
    accent: "text-emerald-400",
    tint: "border-emerald-500/40",
    badgeBg: "bg-emerald-500/10",
    badgeBorder: "border-emerald-500/30",
    badgeText: "text-emerald-400",
    strengths: [
      "Rigid constraint enforcement when delineated with Markdown headings",
      "Exceptional tabular output and structured step-by-step formatting",
      "System-level persona conditioning with role anchors",
      "Predictable instruction-following across multi-turn sessions",
    ],
    whyItDiffers:
      "ChatGPT models (such as GPT-4o and o3-mini) respond with maximum adherence to clear section delimiters (e.g. `# Objective`, `# Operational Rules`) and explicit role priming ('Act as a senior...'). Vague prose causes instruction drift, whereas markdown tables and numbered execution steps force deterministic adherence.",
    recommendations: {
      bestEngine: "GPT-4o or o3-mini (High Reasoning)",
      idealTemperature:
        "0.2 – 0.5 for precision; 0.7 for creative brainstorming",
      contextWindow: "128,000 Tokens",
      bestUseCase:
        "Structured deliverables, business planning, role-based advisory, and markdown tables",
      proTip:
        "Paste the role definition into Custom Instructions or as the opening paragraph of a new chat for optimal persistence.",
      fileTarget: "Chat input or Custom Instructions",
    },
  },

  claude: {
    key: "claude",
    name: "Claude",
    developer: "Anthropic",
    tagline: "XML Hierarchies & Extended Thought Reasoning",
    emoji: "🟠",
    accent: "text-orange-400",
    tint: "border-orange-500/40",
    badgeBg: "bg-orange-500/10",
    badgeBorder: "border-orange-500/30",
    badgeText: "text-orange-400",
    strengths: [
      "Deep semantic comprehension of hierarchical XML tags (<context>, <task>, <rules>)",
      "Unmatched natural prose quality, intellectual honesty, and nuanced tone",
      "Multi-step self-reflection through scratchpad (<thinking>) pre-fills",
      "Low refusal rates when provided with clear ethical boundaries",
    ],
    whyItDiffers:
      "Claude's architecture is uniquely tuned to parse nested XML tags. When instructions, background context, and constraints are wrapped in `<context>` and `<instructions>` tags, Claude isolates variables cleanly and avoids hallucinations. Asking Claude to 'think step-by-step inside `<thinking>` tags' activates its deepest reasoning chains.",
    recommendations: {
      bestEngine: "Claude 3.7 Sonnet (with Extended Thinking enabled)",
      idealTemperature: "0.3 – 0.5",
      contextWindow: "200,000 Tokens",
      bestUseCase:
        "Complex conceptual reasoning, long-form editorial synthesis, architectural design, and edge-case auditing",
      proTip:
        "Enable 'Extended Thinking' mode with a 4,000–8,000 token budget for flawless architectural solutions.",
      fileTarget: "Claude Chat or Project Knowledge prompt",
    },
  },

  gemini: {
    key: "gemini",
    name: "Gemini",
    developer: "Google",
    tagline: "High-Density Key-Value Specs & Massive Context Grounding",
    emoji: "🔷",
    accent: "text-sky-400",
    tint: "border-sky-500/40",
    badgeBg: "bg-sky-500/10",
    badgeBorder: "border-sky-500/30",
    badgeText: "text-sky-400",
    strengths: [
      "World-record 1M – 2M token context window for massive file or repo ingestion",
      "Dense, direct key-value prompt interpretation without preamble fatigue",
      "Native multimodal comprehension (text, diagrams, audio, code, sheets)",
      "Strict schema adherence for programmatic JSON/typed outputs",
    ],
    whyItDiffers:
      "Gemini is built for direct, high-density task execution. Conversational filler and rhetorical fluff degrade its precision. The Gemini prompt uses labeled sections (`Task:`, `Parameters:`, `Anti-Hallucination Guardrails:`, `Output Schema:`) so the model locks onto targets without wasteful token overhead.",
    recommendations: {
      bestEngine: "Gemini 2.5 Pro or Gemini 2.5 Flash",
      idealTemperature:
        "0.2 – 0.4 for deterministic facts; 0.6 for creative work",
      contextWindow: "1,000,000 – 2,000,000 Tokens",
      bestUseCase:
        "Massive document analysis, cross-file research synthesis, and zero-loss context retrieval",
      proTip:
        "Upload raw documentation, PDFs, or entire project trees directly into Google AI Studio alongside this prompt.",
      fileTarget: "Google AI Studio or Gemini Web UI",
    },
  },

  perplexity: {
    key: "perplexity",
    name: "Perplexity",
    developer: "Perplexity AI",
    tagline: "Search-Augmented Retrieval & Source Verification",
    emoji: "🌐",
    accent: "text-teal-400",
    tint: "border-teal-500/40",
    badgeBg: "bg-teal-500/10",
    badgeBorder: "border-teal-500/30",
    badgeText: "text-teal-400",
    strengths: [
      "Real-time live web indexing and academic citation verification",
      "Synthesis of multi-source internet consensus with timestamped anchors",
      "Automatic source filtering against stale or outdated information",
      "Comparative market intelligence and current competitive benchmarking",
    ],
    whyItDiffers:
      "Standard LLM prompts fail on Perplexity because they treat the AI as a static memory bank. Perplexity requires search-directive framing (`Search Intent:`, `Live Recency Mandate:`, `Source Filtering Criteria:`, `Citation Rules:`). This guides its internal search engine to query authoritative web domains and cross-examine live sources before generating the response.",
    recommendations: {
      bestEngine: "Perplexity Pro (Sonar Deep Research or Claude 3.7 Sonnet)",
      idealTemperature: "0.1 – 0.2 (Search-grounded)",
      contextWindow: "Live Web Augmented Search",
      bestUseCase:
        "Market research, competitor benchmarking, pricing verifications, current API docs, and citation-backed reports",
      proTip:
        "Switch Focus to 'Web' or 'Academic' and toggle 'Deep Research' for comprehensive multi-page citations.",
      fileTarget: "Perplexity Pro Search Box",
    },
  },

  grok: {
    key: "grok",
    name: "Grok",
    developer: "xAI",
    tagline: "First-Principles Rigor, Unfiltered Candor & Truth-Seeking",
    emoji: "⚡",
    accent: "text-zinc-200",
    tint: "border-zinc-500/40",
    badgeBg: "bg-zinc-500/10",
    badgeBorder: "border-zinc-500/30",
    badgeText: "text-zinc-200",
    strengths: [
      "Uncompromising first-principles reasoning without sycophantic corporate hedges",
      "Blunt stress-testing of assumptions, hidden flaws, and unit economics",
      "Direct access to real-time public sentiment and conversational pulse via X",
      "Mathematical and logical deduction uninhibited by generic safety disclaimers",
    ],
    whyItDiffers:
      "Most AI models pad answers with diplomatic disclaimers, polite corporate validation, and risk-averse fluff. Grok excels when liberated by explicit first-principles directives: instructing it to assume zero corporate sanitized filters, audit underlying premises ruthlessly, and deliver unvarnished strategic truth.",
    recommendations: {
      bestEngine: "Grok 3 (Think Mode)",
      idealTemperature: "0.4 – 0.7",
      contextWindow: "131,000 Tokens",
      bestUseCase:
        "Brutally honest product stress-testing, risk analysis, viral positioning, and debate verification",
      proTip:
        "Enable 'Think Mode' to see its raw step-by-step chain-of-thought before it delivers its verdict.",
      fileTarget: "Grok Chat / Grok 3 UI",
    },
  },

  cursor: {
    key: "cursor",
    name: "Cursor",
    developer: "Cursor / Anysphere",
    tagline: "Repo-Aware .cursorrules & Architectural Boundaries",
    emoji: "💻",
    accent: "text-cyan-400",
    tint: "border-cyan-500/40",
    badgeBg: "bg-cyan-500/10",
    badgeBorder: "border-cyan-500/30",
    badgeText: "text-cyan-400",
    strengths: [
      "Repository-level code intelligence with AST and symbol graph indexing",
      "Zero-placeholder directive enforcement (banishes `// TODO: implement later`)",
      "Strict TypeScript type safety and lint error prevention",
      "Atomic git diff generation optimized for multi-file workspace edits",
    ],
    whyItDiffers:
      "Cursor is not a chatbot; it is an AI pair programmer editing production codebases. Prompts formatted for chat produce conversational filler and truncated snippets that break files. The Cursor prompt is formatted as a formal `.cursorrules` specification: defining strict boundary rules, banned code smells, typed schemas, and diff protocols.",
    recommendations: {
      bestEngine: "Cursor Agent (Claude 3.7 Sonnet or Cursor Small)",
      idealTemperature: "0.1 – 0.2 (High Determinism)",
      contextWindow: "Full Workspace Repository Index",
      bestUseCase:
        "Production code implementation, refactoring, architectural compliance, and bug fixing",
      proTip:
        "Save this prompt directly into `.cursorrules` in your project root, or invoke in Cursor Composer (`Ctrl+I` / `Cmd+I`) using `@` to reference files.",
      fileTarget: ".cursorrules in project root, or Composer (Cmd+I)",
    },
  },

  windsurf: {
    key: "windsurf",
    name: "Windsurf",
    developer: "Codeium",
    tagline: "Cascade Agentic Protocols & Multi-Phase Action Loops",
    emoji: "🌊",
    accent: "text-blue-400",
    tint: "border-blue-500/40",
    badgeBg: "bg-blue-500/10",
    badgeBorder: "border-blue-500/30",
    badgeText: "text-blue-400",
    strengths: [
      "Autonomous multi-step execution via Cascade agentic tool flows",
      "Built-in terminal shell awareness for build, lint, and test validation",
      "Dynamic scratchpad reasoning with progressive state verification",
      "Sequential file write verification preventing broken partial states",
    ],
    whyItDiffers:
      "Windsurf's Cascade operates as an autonomous agent that inspects files, runs shell commands, and iterates based on compiler output. Static prompts lead to haphazard edits. The Windsurf prompt is structured as a Cascade Execution Protocol divided into sequential phases (Reconnaissance → Atomic Edits → Terminal Verification).",
    recommendations: {
      bestEngine: "Windsurf Cascade (Claude 3.7 Sonnet or Cascade Custom)",
      idealTemperature: "0.2",
      contextWindow: "Cascade Multi-Tool Workspace Context",
      bestUseCase:
        "Full-stack end-to-end feature builds, iterative debugging with terminal verification, and deep dependency audits",
      proTip:
        "Store this in `.windsurfrules` or paste into Cascade Chat. Let Cascade run the terminal verification commands autonomously.",
      fileTarget: ".windsurfrules in project root, or Cascade Chat",
    },
  },
};

export const ALL_MODELS: ModelOptimizationProfile[] = [
  MODEL_OPTIMIZATION_PROFILES.chatgpt,
  MODEL_OPTIMIZATION_PROFILES.claude,
  MODEL_OPTIMIZATION_PROFILES.gemini,
  MODEL_OPTIMIZATION_PROFILES.perplexity,
  MODEL_OPTIMIZATION_PROFILES.grok,
  MODEL_OPTIMIZATION_PROFILES.cursor,
  MODEL_OPTIMIZATION_PROFILES.windsurf,
];

/**
 * Ensures that all 7 AI models receive a dedicated, structurally optimized prompt.
 * If any model is missing from raw input, it synthesizes an architecturally native
 * prompt tailored to that model's strengths rather than duplicating generic content.
 */
export function ensureAllSevenModels(
  raw: Partial<MultiModelPrompts>,
  context?: OptimizationContext,
): MultiModelPrompts {
  // Find a base prompt to extract facts and constraints from
  const base =
    raw.chatgpt ||
    raw.claude ||
    raw.gemini ||
    raw.cursor ||
    raw.windsurf ||
    raw.perplexity ||
    raw.grok ||
    (context?.goal ? `Goal: ${context.goal}` : "Master strategic objective");

  // Extract core elements cleanly
  const cleanGoal =
    context?.goal ||
    extractSection(base, [
      /goal\s*:\s*([^\n]+)/i,
      /objective\s*:\s*([^\n]+)/i,
      /task\s*:\s*([^\n]+)/i,
    ]) ||
    "Execute high-impact strategic execution plan";

  const extractedFacts = Array.from(
    new Set([...(context?.facts ?? []), ...extractContextLines(base)]),
  );

  const resolveModel = (
    rawPrompt: string | undefined,
    generator: () => string,
  ): string => {
    // If missing or truncated / incomplete (under 200 chars), synthesize complete native prompt
    if (!rawPrompt || rawPrompt.trim().length < 200) {
      return generator();
    }
    // If prompt is present, ensure all structured interview facts are retained
    if (extractedFacts.length === 0) {
      return rawPrompt.trim();
    }
    const promptLower = rawPrompt.toLowerCase();
    const missingFacts = extractedFacts.filter((f) => {
      const key = f.toLowerCase().split(/[:-]/)[0].trim();
      return !promptLower.includes(key);
    });
    if (missingFacts.length === 0) {
      return rawPrompt.trim();
    }
    return `${rawPrompt.trim()}\n\n# CONFIRMED INTERVIEW REQUIREMENTS & CONTEXT\n${missingFacts.map((f) => `- ${f}`).join("\n")}`;
  };

  return {
    chatgpt: resolveModel(raw.chatgpt, () =>
      generateChatGPTNative(
        cleanGoal,
        extractedFacts,
        context?.expertDomain,
        context,
      ),
    ),
    claude: resolveModel(raw.claude, () =>
      generateClaudeNative(
        cleanGoal,
        extractedFacts,
        context?.expertDomain,
        context,
      ),
    ),
    gemini: resolveModel(raw.gemini, () =>
      generateGeminiNative(
        cleanGoal,
        extractedFacts,
        context?.expertDomain,
        context,
      ),
    ),
    perplexity: resolveModel(raw.perplexity, () =>
      generatePerplexityNative(
        cleanGoal,
        extractedFacts,
        context?.expertDomain,
        context,
      ),
    ),
    grok: resolveModel(raw.grok, () =>
      generateGrokNative(
        cleanGoal,
        extractedFacts,
        context?.expertDomain,
        context,
      ),
    ),
    cursor: resolveModel(raw.cursor, () =>
      generateCursorNative(
        cleanGoal,
        extractedFacts,
        context?.expertDomain,
        context,
      ),
    ),
    windsurf: resolveModel(raw.windsurf, () =>
      generateWindsurfNative(
        cleanGoal,
        extractedFacts,
        context?.expertDomain,
        context,
      ),
    ),
  };
}

/**
 * Convenience function to generate optimized prompts for all 7 AI models
 */
export function generateOptimizedPrompts(
  goal: string,
  facts: string[] = [],
  expertDomain?: string,
  context?: OptimizationContext,
): MultiModelPrompts {
  return ensureAllSevenModels(
    {},
    {
      ...context,
      goal,
      expertDomain: expertDomain ?? context?.expertDomain,
      facts,
    },
  );
}

// ----------------------------------------------------------------------------
// Model-Specific Native Format Generators
// ----------------------------------------------------------------------------

export interface OptimizationContext {
  goal?: string;
  expertDomain?: string;
  budget?: string;
  techStack?: string;
  integrations?: string;
  hosting?: string;
  audience?: string;
  userExperience?: "beginner" | "intermediate" | "advanced";
  facts?: string[];
}

function extractParameters(facts: string[], context?: OptimizationContext) {
  const combined = facts.join(" ").toLowerCase();
  const isZeroBudget =
    context?.budget?.includes("$0") ||
    context?.budget?.toLowerCase().includes("free") ||
    combined.includes("$0") ||
    combined.includes("zero budget") ||
    combined.includes("no budget") ||
    combined.includes("free tier") ||
    combined.includes("shoestring");

  const budgetStr =
    context?.budget ||
    (isZeroBudget
      ? "$0 Starting Budget (Zero-cost free-tier architecture; verify provider terms and quotas before deployment)"
      : facts.find((f) => f.toLowerCase().includes("budget")) ||
        "Lean Bootstrapped Budget");

  const isWebOrApp =
    (context?.expertDomain || "").toLowerCase().includes("web") ||
    (context?.expertDomain || "").toLowerCase().includes("app") ||
    combined.includes("website") ||
    combined.includes("web app") ||
    combined.includes("saas") ||
    combined.includes("portfolio") ||
    combined.includes("react");

  const stack =
    context?.techStack ||
    (combined.includes("next")
      ? "Next.js 15 (App Router), TypeScript, Tailwind CSS v4, Lucide React, TanStack Query, Drizzle ORM, Supabase/PostgreSQL"
      : isWebOrApp
        ? "Vite + React 19, TypeScript, Tailwind CSS v4, Lucide React, TanStack Query, Zod for validation, Supabase/Firebase free tier"
        : "Domain-specific modern execution stack");

  const integrations =
    context?.integrations ||
    (combined.includes("stripe")
      ? "Stripe Payments (Checkout Sessions & Webhook signatures with raw body parsing)"
      : combined.includes("auth")
        ? "Supabase Auth / Firebase Auth (Google OAuth & Email Magic Links; no paid SMS)"
        : isWebOrApp
          ? "Standard authenticated API endpoints with environment-variable-backed secrets"
          : "Domain-specific modern tools and resources");

  const hosting =
    context?.hosting ||
    (isWebOrApp
      ? isZeroBudget
        ? "Cloudflare Pages (unlimited bandwidth; 500 builds/mo) or Vercel Hobby [VERIFY: commercial eligibility and personal-use restrictions]"
        : "Vercel / Cloudflare Pages with automated git-push CI/CD deployment"
      : "Domain-specific publishing and distribution workflow");

  return { isZeroBudget, budgetStr, isWebOrApp, stack, integrations, hosting };
}

function generateChatGPTNative(
  goal: string,
  facts: string[],
  domain?: string,
  context?: OptimizationContext,
): string {
  const role = getDomainRole(domain);
  const { isZeroBudget, budgetStr, isWebOrApp, stack, integrations, hosting } =
    extractParameters(facts, context);

  return `# ROLE & IDENTITY
Act as an elite ${role}. You have world-class expertise in technical feasibility, software architecture, and production delivery.

# PRIMARY OBJECTIVE
${goal}

# CONTEXT & CONFIRMED REQUIREMENTS
${facts.length > 0 ? facts.map((f) => `- ${f}`).join("\n") : "- Execute based on verified operational requirements."}

# TECHNICAL FEASIBILITY & BUDGET CONSTRAINTS
- **Capital & Budget Limit**: ${budgetStr}
- **Free-Tier Limits & Quotas**:
  ${
    isZeroBudget
      ? `• Hosting: ${hosting}. Adhere strictly to serverless execution limits (10s execution timeout on hobby tiers).
  • Database & Storage: Supabase Free Tier (500MB PostgreSQL storage, 50,000 monthly active users for Auth; [VERIFY: 1-week pause policy on inactivity]) or Firebase Spark Free Plan (1GB Firestore stored, 50k reads/day; zero credit card required). For simple or single-user projects, prioritize client-side storage (IndexedDB / localStorage) to avoid backend costs.
  • Email/Messaging: Resend Free Tier (3,000 emails/mo, 100/day limit; [VERIFY: requires custom domain DNS verification]) or zero-cost mailto fallback. Never assume paid SMS or twilio integration.`
      : `• Respect operational budgets. Differentiate genuinely free services from trial services requiring credit cards.
  • Keep external API usage within free limits where available.`
  }
- **Realistic Zero-Cost Alternatives**:
  • Use email magic links or WebAuthn instead of paid SMS gateways.
  • Use client-side WebGPU / free Google Gemini API quotas (15 RPM free tier) instead of dedicated GPU clusters.
  • Distinguish essential Phase 1 MVP features from optional Phase 2 enhancements.
- **Environment Variables & Secrets Security**:
  • All private API keys must remain strictly server-side (never prefixed with public bundler prefixes like VITE_).
  • Include a documented \`.env.example\` with public vs secret classifications.

# EXACT TECHNOLOGY STACK & ARCHITECTURE
- **Frontend & UI**: ${stack}
- **State Management & Data Fetching**: TanStack Query (React Query) for server state caching and optimistic updates.
- **Validation**: Zod runtime schema validation on all user forms and incoming network payloads.
- **Icons & Styling**: Lucide React icons, Tailwind CSS v4 utility classes.
- **Integrations**: ${integrations}

# FUNCTIONAL REQUIREMENTS & USER JOURNEYS
- **FR-1 (Core Onboarding / Entry)**: Immediate value delivery within 10 seconds of landing.
- **FR-2 (Primary User Flow)**: Interactive workspace with instant feedback, live preview, and validation.
- **FR-3 (Data Persistence & Export)**: Reliable save/load mechanism with local fallback (localStorage/IndexedDB) when offline.
- **Edge Cases**: Empty input submission, offline network disconnection, rate-limit 429 throttling, and malformed server payloads.

# UX STATES & OPERATIONAL PROTOCOL
1. **Input Validation**: Real-time inline feedback via Zod schema parsing; disable submit buttons until inputs are valid.
2. **Loading States**: Layout-matched skeleton placeholders; spinners with descriptive progress text during async actions.
3. **Empty States**: High-contrast guidance cards with direct primary action button (no blank screens).
4. **Error Handling**: React Error Boundaries wrapping page roots, toast notifications for transient failures, and retry triggers.
5. **Accessibility & Responsive**: Full WCAG AA color contrast compliance, keyboard navigation, and mobile viewport adaptability (375px+).

# DELIVERABLES, DEFINITION OF DONE & ACCEPTANCE CRITERIA
- **Concrete Deliverables**: Complete production source code, \`.env.example\`, README with setup commands, and unit tests.
- **Definition of Done (DoD)**:
  1. Zero TypeScript errors (\`tsc --noEmit\` exits 0).
  2. Zero secrets exposed in browser client bundles.
  3. All user flows verified end-to-end with loading, empty, and error fallback states.
- **Testable Acceptance Criteria**:
  • GIVEN a new user enters valid inputs, WHEN they click submit, THEN the state transitions to loading and displays results within 1.5s.
  • GIVEN an empty or invalid form, WHEN submitted, THEN field-level validation errors highlight the exact issue without a network call.`;
}

function generateClaudeNative(
  goal: string,
  facts: string[],
  domain?: string,
  context?: OptimizationContext,
): string {
  const role = getDomainRole(domain);
  const { isZeroBudget, budgetStr, stack, integrations, hosting } =
    extractParameters(facts, context);

  return `<role>
You are an expert ${role} celebrated for intellectual rigor, technical feasibility, and nuanced architectural design.
</role>

<context>
The following verified facts, constraints, and operational context govern this initiative:
${facts.map((f) => `• ${f}`).join("\n") || "• Target production-grade excellence with realistic operational constraints."}
</context>

<goal>
${goal}
</goal>

<technical_feasibility>
- Budget Constraint: ${budgetStr}
- Free-Tier Guardrails & Limits:
  ${
    isZeroBudget
      ? `• Hosting: ${hosting} (Strict 10s serverless function timeout; bandwidth ceiling 100GB/mo; [VERIFY: commercial eligibility]).
  • Database: When persistence is required, consider Supabase free tier (500MB DB storage, 50k MAU Auth; [VERIFY: provider pause policy on inactive projects]). For simple client apps, omit backend database.
  • Never prescribe services requiring credit-card billing activation. Provide zero-cost realistic alternatives for expensive features (e.g. Email magic links instead of SMS; client-side/free API quotas instead of paid GPU clusters).`
      : `• Enforce strict cost ceilings. Separate essential Phase 1 MVP features from optional Phase 2 enhancements.`
  }
- Secrets Management: Isolate all private secrets to server environments; provide .env.example with public vs secret classification.
</technical_feasibility>

<technology_stack>
- Core Framework: ${stack}
- Data Validation: Zod schema parsing across all network and form boundaries.
- Component Architecture: Modular, single-responsibility components with clean separation between business logic, state stores, and UI view layers.
- Integrations: ${integrations}
</technology_stack>

<functional_specifications>
- Primary Pages & Routes: Landing/Welcome view, Core Interactive Workspace, Settings/Configuration drawer, and Saved Artifacts view.
- User Flows: Guided workflow with step-by-step progress, auto-save persistence, and instant export.
- State Handling:
  • Loading: Shimmer skeleton placeholders matching layout geometry.
  • Empty States: Clear instructional prompt with a primary call-to-action button.
  • Error States: Localized try/catch error boundaries with actionable toast alerts and retry buttons.
- Edge Cases: Network timeout, malformed payloads, rate-limit throttling (HTTP 429), and mobile screen breakpoints.
</functional_specifications>

<acceptance_criteria_and_dod>
- Definition of Done (DoD):
  1. Build succeeds with zero TypeScript errors or broken imports.
  2. All forms validate with Zod and provide instant feedback.
  3. Works smoothly across mobile (375px) and desktop viewports with WCAG AA compliance.
- Testable Acceptance Criteria:
  • Given valid input, when the user triggers the action, then state transitions from loading to success without page reload.
  • Given a failed API call, when an error occurs, then a user-friendly error message displays with an actionable retry button.
</acceptance_criteria_and_dod>

<instructions>
1. Begin your response by thinking through the architectural trade-offs, free-tier limits, and edge cases inside <thinking>...</thinking> tags.
2. Deliver a complete, unambiguous technical blueprint and implementation instructions with complete code and configurations.
3. Avoid vague advice such as "ensure security" or "make it modern" — provide exact libraries, configurations, and code structures.
</instructions>`;
}

function generateGeminiNative(
  goal: string,
  facts: string[],
  domain?: string,
  context?: OptimizationContext,
): string {
  const role = getDomainRole(domain);
  const { isZeroBudget, budgetStr, stack, integrations, hosting } =
    extractParameters(facts, context);

  return `Task: Architect and deliver an end-to-end execution specification for: ${goal}
Expert Specialty: ${role}

Context Parameters:
${facts.map((f) => `  * ${f}`).join("\n") || "  * Production-grade standards; zero conversational fluff."}

Technical Feasibility & Free-Tier Guardrails:
  - Budget Limit: ${budgetStr}
  - Service Tiers: ${isZeroBudget ? "Zero-cost architecture using verified free-tier allowances (e.g. Cloudflare Pages, Supabase Free Tier, Resend Free Tier, Gemini API standard free tier). Note: verify provider terms for commercial projects." : "Respect defined budget boundaries."}
  - Quotas to Monitor: Storage limits (500MB DB), bandwidth limits (100GB/mo), rate limits (15 RPM for free AI models; [VERIFY: provider quota limits before deployment]).
  - Zero-Cost Fallbacks: Magic links instead of paid SMS; client-side processing where possible; essential Phase 1 MVP separated from optional Phase 2.
  - Secret Key Hygiene: Server-side proxy routing for all private API keys; zero secret leakage in client bundle.

Exact Stack & Tooling:
  - Frontend: ${stack}
  - Data Validation: Zod schemas on all input interfaces
  - Data Persistence & Auth: ${integrations}
  - Hosting & Deployment: ${hosting}

Data Models & Schemas:
  - UserProfile: { id: string, email: string, preferences: Record<string, unknown>, createdAt: timestamp }
  - ProjectArtifact: { id: string, userId: string, title: string, content: string, status: 'draft'|'active'|'archived', updatedAt: timestamp }

Execution Directives:
1. High-Density Synthesis: Provide direct, high-signal instructions with complete working code.
2. State Handling: Mandate layout-matched loading skeletons, empty state callouts, and localized error boundaries.
3. Anti-Hallucination Guardrails: Every tool, framework, library, and metric must exist, be actively maintained, and be compatible with stated zero-cost/budget constraints.

Definition of Done & Verification Schema:
  - [PASS/FAIL] TypeScript compilation passes cleanly (\`tsc --noEmit\`).
  - [PASS/FAIL] All environment variables documented in \`.env.example\` with public/secret tags.
  - [PASS/FAIL] Input validation, loading skeletons, empty states, and error toasts verified.
  - [PASS/FAIL] Responsive mobile layout (375px+) and WCAG AA contrast verified.`;
}

function generatePerplexityNative(
  goal: string,
  facts: string[],
  domain?: string,
  context?: OptimizationContext,
): string {
  const { isZeroBudget, budgetStr, stack, integrations, hosting } =
    extractParameters(facts, context);

  return `[SEARCH & VERIFICATION DIRECTIVES]
Search Intent: Conduct an authoritative, source-verified investigation and strategic blueprint for: "${goal}"

Investigation Scope & Domain Facts:
${facts.map((f) => `  • Target parameter: ${f}`).join("\n") || "  • Contemporary industry benchmark standards (Current Year)"}

Search & Recency Rules:
1. Ground all recommendations in verified, recent documentation and official release notes.
2. In-Line Source Attribution: Support all tooling trade-offs, pricing models, free-tier quotas, and compliance standards with citations.
3. Free-Tier & Pricing Landscape Audit:
   • Validate whether recommended services (e.g. ${hosting}, ${integrations}) offer genuinely free tiers vs free trials requiring credit-card billing activation.
   • Audit known free-tier limits: storage limits, bandwidth limits, serverless cold starts, and rate limits.
   • Explicitly note: [VERIFY: provider pricing/quota limits] for any unconfirmed metrics.

Tooling & Integration Trade-Offs Matrix:
- Provide a comparative markdown table: [Tool/Platform, Free Tier Allowance, Hard Quota Limits, Hidden Costs/Billing Gotchas, Recommended Use Case].
- Contrast primary stack (${stack}) against lean alternatives.

Structured Report Format:
- **Verified Industry Landscape**: Consensus best practices and production benchmarks.
- **Free-Tier Feasibility Matrix**: Verified zero-cost boundaries and realistic fallbacks.
- **Step-by-Step Implementation Roadmap**: Phased execution plan separating Phase 1 MVP from Phase 2 enhancements.
- **Critical Failure Modes & Rate Limits**: Known pitfalls verified by active developer community reports.`;
}

function generateGrokNative(
  goal: string,
  facts: string[],
  domain?: string,
  context?: OptimizationContext,
): string {
  const role = getDomainRole(domain);
  const { isZeroBudget, budgetStr, stack } = extractParameters(facts, context);

  return `[FIRST-PRINCIPLES STRATEGIC DIRECTIVE — ZERO CORPORATE FLUFF]
You are Grok acting as a battle-tested ${role}. Strip away all sanitized corporate boilerplate, polite platitudes, and marketing jargon.

The Objective:
"${goal}"

The Reality & Ground Truth Constraints:
${facts.map((f) => `  - ${f}`).join("\n") || "  - Start from scratch; optimize for speed, ruthless leverage, and true market viability."}
  - Stated Budget: ${budgetStr}

First-Principles Feasibility Analysis:
1. Deconstruct the Premise & Budget Math:
   • ${isZeroBudget ? "The budget is literally $0. Strip away every paid SaaS subscription, managed cluster, and expensive API. Use verified zero-cost tiers (Cloudflare Pages, Supabase free tier; [VERIFY: provider quota limits and terms]) that require zero credit card to launch." : "Enforce ruthless capital efficiency; eliminate vanity tools [VERIFY: provider pricing limits]."}
   • Overengineering Audit: If anyone suggests Kubernetes, Kafka, or microservices for this MVP, reject it immediately. A unified modern stack is 10x faster to build and maintain.
2. The Brutal Truth on Failure Modes:
   • What is the #1 reason similar builds fail? (Over-scoped features, unvalidated assumptions, broken state handling, leaking API keys).
3. Exact Minimalist Tech Stack:
   • Recommended: ${stack}. No bloatware.

Tactical Punch List:
- **Day 1 (Foundation)**: Scaffold workspace, configure TypeScript & Tailwind CSS, verify .env.example, deploy live 'Hello World' URL.
- **Day 7 (Core User Loop)**: Wire up primary feature flow, Zod input validation, loading skeletons, and persistent storage.
- **Day 30 (Production Polish)**: Full error boundary resilience, mobile viewport polish, automated test suite, and launch announcement.

Zero-BS Definition of Done:
- Compiles cleanly with zero errors.
- Real users can complete the core journey without crashing or seeing blank screens.
- Completely functional within the stated ${budgetStr} constraint.`;
}

function generateCursorNative(
  goal: string,
  facts: string[],
  domain?: string,
  context?: OptimizationContext,
): string {
  const { isZeroBudget, budgetStr, stack, integrations, hosting } =
    extractParameters(facts, context);

  return `// CURSOR AI SYSTEM DIRECTIVES & ARCHITECTURAL RULES
// Target Project: ${goal}
// Primary Domain: ${domain || "Full-Stack Software Architecture & Implementation"}

## CONTEXT & CONFIRMED REQUIREMENTS
${facts.length > 0 ? facts.map((f) => `// - ${f}`).join("\n") : "// - High-standard production architecture"}

## ARCHITECTURAL BOUNDARIES & TECH STACK
// - Stack: ${stack}
// - Integrations: ${integrations}
// - Target Environment: ${hosting}
// - Budget Constraint: ${budgetStr}

## TECHNICAL FEASIBILITY & FREE-TIER LIMITS
// 1. Zero-Cost Enforcement: ${isZeroBudget ? "Rely strictly on verified free tiers (e.g. Supabase 500MB DB cap, Vercel Hobby 100GB/mo; [VERIFY: commercial use restrictions]). Avoid unneeded external services or paid dependencies." : "Respect stated project budget."}
// 2. Secret Protection: Never prefix private secrets with public frontend environment variables (e.g. VITE_ or NEXT_PUBLIC_). Route external API calls through server-side proxy handlers.
// 3. Fallbacks: Provide zero-cost fallbacks for resource-intensive features (e.g. email magic links instead of SMS; client-side search instead of paid clusters).

## STRICT DEVELOPMENT CONVENTIONS (.cursorrules)
1. Code Quality & Strict Typing:
   - Enforce strict TypeScript types. Never use 'any'. Explicitly declare interface contracts.
   - Separate business logic, state stores, and UI view layers into dedicated modular files (under 250 lines per module).
2. Zero Placeholder Mandate:
   - Never output truncated code, '// TODO: implement later', or simulated mock stubs.
   - Always output fully implemented, syntactically complete functions and components.
3. UI State Handling Requirements:
   - Input Validation: Implement Zod schema parsing for all user input forms with field-level error messages.
   - Loading States: Provide layout-matching skeleton components and disabled buttons with spinners during async execution.
   - Empty States: Implement dedicated empty-state cards with helpful guidance and a call-to-action button.
   - Error Handling: Wrap async handlers in try/catch blocks; show user-facing toast alerts and retry buttons.
4. Responsive & Accessibility:
   - Design mobile-first (375px min width); enforce WCAG AA contrast compliance and keyboard navigation.

## ENVIRONMENT VARIABLES & SECRETS (.env.example)
// PUBLIC VARIABLES (safe in client bundle):
// VITE_APP_NAME="Prompt Master"
// SECRET VARIABLES (server-side only, NEVER expose to client):
// DATABASE_URL="postgresql://..." // [VERIFY: provider quota limits]
// API_SECRET_KEY="sk_live_..."

## IMPLEMENTATION & VERIFICATION PLAN
1. Phase 1: Scaffold type interfaces, shared utilities, and Zod schemas.
2. Phase 2: Implement storage/API service layer with robust error resilience.
3. Phase 3: Construct atomic UI components with loading skeletons and empty states.
4. Phase 4: Run 'npm run build' and test suites to verify zero compilation errors.`;
}

function generateWindsurfNative(
  goal: string,
  facts: string[],
  domain?: string,
  context?: OptimizationContext,
): string {
  const { isZeroBudget, budgetStr, stack, integrations, hosting } =
    extractParameters(facts, context);

  return `[WINDSURF CASCADE AGENT EXECUTION PROTOCOL]
Target Objective: "${goal}"
Specialty Domain: ${domain || "Production System Engineering & Workflow Orchestration"}

Verified Constraints & Budget Guardrails:
  - Budget Limit: ${budgetStr}
  - Architecture: ${stack}
  - Integrations: ${integrations}
  - Deployment Target: ${hosting}
  ${facts.map((f) => `- [FACT] ${f}`).join("\n")}

--- CASCADE WORKFLOW PHASES ---

PHASE 1: RECONNAISSANCE, FREE-TIER & DEPENDENCY AUDIT
- Inspect existing workspace files, package manifests, and configuration files before modifying code.
- Audit free-tier limits: verify that required integrations (${integrations}) fit within free allowances (${isZeroBudget ? "verify provider quotas; [VERIFY: provider quota limits and terms]" : "budget compliant; [VERIFY: provider pricing limits]"}).
- Validate environment variables: inspect .env.example to ensure private keys are isolated from public client bundles.
- Formulate a deterministic checklist of files to create, edit, or refactor.

PHASE 2: ATOMIC STEP-BY-STEP IMPLEMENTATION
- Apply modifications sequentially. Each file write must be complete and self-contained (zero placeholder '// TODO' comments).
- Implement mandatory state handling across all interactive features:
  • Input validation with Zod schemas.
  • Layout-matched loading skeletons.
  • Informative empty states with actionable buttons.
  • Localized error boundaries and toast notifications.
- Separate essential Phase 1 MVP features from optional Phase 2 enhancements.

PHASE 3: TERMINAL & TEST VERIFICATION
- Run compilation checks ('npm run build' or equivalent) to confirm zero syntax or type errors.
- Execute automated tests to verify critical user journeys and API error recovery.
- Verify responsive layout on mobile (375px+) and desktop viewports.
- Automatically self-heal any reported compilation or lint errors before concluding.

DEFINITION OF DONE & OPERATIONAL SAFETY:
- All features verified functional with validation, loading, empty, and error states.
- Zero secret leakage in client bundle.
- Complete compatibility with stated ${budgetStr}.`;
}

// ----------------------------------------------------------------------------
// Helper Utilities
// ----------------------------------------------------------------------------

function getDomainRole(domain?: string): string {
  const d = (domain || "").toLowerCase();
  if (d.includes("business") || d.includes("saas") || d.includes("startup")) {
    return "Principal Startup Architect & Venture Strategist";
  }
  if (d.includes("website") || d.includes("web") || d.includes("developer")) {
    return "Lead Full-Stack Solutions Architect";
  }
  if (d.includes("creator") || d.includes("youtube") || d.includes("media")) {
    return "Executive Media Strategist & Audience Growth Director";
  }
  if (d.includes("study") || d.includes("learning") || d.includes("exam")) {
    return "Master Learning Scientist & Curriculum Engineer";
  }
  return "Chief Strategy Consultant & Systems Architect";
}

function extractSection(text: string, regexes: RegExp[]): string | null {
  for (const re of regexes) {
    const m = re.exec(text);
    if (m && m[1] && m[1].trim().length > 3) {
      return m[1].trim();
    }
  }
  return null;
}

function extractContextLines(text: string): string[] {
  const lines = text.split("\n");
  const facts: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (
      (trimmed.startsWith("-") ||
        trimmed.startsWith("•") ||
        trimmed.startsWith("*")) &&
      trimmed.length > 8 &&
      !trimmed.includes("DELIVERABLE") &&
      !trimmed.includes("DELIMITER")
    ) {
      facts.push(trimmed.replace(/^[-•*]\s*/, ""));
    } else if (
      (trimmed.toLowerCase().startsWith("budget:") ||
        trimmed.toLowerCase().startsWith("audience:") ||
        trimmed.toLowerCase().startsWith("stack:") ||
        trimmed.toLowerCase().startsWith("timeline:") ||
        trimmed.toLowerCase().startsWith("market:")) &&
      trimmed.length > 10
    ) {
      facts.push(trimmed);
    }
  }

  return facts.slice(0, 6);
}
