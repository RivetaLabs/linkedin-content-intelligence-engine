import type { Audience } from "@/lib/types";

const EXPERT_CONTEXT = `<audience_context segment="expert">
The creator is writing for readers who care about domain expertise, practical tradeoffs, and credible execution.

<pain_points>
1. Advice is usually too generic to use.
2. Teams copy tactics without understanding the operating context.
3. Decision-makers want proof, not motivational language.
4. Complex work is hard to explain simply.
5. The reader needs a sharper way to think, not another slogan.
</pain_points>

<proof_preference>
This audience trusts: concrete examples, sourced research, constraints, numbers supplied by the user, and plain-language frameworks.
</proof_preference>

<value_equation_emphasis>
Lead with Perceived Likelihood and Effort reduction. Show why the idea works and what it simplifies.
</value_equation_emphasis>
</audience_context>`;

const LEADERSHIP_CONTEXT = `<audience_context segment="leadership">
The creator is writing for professionals navigating career growth, leadership, identity shifts, personal branding, or public learning.

<pain_points>
1. Expertise that stays invisible.
2. Unclear next steps after a promotion, setback, or pivot.
3. Tension between competence and confidence.
4. Wanting more impact without becoming performative.
5. Knowing the lesson but not knowing how to act on it.
</pain_points>

<proof_preference>
This audience trusts: honest stories, practical reflection, specific decisions, and lessons that do not pretend the work was easy.
</proof_preference>

<value_equation_emphasis>
Lead with Dream Outcome and Time Delay. Make the next small move feel possible.
</value_equation_emphasis>
</audience_context>`;

const HYBRID_CONTEXT = `<audience_context segment="hybrid">
The creator is bridging a domain-specific situation to a broader professional lesson.

<bridging_instruction>
Start with the concrete domain tension. Move toward a universal lesson. The reader should learn something specific and still feel personally addressed.
</bridging_instruction>

<proof_preference>
This audience trusts: a vivid example, a plain-language explanation, and a takeaway that applies outside the original scenario.
</proof_preference>

<value_equation_emphasis>
Lead with Dream Outcome and Perceived Likelihood. Show both the practical result and why the lesson transfers.
</value_equation_emphasis>
</audience_context>`;

const CONTEXTS: Record<Audience, string> = {
  expert: EXPERT_CONTEXT,
  leadership: LEADERSHIP_CONTEXT,
  hybrid: HYBRID_CONTEXT,
};

export function getAudienceContext(
  audience: Audience,
  audienceIntelligenceBlock?: string | null,
): string {
  const base = CONTEXTS[audience] ?? HYBRID_CONTEXT;

  if (!audienceIntelligenceBlock) {
    return base;
  }

  return `${base}

<audience_intelligence_instruction>
The following block is computed from synthetic or connected audience data. Use it only to choose examples, angles, and vocabulary. Do not fabricate individual audience reactions.
</audience_intelligence_instruction>

${audienceIntelligenceBlock}`;
}
