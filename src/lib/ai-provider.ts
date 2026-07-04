import { createGoogleGenerativeAI } from "@ai-sdk/google";

export interface AIProviderConfig {
  model: string;
  apiKey?: string;
}

export interface AIProviderError {
  code: "missing_api_key" | "rate_limit" | "network_error" | "invalid_response" | "unknown";
  message: string;
  cause?: Error;
}

export function createAIProviderError(
  code: AIProviderError["code"],
  message: string,
  cause?: Error,
): AIProviderError {
  return { code, message, cause };
}

export function isAIProviderError(error: unknown): error is AIProviderError {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    "message" in error
  );
}

export function getProviderErrorMessage(error: AIProviderError): string {
  switch (error.code) {
    case "missing_api_key":
      return "AI service is not configured. Please add a Google AI API key to your environment.";
    case "rate_limit":
      return "Rate limit hit — please wait a moment and try again.";
    case "network_error":
      return "Network error — please check your connection and try again.";
    case "invalid_response":
      return "Received an invalid response from the AI service. Please try again.";
    default:
      return "Something went wrong generating a response. Please try again.";
  }
}

const DEFAULT_MODEL = "gemini-2.5-flash";

let cachedModel: ReturnType<ReturnType<typeof createGoogleGenerativeAI>> | null = null;

export function getModel(config?: Partial<AIProviderConfig>) {
  const modelId = config?.model ?? DEFAULT_MODEL;
  const apiKey = config?.apiKey || process.env.GOOGLE_GENERATIVE_AI_API_KEY;

  if (!apiKey) {
    throw createAIProviderError(
      "missing_api_key",
      "GOOGLE_GENERATIVE_AI_API_KEY is not configured",
    );
  }

  if (cachedModel && !config) {
    return cachedModel;
  }
  const google = createGoogleGenerativeAI({ apiKey });
  const model = google(modelId);
  if (!config) {
    cachedModel = model;
  }
  return model;
}

export { DEFAULT_MODEL };

export function validateApiKey(): { valid: boolean; error?: AIProviderError } {
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (!apiKey) {
    return {
      valid: false,
      error: createAIProviderError(
        "missing_api_key",
        "GOOGLE_GENERATIVE_AI_API_KEY is not set in environment variables",
      ),
    };
  }
  return { valid: true };
}
