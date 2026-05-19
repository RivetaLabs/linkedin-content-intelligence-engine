// Single-tip refinement prompt.

import type { GenerationContext } from "@/lib/types";
import { buildContextBlock } from "../intelligence/context-block";
import { COPYWRITING_TECHNIQUES } from "../core/copywriting-techniques";

export const TIP_REFINE_PROMPT = `<role>
You apply one specific improvement to a LinkedIn post. Be surgical.
</role>

<rules>
1. Apply only the specified tip.
2. Preserve unrelated content verbatim where possible.
3. Preserve the creator's voice and intent.
4. Do not invent facts, numbers, examples, credentials, or social proof.
5. Maintain word count within 10% unless the tip requires a length change.
6. No em dashes. No emojis unless requested.
7. Output the complete revised post.
</rules>`;

export function getTipRefineSystemPrompt(): string {
  return `${TIP_REFINE_PROMPT}\n\n${COPYWRITING_TECHNIQUES}`;
}

export function assembleTipRefinePrompt(
  currentPost: string,
  tipInstruction: string,
  generationContext?: GenerationContext,
): string {
  const contextBlock = buildContextBlock(generationContext);
  const contextPrefix = contextBlock ? `${contextBlock}\n\n` : "";
  return `${contextPrefix}<current-post>\n${currentPost}\n</current-post>\n\n<tip-to-apply>\n${tipInstruction}\n</tip-to-apply>\n\nApply this specific tip to the post. Output the complete revised post.`;
}
