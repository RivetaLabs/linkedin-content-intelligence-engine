// Refine route: structured operations (tip apply, condense, hook variation, framework build)
// Edge Runtime for streaming
// COPYWRITING_TECHNIQUES injected for condense, framework_build, hook_variation
// (tip_apply and apply_all already embed techniques in their prompt files)

import { streamText } from "ai";
import { getModel } from "@/lib/ai/model-factory";
import { COPYWRITING_TECHNIQUES } from "@/lib/prompts/core/copywriting-techniques";
import {
  TIP_REFINE_PROMPT,
  assembleTipRefinePrompt,
  getTipRefineSystemPrompt,
} from "@/lib/prompts/refinement/tip-refine";
import {
  APPLY_ALL_PROMPT,
  assembleApplyAllPrompt,
} from "@/lib/prompts/refinement/apply-all";
import {
  CONDENSE_PROMPT,
  assembleCondensePrompt,
} from "@/lib/prompts/refinement/condense";
import {
  FRAMEWORK_BUILDER_PROMPT,
  assembleFrameworkBuilderPrompt,
} from "@/lib/prompts/refinement/framework-builder";
import {
  HOOK_VARIATIONS_PROMPT,
  assembleHookVariationsPrompt,
} from "@/lib/prompts/refinement/hook-variations";
import { errorResponse } from "@/lib/api/response";
import type { RefineRequest } from "@/lib/types";

export const runtime = "edge";
export const maxDuration = 30;

export async function POST(request: Request) {
  try {
    const body: RefineRequest = await request.json();
    const {
      currentPost,
      refineType,
      instruction,
      model,
      metadata,
      generationContext,
    } = body;

    if (!currentPost?.trim()) {
      return errorResponse("Current post is required", 400);
    }

    const aiModel = await getModel(model);

    let systemPrompt: string;
    let userPrompt: string;

    switch (refineType) {
      case "tip_apply": {
        systemPrompt = getTipRefineSystemPrompt();
        userPrompt = assembleTipRefinePrompt(
          currentPost,
          instruction,
          generationContext,
        );
        break;
      }
      case "apply_all": {
        const tips =
          (metadata?.tips as Array<{
            instruction: string;
            pillar: string;
            section?: string;
          }>) || [];
        systemPrompt = APPLY_ALL_PROMPT;
        userPrompt = assembleApplyAllPrompt(
          currentPost,
          tips,
          generationContext,
        );
        break;
      }
      case "condense": {
        const targetPercent = (metadata?.targetPercent as number) || 75;
        const currentScores = metadata?.currentScores as
          | Record<string, number>
          | undefined;
        systemPrompt = `${CONDENSE_PROMPT}\n\n${COPYWRITING_TECHNIQUES}`;
        userPrompt = assembleCondensePrompt(
          currentPost,
          targetPercent,
          currentScores,
          generationContext,
        );
        break;
      }
      case "framework_build": {
        const scores = metadata?.scores as Record<string, number> | undefined;
        systemPrompt = `${FRAMEWORK_BUILDER_PROMPT}\n\n${COPYWRITING_TECHNIQUES}`;
        userPrompt = assembleFrameworkBuilderPrompt(currentPost, scores);
        break;
      }
      case "hook_variation": {
        systemPrompt = `${HOOK_VARIATIONS_PROMPT}\n\n${COPYWRITING_TECHNIQUES}`;
        userPrompt = assembleHookVariationsPrompt(currentPost);
        break;
      }
      default:
        return errorResponse(`Unknown refine type: ${refineType}`, 400);
    }

    const result = streamText({
      model: aiModel,
      system: systemPrompt,
      prompt: userPrompt,
    });

    return result.toTextStreamResponse();
  } catch (error) {
    const message = error instanceof Error ? error.message : "Refine failed";
    return errorResponse(message);
  }
}
