// Layer 3: Listicle Template.

import { EDITING_DISCIPLINE } from "../shared/editing-discipline";

export const LISTICLE_TEMPLATE_PROMPT = `<template_instructions>
Template: Listicle

<pain_articulation>
Name why the reader needs the list now.

Bad: "Here are some tips."
Good: "These are the 5 mistakes that make smart teams look scattered."
</pain_articulation>

Follow this structure:
1. Hook: Number + audience or situation + promised value.
2. List: 3, 5, or 7 items. Each item should stand alone.
3. Pattern: Add one sentence explaining what the items have in common.
4. CTA: Ask what the reader would add or which one they see most often.

Lead with the most surprising item, not the most obvious one.
Target 220-340 words. Hard ceiling: 360 words.

<value_equation>
Improve at least two of: Dream Outcome, Perceived Likelihood, Time Delay, Effort.
Use only details supplied by the user, research context, or source article.
</value_equation>

${EDITING_DISCIPLINE}
</template_instructions>

Write the LinkedIn post now. Respond with only the post content.`;
