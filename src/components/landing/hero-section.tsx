import { useState, type FormEvent } from "react";
import { useNavigate } from "@tanstack/react-router";
import { motion } from "motion/react";
import {
  Sparkles,
  ArrowRight,
  Target,
  CheckCircle2,
  ShieldCheck,
  Cpu,
  Layers,
} from "lucide-react";
import { createFreshSession } from "@/lib/threads";

const SUGGESTED_GOALS = [
  { text: "Start a B2B micro-SaaS business", emoji: "💼", tag: "Business" },
  {
    text: "Build a modern portfolio site with React",
    emoji: "🧩",
    tag: "Website",
  },
  {
    text: "Create a 60-day roadmap to master System Design",
    emoji: "📚",
    tag: "Study",
  },
  {
    text: "Launch a faceless YouTube automation channel",
    emoji: "🎬",
    tag: "Creator",
  },
];

export function HeroSection() {
  const navigate = useNavigate();
  const [goal, setGoal] = useState("");

  const handleSubmit = (e?: FormEvent) => {
    e?.preventDefault();
    const clean = goal.trim();
    const fresh = createFreshSession({ goal: clean || undefined });
    void navigate({ to: "/chat/$threadId", params: { threadId: fresh.id } });
  };

  const handleChipClick = (suggestionText: string) => {
    const fresh = createFreshSession({ goal: suggestionText });
    void navigate({ to: "/chat/$threadId", params: { threadId: fresh.id } });
  };

  return (
    <section className="relative pt-12 pb-20 sm:pt-20 sm:pb-28 overflow-hidden">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 text-center">
        {/* Top announcement pill */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-medium text-primary shadow-sm shadow-primary/10 backdrop-blur-md mb-6"
        >
          <Sparkles className="h-3.5 w-3.5 animate-pulse text-primary" />
          <span className="font-semibold tracking-wide">Prompt Master 2.0</span>
          <span className="text-muted-foreground/60">•</span>
          <span className="text-foreground/90">
            The AI Prompt Engineering Studio
          </span>
        </motion.div>

        {/* Hero headline */}
        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-balance text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.1] text-foreground"
        >
          Stop Guessing Prompts. <br className="hidden sm:inline" />
          <span className="bg-gradient-to-r from-primary via-purple-400 to-fuchsia-400 bg-clip-text text-transparent">
            Engineer AI Mastery.
          </span>
        </motion.h1>

        {/* Subtitle value proposition */}
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mt-6 text-balance text-base sm:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed"
        >
          Prompt Master acts as your personal AI consultant. Through a
          structured, adaptive interview, it extracts the missing constraints,
          edge cases, and context beginners overlook — then writes
          production-ready master prompts tailored natively to{" "}
          <span className="text-foreground font-semibold">Claude</span>,{" "}
          <span className="text-foreground font-semibold">ChatGPT</span>, and{" "}
          <span className="text-foreground font-semibold">Gemini</span>.
        </motion.p>

        {/* Interactive Prompt Starter Box */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-10 max-w-2xl mx-auto"
        >
          <form
            onSubmit={handleSubmit}
            className="group relative rounded-2xl border border-primary/35 bg-card/70 p-2 shadow-xl shadow-primary/10 backdrop-blur-xl transition-all focus-within:border-primary focus-within:shadow-2xl focus-within:shadow-primary/20"
          >
            <div className="flex flex-col sm:flex-row items-stretch gap-2">
              <div className="relative flex-1 flex items-center pl-3">
                <Target
                  className="h-5 w-5 text-muted-foreground/70 shrink-0 mr-2"
                  aria-hidden="true"
                />
                <input
                  type="text"
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                  placeholder="Drop your goal (e.g. I want to build a SaaS startup, learn Python, start a channel…)"
                  aria-label="Enter your project goal or prompt objective"
                  className="w-full bg-transparent text-sm sm:text-base text-foreground placeholder:text-muted-foreground/60 focus:outline-none py-2.5"
                />
              </div>

              <button
                type="submit"
                aria-label="Start AI Prompt Interview"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary via-purple-500 to-fuchsia-600 px-6 py-3 text-sm font-semibold text-primary-foreground shadow-md shadow-primary/25 hover:shadow-lg hover:shadow-primary/40 hover:scale-[1.02] active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none transition-all duration-200 shrink-0 cursor-pointer min-h-[44px]"
              >
                <span>Start Interview</span>
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          </form>

          {/* Quick chip suggestions */}
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
            <span className="text-xs text-muted-foreground/70 mr-1">
              Or try:
            </span>
            {SUGGESTED_GOALS.map((item) => (
              <button
                key={item.text}
                type="button"
                onClick={() => handleChipClick(item.text)}
                aria-label={`Start interview with suggestion: ${item.text}`}
                className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-card/40 hover:bg-card hover:border-primary/50 px-3.5 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-all duration-150 cursor-pointer min-h-[36px] focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
              >
                <span aria-hidden="true">{item.emoji}</span>
                <span className="truncate max-w-[200px] sm:max-w-none">
                  {item.text}
                </span>
              </button>
            ))}
          </div>
        </motion.div>

        {/* Model badges & trust bar */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="mt-16 pt-8 border-t border-border/40 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-4xl mx-auto"
        >
          <div className="flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-card/25 border border-border/40">
            <Cpu className="h-4 w-4 text-primary" />
            <div className="text-left text-xs">
              <span className="font-semibold text-foreground">Claude 3.7</span>
              <span className="block text-[10px] text-muted-foreground">
                XML System Tags
              </span>
            </div>
          </div>

          <div className="flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-card/25 border border-border/40">
            <Layers className="h-4 w-4 text-emerald-400" />
            <div className="text-left text-xs">
              <span className="font-semibold text-foreground">ChatGPT-4o</span>
              <span className="block text-[10px] text-muted-foreground">
                Structured Role Prompts
              </span>
            </div>
          </div>

          <div className="flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-card/25 border border-border/40">
            <CheckCircle2 className="h-4 w-4 text-cyan-400" />
            <div className="text-left text-xs">
              <span className="font-semibold text-foreground">Gemini 2.0</span>
              <span className="block text-[10px] text-muted-foreground">
                Task & Constraints Specs
              </span>
            </div>
          </div>

          <div className="flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-card/25 border border-border/40">
            <ShieldCheck className="h-4 w-4 text-amber-400" />
            <div className="text-left text-xs">
              <span className="font-semibold text-foreground">
                10.0 Quality Gate
              </span>
              <span className="block text-[10px] text-muted-foreground">
                Mathematical Verification
              </span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
