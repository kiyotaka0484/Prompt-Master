import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createOllama } from "ai-sdk-ollama";

export type AIProviderType = "gemini" | "ollama";

export const DEFAULT_GEMINI_MODEL = "gemini-2.5-flash";
export const DEFAULT_OLLAMA_MODEL = "qwen3:4b";
export const DEFAULT_OLLAMA_BASE_URL = "http://localhost:11434";

export interface AIProviderConfig {
  provider?: AIProviderType;
  model?: string;
  apiKey?: string;
  baseUrl?: string;
}

export interface AIProviderError {
  code:
    | "missing_api_key"
    | "ollama_not_running"
    | "ollama_model_missing"
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
      return "Gemini service is not configured. Please verify your GEMINI_API_KEY environment variable, or switch to the local Ollama provider.";
    case "ollama_not_running":
      return "Cannot connect to local Ollama at http://localhost:11434. Please ensure Ollama is installed and running on your PC (run 'ollama serve' in your terminal).";
    case "ollama_model_missing":
      return "Model 'qwen3:4b' was not found in your local Ollama. Please run 'ollama pull qwen3:4b' on your PC to download it.";
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

  // Ollama specific error detection
  if (
    errString.includes("11434") ||
    errString.includes("econnrefused") ||
    errString.includes("connect econnrefused") ||
    errString.includes("failed to fetch") ||
    (errString.includes("fetch failed") && errString.includes("localhost"))
  ) {
    return "Cannot connect to local Ollama at http://localhost:11434. Make sure Ollama is running on your machine ('ollama serve').";
  }

  if (
    errString.includes("model 'qwen3:4b' not found") ||
    (errString.includes("not found") && errString.includes("qwen3:4b")) ||
    errString.includes("try pulling it first")
  ) {
    return "Local Ollama model 'qwen3:4b' not found. Please pull it in your terminal: ollama pull qwen3:4b";
  }

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

const DEFAULT_MODEL = DEFAULT_GEMINI_MODEL;

let cachedGeminiModel: ReturnType<
  ReturnType<typeof createGoogleGenerativeAI>
> | null = null;

let cachedOllamaModel: ReturnType<ReturnType<typeof createOllama>> | null =
  null;

/**
 * Returns a configured language model instance.
 * Supports:
 * - provider: "gemini" -> Google Generative AI (default gemini-2.5-flash)
 * - provider: "ollama" -> Local Ollama instance (default qwen3:4b at http://localhost:11434)
 *
 * IMPORTANT:
 * - Never silently falls back from Ollama to Gemini.
 * - qwen3:4b is the only Ollama model configured for Prompt Master.
 */
export function getModel(config?: Partial<AIProviderConfig>) {
  const provider: AIProviderType = config?.provider ?? "gemini";

  if (provider === "ollama") {
    const modelId = config?.model || DEFAULT_OLLAMA_MODEL;
    const baseURL = config?.baseUrl || DEFAULT_OLLAMA_BASE_URL;

    if (
      cachedOllamaModel &&
      (!config ||
        (config.model === DEFAULT_OLLAMA_MODEL &&
          (!config.baseUrl || config.baseUrl === DEFAULT_OLLAMA_BASE_URL)))
    ) {
      return cachedOllamaModel;
    }

    // Direct instantiation with createOllama
    const ollama = createOllama({ baseURL });
    const model = ollama(modelId);
    if (!config) {
      cachedOllamaModel = model;
    }
    return model;
  }

  // Gemini Provider
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
