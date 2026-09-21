import { useNavigate } from "@tanstack/react-router";
import { Sparkles, ArrowRight, ShieldCheck } from "lucide-react";
import { createFreshSession } from "@/lib/threads";

export function CtaBanner() {
  const navigate = useNavigate();

  const handleStart = () => {
    const thread = createFreshSession();
    void navigate({ to: "/chat/$threadId", params: { threadId: thread.id } });
  };

  return (
    <section className="py-16 sm:py-24 relative overflow-hidden">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-3xl border border-primary/40 bg-gradient-to-b from-card/80 via-card/50 to-card/90 p-8 sm:p-14 text-center shadow-2xl shadow-primary/15 backdrop-blur-xl overflow-hidden">
          {/* Radial ambient glow in background */}
          <div className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 h-72 w-96 rounded-full bg-primary/25 blur-3xl" />

          <div className="relative z-10 max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-primary mb-4">
              <Sparkles className="h-3.5 w-3.5" />
              100% Free & Browser-Local
            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-foreground leading-tight">
              Ready to write prompts that actually get results?
            </h2>

            <p className="mt-4 text-base sm:text-lg text-muted-foreground">
              Experience the difference an adaptive consultant makes. Start your
              first interview in 5 seconds without signing up.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                type="button"
                onClick={handleStart}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary via-purple-500 to-fuchsia-600 px-8 py-3.5 text-base font-semibold text-primary-foreground shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/40 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 cursor-pointer"
              >
                <Sparkles className="h-4 w-4" />
                <span>Start Your Interview</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-6 flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <ShieldCheck className="h-4 w-4 text-primary" />
              <span>No credit card required. Sessions saved locally.</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
