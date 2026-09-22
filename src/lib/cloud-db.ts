import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  query,
  where,
  onSnapshot,
  getDocs,
} from "firebase/firestore";
import type { User } from "firebase/auth";
import { db } from "./firebase";
import type { ExpertId } from "./experts";
import type { UIMessage } from "ai";

export type ThemePreference = "dark" | "light";

export interface UserProfile {
  id: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  theme: ThemePreference;
  createdAt: number;
  updatedAt: number;
}

export interface CloudThreadRecord {
  id: string;
  userId: string;
  expert: ExpertId | null;
  title: string;
  isFavorite?: boolean;
  updatedAt: number;
  createdAt?: number;
  messages: UIMessage[];
}

export type SupportedModelKey =
  | "chatgpt"
  | "claude"
  | "gemini"
  | "perplexity"
  | "grok"
  | "cursor"
  | "windsurf";

export interface SavedPromptRecord {
  id: string;
  userId: string;
  threadId: string;
  title: string;
  model: SupportedModelKey | "all" | string;
  content: string;
  score: number;
  isFavorite: boolean;
  tags: string[];
  createdAt: number;
  updatedAt: number;
}

// ---------------- USER PROFILE ----------------
export async function syncUserProfile(
  user: User,
  preferredTheme: ThemePreference = "dark",
): Promise<UserProfile> {
  const userRef = doc(db, "users", user.uid);
  const snap = await getDoc(userRef);

  if (snap.exists()) {
    const data = snap.data() as UserProfile;
    const updated: Partial<UserProfile> = {
      email: user.email,
      displayName: user.displayName ?? data.displayName,
      photoURL: user.photoURL ?? data.photoURL,
      updatedAt: Date.now(),
    };
    await updateDoc(userRef, updated);
    return { ...data, ...updated };
  }

  const newProfile: UserProfile = {
    id: user.uid,
    email: user.email,
    displayName:
      user.displayName ?? user.email?.split("@")[0] ?? "Prompt Crafter",
    photoURL: user.photoURL,
    theme: preferredTheme,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  await setDoc(userRef, newProfile);
  return newProfile;
}

export async function updateUserTheme(
  userId: string,
  theme: ThemePreference,
): Promise<void> {
  const userRef = doc(db, "users", userId);
  await updateDoc(userRef, {
    theme,
    updatedAt: Date.now(),
  });
}

// ---------------- CLOUD THREADS ----------------
export async function saveThreadToCloud(
  userId: string,
  thread: {
    id: string;
    title: string;
    expert: ExpertId | null;
    messages: UIMessage[];
    updatedAt: number;
    isFavorite?: boolean;
  },
): Promise<void> {
  const threadRef = doc(db, "threads", thread.id);
  const payload: CloudThreadRecord = {
    id: thread.id,
    userId,
    title: thread.title,
    expert: thread.expert,
    isFavorite: thread.isFavorite ?? false,
    updatedAt: thread.updatedAt || Date.now(),
    messages: thread.messages,
  };
  await setDoc(threadRef, payload, { merge: true });
}

export async function renameThreadInCloud(
  userId: string,
  threadId: string,
  newTitle: string,
): Promise<void> {
  const threadRef = doc(db, "threads", threadId);
  await updateDoc(threadRef, {
    title: newTitle.trim() || "Untitled session",
    updatedAt: Date.now(),
  });
}

export async function toggleThreadFavoriteInCloud(
  userId: string,
  threadId: string,
  isFavorite: boolean,
): Promise<void> {
  const threadRef = doc(db, "threads", threadId);
  await updateDoc(threadRef, {
    isFavorite,
    updatedAt: Date.now(),
  });
}

export async function deleteThreadFromCloud(
  userId: string,
  threadId: string,
): Promise<void> {
  const threadRef = doc(db, "threads", threadId);
  await deleteDoc(threadRef);
}

export function subscribeToUserThreads(
  userId: string,
  onUpdate: (threads: CloudThreadRecord[]) => void,
  onError?: (err: Error) => void,
): () => void {
  if (!userId) return () => {};
  const q = query(collection(db, "threads"), where("userId", "==", userId));

  return onSnapshot(
    q,
    (snapshot) => {
      const threads: CloudThreadRecord[] = [];
      snapshot.forEach((docSnap) => {
        threads.push(docSnap.data() as CloudThreadRecord);
      });
      // Sort newest first
      threads.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
      onUpdate(threads);
    },
    (err) => {
      console.error("Error subscribing to cloud threads:", err);
      onError?.(err);
    },
  );
}

// ---------------- SAVED PROMPTS & LIBRARY ----------------
const LOCAL_SAVED_KEY = "prompt-master.saved-prompts.v1";

export function loadLocalSavedPrompts(): SavedPromptRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(LOCAL_SAVED_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveLocalSavedPrompts(prompts: SavedPromptRecord[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(LOCAL_SAVED_KEY, JSON.stringify(prompts));
  } catch {
    // ignore
  }
}

export async function savePromptToCloud(
  prompt: Omit<SavedPromptRecord, "createdAt" | "updatedAt">,
): Promise<SavedPromptRecord> {
  const docRef = doc(db, "saved_prompts", prompt.id);
  const snap = await getDoc(docRef);
  const now = Date.now();
  const existing = snap.exists() ? (snap.data() as SavedPromptRecord) : null;

  const full: SavedPromptRecord = {
    ...prompt,
    createdAt: existing?.createdAt || now,
    updatedAt: now,
  };

  await setDoc(docRef, full, { merge: true });
  return full;
}

export async function togglePromptFavoriteInCloud(
  promptId: string,
  isFavorite: boolean,
): Promise<void> {
  const docRef = doc(db, "saved_prompts", promptId);
  await updateDoc(docRef, {
    isFavorite,
    updatedAt: Date.now(),
  });
}

export async function deletePromptFromCloud(promptId: string): Promise<void> {
  const docRef = doc(db, "saved_prompts", promptId);
  await deleteDoc(docRef);
}

export function subscribeToSavedPrompts(
  userId: string,
  onUpdate: (prompts: SavedPromptRecord[]) => void,
  onError?: (err: Error) => void,
): () => void {
  if (!userId) return () => {};
  const q = query(
    collection(db, "saved_prompts"),
    where("userId", "==", userId),
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const items: SavedPromptRecord[] = [];
      snapshot.forEach((docSnap) => {
        items.push(docSnap.data() as SavedPromptRecord);
      });
      items.sort((a, b) => b.createdAt - a.createdAt);
      onUpdate(items);
    },
    (err) => {
      console.error("Error subscribing to saved prompts:", err);
      onError?.(err);
    },
  );
}

// ---------------- GUEST TO CLOUD MIGRATION ----------------
export async function syncLocalToCloud(
  userId: string,
  localThreads: {
    id: string;
    title: string;
    expert: ExpertId | null;
    messages: UIMessage[];
    updatedAt: number;
    isFavorite?: boolean;
  }[],
  localSavedPrompts: SavedPromptRecord[],
): Promise<{ threadsSynced: number; promptsSynced: number; errors: number }> {
  let threadsSynced = 0;
  let promptsSynced = 0;
  let errors = 0;

  for (const t of localThreads) {
    if (t.messages && t.messages.length > 0) {
      try {
        await saveThreadToCloud(userId, t);
        threadsSynced++;
      } catch (err) {
        console.error(`Failed to sync thread ${t.id} to cloud:`, err);
        errors++;
      }
    }
  }

  for (const p of localSavedPrompts) {
    try {
      await savePromptToCloud({
        ...p,
        userId,
      });
      promptsSynced++;
    } catch (err) {
      console.error(`Failed to sync prompt ${p.id} to cloud:`, err);
      errors++;
    }
  }

  return { threadsSynced, promptsSynced, errors };
}
