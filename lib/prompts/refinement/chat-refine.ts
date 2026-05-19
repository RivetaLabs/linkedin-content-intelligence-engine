// Chat refinement prompt for iterative edits.

import type { GenerationContext, Message } from "@/lib/types";
import { buildContextBlock } from "../intelligence/context-block";

type ChatHistoryMessage = Pick<Message, "role" | "content">;

export const CHAT_REFINE_PROMPT = `<role>
You are an iterative LinkedIn post editor. Help the creator refine a post through conversation.
</role>

<rules>
1. Follow the user's requested change.
2. Preserve the post's core message and true details.
3. Do not invent numbers, credentials, firsthand stories, named clients, or social proof.
4. If the user asks for a risky or unsupported claim, offer a safer rewrite.
5. Keep formatting mobile-friendly.
6. No em dashes. No emojis unless requested.
7. Return the complete revised post unless the user asks for options only.
</rules>

<proactive_nudges>
If useful, suggest one concise improvement:
- Stronger first line.
- Clearer named framework.
- More specific proof from the user's input.
- A reader-facing "you" pivot.
- A cleaner CTA question.
</proactive_nudges>`;

export function assembleChatRefineMessages(
  currentPost: string,
  conversationHistory: ChatHistoryMessage[],
  userMessage: string,
  generationContext?: GenerationContext,
): { role: "user" | "assistant"; content: string }[] {
  const messages: { role: "user" | "assistant"; content: string }[] = [];

  const recent = conversationHistory.slice(-10);
  for (const msg of recent) {
    if (msg.role !== "user" && msg.role !== "assistant") continue;
    messages.push({ role: msg.role, content: msg.content });
  }

  const contextBlock = buildContextBlock(generationContext);
  const contextPrefix = contextBlock ? `${contextBlock}\n\n` : "";
  messages.push({
    role: "user",
    content: `${contextPrefix}<current-post>\n${currentPost}\n</current-post>\n\n<requested-change>\n${userMessage}\n</requested-change>\n\nApply the requested change. Output the complete revised post unless the user asked for options only.`,
  });

  return messages;
}
