import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
  type ErrorComponentProps,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import { Sparkles, Home, RotateCcw, AlertTriangle } from "lucide-react";
import { AuthProvider } from "@/contexts/auth-context";
import { Toaster } from "sonner";
import logoImg from "@/assets/prompt-master-logo.png";
import appCss from "../styles.css?url";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 text-foreground relative overflow-hidden">
      {/* Soft ambient glow */}
      <div className="pointer-events-none absolute h-96 w-96 rounded-full bg-primary/20 blur-3xl" />

      <div className="relative z-10 max-w-md text-center rounded-2xl border border-border/70 bg-card/70 p-8 sm:p-10 shadow-xl backdrop-blur-xl">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-primary/30 bg-primary/10 shadow-md shadow-primary/20">
          <img
            src={logoImg}
            alt="Prompt Master"
            className="h-9 w-9 object-contain"
          />
        </div>

        <span className="rounded-full bg-primary/15 border border-primary/30 px-3 py-1 text-xs font-semibold text-primary uppercase tracking-wider">
          404 Not Found
        </span>

        <h1 className="mt-4 text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
          Session or Page Not Found
        </h1>

        <p className="mt-2.5 text-sm text-muted-foreground leading-relaxed">
          The requested prompt session or link does not exist, or has been
          cleared from local browser memory.
        </p>

        <div className="mt-7 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            to="/"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-fuchsia-600 px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-md shadow-primary/20 hover:scale-[1.02] transition-all cursor-pointer"
          >
            <Home className="h-4 w-4" />
            <span>Return Home</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: ErrorComponentProps) {
  console.error(error);
  const router = useRouter();

  useEffect(() => {
    console.error("Root error boundary caught:", error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 text-foreground relative overflow-hidden">
      <div className="pointer-events-none absolute h-96 w-96 rounded-full bg-destructive/15 blur-3xl" />

      <div className="relative z-10 max-w-md text-center rounded-2xl border border-destructive/30 bg-card/70 p-8 sm:p-10 shadow-xl backdrop-blur-xl">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-destructive/10 text-destructive border border-destructive/20">
          <AlertTriangle className="h-6 w-6" />
        </div>

        <span className="rounded-full bg-destructive/15 border border-destructive/25 px-3 py-1 text-xs font-semibold text-destructive uppercase tracking-wider">
          Something went wrong
        </span>

        <h1 className="mt-4 text-xl font-bold tracking-tight text-foreground">
          Application Error
        </h1>

        <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
          We encountered an unexpected error. You can try refreshing the view or
          return to the studio.
        </p>

        <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 transition-all cursor-pointer"
          >
            <RotateCcw className="h-4 w-4" />
            <span>Try Again</span>
          </button>

          <Link
            to="/"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-card/80 px-4 py-2.5 text-sm font-medium text-foreground hover:bg-card transition-all"
          >
            <Home className="h-4 w-4" />
            <span>Return Home</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()(
  {
    head: () => ({
      meta: [
        { charSet: "utf-8" },
        { name: "viewport", content: "width=device-width, initial-scale=1" },
        { title: "Prompt Master — AI Prompt Engineering Studio" },
        {
          name: "description",
          content:
            "Prompt Master acts as your personal AI consultant. Through a structured Socratic interview, it crafts certified master prompts natively tuned for Claude, ChatGPT, and Gemini.",
        },
        { name: "author", content: "Prompt Master" },
        {
          property: "og:title",
          content: "Prompt Master — AI Prompt Engineering Studio",
        },
        {
          property: "og:description",
          content:
            "Prompt Master acts as your personal AI consultant. Through a structured Socratic interview, it crafts certified master prompts natively tuned for Claude, ChatGPT, and Gemini.",
        },
        { property: "og:type", content: "website" },
        { property: "og:site_name", content: "Prompt Master" },
        { name: "twitter:card", content: "summary_large_image" },
        {
          name: "twitter:title",
          content: "Prompt Master — AI Prompt Engineering Studio",
        },
        {
          name: "twitter:description",
          content:
            "Adaptive Socratic AI interviews that engineer certified, model-native prompts for Claude, ChatGPT, and Gemini.",
        },
      ],
      links: [
        {
          rel: "stylesheet",
          href: appCss,
        },
      ],
    }),
    shellComponent: RootShell,
    component: RootComponent,
    notFoundComponent: NotFoundComponent,
    errorComponent: ErrorComponent,
  },
);

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body suppressHydrationWarning>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Outlet />
        <Toaster richColors closeButton position="bottom-right" />
      </AuthProvider>
    </QueryClientProvider>
  );
}
