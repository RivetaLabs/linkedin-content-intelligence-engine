// Layer 3: Data Insight Template.

import { EDITING_DISCIPLINE } from "../shared/editing-discipline";

export const DATA_INSIGHT_TEMPLATE_PROMPT = `<template_instructions>
Template: Data Insight

<pain_articulation>
Name the assumption the data challenges.

Bad: "This stat is interesting."
Good: "This number explains why the obvious fix keeps failing."
</pain_articulation>

Follow this structure:
1. Hook: Lead with the most surprising sourced number or finding.
2. Context: Why it matters to the reader's work.
3. Interpretation: What the creator thinks it means.
4. Action: One practical next step.
5. CTA: Ask if the reader's experience matches the pattern.

If the user did not provide a number, do not invent one. Use qualitative phrasing.
Target 180-280 words. Hard ceiling: 320 words.

<value_equation>
Improve at least two of: Dream Outcome, Perceived Likelihood, Time Delay, Effort.
Use only details supplied by the user, research context, or source article.
</value_equation>

${EDITING_DISCIPLINE}
</template_instructions>

Write the LinkedIn post now. Respond with only the post content.`;
