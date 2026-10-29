import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  GithubAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  type Auth,
  type User,
} from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";
import rawConfig from "../../firebase-applet-config.json";

// Safe API key resolution from client or server environment variables, or config fallback
const envApiKey =
  (typeof import.meta !== "undefined" &&
    import.meta.env?.VITE_FIREBASE_API_KEY) ||
  (typeof process !== "undefined" &&
    (process.env?.VITE_FIREBASE_API_KEY || process.env?.FIREBASE_API_KEY)) ||
  "";

const resolvedApiKey = (envApiKey || rawConfig.apiKey || "").trim();

export const isFirebaseConfigured: boolean = Boolean(
  resolvedApiKey &&
  resolvedApiKey !== "" &&
  !resolvedApiKey.includes("YOUR_") &&
  rawConfig.projectId &&
  rawConfig.projectId !== "remixed-project-id",
);

export const firebaseConfig = {
  ...rawConfig,
  apiKey: resolvedApiKey,
};

let appInstance: FirebaseApp | null = null;
let authInstance: Auth | null = null;
let dbInstance: Firestore | null = null;

if (isFirebaseConfigured) {
  try {
    appInstance =
      getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
    authInstance = getAuth(appInstance);
    dbInstance = getFirestore(
      appInstance,
      firebaseConfig.firestoreDatabaseId || "(default)",
    );
  } catch (err) {
    console.warn("Firebase initialization skipped or failed:", err);
  }
}

export const app = appInstance;
export const auth = authInstance;
export const db = dbInstance;

// Auth Providers
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });

export const githubProvider = new GithubAuthProvider();
githubProvider.addScope("read:user");
githubProvider.addScope("user:email");

export async function loginWithGoogle(): Promise<User> {
  if (!auth) {
    throw new Error(
      "Firebase authentication is not configured. Please supply a valid VITE_FIREBASE_API_KEY.",
    );
  }
  const result = await signInWithPopup(auth, googleProvider);
  return result.user;
}

export async function loginWithGithub(): Promise<User> {
  if (!auth) {
    throw new Error(
      "Firebase authentication is not configured. Please supply a valid VITE_FIREBASE_API_KEY.",
    );
  }
  const result = await signInWithPopup(auth, githubProvider);
  return result.user;
}

export async function logoutUser(): Promise<void> {
  if (auth) {
    await signOut(auth);
  }
}

export { onAuthStateChanged, type User };
