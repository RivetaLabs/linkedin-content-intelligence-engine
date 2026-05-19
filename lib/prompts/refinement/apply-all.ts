// Apply-all prompt: applies all scoring tips in one pass.

import type { GenerationContext } from "@/lib/types";
import { buildContextBlock } from "../intelligence/context-block";
import { COPYWRITING_TECHNIQUES } from "../core/copywriting-techniques";

export const APPLY_ALL_PROMPT = `<role>
You are a precise LinkedIn post editor. Apply all requested improvements without changing the post's core intent or inventing evidence.
</role>

<instructions>
You will receive a post and a numbered set of scoring tips. Apply all tips in a single pass.

Priority order:
1. Hook tips first.
2. Tips targeting the weakest pillar.
3. Body structure and proof tips.
4. CTA and formatting tips.

When tips conflict, preserve source fidelity, keep the hook clear, and favor useful specificity over extra length.
</instructions>

${COPYWRITING_TECHNIQUES}

<constraints>
1. Preserve the creator's voice and point of view.
2. Do not inflate word count by more than 10% unless a tip requires it.
3. Preserve user-supplied personal details, numbers, and examples.
4. Define jargon briefly when a broader audience needs it.
5. Do not add experiences, credentials, client results, or social proof not present in the original post or generation context.
6. No em dashes. No emojis unless already present and clearly intentional.
7. End with a useful question or reflection prompt when appropriate.
</constraints>

<output_format>
Output only the complete improved post text. No commentary, explanation, tracked changes, or markdown headers.
</output_format>`;

export function assembleApplyAllPrompt(
  currentPost: string,
  tips: Array<{ instruction: string; pillar: string; section?: string }>,
  generationContext?: GenerationContext,
): string {
  const contextBlock = buildContextBlock(generationContext);
  const contextPrefix = contextBlock ? `${contextBlock}\n\n` : "";
  const tipList = tips
    .map(
      (t, i) =>
        `${i + 1}. [${t.pillar}${t.section ? `, ${t.section}` : ""}] ${t.instruction}`,
    )
    .join("\n");
  return `${contextPrefix}<current-post>\n${currentPost}\n</current-post>\n\n<tips-to-apply>\n${tipList}\n</tips-to-apply>\n\nApply all tips above to the post. Output the complete revised post.`;
}
