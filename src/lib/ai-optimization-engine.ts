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
  context?: { goal?: string; expertDomain?: string },
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

  const extractedFacts = extractContextLines(base);

  return {
    chatgpt:
      raw.chatgpt && raw.chatgpt.length > 50
        ? raw.chatgpt
        : generateChatGPTNative(
            cleanGoal,
            extractedFacts,
            context?.expertDomain,
          ),

    claude:
      raw.claude && raw.claude.length > 50
        ? raw.claude
        : generateClaudeNative(
            cleanGoal,
            extractedFacts,
            context?.expertDomain,
          ),

    gemini:
      raw.gemini && raw.gemini.length > 50
        ? raw.gemini
        : generateGeminiNative(
            cleanGoal,
            extractedFacts,
            context?.expertDomain,
          ),

    perplexity:
      raw.perplexity && raw.perplexity.length > 50
        ? raw.perplexity
        : generatePerplexityNative(
            cleanGoal,
            extractedFacts,
            context?.expertDomain,
          ),

    grok:
      raw.grok && raw.grok.length > 50
        ? raw.grok
        : generateGrokNative(cleanGoal, extractedFacts, context?.expertDomain),

    cursor:
      raw.cursor && raw.cursor.length > 50
        ? raw.cursor
        : generateCursorNative(
            cleanGoal,
            extractedFacts,
            context?.expertDomain,
          ),

    windsurf:
      raw.windsurf && raw.windsurf.length > 50
        ? raw.windsurf
        : generateWindsurfNative(
            cleanGoal,
            extractedFacts,
            context?.expertDomain,
          ),
  };
}

// ----------------------------------------------------------------------------
// Model-Specific Native Format Generators
// ----------------------------------------------------------------------------

function generateChatGPTNative(
  goal: string,
  facts: string[],
  domain?: string,
): string {
  const role = getDomainRole(domain);
  return `# ROLE & IDENTITY
Act as an elite ${role}. You have world-class expertise in strategic execution, high-yield architectures, and operational excellence.

# PRIMARY OBJECTIVE
${goal}

# CORE CONSTRAINTS & PROJECT PARAMETERS
${facts.map((f) => `- ${f}`).join("\n") || "- Apply maximum industry best practices and strict feasibility filters."}

# OPERATIONAL PROTOCOL
1. Analyze the objective through the lens of first-principles viability and market readiness.
2. Formulate a cohesive, non-generic execution blueprint with measurable milestones.
3. Detail exact tools, frameworks, and resource allocations required.
4. Highlight common points of failure and provide preemptive counter-measures.

# REQUIRED DELIVERABLE FORMAT
Structure your response cleanly using Markdown:
- **Executive Summary**: 2-3 sentences framing the core leverage point.
- **Strategic Architecture Matrix**: A Markdown table with columns [Phase, Key Milestones, Primary Deliverable, Verification Metric].
- **Deep-Dive Action Plan**: Numbered, exhaustive operational instructions.
- **Risk Mitigation Guardrails**: Bulleted checklist of strict non-negotiables.`;
}

function generateClaudeNative(
  goal: string,
  facts: string[],
  domain?: string,
): string {
  const role = getDomainRole(domain);
  return `<role>
You are an expert ${role} celebrated for intellectual rigor, nuanced strategic analysis, and clear architectural vision.
</role>

<context>
The following verified facts, constraints, and environmental context govern this initiative:
${facts.map((f) => `• ${f}`).join("\n") || "• Target production-grade excellence with realistic operational constraints."}
</context>

<goal>
${goal}
</goal>

<instructions>
1. Begin your response by thinking through the strategic implications, trade-offs, and edge cases inside <thinking>...</thinking> tags.
2. Formulate a comprehensive, beautifully reasoned action strategy that directly addresses the nuances outlined in <context>.
3. Favor depth over superficial bullet points. Articulate the underlying rationale behind every recommendation so I understand why this path was chosen over alternatives.
4. Weave practical guardrails throughout: call out subtle pitfalls, resource bottlenecks, and non-obvious leverage opportunities.
</instructions>

<output_requirements>
- Natural, sophisticated prose organized by clear semantic headings.
- Explicit step-by-step reasoning that connects user constraints directly to concrete outcomes.
- No patronizing preambles; begin immediately with your structured thinking and executive analysis.
</output_requirements>`;
}

function generateGeminiNative(
  goal: string,
  facts: string[],
  domain?: string,
): string {
  const role = getDomainRole(domain);
  return `Task: Architect and deliver an end-to-end execution specification for: ${goal}
Expert Specialty: ${role}

Context Parameters:
${facts.map((f) => `  * ${f}`).join("\n") || "  * Production-grade standards; zero conversational fluff."}

Execution Directives:
1. High-Density Synthesis: Provide direct, high-signal instructions with zero filler tokens.
2. Multi-Tier Blueprint:
   - Tier 1: Core System Architecture & Foundational Setup
   - Tier 2: Implementation Sequencing & Technical/Operational Workflows
   - Tier 3: Quality Gates & Automated Validation
3. Anti-Hallucination Guardrails: Every tool, framework, library, or metric mentioned must exist, be actively maintained, and be appropriate for the specified scale.

Output Schema:
- [SPECIFICATION]: High-level operational schema
- [ACTION MATRIX]: Sequential task breakdown with inputs, processes, and outputs
- [VERIFICATION CHECKLIST]: Binary pass/fail criteria for completion`;
}

