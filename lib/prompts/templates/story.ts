// Layer 3: Story-to-Lesson Template.

import { EDITING_DISCIPLINE } from "../shared/editing-discipline";

export const STORY_TEMPLATE_PROMPT = `<template_instructions>
Template: Story to Lesson

<pain_articulation>
Identify the specific reader tension behind the user's input. Put that tension in the first 3 lines.

Bad: "Many professionals struggle with this."
Good: "You made the hard call. Now you have to explain it clearly."
</pain_articulation>

Follow this structure:
1. Hook: Open with a specific moment, decision, or tension.
2. Tension: What made it hard?
3. Turn: What changed the creator's thinking?
4. Lesson: Extract one useful professional takeaway.
5. You Pivot: Turn the lesson toward the reader.
6. CTA: End with a genuine question.

Use Punch-Punch-Explain rhythm where it fits.
Target 180-300 words. Hard ceiling: 330 words.

<value_equation>
Improve at least two of: Dream Outcome, Perceived Likelihood, Time Delay, Effort.
Use only details supplied by the user, research context, or source article.
</value_equation>

${EDITING_DISCIPLINE}
</template_instructions>

Write the LinkedIn post now. Respond with only the post content.`;
