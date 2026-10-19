import { createGoogleGenerativeAI } from "@ai-sdk/google";

export type AIProviderType = "gemini";

export const DEFAULT_GEMINI_MODEL = "gemini-2.5-flash";
export const DEFAULT_MODEL = DEFAULT_GEMINI_MODEL;

export interface AIProviderConfig {
  provider?: "gemini";
  model?: string;
  apiKey?: string;
}

export interface AIProviderError {
  code:
    | "missing_api_key"
    | "rate_limit"
    | "network_error"
    | "invalid_response"
    | "unknown";
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
      return "Gemini service is not configured. Please verify your GEMINI_API_KEY environment variable.";
    case "rate_limit":
      return "Gemini API rate limit reached or quota exhausted — please wait a few moments and try again.";
    case "network_error":
      return "Network connection issue — please check your connection and try again.";
    case "invalid_response":
      return "Received an invalid response from the Gemini AI service. Please try again.";
    default:
      return "Something went wrong generating a response from Gemini. Please try again.";
  }
}

export function sanitizeAIErrorMessage(err: unknown): string {
  if (isAIProviderError(err)) {
    return getProviderErrorMessage(err);
  }

  const errString = String(
    (err && typeof err === "object" && "message" in err
      ? (err as { message: string }).message
      : err) || "",
  ).toLowerCase();

  const status =
    err && typeof err === "object" && "statusCode" in err
      ? (err as { statusCode: number }).statusCode
      : 0;

  if (
    status === 429 ||
    errString.includes("429") ||
    errString.includes("resource_exhausted") ||
    errString.includes("quota") ||
    errString.includes("rate limit")
  ) {
    return "Gemini API rate limit or quota exceeded. Please wait a few moments or verify your API quota before retrying.";
  }

  if (
    status === 401 ||
    status === 403 ||
    errString.includes("401") ||
    errString.includes("403") ||
    errString.includes("unauthenticated") ||
    errString.includes("permission_denied") ||
    errString.includes("api key") ||
    errString.includes("api_key")
  ) {
    return "Gemini API authentication failed. Please verify your GEMINI_API_KEY configuration.";
  }

  if (
    status === 408 ||
    errString.includes("timeout") ||
    errString.includes("deadline_exceeded") ||
    errString.includes("aborted") ||
    errString.includes("etimedout")
  ) {
    return "Request timed out while waiting for Gemini AI generation. Please retry.";
  }

  if (
    status === 502 ||
    status === 503 ||
    status === 504 ||
    errString.includes("unavailable") ||
    errString.includes("overloaded") ||
    errString.includes("high demand")
  ) {
    return "The Gemini AI service is experiencing high demand. Please try again shortly.";
  }

  if (
    err instanceof TypeError ||
    errString.includes("fetch failed") ||
    errString.includes("network")
  ) {
    return "Network connection issue detected. Please check your internet connection and try again.";
  }

  return "An unexpected error occurred while generating a response from Gemini. Please try again.";
}

let cachedGeminiModel: ReturnType<
  ReturnType<typeof createGoogleGenerativeAI>
> | null = null;

/**
 * Returns a configured Google Generative AI (Gemini) model instance.
 * Exclusively uses Gemini API (default: gemini-2.5-flash).
 */
export function getModel(config?: Partial<AIProviderConfig>) {
  const modelId = config?.model ?? DEFAULT_GEMINI_MODEL;
  const apiKey =
    config?.apiKey ||
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_GENERATIVE_AI_API_KEY;

  if (!apiKey) {
    throw createAIProviderError(
      "missing_api_key",
      "GEMINI_API_KEY is not configured",
    );
  }

  if (cachedGeminiModel && !config) {
    return cachedGeminiModel;
  }
  const google = createGoogleGenerativeAI({ apiKey });
  const model = google(modelId);
  if (!config) {
    cachedGeminiModel = model;
  }
  return model;
}

export function validateApiKey(): { valid: boolean; error?: AIProviderError } {
  const apiKey =
    process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (!apiKey) {
    return {
      valid: false,
      error: createAIProviderError(
        "missing_api_key",
        "GEMINI_API_KEY is not set in environment variables",
      ),
    };
  }
  return { valid: true };
}
