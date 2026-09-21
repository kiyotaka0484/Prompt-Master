import { useState } from "react";
import { Copy, Check, XCircle, CheckCircle2 } from "lucide-react";

export function ComparisonSection() {
  const [copied, setCopied] = useState(false);

  const sampleMasterPrompt = `Act as a senior B2B SaaS Product Strategist & Enterprise Consultant.

My goal is to validate, design, and launch a lightweight customer feedback triage platform tailored specifically for mid-market engineering teams (20-100 devs) in the United States.

Here are my confirmed constraints and context:
- Starting Capital: $1,500 bootstrapping budget
- Time Commitment: 18 hours/week alongside a full-time role
- Technical Foundation: Proficient with Next.js, TypeScript, and Supabase
- Distribution Channel: Organic developer content on LinkedIn & cold outreach to VP of Engineering
- Primary Hurdle: Competitors (Canny, UserVoice) are too expensive and bloated for 50-person orgs

Your objective:
1. Provide a step-by-step 30-day validation sprint roadmap.
2. Outline the minimal lovable product (MLP) feature scope that can be built in 14 days without third-party bloat.
3. Draft 3 high-converting cold outreach email scripts addressing engineering friction.
4. Format your response with markdown tables, numbered stages, and risk mitigations.`;

  const handleCopy = () => {
    navigator.clipboard.writeText(sampleMasterPrompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section id="comparison" className="py-20 sm:py-28 relative">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-primary mb-3">
            The Performance Difference
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
            Amateur Prompt vs. Master Prompt
          </h2>
          <p className="mt-4 text-base sm:text-lg text-muted-foreground">
            See the exact difference in prompt architecture when you let Prompt
            Master interview you first.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
          {/* Amateur Prompt Card */}
          <div className="flex flex-col justify-between rounded-2xl border border-destructive/30 bg-destructive/5 p-6 sm:p-8">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 text-destructive font-semibold text-sm">
                  <XCircle className="h-4 w-4" />
                  <span>The Average User Prompt</span>
                </div>
                <span className="rounded-full bg-destructive/20 text-destructive text-[11px] font-bold px-2.5 py-0.5">
                  Score: 1.8 / 10
                </span>
              </div>

              <div className="rounded-xl border border-destructive/20 bg-background/60 p-4 font-mono text-sm text-foreground/80 mb-6">
                "Give me a business plan for an app that helps software teams
                organize feedback."
              </div>

              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">
                Why this generates useless AI fluff:
              </h4>

              <ul className="space-y-2.5 text-xs text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-destructive font-bold">✕</span>
                  <span>
                    <strong>Zero Role Definition:</strong> The AI doesn't know
                    whether to think like a junior dev, investor, or copywriter.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-destructive font-bold">✕</span>
                  <span>
                    <strong>No Budget or Time Constraints:</strong> Produces
                    generic recommendations to hire 10 engineers or raise VC
                    money.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-destructive font-bold">✕</span>
                  <span>
                    <strong>Undefined Audience:</strong> Assumes general
                    consumer market instead of targeted B2B engineering leads.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-destructive font-bold">✕</span>
                  <span>
                    <strong>No Formatting Structure:</strong> Dumps 8 vague
                    paragraphs you won't use.
                  </span>
                </li>
              </ul>
            </div>

            <div className="mt-8 rounded-xl bg-destructive/10 border border-destructive/20 p-3 text-center text-xs text-destructive font-medium">
              Result: Generic, hallucinated advice with zero execution value.
            </div>
          </div>

          {/* Prompt Master Engineered Card */}
          <div className="flex flex-col justify-between rounded-2xl border border-primary/40 bg-card/70 p-6 sm:p-8 shadow-xl shadow-primary/10 backdrop-blur-md">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 text-primary font-semibold text-sm">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Prompt Master Engineered Prompt</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-primary/20 text-primary text-[11px] font-bold px-2.5 py-0.5">
                    Score: 9.8 / 10
                  </span>
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="inline-flex items-center gap-1 rounded-lg border border-border/80 bg-card px-2 py-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                  >
                    {copied ? (
                      <Check className="h-3 w-3 text-emerald-400" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                    <span>{copied ? "Copied" : "Copy"}</span>
                  </button>
                </div>
              </div>

              <div className="rounded-xl border border-border/80 bg-background/80 p-4 font-mono text-xs text-foreground/90 leading-relaxed max-h-56 overflow-y-auto mb-6">
                <pre className="whitespace-pre-wrap font-sans text-xs">
                  {sampleMasterPrompt}
                </pre>
              </div>

              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">
                Why this extracts 10x better AI output:
              </h4>

              <ul className="space-y-2.5 text-xs text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span>
                    <strong>Explicit Persona & Stance:</strong> Constrains the
                    LLM to high-level B2B SaaS strategy.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span>
                    <strong>Locked Financial & Tech Realities:</strong>{" "}
                    Solutions adapt strictly to $1,500 capital and Supabase
                    stack.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span>
                    <strong>Targeted Persona Niche:</strong> Tailored for 20-100
                    person engineering organizations in the US.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span>
                    <strong>Actionable Deliverables:</strong> Requires
                    structured markdown tables, sprints, and cold outreach
                    scripts.
                  </span>
                </li>
              </ul>
            </div>

            <div className="mt-8 rounded-xl bg-primary/10 border border-primary/25 p-3 text-center text-xs text-primary font-medium">
              Result: Production-ready strategy ready to execute immediately.
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
