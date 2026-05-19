// Scoring route: always uses Claude (F-035), standard runtime
// Weighted scoring with plain English tips
// v4: Engagement-calibrated weights for tip prioritization and weighted total

import { generateText } from "ai";
import { getAnthropicScoringModel } from "@/lib/ai/model-factory";
import {
  SCORING_PROMPT,
  buildCalibrationContext,
} from "@/lib/prompts/scoring/scoring";
import { COPYWRITING_TECHNIQUES } from "@/lib/prompts/core/copywriting-techniques";
import {
  computeWeightedTotal,
  computeWeightedTotalWith,
  getCalibratedWeights,
  normalizeTips,
  PILLAR_WEIGHTS,
  type PillarScores,
} from "@/lib/scoring-math";
import { extractJson } from "@/lib/api/parse-ai-response";
import { errorResponse, jsonResponse } from "@/lib/api/response";
import type { CalibratedWeights } from "@/lib/scoring-calibration";

/**
 * Checks if calibrated weights differ from the hardcoded defaults.
 * Returns true if calibration has actually run and produced different weights.
 */
function isCalibrated(weights: CalibratedWeights): boolean {
  const defaults = PILLAR_WEIGHTS;
  return (Object.keys(defaults) as (keyof typeof defaults)[]).some(
    (k) => Math.abs(weights[k] - defaults[k]) > 0.001,
  );
}

export async function POST(request: Request) {
  try {
    const { content } = await request.json();
    if (!content?.trim()) {
      return errorResponse("Content is required", 400);
    }

    // Fetch model and calibrated weights in parallel
    const [model, calibrated] = await Promise.all([
      getAnthropicScoringModel(),
      getCalibratedWeights(),
    ]);

    // Build system prompt — append calibration context if weights differ from defaults
    let systemPrompt = `${SCORING_PROMPT}\n\n${COPYWRITING_TECHNIQUES}`;
    const hasCalibration = isCalibrated(calibrated);
    if (hasCalibration) {
      systemPrompt += `\n\n${buildCalibrationContext(calibrated)}`;
    }

    const { text } = await generateText({
      model,
      system: systemPrompt,
      prompt: content,
    });

    // Parse the JSON response using unified parser
    const parsed = extractJson<{ scores: PillarScores; tips?: unknown }>(text);
    parsed.tips = normalizeTips(parsed.tips);

    // Use calibrated weights for the weighted total when available
    const weightedTotal = hasCalibration
      ? computeWeightedTotalWith(parsed.scores, calibrated)
      : computeWeightedTotal(parsed.scores);

    return jsonResponse({
      ...parsed,
      weighted_total: weightedTotal,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Scoring failed";
    return errorResponse(message);
  }
}
