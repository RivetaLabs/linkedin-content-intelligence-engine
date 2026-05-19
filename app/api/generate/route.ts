// Edge Runtime for Vercel 10s timeout (F-022)
// Vercel AI SDK streamText + generateText (F-047)
// Classifier uses Haiku for fast auto-detection (~200ms)

import { streamText } from "ai";
import { getModel } from "@/lib/ai/model-factory";
import { classifyInput } from "@/lib/ai/classify-input";
import { assembleSystemPrompt } from "@/lib/prompts/assembly";
import { assembleArticleToPostPrompt } from "@/lib/prompts/article-to-post";
import {
  fetchPostIntelligence,
  fetchRecentOpeningLines,
  formatPostIntelligenceBlock,
} from "@/lib/prompts/intelligence/post-intelligence";
import { getGoldStandardWithMetadata } from "@/lib/prompts/gold-standards/gold-standards";
import { supabase } from "@/lib/supabase";
import {
  getAudienceIntelligence,
  formatAudienceIntelligenceBlock,
} from "@/lib/audience-intelligence";
import { errorResponse } from "@/lib/api/response";
import type { GenerateRequest, Template } from "@/lib/types";

export const runtime = "edge";
export const maxDuration = 30;

export async function POST(request: Request) {
  try {
    const body: GenerateRequest = await request.json();
    const { mode, template, input, model, audience, researchContext } = body;

    if (!input?.trim()) {
      return errorResponse("Input is required", 400);
    }

    // Classify input: resolves template/audience, detects article mode
    const {
      resolvedTemplate,
      resolvedAudience,
      detectedTemplate,
      detectedAudience,
      isArticle,
    } = await classifyInput(input, template, audience, mode);

    const needsClassifier =
      !isArticle &&
      (template === "auto" || !audience || audience === "auto") &&
      mode !== "polish";

    // Parallel fetch: model, post intelligence, recent openings, gold standard, audience intelligence
    const isPolish = resolvedTemplate === "polish";
    const needsGoldStandard = !isPolish && !isArticle;
    const [
      aiModel,
      intelligence,
      recentOpenings,
      goldStandardMeta,
      audienceIntel,
    ] = await Promise.all([
      getModel(model),
      !isPolish
        ? fetchPostIntelligence(
            supabase,
            resolvedTemplate as Exclude<Template, "polish">,
            resolvedAudience,
          ).catch(() => null)
        : Promise.resolve(null),
      fetchRecentOpeningLines(supabase).catch(() => []),
      needsGoldStandard
        ? getGoldStandardWithMetadata(
            resolvedTemplate as Exclude<Template, "polish">,
          ).catch(() => null)
        : Promise.resolve(null),
      !isPolish
        ? getAudienceIntelligence(supabase).catch(() => null)
        : Promise.resolve(null),
    ]);

    const piBlock = intelligence
      ? formatPostIntelligenceBlock(intelligence, recentOpenings)
      : null;

    // v4: Format audience intelligence for prompt injection
    const audienceIntelBlock = audienceIntel
      ? formatAudienceIntelligenceBlock(audienceIntel)
      : null;

    const systemPrompt = await assembleSystemPrompt(
      mode,
      resolvedTemplate,
      resolvedAudience,
      piBlock,
      isArticle,
      audienceIntelBlock,
    );

    // v3: Use article-to-post assembler for long-form input
    let userPrompt = isArticle ? assembleArticleToPostPrompt(input) : input;

    // Inject research context if provided (from /research page bridge)
    if (researchContext) {
      userPrompt = `<research_context>\nThe user researched this topic before writing. Use these findings to add specificity, data points, and source-backed claims to the post. Do not copy the research verbatim — synthesize it into the post naturally.\n\n${researchContext}\n</research_context>\n\n${userPrompt}`;
    }

    const result = streamText({
      model: aiModel,
      system: systemPrompt,
      prompt: userPrompt,
    });

    const response = result.toTextStreamResponse();

    // Add classification metadata headers
    const headers = new Headers(response.headers);
    if (detectedTemplate) {
      headers.set("X-Detected-Template", detectedTemplate);
    }
    if (detectedAudience) {
      headers.set("X-Detected-Audience", detectedAudience);
    }
    headers.set("X-Resolved-Template", String(resolvedTemplate));
    headers.set("X-Resolved-Audience", String(resolvedAudience));
    if (isArticle) {
      headers.set("X-Article-Detected", "true");
    }

    // v4: Generation metadata for feedback loop tracking
    const generationMetadata: Record<string, unknown> = {
      detected_template: detectedTemplate,
      detected_audience: detectedAudience,
      resolved_template: resolvedTemplate,
      resolved_audience: resolvedAudience,
      classifier_used: needsClassifier,
      is_article: isArticle,
      generation_model: model,
      generated_at: new Date().toISOString(),
    };
    if (goldStandardMeta) {
      generationMetadata.gold_standard_id = goldStandardMeta.candidateId;
      generationMetadata.gold_standard_template =
        goldStandardMeta.candidateTemplate;
    }
    headers.set("X-Generation-Metadata", JSON.stringify(generationMetadata));

    return new Response(response.body, {
      status: response.status,
      headers,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Generation failed";
    return errorResponse(message);
  }
}