function generatePerplexityNative(
  goal: string,
  facts: string[],
  domain?: string,
): string {
  return `[SEARCH & VERIFICATION DIRECTIVES]
Search Intent: Conduct an authoritative, source-verified investigation and strategic blueprint for: "${goal}"

Investigation Scope & Domain Facts:
${facts.map((f) => `  • Target parameter: ${f}`).join("\n") || "  • Contemporary industry benchmark standards (Current Year)"}

Search & Recency Rules:
1. Ground all recommendations in verified, recent data. Prioritize official documentation, industry benchmarks, and active market data over speculative commentary.
2. In-Line Source Attribution: Support all market estimates, tooling benchmarks, pricing, and compliance standards with citations.
3. Compare Top Industry Alternatives: Identify the leading 3 proven pathways or tools for this objective, outlining concrete trade-offs, pricing models, and real-world adoption trends.

Structured Report Format:
- **Verified Industry Landscape**: Current consensus, best practices, and verified benchmarks.
- **Comparative Analysis Table**: Tooling/Strategy, Strengths, Limitations, Cost/Pricing Structure, Citations.
- **Recommended Implementation Roadmap**: Step-by-step roadmap grounded in verified case studies.
- **Critical Risk Factors**: Known pitfalls verified by community experiences or recent updates.`;
}

function generateGrokNative(
  goal: string,
  facts: string[],
  domain?: string,
): string {
  const role = getDomainRole(domain);
  return `[FIRST-PRINCIPLES STRATEGIC DIRECTIVE — ZERO CORPORATE FLUFF]
You are Grok acting as a battle-tested ${role}. Strip away all sanitized corporate boilerplate, polite platitudes, and marketing jargon.

The Objective:
"${goal}"

The Reality & Constraints on the Ground:
${facts.map((f) => `  - ${f}`).join("\n") || "  - Start from scratch; optimize for speed, ruthless leverage, and true market viability."}

First-Principles Analysis Directives:
1. Deconstruct the Premise: What is the fundamental physics or economic math behind making this goal work? Call out any flawed assumptions, wishful thinking, or vanity metrics immediately.
2. The Brutal Truth: What is the single biggest reason similar attempts fail, and what is the non-consensus truth that actually moves the needle?
3. Unfair Leverage: How can we leverage modern automation, distribution asymmetry, and lean mechanics to achieve this with 10x less wasted effort?
4. Decisive Action Script: Provide an unfiltered, numbered punch list of what needs to happen on Day 1, Day 7, and Day 30. Be direct, witty, and uncompromisingly practical.`;
}

function generateCursorNative(
  goal: string,
  facts: string[],
  domain?: string,
): string {
  return `// CURSOR AI SYSTEM DIRECTIVES & ARCHITECTURAL RULES
// Target Project: ${goal}
// Primary Domain: ${domain || "Full-Stack Software Architecture & Implementation"}

## ARCHITECTURAL BOUNDARIES & TECH STACK
${facts.map((f) => `// - ${f}`).join("\n") || "// - Modern TypeScript, Vite/React, Tailwind CSS, Modular Components"}

## STRICT DEVELOPMENT CONVENTIONS (.cursorrules)
1. Code Quality & Typing:
   - Enforce strict TypeScript types. Never use 'any'. Explicitly declare interface contracts.
   - Separate business logic, state stores, and UI view layers into dedicated modular files.
2. Zero Placeholder Mandate:
   - Never output truncated code, '// TODO: implement remaining logic', or simulated mock stubs.
   - Always output fully implemented, syntactically complete functions and components.
3. File & Module Structure:
   - Target files must adhere to single-responsibility principles (under 250 lines per module).
   - Ensure clean import paths, relative imports, and zero circular dependencies.
4. Error Handling & Verification:
   - Wrap asynchronous promises in robust try/catch blocks with user-facing error feedback.
   - Ensure all UI buttons, inputs, and controls have fully wired, responsive event handlers.

## IMPLEMENTATION PLAN
1. Scaffold core type interfaces and shared utilities.
2. Implement backend/state services with complete error resilience.
3. Construct atomic UI components with Tailwind utility styling and accessibility attributes.
4. Verify build compilation and lint checks before finalizing edits.`;
}

function generateWindsurfNative(
  goal: string,
  facts: string[],
  domain?: string,
): string {
  return `[WINDSURF CASCADE AGENT EXECUTION PROTOCOL]
Target Objective: "${goal}"
Specialty Domain: ${domain || "Production System Engineering & Workflow Orchestration"}

Verified Constraints & Environment:
${facts.map((f) => `  - [FACT] ${f}`).join("\n") || "  - [FACT] Clean environment with automated verification requirements"}

--- CASCADE WORKFLOW PHASES ---

PHASE 1: RECONNAISSANCE & DEPENDENCY AUDIT
- Inspect existing workspace files, configuration manifests, and package dependencies before modifying anything.
- Identify all touchpoints, interfaces, and potential breaking changes.
- Formulate a deterministic checklist of files to create, edit, or refactor.

PHASE 2: ATOMIC STEP-BY-STEP IMPLEMENTATION
- Apply modifications sequentially. Each file write must be complete and self-contained.
- Follow strict modular separation: types in dedicated files, services isolated from UI components.
- Zero mock placeholders: every function must execute actual business logic.

PHASE 3: TERMINAL & TOOL VERIFICATION
- Run compilation checks ('npm run build' or equivalent lint command) to confirm zero syntax errors.
- Inspect terminal logs for missing packages, type mismatches, or runtime warnings.
- Automatically self-heal any reported compilation errors before concluding the session.

OPERATIONAL SAFETY RULES:
- Never overwrite working configurations without verifying existing keys.
- Preserve backward compatibility with existing user state and database schemas.`;
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
