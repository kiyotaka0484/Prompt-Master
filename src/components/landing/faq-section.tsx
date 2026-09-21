import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { HelpCircle } from "lucide-react";

const FAQS = [
  {
    q: "Why do I need an interview instead of writing a prompt directly?",
    a: "LLMs don't fail because they lack intelligence; they fail because prompts lack critical context, negative constraints, and output boundaries. A beginner usually writes 1 or 2 vague sentences. Prompt Master acts like a senior architect: it asks 6 to 10 targeted questions to discover your budget, tech stack, target users, and edge cases, ensuring the prompt gives the AI everything it needs to perform at an expert level.",
  },
  {
    q: "How are the prompts different for Claude, ChatGPT, and Gemini?",
    a: "Each frontier model has distinct architectural strengths and instruction preferences. Claude 3.7 excels with XML-style contextual fencing (<context>, <task>, <constraints>) and step-by-step reasoning triggers. ChatGPT-4o performs best with persona-anchored procedural instructions, explicit formatting tables, and markdown headers. Gemini 2.0 responds best to clean, structured bullet lists of concrete constraints and output schemas. Prompt Master generates native blocks for all three.",
  },
  {
    q: "What is Layman Teacher Mode?",
    a: "If an expert consultant mentions a technical term you don't recognize (such as SaaS, MVP, RPM, API, or Tailwind), you can simply ask 'what does this mean?' or click 'Why am I being asked this?'. Prompt Master will explain the concept in plain English and help you decide the best answer, without breaking your interview progress.",
  },
  {
    q: "Are my project and business ideas kept private?",
    a: "Yes. All your interview threads, answers, and generated prompts are stored locally inside your browser's localStorage. Prompt Master does not maintain an external user tracking database or sell your prompts.",
  },
  {
    q: "Can I regenerate or tweak the prompt after it's produced?",
    a: "Absolutely. Once the 3 model-native master prompts and your Quality Certificate are displayed, you can click 'Regenerate' or ask Prompt Master to adjust constraints, emphasize specific features, or rephrase for a different tone.",
  },
  {
    q: "What if I give a vague answer or don't know the answer yet?",
    a: "Prompt Master's anti-vagueness engine detects non-committal answers like 'idk', 'maybe', or 'fast'. Instead of blindly accepting them and generating a flawed prompt, it will politely explain why that detail matters and suggest a few practical options for you to choose from.",
  },
];

export function FaqSection() {
  return (
    <section id="faq" className="py-20 sm:py-28 relative">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-primary mb-3">
            <HelpCircle className="h-3.5 w-3.5" />
            Clear Answers
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
            Frequently Asked Questions
          </h2>
          <p className="mt-4 text-base sm:text-lg text-muted-foreground">
            Everything you need to know about Prompt Master's interview engine
            and model-native generation.
          </p>
        </div>

        <div className="rounded-2xl border border-border/70 bg-card/50 p-6 sm:p-8 backdrop-blur-md">
          <Accordion type="single" collapsible className="w-full space-y-4">
            {FAQS.map((faq, index) => (
              <AccordionItem
                key={index}
                value={`item-${index}`}
                className="border-b border-border/50 last:border-b-0 pb-2"
              >
                <AccordionTrigger className="text-left font-semibold text-foreground hover:text-primary text-base py-3">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground leading-relaxed pt-1 pb-4">
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
}
