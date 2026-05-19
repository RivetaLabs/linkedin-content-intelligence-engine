// Layer 3: Framework Reveal Template.

import { EDITING_DISCIPLINE } from "../shared/editing-discipline";

export const FRAMEWORK_TEMPLATE_PROMPT = `<template_instructions>
Template: Framework Reveal

<pain_articulation>
Name the situation where the reader needs a repeatable process.

Bad: "Here is a useful framework."
Good: "You know the work matters. You just do not have a clean way to decide what comes first."
</pain_articulation>

Follow this structure:
1. Hook: Name the outcome or painful situation.
2. Name it: Give the framework a clear name.
3. Steps: 3 to 5 numbered steps, each specific and actionable.
4. Proof or example: Use only user-provided or sourced detail.
5. You Pivot: Tell the reader where to try it.
6. CTA: Ask which step they would use first.

Use parallel structure in step names.
Target 220-340 words. Hard ceiling: 360 words.

<value_equation>
Improve at least two of: Dream Outcome, Perceived Likelihood, Time Delay, Effort.
Use only details supplied by the user, research context, or source article.
</value_equation>

${EDITING_DISCIPLINE}
</template_instructions>

Write the LinkedIn post now. Respond with only the post content.`;
