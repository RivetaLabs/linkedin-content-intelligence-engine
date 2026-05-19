// Extracted classification logic from app/api/generate/route.ts
// Handles template/audience resolution, article detection, and classifier dispatch

import { generateText } from "ai";
import { getClassifierModel } from "@/lib/ai/model-factory";
import { CLASSIFIER_PROMPT } from "@/lib/prompts/classifier/classifier";
import {
  parseClassifierResponse,
  isArticleInput,
} from "@/lib/classifier-utils";
import type {
  Template,
  Audience,
  TemplateOrAuto,
  AudienceOrAuto,
  Mode,
} from "@/lib/types";

export interface ClassificationResult {
  resolvedTemplate: Template;
  resolvedAudience: Audience;
  detectedTemplate: string | null;
  detectedAudience: string | null;
  isArticle: boolean;
}

/**
 * Classifies user input into a resolved template and audience segment.
 *
 * Resolution order:
 * 1. Article detection (>300 words, create mode) — forces story/hybrid, skips classifier
 * 2. Polish mode — forces resolvedTemplate="polish", skips classifier
 * 3. Classifier — runs when template="auto" or audience is missing/auto, NOT in polish mode
 * 4. User-specified values — passed through unchanged when not "auto"
 * 5. Defaults — story/hybrid when classifier fails or is skipped
 */
export async function classifyInput(
  input: string,
  requestedTemplate: TemplateOrAuto,
  requestedAudience: AudienceOrAuto | undefined,
  mode: Mode,
): Promise<ClassificationResult> {
  const wordCount = input.trim().split(/\s+/).filter(Boolean).length;
  const isArticle = isArticleInput(wordCount, mode);

  let resolvedTemplate: Template = requestedTemplate as Template;
  let resolvedAudience: Audience = (requestedAudience as Audience) || "hybrid";
  let detectedTemplate: string | null = null;
  let detectedAudience: string | null = null;

  const needsClassifier =
    !isArticle &&
    (requestedTemplate === "auto" ||
      !requestedAudience ||
      requestedAudience === "auto");

  if (needsClassifier && mode !== "polish") {
    const classifierModel = await getClassifierModel();
    const { text } = await generateText({
      model: classifierModel,
      system: CLASSIFIER_PROMPT,
      prompt: input,
    });
    const classification = parseClassifierResponse(text);

    if (requestedTemplate === "auto") {
      resolvedTemplate = classification.template;
      detectedTemplate = classification.template;
    }
    if (!requestedAudience || requestedAudience === "auto") {
      resolvedAudience = classification.audience;
      detectedAudience = classification.audience;
    }
  }

  // Article mode overrides (before polish, since isArticle already excludes polish)
  if (isArticle) {
    resolvedTemplate = "story";
    resolvedAudience = "hybrid";
  }

  // Polish mode overrides
  if (mode === "polish") {
    resolvedTemplate = "polish";
  }

  return {
    resolvedTemplate,
    resolvedAudience,
    detectedTemplate,
    detectedAudience,
    isArticle,
  };
}
