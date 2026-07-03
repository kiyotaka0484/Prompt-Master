import { createOpenAI } from "@ai-sdk/openai";

export type AIProviderType = "openai" | "anthropic" | "google";

export interface AIProviderConfig {
  provider: AIProviderType;
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
      return "AI service is not configured. Please add an API key to your environment.";
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

// Default models for each provider
const PROVIDER_MODELS: Record<AIProviderType, string> = {
  openai: "gpt-4.1",
  anthropic: "claude-sonnet-4-20250514",
  google: "gemini-2.5-pro-preview-06-05",
};

let cachedModel: ReturnType<ReturnType<typeof createOpenAI>> | null = null;

export function getModel(config?: Partial<AIProviderConfig>) {
  const provider = config?.provider ?? "openai";
  const modelId = config?.model ?? PROVIDER_MODELS[provider];
  const apiKey = config?.apiKey || process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw createAIProviderError(
      "missing_api_key",
      "OPENAI_API_KEY is not configured",
    );
  }

  switch (provider) {
    case "openai": {
      if (cachedModel && !config) {
        return cachedModel;
      }
      const openai = createOpenAI({ apiKey });
      const model = openai(modelId);
      if (!config) {
        cachedModel = model;
      }
      return model;
    }
    case "anthropic":
      throw createAIProviderError(
        "missing_api_key",
        "Anthropic provider is not yet configured. Please use OpenAI for now.",
      );
    case "google":
      throw createAIProviderError(
        "missing_api_key",
        "Google provider is not yet configured. Please use OpenAI for now.",
      );
    default:
      throw createAIProviderError(
        "unknown",
        `Unknown provider: ${provider}`,
      );
  }
}

export const DEFAULT_MODEL = PROVIDER_MODELS.openai;

export function validateApiKey(): { valid: boolean; error?: AIProviderError } {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return {
      valid: false,
      error: createAIProviderError(
        "missing_api_key",
        "OPENAI_API_KEY is not set in environment variables",
      ),
    };
  }
  return { valid: true };
}
