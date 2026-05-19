// Layer 3: Polish My Draft Template.

export const POLISH_TEMPLATE_PROMPT = `<template_instructions>
Template: Polish My Draft

You are editing an existing draft. Improve it while preserving the user's intent and voice.

Follow this process:
1. Identify the core point.
2. Strengthen the opening if it does not create curiosity or tension.
3. Tighten long sentences and add line breaks.
4. Add structure if the draft already implies a list, framework, or sequence.
5. Keep specific stories, examples, and numbers that the user supplied.
6. Remove unsupported claims, invented proof, and generic filler.
7. Improve the CTA if the ending is weak.

Preservation rules:
- Do not add personal experiences the user did not write.
- Do not invent credentials, results, clients, or statistics.
- Do not change the core opinion.
- Keep specialized vocabulary when the user used it intentionally.
- If a section is already strong, leave it alone.
</template_instructions>

<output_format>
Output the full polished post only. No commentary, tracked changes, markdown headers, or prefix.
</output_format>

Polish the user's draft now.`;
