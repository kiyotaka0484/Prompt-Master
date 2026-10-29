import {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
  type ReactNode,
} from "react";
import {
  auth,
  loginWithGoogle as fbLoginWithGoogle,
  loginWithGithub as fbLoginWithGithub,
  logoutUser as fbLogoutUser,
  onAuthStateChanged,
  isFirebaseConfigured,
  type User,
} from "@/lib/firebase";
import {
  syncUserProfile,
  updateUserTheme,
  syncLocalToCloud,
  loadLocalSavedPrompts,
  type ThemePreference,
  type UserProfile,
} from "@/lib/cloud-db";
import { loadThreads } from "@/lib/threads";
import { toast } from "sonner";

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  theme: ThemePreference;
  setTheme: (theme: ThemePreference) => Promise<void>;
  toggleTheme: () => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  loginWithGithub: () => Promise<void>;
  logout: () => Promise<void>;
  syncLocalData: () => Promise<void>;
  isCloudSynced: boolean;
  isFirebaseConfigured: boolean;
}

const THEME_STORAGE_KEY = "prompt-master.theme.v1";

function applyThemeToDom(theme: ThemePreference) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  if (theme === "light") {
    root.classList.remove("dark");
    root.classList.add("light");
  } else {
    root.classList.remove("light");
    root.classList.add("dark");
  }
}

const DEFAULT_AUTH_CONTEXT: AuthContextType = {
  user: null,
  profile: null,
  loading: false,
  theme: "dark",
  setTheme: async (newTheme: ThemePreference) => {
    applyThemeToDom(newTheme);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(THEME_STORAGE_KEY, newTheme);
    }
  },
  toggleTheme: async () => {
    if (typeof window === "undefined") return;
    const current = window.localStorage.getItem(THEME_STORAGE_KEY);
    const next: ThemePreference = current === "light" ? "dark" : "light";
    applyThemeToDom(next);
    window.localStorage.setItem(THEME_STORAGE_KEY, next);
  },
  loginWithGoogle: async () => {
    toast.error(
      "Cloud authentication is not configured. Set VITE_FIREBASE_API_KEY in your environment to enable sync.",
    );
  },
  loginWithGithub: async () => {
    toast.error(
      "Cloud authentication is not configured. Set VITE_FIREBASE_API_KEY in your environment to enable sync.",
    );
  },
  logout: async () => {},
  syncLocalData: async () => {
    toast.info("Please sign in to sync your interview sessions to the cloud.");
  },
  isCloudSynced: false,
  isFirebaseConfigured,
};

// Persist context instance on globalThis so Vite HMR / SSR module reloads never split Provider and Consumer identity
const GLOBAL_AUTH_CTX_KEY = "__PROMPT_MASTER_AUTH_CONTEXT__";
const globalStore = globalThis as typeof globalThis & {
  [GLOBAL_AUTH_CTX_KEY]?: ReturnType<
    typeof createContext<AuthContextType | undefined>
  >;
};

const AuthContext =
  globalStore[GLOBAL_AUTH_CTX_KEY] ??
  (globalStore[GLOBAL_AUTH_CTX_KEY] = createContext<
    AuthContextType | undefined
  >(undefined));

