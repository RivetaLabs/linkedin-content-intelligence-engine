// Chat route: multi-turn conversation streaming for iterative editing
// Edge Runtime for Vercel 10s timeout avoidance

import { streamText } from "ai";
import { getModel } from "@/lib/ai/model-factory";
import {
  CHAT_REFINE_PROMPT,
  assembleChatRefineMessages,
} from "@/lib/prompts/refinement/chat-refine";
import { VOICE_PROFILE_PROMPT } from "@/lib/prompts/core/voice-profile";
import { BASE_SYSTEM_PROMPT } from "@/lib/prompts/core/base-system";
import { COPYWRITING_TECHNIQUES } from "@/lib/prompts/core/copywriting-techniques";
import { executeResearch } from "@/lib/research";
import { errorResponse } from "@/lib/api/response";
import type { ChatRequest } from "@/lib/types";

export const runtime = "edge";
export const maxDuration = 30;

function detectResearchIntent(message: string): {
  isResearch: boolean;
  query: string;
} {
  const lower = message.toLowerCase().trim();

  // Explicit research triggers
  if (
    lower.startsWith("research ") ||
    lower.startsWith("look up ") ||
    lower.startsWith("what is ") ||
    lower.startsWith("what are ") ||
    lower.startsWith("explain ") ||
    lower.startsWith("define ")
  ) {
    return { isResearch: true, query: message };
  }

  // Question with research-like keywords (but NOT editing instructions)
  if (
    lower.includes("?") &&
    (lower.includes("what") ||
      lower.includes("how does") ||
      lower.includes("why do") ||
      lower.includes("tell me about"))
  ) {
    const editSignals = [
      "make",
      "change",
      "rewrite",
      "shorten",
      "strengthen",
      "add",
      "remove",
      "fix",
      "improve",
      "update",
    ];
    const hasEditSignal = editSignals.some((s) => lower.includes(s));
    if (!hasEditSignal) {
      return { isResearch: true, query: message };
    }
  }

  return { isResearch: false, query: "" };
}

export async function POST(request: Request) {
  try {
    const body: ChatRequest = await request.json();
    const { currentPost, messages, instruction, model, generationContext } =
      body;

    if (!instruction?.trim()) {
      return errorResponse("Instruction is required", 400);
    }

    if (!currentPost?.trim()) {
      return errorResponse("Current post content is required", 400);
    }

    // v3: Research intent detection — route research questions to /api/research
    const { isResearch, query } = detectResearchIntent(instruction);

    if (isResearch) {
      const researchResponse = await executeResearch(query, model, "quick");

      // Forward the streaming body with research header
      return new Response(researchResponse.body, {
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "X-Research-Detected": "true",
        },
      });
    }

    const aiModel = await getModel(model);

    // Intentional: chat uses 4 static layers (base + voice + chat-refine +
    // techniques). This is NOT the full 7-layer prompt assembly pipeline.
    // Chat is for iterative editing, not initial generation.
    // See lib/prompts/assembly.ts for the full pipeline.
    const systemPrompt = `${BASE_SYSTEM_PROMPT}\n\n${VOICE_PROFILE_PROMPT}\n\n${CHAT_REFINE_PROMPT}\n\n${COPYWRITING_TECHNIQUES}`;

    const chatMessages = assembleChatRefineMessages(
      currentPost,
      messages,
      instruction,
      generationContext,
    );

    const result = streamText({
      model: aiModel,
      system: systemPrompt,
      messages: chatMessages,
    });

    return result.toTextStreamResponse();
  } catch (error) {
    const message = error instanceof Error ? error.message : "Chat failed";
    return errorResponse(message);
  }
}
