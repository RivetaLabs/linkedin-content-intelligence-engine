// Extracted scoring math from app/api/score/route.ts
// Pure functions for weighted scoring, tip normalization, and JSON extraction
// v4: Added getCalibratedWeights for dynamic weight calibration from engagement data

import type { ScoringTip, ScoreResponse } from "@/lib/types";
import {
  getCalibratedWeights as fetchCalibratedWeights,
  type CalibratedWeights,
} from "@/lib/scoring-calibration";
import { supabase } from "@/lib/supabase";

export type PillarScores = ScoreResponse["scores"];

// Default weights reflect direct-response copywriting pillar importance (must sum to 1.0)
export const PILLAR_WEIGHTS = {
  story: 0.25,
  contrarian: 0.2,
  framework: 0.2,
  value: 0.15,
  hook: 0.1,
  format: 0.1,
} as const;

/**
 * Computes the weighted total score from individual pillar scores.
 * Uses default direct-response copywriting weights. For calibrated weights, use computeWeightedTotalWith().
 */
export function computeWeightedTotal(scores: PillarScores): number {
  return computeWeightedTotalWith(scores, PILLAR_WEIGHTS);
}

/**
 * Computes weighted total with custom weights.
 * Used by calibrated scoring to apply engagement-derived weights.
 */
export function computeWeightedTotalWith(
  scores: PillarScores,
  weights: Record<keyof PillarScores, number>,
): number {
  const total =
    scores.story * weights.story +
    scores.contrarian * weights.contrarian +
    scores.framework * weights.framework +
    scores.value * weights.value +
    scores.hook * weights.hook +
    scores.format * weights.format;
  return Math.round(total * 100) / 100;
}

/**
 * Reads calibrated weights from DB if available, falls back to default PILLAR_WEIGHTS.
 * Cached in pillar_metrics table, computed by lib/scoring-calibration.ts.
 */
export async function getCalibratedWeights(): Promise<CalibratedWeights> {
  try {
    const calibrated = await fetchCalibratedWeights(supabase);
    if (calibrated) return calibrated;
  } catch {
    // Fall back to defaults on any error
  }
  return { ...PILLAR_WEIGHTS };
}

/**
 * Normalizes tips to ScoringTip[] format.
 * Handles backward compatibility: old format was string[], new format is ScoringTip[].
 */
export function normalizeTips(tips: unknown): ScoringTip[] {
  if (!Array.isArray(tips)) return [];
  return tips.map((tip: unknown, i: number) => {
    if (typeof tip === "string") {
      return {
        id: `tip-general-${i + 1}`,
        pillar: "value" as const,
        technique: "General",
        instruction: tip,
        section: "meat" as const,
      };
    }
    return tip as ScoringTip;
  });
}
