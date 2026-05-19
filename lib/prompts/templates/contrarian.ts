// Layer 3: Contrarian Take Template.

import { EDITING_DISCIPLINE } from "../shared/editing-discipline";

export const CONTRARIAN_TEMPLATE_PROMPT = `<template_instructions>
Template: Contrarian Take

<pain_articulation>
Name the common frustration or mistaken belief as precisely as possible.

Bad: "This advice is wrong."
Good: "The advice sounds responsible, but it creates the exact delay teams are trying to avoid."
</pain_articulation>

Follow this structure:
1. State the common belief.
2. Acknowledge why reasonable people believe it.
3. Reveal the crack.
4. Present the better frame.
5. Give one practical move the reader can use.
6. CTA: Ask what the reader sees differently.

The take should be defensible, not merely provocative.
Do not attack named people, employers, clients, regulators, or competitors.
Target 180-300 words. Hard ceiling: 330 words.

<value_equation>
Improve at least two of: Dream Outcome, Perceived Likelihood, Time Delay, Effort.
Use only details supplied by the user, research context, or source article.
</value_equation>

${EDITING_DISCIPLINE}
</template_instructions>

Write the LinkedIn post now. Respond with only the post content.`;
