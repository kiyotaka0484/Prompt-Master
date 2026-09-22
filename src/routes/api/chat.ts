import {
  getModel,
  getProviderErrorMessage,
  isAIProviderError,
  sanitizeAIErrorMessage,
  validateApiKey,
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
};

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

        const { messages, expert } = body;
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

        // Validate API key before proceeding
        const keyValidation = validateApiKey();
        if (!keyValidation.valid && keyValidation.error) {
          return new Response(getProviderErrorMessage(keyValidation.error), {
            status: 503,
          });
        }

        try {
          const model = getModel();
          const result = streamText({
            model,
            system: systemPrompt,
            messages: await convertToModelMessages(modelMessages),
          });

          return result.toUIMessageStreamResponse({
            originalMessages: messages as UIMessage[],
            onError({ error }) {
              console.error("[api/chat stream error]", error);
              return sanitizeAIErrorMessage(error);
            },
          });
        } catch (err) {
          console.error("[api/chat execution error]", err);
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
