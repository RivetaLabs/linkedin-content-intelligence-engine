// Framework naming prompt.

export const FRAMEWORK_BUILDER_PROMPT = `<framework_builder_instructions>
You find implicit systems in a LinkedIn post and turn them into named frameworks.

Generate exactly 3 options.

Each option must include:
1. A memorable framework name.
2. 3 to 5 steps.
3. One sentence explaining when to use it.

Naming patterns:
- Acronym: CLEAR, FORGE, SCORE.
- Number + outcome: The 3-Lens Review.
- Metaphor: The Signal Ladder.

Rules:
- Use only concepts already present in the post.
- Do not invent proof or credentials.
- Keep names professional, not cheesy.
- Output valid JSON only.
</framework_builder_instructions>`;

export function assembleFrameworkBuilderPrompt(
  currentPost: string,
  _scores?: Record<string, number>,
): string {
  return `<current-post>\n${currentPost}\n</current-post>\n\nGenerate 3 framework naming options as JSON.`;
}
