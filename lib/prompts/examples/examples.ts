// Centralized synthetic hook examples.
// These are generic demo examples, not copied from any private creator data.

import type { Template, Audience } from "@/lib/types";

export type HookType =
  | "bold-claim"
  | "vivid-scene"
  | "data-lead"
  | "contrarian-opener"
  | "question"
  | "fear-gap"
  | "status-aspiration";

export interface HookExample {
  template: Exclude<Template, "polish">;
  audience: Audience;
  hookType: HookType;
  hook: string;
  whyItWorks: string;
}

const EXAMPLES: HookExample[] = [
  {
    template: "story",
    audience: "expert",
    hookType: "vivid-scene",
    hook: "At 9:12 a.m., the launch plan looked finished. By 9:17, one customer question broke it.",
    whyItWorks:
      "Specific time stamps create a scene, and the customer question creates immediate tension.",
  },
  {
    template: "story",
    audience: "leadership",
    hookType: "vivid-scene",
    hook: "The meeting ended. Everyone said it went well. I knew we had avoided the real issue.",
    whyItWorks:
      "The gap between public agreement and private truth creates a strong leadership tension.",
  },
  {
    template: "story",
    audience: "hybrid",
    hookType: "fear-gap",
    hook: "We had the right answer. We just explained it in the wrong order.",
    whyItWorks:
      "The hook starts with a concrete execution problem and expands into a universal communication lesson.",
  },
  {
    template: "contrarian",
    audience: "expert",
    hookType: "contrarian-opener",
    hook: "Everyone says the best strategy wins. I think the clearest strategy wins.",
    whyItWorks:
      "It challenges a common belief while offering a cleaner replacement frame.",
  },
  {
    template: "contrarian",
    audience: "leadership",
    hookType: "contrarian-opener",
    hook: "Stop trying to sound confident. Start being easier to trust.",
    whyItWorks:
      "It reframes a familiar professional goal into a more useful standard.",
  },
  {
    template: "contrarian",
    audience: "hybrid",
    hookType: "bold-claim",
    hook: "The problem was not the idea. It was the room we tested it in.",
    whyItWorks:
      "It points to context as the hidden variable, which creates curiosity.",
  },
  {
    template: "framework",
    audience: "expert",
    hookType: "bold-claim",
    hook: "I use a 3-step filter before I trust any roadmap. It has saved me months.",
    whyItWorks:
      "It promises a named process, a clear use case, and a concrete benefit.",
  },
  {
    template: "framework",
    audience: "leadership",
    hookType: "status-aspiration",
    hook: "The best operators I know use the same review rhythm. I call it the Signal Loop.",
    whyItWorks:
      "It uses peer observation and a named framework without inventing a result.",
  },
  {
    template: "framework",
    audience: "hybrid",
    hookType: "bold-claim",
    hook: "This started as a customer discovery checklist. It became my decision-making system.",
    whyItWorks:
      "It bridges a domain-specific tool into a broad professional lesson.",
  },
  {
    template: "data-insight",
    audience: "expert",
    hookType: "data-lead",
    hook: "One metric can make a healthy funnel look broken.",
    whyItWorks:
      "It creates a useful data tension without inventing a specific statistic.",
  },
  {
    template: "data-insight",
    audience: "leadership",
    hookType: "data-lead",
    hook: "I reviewed 30 project updates. The strongest ones had one pattern in common.",
    whyItWorks:
      "It uses a concrete count and a curiosity gap while staying broadly applicable.",
  },
  {
    template: "data-insight",
    audience: "hybrid",
    hookType: "question",
    hook: "What if your best signal is the one your dashboard hides?",
    whyItWorks:
      "It turns a data point into a strategic question for a broader audience.",
  },
  {
    template: "listicle",
    audience: "expert",
    hookType: "bold-claim",
    hook: "5 questions I ask before I trust a customer insight.",
    whyItWorks:
      "The number, decision context, and practical promise make the post saveable.",
  },
  {
    template: "listicle",
    audience: "leadership",
    hookType: "bold-claim",
    hook: "3 mistakes that make smart leaders look scattered.",
    whyItWorks:
      "It names an identity risk and promises a compact lesson.",
  },
  {
    template: "listicle",
    audience: "hybrid",
    hookType: "fear-gap",
    hook: "7 ways good teams accidentally bury the signal.",
    whyItWorks:
      "It combines a clear number, a credible problem, and a useful diagnostic frame.",
  },
];

export function getRelevantExamples(
  template: Exclude<Template, "polish">,
  audience: Audience,
  count: number = 3,
): HookExample[] {
  const exact = EXAMPLES.filter(
    (example) => example.template === template && example.audience === audience,
  );

  if (exact.length >= count) {
    return exact.slice(0, count);
  }

  const templateOnly = EXAMPLES.filter(
    (example) => example.template === template && !exact.includes(example),
  );

  return [...exact, ...templateOnly].slice(0, count);
}

export function formatExamplesBlock(examples: HookExample[]): string {
  if (examples.length === 0) return "";

  const formatted = examples
    .map(
      (example) =>
        `<example template="${example.template}" audience="${example.audience}" hook_type="${example.hookType}">
<hook>${example.hook}</hook>
<why_it_works>${example.whyItWorks}</why_it_works>
</example>`,
    )
    .join("\n\n");

  return `<dynamic_examples>\n${formatted}\n</dynamic_examples>`;
}
