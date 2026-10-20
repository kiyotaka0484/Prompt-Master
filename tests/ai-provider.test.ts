import test from "node:test";
import assert from "node:assert/strict";
import {
  DEFAULT_GEMINI_MODEL,
  DEFAULT_MODEL,
  getModel,
  validateApiKey,
  sanitizeAIErrorMessage,
  createAIProviderError,
  isAIProviderError,
  getProviderErrorMessage,
} from "../src/lib/ai-provider";

test("Gemini Provider: Default Model Configuration", () => {
  assert.equal(DEFAULT_GEMINI_MODEL, "gemini-3.5-flash-lite");
  assert.equal(DEFAULT_MODEL, "gemini-3.5-flash-lite");
});

test("Gemini Provider: Missing API Key Validation", () => {
  const originalKey = process.env.GEMINI_API_KEY;
  const originalGoogleKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  try {
    delete process.env.GEMINI_API_KEY;
    delete process.env.GOOGLE_GENERATIVE_AI_API_KEY;

    const validation = validateApiKey();
    assert.equal(validation.valid, false);
    assert.ok(validation.error);
    assert.equal(validation.error.code, "missing_api_key");

    assert.throws(
      () => {
        getModel();
      },
      (err: unknown) => {
        return (
          isAIProviderError(err) &&
          err.code === "missing_api_key" &&
          err.message.includes("GEMINI_API_KEY")
        );
      },
    );
  } finally {
    if (originalKey) process.env.GEMINI_API_KEY = originalKey;
    if (originalGoogleKey)
      process.env.GOOGLE_GENERATIVE_AI_API_KEY = originalGoogleKey;
  }
});

test("Gemini Provider: Key present configures model", () => {
  const model = getModel({ apiKey: "test-fake-gemini-key" });
  assert.ok(model, "Model should be successfully instantiated with API key");
  assert.equal(model.modelId, "gemini-3.5-flash-lite");

  const customModel = getModel({
    apiKey: "test-fake-gemini-key",
    model: "gemini-2.5-pro",
  });
  assert.equal(customModel.modelId, "gemini-2.5-pro");
});

test("Gemini Provider: Quota and Rate Limit Error Sanitization", () => {
  const rateLimitError = {
    statusCode: 429,
    message:
      "RESOURCE_EXHAUSTED: quota exceeded for model gemini-3.5-flash-lite",
  };
  const sanitized = sanitizeAIErrorMessage(rateLimitError);
  assert.ok(
    sanitized.toLowerCase().includes("quota") ||
      sanitized.toLowerCase().includes("rate limit"),
    "Should provide clear guidance for quota and rate limit errors",
  );
});

test("Gemini Provider: Authentication Error Sanitization", () => {
  const authError = {
    statusCode: 401,
    message: "API_KEY_INVALID: API key not valid. Please pass a valid API key.",
  };
  const sanitized = sanitizeAIErrorMessage(authError);
  assert.ok(
    sanitized.toLowerCase().includes("authentication") ||
      sanitized.toLowerCase().includes("api key"),
    "Should provide clear guidance for auth errors",
  );
});

test("Gemini Provider: Structured AIProviderError handling", () => {
  const providerErr = createAIProviderError(
    "missing_api_key",
    "Missing Gemini API key",
  );
  assert.equal(isAIProviderError(providerErr), true);
  const msg = getProviderErrorMessage(providerErr);
  assert.ok(msg.includes("GEMINI_API_KEY"));
});

test("API Chat Route: Resilient stream handling when Gemini authentication fails", async () => {
  const { Route } = await import("../src/routes/api/chat");
  const postHandler = Route.options.server?.handlers?.POST;
  assert.ok(postHandler, "POST handler must be defined on Route");

  const req = new Request("http://localhost:3000/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      messages: [
        {
          role: "user",
          parts: [
            { type: "text", text: "I want to build a portfolio website" },
          ],
        },
      ],
      expert: "website",
    }),
  });

  const res = await (
    postHandler as (args: { request: Request }) => Promise<Response>
  )({ request: req });
  assert.equal(res.status, 200, "Response status must be 200");
  assert.ok(
    res.headers.get("content-type")?.includes("text/event-stream"),
    "Response must be SSE stream",
  );

  const raw = await res.text();
  assert.ok(
    raw.includes('"type":"text-delta"'),
    "Stream must yield text delta events",
  );
  assert.ok(
    raw.includes("<!--slot:"),
    "Stream must include consultant slot tag",
  );
});
