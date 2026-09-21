import {
  AIProviderError,
  getModel,
  getProviderErrorMessage,
  isAIProviderError,
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
        const { messages, expert } = (await request.json()) as ChatRequestBody;
        if (!Array.isArray(messages)) {
          return new Response("Messages are required", { status: 400 });
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
            status: 500,
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
          });
        } catch (err) {
          // Handle provider-specific errors
          if (isAIProviderError(err)) {
            return new Response(getProviderErrorMessage(err), { status: 500 });
          }

          // Handle API SDK errors
          const status =
            err && typeof err === "object" && "statusCode" in err
              ? (err as { statusCode: number }).statusCode
              : 500;

          let message: string;
          if (status === 429) {
            message = "Rate limit hit — please wait a moment and try again.";
          } else if (status === 401 || status === 403) {
            message =
              "API authentication failed. Please check your API key configuration.";
          } else if (status === 502 || status === 503 || status === 504) {
            message =
              "The AI service is temporarily unavailable. Please try again in a moment.";
          } else if (err instanceof TypeError) {
            message =
              "Network error — please check your connection and try again.";
          } else {
            message = "Something went wrong generating a response.";
          }

          return new Response(message, { status });
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
