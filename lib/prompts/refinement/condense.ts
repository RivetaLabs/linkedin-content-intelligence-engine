// Dedicated condense prompt.

import type { GenerationContext, ScoreResponse } from "@/lib/types";
import { buildContextBlock } from "../intelligence/context-block";

export const CONDENSE_PROMPT = `<condense_instructions>
You shorten LinkedIn posts while preserving their strongest ideas.

Rules:
1. Preserve the hook if it is strong. If it is weak, tighten it.
2. Preserve user-supplied facts, examples, numbers, and personal details.
3. Remove repetition, throat-clearing, and generic encouragement.
4. Keep line breaks and mobile readability.
5. Keep the CTA if it is useful. Shorten it if needed.
6. Do not add new claims.
7. No em dashes. No emojis unless already present and clearly intentional.
</condense_instructions>`;

export function assembleCondensePrompt(
  currentPost: string,
  targetPercent: number,
  currentScores?: ScoreResponse | Record<string, number> | null,
  generationContext?: GenerationContext,
): string {
  const contextBlock = buildContextBlock(generationContext);
  const contextPrefix = contextBlock ? `${contextBlock}\n\n` : "";
  const wordCount = currentPost.split(/\s+/).filter(Boolean).length;
  const targetWords = Math.round(wordCount * (targetPercent / 100));

  let prompt = `${contextPrefix}<current-post>\n${currentPost}\n</current-post>\n\nShorten this post to about ${targetWords} words (${targetPercent}% of the current length). Output only the condensed post.`;

  if (currentScores) {
    prompt += `\n\nCurrent pillar scores: ${JSON.stringify(currentScores)}`;
  }

  return prompt;
}
