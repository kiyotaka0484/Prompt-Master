import {
  MessageSquareCode,
  Layers,
  Award,
  HelpCircle,
  ShieldCheck,
  Zap,
} from "lucide-react";

const FEATURES = [
  {
    icon: MessageSquareCode,
    title: "Adaptive Socratic Interview",
    badge: "1-Question Cadence",
    description:
      "Unlike static prompt templates or overwhelming questionnaires, Prompt Master asks one sharp question at a time. It chains context from your previous answers and skips anything already inferable.",
  },
  {
    icon: Layers,
    title: "Multi-Model Native Prompts",
    badge: "Claude • GPT • Gemini",
    description:
      "One size never fits all. Prompt Master outputs 3 distinct master prompts: XML semantic tags for Claude, structured procedural sections for ChatGPT, and bulleted constraint specs for Gemini.",
  },
  {
    icon: Award,
    title: "Mathematical Quality Certificate",
    badge: "10.0 Rating Matrix",
    description:
      "Every master prompt is certified across 6 mathematical dimensions: Clarity, Context, Constraints, Audience, Output Specification, and Completeness before generation is unlocked.",
  },
  {
    icon: HelpCircle,
    title: "Teacher & 'Why' Intelligence",
    badge: "Instant Layman Explanations",
    description:
      "Encountered a term like MVP, B2B, RPM, or API? Ask 'What does this mean?' or click 'Why am I being asked this?' to receive plain-English guidance without derailing your interview.",
  },
  {
    icon: Zap,
    title: "Anti-Vagueness & Edge-Case Catching",
    badge: "Intelligent Guardrails",
    description:
      "Answers like 'whatever', 'maybe', or 'fast' will be politely challenged. Prompt Master ensures your constraints are concrete enough to prevent AI hallucinations.",
  },
  {
    icon: ShieldCheck,
    title: "Private & Local-First Architecture",
    badge: "Zero Tracking",
    description:
      "Your strategic ideas, proprietary concepts, and generated prompts are persisted strictly inside your browser's local sandbox. No data tracking, no external user profiling.",
  },
];

export function FeatureGrid() {
  return (
    <section id="features" className="py-20 sm:py-28 relative">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-primary mb-3">
            Engineered For Excellence
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
            Why Prompt Master Outperforms Generic AI Prompts
          </h2>
          <p className="mt-4 text-base sm:text-lg text-muted-foreground">
            Prompt engineering isn't about magical keywords — it's about
            providing the context, constraints, and success criteria that LLMs
            require to perform at an expert level.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {FEATURES.map((feat) => {
            const Icon = feat.icon;
            return (
              <div
                key={feat.title}
                className="group relative rounded-2xl border border-border/70 bg-card/50 p-6 sm:p-7 backdrop-blur-sm transition-all duration-300 hover:border-primary/50 hover:bg-card/80 hover:-translate-y-1 hover:shadow-lg hover:shadow-primary/10"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 border border-primary/20 text-primary transition-colors group-hover:bg-primary/20">
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="rounded-full bg-secondary/80 border border-border/50 px-2.5 py-0.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                    {feat.badge}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-foreground mb-2">
                  {feat.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {feat.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
