import { BrandLogo } from "./brand-logo";

export function LandingFooter() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer className="border-t border-border/50 bg-card/20 backdrop-blur-md py-12 sm:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          {/* Brand & Mission */}
          <div className="md:col-span-2 space-y-4">
            <BrandLogo size="md" subtitle="AI Prompt Engineering Studio" />
            <p className="text-sm text-muted-foreground max-w-md leading-relaxed">
              Prompt Master transforms vague user goals into certified,
              model-native master prompts for Claude, ChatGPT, and Gemini
              through a structured adaptive interview.
            </p>
            <div className="text-xs text-muted-foreground/80">
              Built for developers, entrepreneurs, researchers, and creators.
            </div>
          </div>

          {/* Navigation */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-foreground mb-4">
              Explore
            </h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <a
                  href="#features"
                  className="hover:text-foreground transition-colors"
                >
                  Features
                </a>
              </li>
              <li>
                <a
                  href="#consultants"
                  className="hover:text-foreground transition-colors"
                >
                  Domain Consultants
                </a>
              </li>
              <li>
                <a
                  href="#comparison"
                  className="hover:text-foreground transition-colors"
                >
                  Amateur vs. Master Prompt
                </a>
              </li>
              <li>
                <a
                  href="#how-it-works"
                  className="hover:text-foreground transition-colors"
                >
                  How It Works
                </a>
              </li>
              <li>
                <a
                  href="#faq"
                  className="hover:text-foreground transition-colors"
                >
                  FAQ
                </a>
              </li>
            </ul>
          </div>

          {/* Supported Models & Privacy */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-foreground mb-4">
              Supported Architectures
            </h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                <span>Anthropic Claude 3.7 / 3.5</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                <span>OpenAI ChatGPT-4o / o3</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
                <span>Google Gemini 2.0 / 1.5</span>
              </li>
              <li className="pt-2">
                <span className="inline-block rounded-md bg-secondary/80 px-2 py-1 text-[11px] font-medium text-foreground">
                  🔒 Local-First Browser Storage
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 border-t border-border/40 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <div>
            © {new Date().getFullYear()} Prompt Master. All rights reserved.
            Sessions are persisted locally in your browser.
          </div>
          <button
            type="button"
            onClick={scrollToTop}
            className="hover:text-foreground transition-colors cursor-pointer"
          >
            Back to top ↑
          </button>
        </div>
      </div>
    </footer>
  );
}
