import { createGoogleGenerativeAI } from "@ai-sdk/google";

export interface AIProviderConfig {
  model: string;
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
      return "AI service is not configured. Please verify your GEMINI_API_KEY environment variable.";
    case "rate_limit":
      return "Rate limit reached — please wait a few moments and try again.";
    case "network_error":
      return "Network connection issue — please check your connection and try again.";
    case "invalid_response":
      return "Received an invalid response from the AI service. Please try again.";
    default:
      return "Something went wrong generating a response. Please try again.";
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
    return "Rate limit reached — please wait a few moments and try again.";
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
    return "AI service authentication failed. Please verify your API key configuration.";
  }

  if (
    status === 408 ||
    errString.includes("timeout") ||
    errString.includes("deadline_exceeded") ||
    errString.includes("aborted") ||
    errString.includes("etimedout")
  ) {
    return "Request timed out while waiting for AI generation. Please retry.";
  }

  if (
    status === 502 ||
    status === 503 ||
    status === 504 ||
    errString.includes("unavailable") ||
    errString.includes("overloaded") ||
    errString.includes("high demand")
  ) {
    return "The AI service is experiencing high demand. Please try again shortly.";
  }

  if (
    err instanceof TypeError ||
    errString.includes("fetch failed") ||
    errString.includes("network")
  ) {
    return "Network connection issue detected. Please check your internet connection and try again.";
  }

  return "An unexpected error occurred while generating a response. Please try again.";
}

const DEFAULT_MODEL = "gemini-2.5-flash";

let cachedModel: ReturnType<
  ReturnType<typeof createGoogleGenerativeAI>
> | null = null;

export function getModel(config?: Partial<AIProviderConfig>) {
  const modelId = config?.model ?? DEFAULT_MODEL;
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
