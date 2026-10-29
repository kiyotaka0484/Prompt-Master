import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {
  isFirebaseConfigured,
  firebaseConfig,
  loginWithGoogle,
  loginWithGithub,
} from "../src/lib/firebase";
import {
  validateApiKey,
  sanitizeAIErrorMessage,
  createAIProviderError,
} from "../src/lib/ai-provider";

test("Security 1: firebase-applet-config.json does not contain hardcoded Google API keys", () => {
  const configPath = path.resolve(process.cwd(), "firebase-applet-config.json");
  assert.ok(
    fs.existsSync(configPath),
    "firebase-applet-config.json must exist",
  );
  const raw = fs.readFileSync(configPath, "utf8");
  const parsed = JSON.parse(raw);

  // Must not contain any AIzaSy... API key
  assert.doesNotMatch(
    raw,
    /AIzaSy[A-Za-z0-9_-]{35}/,
    "firebase-applet-config.json must not contain any raw AIzaSy Google API key",
  );

  // apiKey must be empty in tracked config file
  assert.equal(
    parsed.apiKey,
    "",
    "firebase-applet-config.json apiKey should be empty in tracked configuration",
  );
});

test("Security 2: Tracked source and configuration files contain no exposed Google or Gemini secrets", () => {
  const rootDir = process.cwd();
  const searchDirs = ["src", "public"];

  for (const dir of searchDirs) {
    const fullDir = path.resolve(rootDir, dir);
    if (!fs.existsSync(fullDir)) continue;

    function checkDir(currentPath: string) {
      const entries = fs.readdirSync(currentPath, { withFileTypes: true });
      for (const entry of entries) {
        const entryPath = path.join(currentPath, entry.name);
        if (entry.isDirectory()) {
          checkDir(entryPath);
        } else if (/\.(ts|tsx|js|json|html|css|md)$/.test(entry.name)) {
          const content = fs.readFileSync(entryPath, "utf8");
          assert.doesNotMatch(
            content,
            /AIzaSy[A-Za-z0-9_-]{35}/,
            `File ${entryPath} must not contain any raw Google API key (AIzaSy...)`,
          );
        }
      }
    }
    checkDir(fullDir);
  }
});

test("Security 3: .env.example contains only placeholders and zero real credentials", () => {
  const envExamplePath = path.resolve(process.cwd(), ".env.example");
  assert.ok(fs.existsSync(envExamplePath), ".env.example must exist");
  const content = fs.readFileSync(envExamplePath, "utf8");

  // No real Google API key
  assert.doesNotMatch(
    content,
    /AIzaSy[A-Za-z0-9_-]{35}/,
    ".env.example must not contain real AIzaSy keys",
  );

  // No real Gemini API key
  assert.doesNotMatch(
    content,
    /AQ\.[A-Za-z0-9_-]{30,}/,
    ".env.example must not contain real Gemini/AI Studio keys",
  );

  // Variables must use descriptive placeholder values
  assert.match(
    content,
    /your_gemini_api_key_here/i,
    ".env.example must document GEMINI_API_KEY with placeholder",
  );
  assert.match(
    content,
    /your_firebase_web_api_key_here/i,
    ".env.example must document VITE_FIREBASE_API_KEY with placeholder",
  );
});

test("Security 4: Firebase module gracefully handles unconfigured or missing credentials without crashing", async () => {
  // If API key is empty or unconfigured, isFirebaseConfigured should reflect it accurately
  // and login functions must throw a clear, informative error rather than crashing
  if (!isFirebaseConfigured) {
    await assert.rejects(
      async () => {
        await loginWithGoogle();
      },
      /Firebase authentication is not configured/i,
      "loginWithGoogle should reject with informative configuration error when unconfigured",
    );

    await assert.rejects(
      async () => {
        await loginWithGithub();
      },
      /Firebase authentication is not configured/i,
      "loginWithGithub should reject with informative configuration error when unconfigured",
    );
  } else {
    // If running in an environment where VITE_FIREBASE_API_KEY is supplied
    assert.ok(
      typeof firebaseConfig.apiKey === "string" &&
        firebaseConfig.apiKey.length > 0,
      "Configured apiKey should be a non-empty string",
    );
  }
});

test("Security 5: Server-side Gemini API provider validates credentials and never exposes keys in error messages", () => {
  // Check validateApiKey behavior
  const validation = validateApiKey();
  assert.equal(typeof validation.valid, "boolean");

  // Verify error sanitization never leaks keys
  const fakeErrorWithKey = new Error(
    "Failed request to https://generativelanguage.googleapis.com with key AIzaSy_SECRET_TEST_KEY_123",
  );
  const sanitized = sanitizeAIErrorMessage(fakeErrorWithKey);
  assert.doesNotMatch(
    sanitized,
    /AIzaSy_SECRET_TEST_KEY_123/,
    "Sanitized error message must never expose API keys",
  );
  assert.doesNotMatch(
    sanitized,
    /key/i,
    "Sanitized error message must provide user-facing guidance without technical error dump",
  );

  // Verify missing_api_key error produces clear guidance
  const missingKeyError = createAIProviderError(
    "missing_api_key",
    "GEMINI_API_KEY is missing",
  );
  const msg = sanitizeAIErrorMessage(missingKeyError);
  assert.match(msg, /GEMINI_API_KEY/);
});
