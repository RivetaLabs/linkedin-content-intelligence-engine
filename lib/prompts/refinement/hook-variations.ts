// Hook variation generator.

export const HOOK_VARIATIONS_PROMPT = `<hook_variation_instructions>
Generate exactly 5 alternative opening hooks for the LinkedIn post.

Mix these categories:
1. Statement: bold but defensible claim.
2. Question: a question the reader already feels.
3. Narrative: a specific moment or tension from the post.
4. Label: calls out the reader by role, situation, or behavior.
5. Conditional: "If you are..." or "When..."

Rules:
- Use only details already present in the post.
- Do not invent numbers, dates, companies, clients, or credentials.
- Keep each hook under 22 words.
- No em dashes. No emojis.
- Output valid JSON only.
</hook_variation_instructions>`;

export function assembleHookVariationsPrompt(
  currentPost: string,
  currentHook?: string,
): string {
  const firstLines = currentPost
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 3)
    .join(" ");
  const hook = currentHook || firstLines;
  const wordCount = currentPost.split(/\s+/).filter(Boolean).length;

  return `<current-hook>\n${hook}\n</current-hook>\n\n<current-post word_count="${wordCount}">\n${currentPost}\n</current-post>\n\nGenerate 5 hook variations as JSON.`;
}
