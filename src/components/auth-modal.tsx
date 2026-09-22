import { useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Cloud,
  CheckCircle2,
  LogOut,
  RefreshCw,
  Sun,
  Moon,
  Sparkles,
  Shield,
  Laptop,
} from "lucide-react";

interface AuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AuthModal({ open, onOpenChange }: AuthModalProps) {
  const {
    user,
    profile,
    theme,
    toggleTheme,
    loginWithGoogle,
    loginWithGithub,
    logout,
    syncLocalData,
    loading,
  } = useAuth();
  const [syncing, setSyncing] = useState(false);

  const handleSync = async () => {
    setSyncing(true);
    await syncLocalData();
    setSyncing(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md border-border/80 bg-card p-4 sm:p-6 shadow-2xl backdrop-blur-2xl">
        <DialogHeader>
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-2xl border border-primary/30 bg-primary/10 shadow-lg shadow-primary/20">
            <Cloud className="h-6 w-6 text-primary" aria-hidden="true" />
          </div>
          <DialogTitle className="text-center text-xl font-bold tracking-tight">
            {user ? "Your Prompt Master Account" : "Sign In to Prompt Master"}
          </DialogTitle>
          <DialogDescription className="text-center text-sm text-muted-foreground">
            {user
              ? "All your interviews, custom prompts, and settings are synced in the cloud."
              : "Sync your prompt sessions across all your devices and never lose your master prompts."}
          </DialogDescription>
        </DialogHeader>

        {user ? (
          <div className="mt-4 space-y-4">
            {/* User Profile Card */}
            <div className="flex items-center gap-3.5 rounded-xl border border-border/70 bg-background/60 p-3.5">
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || "Avatar"}
                  className="h-12 w-12 rounded-full border border-primary/30 object-cover"
                />
              ) : (
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/20 text-base font-bold text-primary">
                  {(user.displayName || user.email || "U")[0].toUpperCase()}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="truncate font-semibold text-foreground">
                    {user.displayName || "Prompter"}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-semibold text-primary">
                    <CheckCircle2 className="h-3 w-3" aria-hidden="true" />{" "}
                    Synced
                  </span>
                </div>
                <div className="truncate text-xs text-muted-foreground">
                  {user.email}
                </div>
                <div className="mt-0.5 text-[10px] text-muted-foreground">
                  UID: {user.uid.slice(0, 10)}…
                </div>
              </div>
            </div>

            {/* Cloud Sync Status */}
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-300">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 font-medium">
                  <Cloud
                    className="h-4 w-4 text-emerald-400"
                    aria-hidden="true"
                  />
                  <span>Cloud Database Active</span>
                </div>
                <button
                  type="button"
                  onClick={handleSync}
                  disabled={syncing}
                  aria-label="Synchronize local data to cloud database now"
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 underline hover:text-emerald-300 disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:outline-none rounded"
                >
                  <RefreshCw
                    className={`h-3 w-3 ${syncing ? "animate-spin" : ""}`}
                    aria-hidden="true"
                  />
                  <span>{syncing ? "Syncing…" : "Sync Now"}</span>
                </button>
              </div>
              <p className="mt-1 text-[11px] text-emerald-300/80">
                Your prompt history, ratings, and saved prompts are securely
                backed up in Google Cloud Firestore.
              </p>
            </div>

            {/* Theme & Preferences */}
            <div className="flex items-center justify-between rounded-xl border border-border/70 bg-background/40 px-3.5 py-2.5">
              <div className="flex items-center gap-2">
                {theme === "dark" ? (
                  <Moon className="h-4 w-4 text-primary" aria-hidden="true" />
                ) : (
                  <Sun className="h-4 w-4 text-amber-500" aria-hidden="true" />
                )}
                <div>
                  <div className="text-xs font-semibold">Theme Mode</div>
                  <div className="text-[10px] text-muted-foreground capitalize">
                    Currently using {theme} mode
                  </div>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => toggleTheme()}
                aria-label={`Switch theme to ${theme === "dark" ? "Light" : "Dark"}`}
                className="h-7 text-xs"
              >
                Switch to {theme === "dark" ? "Light" : "Dark"}
              </Button>
            </div>

            {/* Actions */}
            <div className="pt-2 flex justify-between gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onOpenChange(false)}
                className="flex-1"
              >
                Close
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={async () => {
                  await logout();
                  onOpenChange(false);
                }}
                className="inline-flex items-center gap-1.5"
              >
                <LogOut className="h-3.5 w-3.5" aria-hidden="true" /> Sign Out
              </Button>
            </div>
          </div>
        ) : (
          <div className="mt-4 space-y-4">
            {/* Feature bullets */}
            <div className="grid grid-cols-1 gap-2 rounded-xl border border-border/60 bg-background/50 p-3 text-xs text-muted-foreground">
              <div className="flex items-center gap-2 text-foreground">
                <Sparkles
                  className="h-3.5 w-3.5 text-primary shrink-0"
                  aria-hidden="true"
                />
                <span>Save and favorite your multi-model prompts</span>
              </div>
              <div className="flex items-center gap-2 text-foreground">
                <Cloud
                  className="h-3.5 w-3.5 text-sky-400 shrink-0"
                  aria-hidden="true"
                />
                <span>Real-time cloud backup via Firebase Firestore</span>
              </div>
              <div className="flex items-center gap-2 text-foreground">
                <Shield
                  className="h-3.5 w-3.5 text-emerald-400 shrink-0"
                  aria-hidden="true"
                />
                <span>Private & secure authentication via OAuth</span>
              </div>
            </div>

            {/* Provider Buttons */}
            <div className="space-y-2.5 pt-1">
              <button
                type="button"
                onClick={async () => {
                  await loginWithGoogle();
                  onOpenChange(false);
                }}
                disabled={loading}
                aria-label="Continue with Google"
                className="flex w-full items-center justify-center gap-3 rounded-xl border border-border/80 bg-background/90 px-4 py-2.5 text-sm font-semibold text-foreground shadow-sm hover:bg-card hover:border-primary/40 active:scale-[0.99] focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none transition-all cursor-pointer min-h-[44px]"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Continue with Google</span>
              </button>

              <button
                type="button"
                onClick={async () => {
                  await loginWithGithub();
                  onOpenChange(false);
                }}
                disabled={loading}
                aria-label="Continue with GitHub"
                className="flex w-full items-center justify-center gap-3 rounded-xl border border-border/80 bg-background/90 px-4 py-2.5 text-sm font-semibold text-foreground shadow-sm hover:bg-card hover:border-primary/40 active:scale-[0.99] focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none transition-all cursor-pointer min-h-[44px]"
              >
                <svg
                  className="h-4 w-4 fill-current text-foreground"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                  />
                </svg>
                <span>Continue with GitHub</span>
              </button>
            </div>

            {/* Theme toggle for guests */}
            <div className="flex items-center justify-between border-t border-border/50 pt-3">
              <span className="text-xs text-muted-foreground">Theme mode:</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => toggleTheme()}
                aria-label={`Toggle theme: currently ${theme} mode`}
                className="h-7 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
              >
                {theme === "dark" ? (
                  <>
                    <Moon className="h-3 w-3" aria-hidden="true" /> Dark
                  </>
                ) : (
                  <>
                    <Sun
                      className="h-3 w-3 text-amber-500"
                      aria-hidden="true"
                    />{" "}
                    Light
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
