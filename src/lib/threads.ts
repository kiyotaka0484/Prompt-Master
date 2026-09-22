import type { UIMessage } from "ai";
import { detectExpert, type ExpertId } from "./experts";

export interface ThreadRecord {
  id: string;
  expert: ExpertId | null;
  title: string;
  updatedAt: number;
  isFavorite?: boolean;
  messages: UIMessage[];
}

const KEY = "prompt-master.threads.v1";

function isBrowser() {
  return typeof window !== "undefined";
}

export function loadThreads(): ThreadRecord[] {
  if (!isBrowser()) return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as ThreadRecord[];
    if (!Array.isArray(parsed)) return [];
    return parsed.map(normalizeThreadRecord);
  } catch {
    return [];
  }
}

function normalizeThreadRecord(thread: ThreadRecord): ThreadRecord {
  const goalIndex = thread.messages.findIndex(
    (m) => m.role === "user" && detectExpert(messageText(m)),
  );
  if (goalIndex === -1) {
    return { ...thread, expert: null, title: "New session", messages: [] };
  }
  const messages = thread.messages.slice(goalIndex);
  const expert = thread.expert ?? detectExpert(messageText(messages[0]));
  return {
    ...thread,
    expert,
    messages,
    title: deriveTitle(messages),
  };
}

export function saveThreads(threads: ThreadRecord[]) {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(threads));
  } catch {
    // ignore quota errors
  }
}

export function newThreadId() {
  if (isBrowser() && "crypto" in window && "randomUUID" in window.crypto) {
    return window.crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function messageText(m: UIMessage): string {
  return m.parts.map((p) => (p.type === "text" ? p.text : "")).join("");
}

export function messageHasReasoning(m: UIMessage): boolean {
  return m.parts.some((p) => p.type === "reasoning" && Boolean(p.text));
}

export function deriveTitle(messages: UIMessage[]): string {
  const firstUser = messages.find(
    (m) => m.role === "user" && detectExpert(messageText(m)),
  );
  if (!firstUser) return "New session";
  const text = messageText(firstUser).trim();
  if (!text) return "New session";
  return text.length > 48 ? text.slice(0, 48) + "…" : text;
}

export function createFreshSession(options?: {
  expert?: ExpertId | null;
  goal?: string;
}): ThreadRecord {
  const id = newThreadId();
  const goalText = options?.goal?.trim();
  const thread: ThreadRecord = {
    id,
    expert: options?.expert ?? (goalText ? detectExpert(goalText) : null),
    title: goalText
      ? goalText.length > 48
        ? goalText.slice(0, 48) + "…"
        : goalText
      : "New session",
    updatedAt: Date.now(),
    messages: goalText
      ? [
          {
            id: newThreadId(),
            role: "user",
            parts: [{ type: "text", text: goalText }],
          },
        ]
      : [],
  };

  const current = loadThreads();
  saveThreads([thread, ...current]);
  return thread;
}
