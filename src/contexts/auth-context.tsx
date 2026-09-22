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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

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

export function AuthProvider({ children }: { children: ReactNode }) {
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
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem(
      THEME_STORAGE_KEY,
    ) as ThemePreference | null;
    const initialTheme: ThemePreference = stored === "light" ? "light" : "dark";
    setThemeState(initialTheme);
    themeRef.current = initialTheme;
    applyThemeToDom(initialTheme);
  }, []);

  // Listen to Firebase Auth state
  useEffect(() => {
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
  }, []);

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
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