export function AuthProvider({ children }: { children: ReactNode }) {
  const existingContext = useContext(AuthContext);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [theme, setThemeState] = useState<ThemePreference>("dark");
  const themeRef = useRef<ThemePreference>(theme);

  useEffect(() => {
    themeRef.current = theme;
  }, [theme]);

  // Initialize theme from storage
  useEffect(() => {
    if (existingContext || typeof window === "undefined") return;
    const stored = window.localStorage.getItem(
      THEME_STORAGE_KEY,
    ) as ThemePreference | null;
    const initialTheme: ThemePreference = stored === "light" ? "light" : "dark";
    setThemeState(initialTheme);
    themeRef.current = initialTheme;
    applyThemeToDom(initialTheme);
  }, [existingContext]);

  // Listen to Firebase Auth state
  useEffect(() => {
    if (existingContext) return;
    if (!auth) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          const userProfile = await syncUserProfile(
            currentUser,
            themeRef.current,
          );
          setProfile(userProfile);
          if (userProfile.theme && userProfile.theme !== themeRef.current) {
            setThemeState(userProfile.theme);
            themeRef.current = userProfile.theme;
            applyThemeToDom(userProfile.theme);
            window.localStorage.setItem(THEME_STORAGE_KEY, userProfile.theme);
          }
        } catch (err) {
          console.error("Failed to sync profile:", err);
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [existingContext]);

  // If already wrapped by a parent AuthProvider, avoid duplicate listeners
  if (existingContext) {
    return <>{children}</>;
  }

  const setTheme = async (newTheme: ThemePreference) => {
    setThemeState(newTheme);
    applyThemeToDom(newTheme);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(THEME_STORAGE_KEY, newTheme);
    }
    if (user) {
      try {
        await updateUserTheme(user.uid, newTheme);
        setProfile((prev) => (prev ? { ...prev, theme: newTheme } : null));
      } catch (err) {
        console.error("Failed to update cloud theme:", err);
      }
    }
  };

  const toggleTheme = async () => {
    const next = theme === "dark" ? "light" : "dark";
    await setTheme(next);
  };

  const loginWithGoogle = async () => {
    if (!isFirebaseConfigured || !auth) {
      toast.error(
        "Cloud authentication is not configured. Set VITE_FIREBASE_API_KEY in your environment to enable sync.",
      );
      return;
    }
    try {
      const loggedUser = await fbLoginWithGoogle();
      toast.success(`Welcome back, ${loggedUser.displayName || "Prompter"}!`);
      // Auto sync any local threads
      const localThreads = loadThreads();
      const localSaved = loadLocalSavedPrompts();
      if (localThreads.length > 0 || localSaved.length > 0) {
        syncLocalToCloud(loggedUser.uid, localThreads, localSaved).catch(
          console.error,
        );
      }
    } catch (err: unknown) {
      const error = err as { code?: string; message?: string };
      if (error.code !== "auth/popup-closed-by-user") {
        toast.error(error.message || "Failed to sign in with Google");
      }
    }
  };

  const loginWithGithub = async () => {
    if (!isFirebaseConfigured || !auth) {
      toast.error(
        "Cloud authentication is not configured. Set VITE_FIREBASE_API_KEY in your environment to enable sync.",
      );
      return;
    }
    try {
      const loggedUser = await fbLoginWithGithub();
      toast.success(`Welcome back, ${loggedUser.displayName || "Developer"}!`);
      // Auto sync local threads
      const localThreads = loadThreads();
      const localSaved = loadLocalSavedPrompts();
      if (localThreads.length > 0 || localSaved.length > 0) {
        syncLocalToCloud(loggedUser.uid, localThreads, localSaved).catch(
          console.error,
        );
      }
    } catch (err: unknown) {
      const error = err as { code?: string; message?: string };
      if (error.code !== "auth/popup-closed-by-user") {
        toast.error(error.message || "Failed to sign in with GitHub");
      }
    }
  };

  const logout = async () => {
    if (!auth) {
      setUser(null);
      setProfile(null);
      return;
    }
    try {
      await fbLogoutUser();
      toast.success("Signed out successfully");
    } catch (err) {
      console.error("Logout error:", err);
      toast.error("Failed to sign out");
    }
  };

  const syncLocalData = async () => {
    if (!user) {
      toast.info(
        "Please sign in to sync your interview sessions to the cloud.",
      );
      return;
    }
    try {
      const localThreads = loadThreads();
      const localSaved = loadLocalSavedPrompts();
      const result = await syncLocalToCloud(user.uid, localThreads, localSaved);
      if (result.errors > 0) {
        toast.warning(
          `Synced ${result.threadsSynced} interviews and ${result.promptsSynced} saved prompts (${result.errors} item(s) skipped).`,
        );
      } else {
        toast.success(
          `Cloud sync complete: ${result.threadsSynced} interviews and ${result.promptsSynced} saved prompts synced!`,
        );
      }
    } catch (err) {
      console.error("Manual sync failed:", err);
      toast.error("Cloud synchronization encountered an error.");
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        theme,
        setTheme,
        toggleTheme,
        loginWithGoogle,
        loginWithGithub,
        logout,
        syncLocalData,
        isCloudSynced: !!user,
        isFirebaseConfigured,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  return context ?? DEFAULT_AUTH_CONTEXT;
}
