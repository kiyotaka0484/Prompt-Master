import { useNavigate } from "@tanstack/react-router";
import { ArrowRight, CheckCircle, Sparkles } from "lucide-react";
import { EXPERT_LIST, type ExpertId } from "@/lib/experts";
import { createFreshSession } from "@/lib/threads";

export function ConsultantShowcase() {
  const navigate = useNavigate();

  const handleSelectExpert = (expertId: ExpertId, exampleGoal?: string) => {
    const thread = createFreshSession({
      expert: expertId,
      goal: exampleGoal,
    });
    void navigate({ to: "/chat/$threadId", params: { threadId: thread.id } });
  };

  return (
    <section id="consultants" className="py-20 sm:py-28 relative">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-primary mb-3">
            <Sparkles className="h-3.5 w-3.5" />
            Specialized Domain Intelligence
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
            Meet Your Domain Consultants
          </h2>
          <p className="mt-4 text-base sm:text-lg text-muted-foreground">
            Generic prompts produce generic outputs. Prompt Master matches your
            project to a dedicated consultant trained in that domain's exact
            architecture, business models, and technical requirements.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
          {EXPERT_LIST.map((expert) => {
            const criticalSlots = expert.slots.filter(
              (s) => s.priority === "critical",
            );

            return (
              <div
                key={expert.id}
                className="group relative flex flex-col justify-between rounded-2xl border border-border/70 bg-card/60 p-6 sm:p-8 backdrop-blur-md transition-all duration-300 hover:border-primary/50 hover:bg-card/90 hover:shadow-xl hover:shadow-primary/10"
              >
                <div>
                  {/* Top Bar with Emoji & Tagline */}
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex items-center gap-3">
                      <div
                        className="flex h-12 w-12 items-center justify-center rounded-xl text-2xl border border-border/80 shadow-sm"
                        style={{
                          backgroundColor: `color-mix(in oklch, ${expert.accent} 15%, transparent)`,
                        }}
                      >
                        {expert.emoji}
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-foreground">
                          {expert.name}
                        </h3>
                        <p className="text-xs font-medium text-primary">
                          {expert.tagline}
                        </p>
                      </div>
                    </div>

                    <span className="rounded-full bg-secondary px-2.5 py-1 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                      {expert.slots.length} Dimensions
                    </span>
                  </div>

                  <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                    {expert.description}
                  </p>

                  {/* Critical slots pills */}
                  <div className="mb-6">
                    <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                      Critical Parameters Analyzed
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {criticalSlots.map((slot) => (
                        <span
                          key={slot.id}
                          className="inline-flex items-center gap-1 rounded-md bg-secondary/80 border border-border/50 px-2 py-0.5 text-xs text-foreground/90 font-medium"
                        >
                          <CheckCircle className="h-3 w-3 text-primary" />
                          {slot.label}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Example prompt pills */}
                  <div className="mb-6">
                    <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                      Popular Goals
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {expert.examples.map((eg) => (
                        <button
                          key={eg}
                          type="button"
                          onClick={() => handleSelectExpert(expert.id, eg)}
                          className="rounded-lg border border-border/60 bg-background/50 px-2.5 py-1 text-xs text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors text-left"
                        >
                          "{eg}"
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Card footer CTA */}
                <div className="pt-4 border-t border-border/50 flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    Includes Layman Teacher Mode
                  </span>
                  <button
                    type="button"
                    onClick={() => handleSelectExpert(expert.id)}
                    className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-primary/80 group-hover:translate-x-1 transition-all cursor-pointer"
                  >
                    <span>Consult with {expert.name.split(" ")[0]}</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
