import { MessageSquare, Cpu, CheckCircle } from "lucide-react";

const STEPS = [
  {
    number: "01",
    icon: MessageSquare,
    title: "Drop Your Raw Vision",
    description:
      "Start by speaking naturally in 1 sentence. Whether it's 'I want to build a fitness app' or 'I need to learn Python', Prompt Master instantly assigns the optimal domain specialist.",
  },
  {
    number: "02",
    icon: Cpu,
    title: "Take The Socratic Interview",
    description:
      "Answer 6 to 10 tailored, high-value questions one at a time. Prompt Master learns your budget, tech stack, constraints, and audience, while you can ask 'what does this mean?' anytime.",
  },
  {
    number: "03",
    icon: CheckCircle,
    title: "Copy Verified Master Prompts",
    description:
      "Once your readiness score reaches certification grade, Prompt Master outputs 3 distinct, production-ready prompts tailored natively for Claude, ChatGPT, and Gemini.",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-20 sm:py-28 relative">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-primary mb-3">
            Simple 3-Step Process
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
            How Prompt Master Works
          </h2>
          <p className="mt-4 text-base sm:text-lg text-muted-foreground">
            From an unformed idea to a certified, model-native master prompt in
            under 3 minutes.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          {STEPS.map((step, idx) => {
            const Icon = step.icon;
            return (
              <div
                key={step.number}
                className="relative rounded-2xl border border-border/70 bg-card/40 p-7 backdrop-blur-sm transition-all duration-300 hover:border-primary/50 hover:bg-card/70 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <span className="font-mono text-2xl font-black text-primary/80">
                      {step.number}
                    </span>
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <Icon className="h-5 w-5" />
                    </div>
                  </div>

                  <h3 className="text-xl font-bold text-foreground mb-3">
                    {step.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {step.description}
                  </p>
                </div>

                {idx < 2 && (
                  <div className="hidden md:block absolute -right-4 top-1/2 -translate-y-1/2 z-10 text-muted-foreground/40 font-mono text-lg">
                    →
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
