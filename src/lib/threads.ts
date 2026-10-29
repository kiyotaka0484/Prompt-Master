import type { UIMessage } from "ai";
import { detectExpert, isVagueIntent, type ExpertId } from "./experts";
import {
  buildProjectProfileFromMessages,
  createEmptyProjectProfile,
  deserializeProjectProfile,
  type ProjectProfile,
} from "./project-understanding-engine";

export interface ThreadRecord {
  id: string;
  expert: ExpertId | null;
  title: string;
  updatedAt: number;
  isFavorite?: boolean;
  messages: UIMessage[];
  projectProfile?: ProjectProfile;
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

export function normalizeThreadRecord(thread: ThreadRecord): ThreadRecord {
  const rawMessages = Array.isArray(thread.messages) ? thread.messages : [];
  let goalIndex = rawMessages.findIndex(
    (m) => m.role === "user" && Boolean(detectExpert(messageText(m))),
  );
  if (goalIndex === -1) {
    goalIndex = rawMessages.findIndex((m) => {
      if (m.role !== "user") return false;
      const text = messageText(m).trim();
      return text.length > 0 && !isVagueIntent(text);
    });
  }
  if (goalIndex === -1) {
    const expert = thread.expert ?? null;
    const projectProfile = thread.projectProfile
      ? deserializeProjectProfile(thread.projectProfile, [], expert)
      : createEmptyProjectProfile(expert);
    return {
      ...thread,
      expert,
      title:
        thread.title && thread.title !== "New session"
          ? thread.title
          : "New session",
      messages: [],
      projectProfile,
    };
  }
  const messages = rawMessages.slice(goalIndex);
  const expert =
    thread.expert ?? detectExpert(messageText(messages[0])) ?? "business";
  const projectProfile = deserializeProjectProfile(
    thread.projectProfile,
    messages,
    expert,
  );
  return {
    ...thread,
    expert,
    messages,
    title: deriveTitle(messages),
    projectProfile,
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

export function messageText(m: UIMessage | undefined | null): string {
  if (!m || !Array.isArray(m.parts)) return "";
  return m.parts
    .map((p) =>
      p?.type === "text" && typeof p.text === "string" ? p.text : "",
    )
    .join("");
}

export function messageHasReasoning(m: UIMessage | undefined | null): boolean {
  if (!m || !Array.isArray(m.parts)) return false;
  return m.parts.some((p) => p?.type === "reasoning" && Boolean(p.text));
}

export function deriveTitle(messages: UIMessage[]): string {
  const safeMessages = Array.isArray(messages) ? messages : [];
  const firstUser =
    safeMessages.find(
      (m) => m.role === "user" && Boolean(detectExpert(messageText(m))),
    ) ??
    safeMessages.find((m) => {
      if (m.role !== "user") return false;
      const text = messageText(m).trim();
      return text.length > 0 && !isVagueIntent(text);
    });
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
  const expert = options?.expert ?? (goalText ? detectExpert(goalText) : null);
  const messages: UIMessage[] = goalText
    ? [
        {
          id: newThreadId(),
          role: "user",
          parts: [{ type: "text", text: goalText }],
        },
      ]
    : [];
  const thread: ThreadRecord = {
    id,
    expert,
    title: goalText
      ? goalText.length > 48
        ? goalText.slice(0, 48) + "…"
        : goalText
      : "New session",
    updatedAt: Date.now(),
    messages,
    projectProfile: buildProjectProfileFromMessages(messages, expert),
  };

  const current = loadThreads();
  saveThreads([thread, ...current]);
  return thread;
}
