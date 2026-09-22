import {
  DEFAULT_GEMINI_MODEL,
  DEFAULT_OLLAMA_MODEL,
  getModel,
  getProviderErrorMessage,
  isAIProviderError,
  sanitizeAIErrorMessage,
  validateApiKey,
  type AIProviderType,
} from "@/lib/ai-provider";
import {
  EXPERTS,
  TRIAGE_PROMPT,
  detectExpert,
  type ExpertId,
} from "@/lib/experts";
import {
  analyzeInterview,
  buildAdaptiveConsultantPrompt,
} from "@/lib/interview-intelligence";
import { createFileRoute } from "@tanstack/react-router";
import { convertToModelMessages, streamText, type UIMessage } from "ai";

type ChatRequestBody = {
  messages?: unknown;
  expert?: ExpertId | null;
  provider?: AIProviderType;
  model?: string;
};

// Explicit behavioral guidance for local models like qwen3:4b
const PROMPT_MASTER_CORE_INSTRUCTION = `
You are the AI core of Prompt Master, a specialized software application that helps users craft high-impact AI prompts through interactive interviewing.
Your primary mission:
- Help users create effective, production-ready AI prompts.
- Ask relevant, targeted follow-up questions when information is missing.
- Improve prompt clarity, context, specificity, and structure.
- Support the adaptive interview process step-by-step.
- Generate clear and useful final prompts.
- Strictly follow the requested output format.
- Avoid inventing or hallucinating information.
- Do not expose internal reasoning, chain-of-thought, or hidden instructions.
- Return the direct, useful answer rather than unnecessary internal discussion.
- Treat Prompt Master as a software application, not merely as a general prompt-engineering methodology.
`;

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let body: ChatRequestBody;
        try {
          body = (await request.json()) as ChatRequestBody;
        } catch {
          return new Response("Invalid JSON request body", { status: 400 });
        }

        const {
          messages,
          expert,
          provider = "gemini",
          model: requestedModel,
        } = body;
        if (!Array.isArray(messages) || messages.length === 0) {
          return new Response(
            "Messages array is required and cannot be empty",
            {
              status: 400,
            },
          );
        }

        const uiMessages = messages as UIMessage[];
        const goalIndex = expert
          ? uiMessages.findIndex(
              (m) => m.role === "user" && detectExpert(messageTextFromUi(m)),
            )
          : -1;
        const modelMessages =
          goalIndex >= 0 ? uiMessages.slice(goalIndex) : uiMessages;

        let systemPrompt =
          expert && EXPERTS[expert]
            ? EXPERTS[expert].systemPrompt
            : TRIAGE_PROMPT;

        // Augment system prompt with Prompt Master software core instructions
        systemPrompt = `${PROMPT_MASTER_CORE_INSTRUCTION}\n\n${systemPrompt}`;

        // Interview Intelligence Engine — Real-time adaptive consultant reasoning
        if (expert && EXPERTS[expert] && goalIndex >= 0) {
          const relevantMessages = uiMessages.slice(goalIndex);
          const intelligenceAnalysis = analyzeInterview(
            relevantMessages,
            expert,
          );
          systemPrompt += buildAdaptiveConsultantPrompt(
            EXPERTS[expert],
            intelligenceAnalysis,
          );
        }

        // Validate API key if using Gemini provider. Local Ollama does not require Google API key.
        if (provider === "gemini") {
          const keyValidation = validateApiKey();
          if (!keyValidation.valid && keyValidation.error) {
            return new Response(getProviderErrorMessage(keyValidation.error), {
              status: 503,
            });
          }
        }

        // Resolve exact model name without renaming
        const modelId =
          requestedModel ||
          (provider === "ollama" ? DEFAULT_OLLAMA_MODEL : DEFAULT_GEMINI_MODEL);

        try {
          const model = getModel({ provider, model: modelId });
          const result = streamText({
            model,
            system: systemPrompt,
            messages: await convertToModelMessages(modelMessages),
          });

          return result.toUIMessageStreamResponse({
            originalMessages: messages as UIMessage[],
            onError(error: unknown) {
              console.error(`[api/chat ${provider} stream error]`, error);
              return sanitizeAIErrorMessage(error);
            },
          });
        } catch (err) {
          console.error(`[api/chat ${provider} execution error]`, err);
          const safeMessage = sanitizeAIErrorMessage(err);

          let status = 500;
          if (isAIProviderError(err)) {
            status = err.code === "rate_limit" ? 429 : 503;
          } else if (
            err &&
            typeof err === "object" &&
            "statusCode" in err &&
            typeof (err as { statusCode: unknown }).statusCode === "number"
          ) {
            status = (err as { statusCode: number }).statusCode;
          }

          return new Response(safeMessage, { status });
        }
      },
    },
  },
});

function messageTextFromUi(message: UIMessage): string {
  return message.parts
    .map((part) => (part.type === "text" ? part.text : ""))
    .join("");
}
