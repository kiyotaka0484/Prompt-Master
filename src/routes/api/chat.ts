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
  buildPlannerContext,
  detectExpert,
  type ExpertId,
} from "@/lib/experts";
import { createFileRoute } from "@tanstack/react-router";
import { convertToModelMessages, streamText, type UIMessage } from "ai";

type ChatRequestBody = {
  messages?: unknown;
  expert?: ExpertId | null;
};

const SLOT_TAG_RE = /<!--\s*slot\s*:\s*([a-z0-9_]+)\s*-->/i;

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

        // Dynamic Question Planning — inject KNOWN / MISSING inventory each turn.
        if (expert && EXPERTS[expert] && goalIndex >= 0) {
          const goalText = messageTextFromUi(uiMessages[goalIndex]).trim();
          const filled: Record<string, string> = {};
          // Walk pairs: each assistant message with a slot tag → followed by the next user message = its answer.
          for (let i = 0; i < uiMessages.length - 1; i++) {
            const m = uiMessages[i];
            if (m.role !== "assistant") continue;
            const tag = SLOT_TAG_RE.exec(messageTextFromUi(m));
            if (!tag) continue;
            const next = uiMessages[i + 1];
            if (next && next.role === "user") {
              filled[tag[1].toLowerCase()] = messageTextFromUi(next);
            }
          }
          systemPrompt += buildPlannerContext(
            EXPERTS[expert],
            goalText,
            filled,
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
