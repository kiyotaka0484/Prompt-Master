import { createFileRoute } from "@tanstack/react-router";
import { LandingAnimatedBackground } from "@/components/landing/animated-background";
import { LandingNav } from "@/components/landing/landing-nav";
import { HeroSection } from "@/components/landing/hero-section";
import { ConsultantShowcase } from "@/components/landing/consultant-showcase";
import { FeatureGrid } from "@/components/landing/feature-grid";
import { ComparisonSection } from "@/components/landing/comparison-section";
import { HowItWorks } from "@/components/landing/how-it-works";
import { FaqSection } from "@/components/landing/faq-section";
import { CtaBanner } from "@/components/landing/cta-banner";
import { LandingFooter } from "@/components/landing/landing-footer";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Prompt Master — AI-Powered Prompt Engineering Studio" },
      {
        name: "description",
        content:
          "Prompt Master interviews you like a senior consultant, extracts critical constraints, and crafts certified, model-native master prompts for Claude, ChatGPT, and Gemini.",
      },
      {
        property: "og:title",
        content: "Prompt Master — AI-Powered Prompt Engineering Studio",
      },
      {
        property: "og:description",
        content:
          "Transform vague ideas into certified master prompts for Claude, ChatGPT, and Gemini through an adaptive, Socratic AI interview.",
      },
      {
        property: "og:type",
        content: "website",
      },
      {
        property: "og:url",
        content: "https://prompt-master.ai",
      },
      {
        name: "twitter:card",
        content: "summary_large_image",
      },
      {
        name: "twitter:title",
        content: "Prompt Master — AI-Powered Prompt Engineering Studio",
      },
      {
        name: "twitter:description",
        content:
          "Adaptive Socratic AI interviews that engineer certified, model-native prompts for Claude, ChatGPT, and Gemini.",
      },
      {
        name: "keywords",
        content:
          "prompt engineering, AI prompts, Claude prompts, ChatGPT prompts, Gemini prompts, prompt optimization, AI studio",
      },
    ],
    links: [
      {
        rel: "canonical",
        href: "https://prompt-master.ai",
      },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebApplication",
          name: "Prompt Master",
          applicationCategory: "DeveloperApplication",
          operatingSystem: "Web Browser",
          description:
            "An AI prompt engineering studio that conducts adaptive Socratic interviews to craft certified, model-native master prompts for Claude, ChatGPT, and Gemini.",
          offers: {
            "@type": "Offer",
            price: "0.00",
            priceCurrency: "USD",
          },
          featureList: [
            "Adaptive Socratic Interview Engine",
            "Multi-Model Native Generation (Claude XML, ChatGPT steps, Gemini specs)",
            "Mathematical Quality Certificate scoring 0-10",
            "Domain Specialist Consultants",
            "Layman Teacher Mode & Why Explanations",
            "Local Browser Privacy",
          ],
        }),
      },
    ],
  }),
  component: LandingPage,
});

function LandingPage() {
  return (
    <div className="relative min-h-screen bg-background text-foreground selection:bg-primary/30 selection:text-primary-foreground overflow-x-hidden">
      <LandingAnimatedBackground />
      <LandingNav />
      <main>
        <HeroSection />
        <ConsultantShowcase />
        <FeatureGrid />
        <ComparisonSection />
        <HowItWorks />
        <FaqSection />
        <CtaBanner />
      </main>
      <LandingFooter />
    </div>
  );
}
