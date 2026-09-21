import { useState, useEffect } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  Sparkles,
  Menu,
  X,
  ArrowRight,
  History,
  Plus,
  Sun,
  Moon,
  Bookmark,
  Cloud,
  User as UserIcon,
} from "lucide-react";
import { BrandLogo } from "./brand-logo";
import {
  loadThreads,
  createFreshSession,
  type ThreadRecord,
} from "@/lib/threads";
import { useAuth } from "@/contexts/auth-context";
import { AuthModal } from "@/components/auth-modal";
import { SavedPromptsModal } from "@/components/saved-prompts-modal";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function LandingNav() {
  const navigate = useNavigate();
  const { user, theme, toggleTheme } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [threads, setThreads] = useState<ThreadRecord[]>([]);
  const [scrolled, setScrolled] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [libraryModalOpen, setLibraryModalOpen] = useState(false);

  useEffect(() => {
    setThreads(loadThreads());

    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const recentThreads = threads
    .filter((t) => t.messages.length > 0)
    .sort((a, b) => b.updatedAt - a.updatedAt)
    .slice(0, 3);

  const handleStartInterview = () => {
    const fresh = createFreshSession();
    void navigate({ to: "/chat/$threadId", params: { threadId: fresh.id } });
  };

  return (
    <>
      <header
        className={cn(
          "sticky top-0 z-50 w-full transition-all duration-300",
          scrolled
            ? "border-b border-border/60 bg-background/80 backdrop-blur-xl shadow-sm shadow-black/20"
            : "border-b border-transparent bg-transparent",
        )}
      >
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Brand */}
          <Link to="/" className="flex items-center gap-2">
            <BrandLogo size="md" subtitle="AI Prompt Studio" />
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-muted-foreground">
            <a
              href="#features"
              className="hover:text-foreground transition-colors"
            >
              Features
            </a>
            <a
              href="#consultants"
              className="hover:text-foreground transition-colors"
            >
              Consultants
            </a>
            <a
              href="#comparison"
              className="hover:text-foreground transition-colors"
            >
              Comparison
            </a>
            <a
              href="#how-it-works"
              className="hover:text-foreground transition-colors"
            >
              How It Works
            </a>
            <a href="#faq" className="hover:text-foreground transition-colors">
              FAQ
            </a>
          </nav>

          {/* Desktop CTA actions */}
          <div className="hidden sm:flex items-center gap-2.5">
            {/* Theme Toggle Button */}
            <button
              type="button"
              onClick={() => toggleTheme()}
              className="rounded-lg p-2 text-muted-foreground hover:bg-card hover:text-foreground transition-colors"
              title={`Switch to ${theme === "dark" ? "Light" : "Dark"} mode`}
            >
              {theme === "dark" ? (
                <Sun className="h-4 w-4 text-amber-400" />
              ) : (
                <Moon className="h-4 w-4 text-primary" />
              )}
            </button>

            {/* Prompt Library Button */}
            <button
              type="button"
              onClick={() => setLibraryModalOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border/70 bg-card/60 px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-card hover:text-foreground transition-colors"
              title="Open Prompt Library & Favorites"
            >
              <Bookmark className="h-3.5 w-3.5 text-primary" />
              <span>Library</span>
            </button>

            {/* User Account / Sign In */}
            {user ? (
              <button
                type="button"
                onClick={() => setAuthModalOpen(true)}
                className="inline-flex items-center gap-2 rounded-lg border border-border/70 bg-card/60 px-2.5 py-1.5 text-xs font-medium text-foreground hover:bg-card transition-colors"
              >
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || "User"}
                    className="h-5 w-5 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/20 text-[10px] font-bold text-primary">
                    {(user.displayName || user.email || "U")[0].toUpperCase()}
                  </div>
                )}
                <span className="max-w-[100px] truncate">
                  {user.displayName || "Account"}
                </span>
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setAuthModalOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border/70 bg-card/60 px-3 py-1.5 text-xs font-medium text-foreground/90 hover:bg-card hover:border-primary/40 transition-colors"
              >
                <Cloud className="h-3.5 w-3.5 text-primary" />
                <span>Sign In</span>
              </button>
            )}

            {recentThreads.length > 0 && (
              <Link
                to="/chat/$threadId"
                params={{ threadId: recentThreads[0].id }}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border/70 bg-card/60 px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-card hover:text-foreground transition-colors"
              >
                <History className="h-3.5 w-3.5 text-primary" />
                <span>Resume</span>
              </Link>
            )}

            <button
              type="button"
              onClick={handleStartInterview}
              className="group relative inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary via-purple-500 to-fuchsia-600 px-4 py-2 text-sm font-semibold text-primary-foreground shadow-md shadow-primary/25 hover:shadow-lg hover:shadow-primary/40 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
            >
              <Sparkles className="h-4 w-4 transition-transform group-hover:rotate-12" />
              <span>Start Interview</span>
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            </button>
          </div>

          {/* Mobile menu toggle & quick buttons */}
          <div className="flex items-center gap-2 sm:hidden">
            <button
              type="button"
              onClick={() => toggleTheme()}
              className="rounded-lg p-1.5 text-muted-foreground hover:bg-card hover:text-foreground"
            >
              {theme === "dark" ? (
                <Sun className="h-4 w-4 text-amber-400" />
              ) : (
                <Moon className="h-4 w-4 text-primary" />
              )}
            </button>

            <button
              type="button"
              onClick={() => setAuthModalOpen(true)}
              className="rounded-lg p-1.5 text-muted-foreground hover:bg-card hover:text-foreground"
            >
              {user ? (
                <Cloud className="h-4 w-4 text-emerald-400" />
              ) : (
                <UserIcon className="h-4 w-4" />
              )}
            </button>

            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="rounded-lg p-2 text-muted-foreground hover:bg-card hover:text-foreground"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile dropdown */}
        {mobileMenuOpen && (
          <div className="border-b border-border/60 bg-background/95 backdrop-blur-xl px-4 py-5 sm:hidden">
            <nav className="flex flex-col gap-3 text-sm font-medium">
              <a
                href="#features"
                onClick={() => setMobileMenuOpen(false)}
                className="py-1 text-muted-foreground hover:text-foreground"
              >
                Features
              </a>
              <a
                href="#consultants"
                onClick={() => setMobileMenuOpen(false)}
                className="py-1 text-muted-foreground hover:text-foreground"
              >
                Consultants
              </a>
              <a
                href="#comparison"
                onClick={() => setMobileMenuOpen(false)}
                className="py-1 text-muted-foreground hover:text-foreground"
              >
                Comparison
              </a>
              <a
                href="#how-it-works"
                onClick={() => setMobileMenuOpen(false)}
                className="py-1 text-muted-foreground hover:text-foreground"
              >
                How It Works
              </a>
              <a
                href="#faq"
                onClick={() => setMobileMenuOpen(false)}
                className="py-1 text-muted-foreground hover:text-foreground"
              >
                FAQ
              </a>
            </nav>

            <div className="mt-4 flex flex-col gap-2 pt-3 border-t border-border/40">
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  setLibraryModalOpen(true);
                }}
                className="flex items-center justify-center gap-2 rounded-lg border border-border bg-card/60 py-2 text-xs font-medium text-foreground"
              >
                <Bookmark className="h-3.5 w-3.5 text-primary" />
                Prompt Library & Favorites
              </button>

              {recentThreads.length > 0 && (
                <Link
                  to="/chat/$threadId"
                  params={{ threadId: recentThreads[0].id }}
                  className="flex items-center justify-center gap-2 rounded-lg border border-border bg-card/60 py-2 text-xs font-medium"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <History className="h-3.5 w-3.5 text-primary" />
                  Resume: {recentThreads[0].title}
                </Link>
              )}

              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleStartInterview();
                }}
                className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-fuchsia-600 py-2.5 text-sm font-semibold text-primary-foreground shadow-md shadow-primary/20"
              >
                <Plus className="h-4 w-4" /> Start Interview
              </button>
            </div>
          </div>
        )}
      </header>

      <AuthModal open={authModalOpen} onOpenChange={setAuthModalOpen} />
      <SavedPromptsModal
        open={libraryModalOpen}
        onOpenChange={setLibraryModalOpen}
      />
    </>
  );
}
