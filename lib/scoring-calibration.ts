// Calibrates pillar scoring weights using Pearson correlation between
// individual pillar scores and actual LinkedIn engagement data.
// Replaces hardcoded weights in scoring-math.ts with data-driven weights.

import type { SupabaseClient } from "@supabase/supabase-js";

export interface CalibratedWeights {
  hook: number;
  value: number;
  format: number;
  framework: number;
  contrarian: number;
  story: number;
}

const PILLAR_COLUMNS = [
  "hook_score",
  "value_score",
  "format_score",
  "framework_score",
  "contrarian_score",
  "story_score",
] as const;

const PILLAR_NAMES: readonly (keyof CalibratedWeights)[] = [
  "hook",
  "value",
  "format",
  "framework",
  "contrarian",
  "story",
] as const;

// Minimum weight floor for pillars with negative or near-zero correlation.
// Prevents any pillar from being completely ignored in scoring.
const MIN_WEIGHT = 0.05;

// Minimum number of scored LinkedIn posts required for calibration.
// Below this threshold, Pearson correlation is unreliable.
const MIN_POSTS_REQUIRED = 20;

/**
 * Computes the Pearson correlation coefficient between two numeric arrays.
 *
 * r = sum((xi - meanX)(yi - meanY)) / sqrt(sum((xi - meanX)^2) * sum((yi - meanY)^2))
 *
 * Returns 0 if standard deviation of either array is 0 (no variance).
 * Assumes xs and ys have equal length and length >= 2.
 */
export function pearsonCorrelation(xs: number[], ys: number[]): number {
  const n = xs.length;
  if (n < 2) return 0;

  let sumX = 0;
  let sumY = 0;
  for (let i = 0; i < n; i++) {
    sumX += xs[i];
    sumY += ys[i];
  }
  const meanX = sumX / n;
  const meanY = sumY / n;

  let numerator = 0;
  let denomX = 0;
  let denomY = 0;
  for (let i = 0; i < n; i++) {
    const dx = xs[i] - meanX;
    const dy = ys[i] - meanY;
    numerator += dx * dy;
    denomX += dx * dx;
    denomY += dy * dy;
  }

  const denominator = Math.sqrt(denomX * denomY);
  if (denominator === 0) return 0;

  return numerator / denominator;
}

interface PostRow {
  hook_score: number;
  value_score: number;
  format_score: number;
  framework_score: number;
  contrarian_score: number;
  story_score: number;
  engagement_total: number;
}

/**
 * Calibrates pillar weights by correlating each pillar's score with actual
 * LinkedIn engagement data. Writes results to the pillar_metrics table.
 *
 * Returns the calibrated weights object, or null if fewer than MIN_POSTS_REQUIRED
 * posts have both pillar scores and engagement data.
 *
 * Steps:
 * 1. Query all LinkedIn posts with complete scoring and engagement data
 * 2. Compute Pearson r for each pillar vs engagement_total
 * 3. Convert correlations to weights (absolute values, min floor, normalize to 1.0)
 * 4. Persist to pillar_metrics table
 */
export async function calibrateWeights(
  supabaseClient: SupabaseClient,
): Promise<CalibratedWeights | null> {
  // Fetch LinkedIn posts with all 6 pillar scores and engagement_total populated
  const { data: posts, error: fetchError } = await supabaseClient
    .from("posts")
    .select(
      "hook_score, value_score, format_score, framework_score, contrarian_score, story_score, engagement_total",
    )
    .eq("source", "linkedin")
    .not("hook_score", "is", null)
    .not("value_score", "is", null)
    .not("format_score", "is", null)
    .not("framework_score", "is", null)
    .not("contrarian_score", "is", null)
    .not("story_score", "is", null)
    .not("engagement_total", "is", null);

  if (fetchError) {
    throw new Error(
      `Failed to fetch posts for calibration: ${fetchError.message}`,
    );
  }

  const rows = (posts ?? []) as PostRow[];

  if (rows.length < MIN_POSTS_REQUIRED) {
    return null;
  }

  // Extract engagement values once (shared across all pillar correlations)
  const engagementValues = rows.map((r) => r.engagement_total);

  // Compute Pearson correlation for each pillar
  const correlations: Record<keyof CalibratedWeights, number> = {
    hook: 0,
    value: 0,
    format: 0,
    framework: 0,
    contrarian: 0,
    story: 0,
  };

  for (let i = 0; i < PILLAR_NAMES.length; i++) {
    const pillarName = PILLAR_NAMES[i];
    const columnName = PILLAR_COLUMNS[i];
    const pillarValues = rows.map((r) => r[columnName]);
    correlations[pillarName] = pearsonCorrelation(
      pillarValues,
      engagementValues,
    );
  }

  // Convert correlations to weights:
  // 1. Use absolute value of correlation (negative correlation still indicates relationship)
  // 2. Apply minimum weight floor for negative correlations
  // 3. Normalize so all weights sum to 1.0
  const rawWeights: Record<keyof CalibratedWeights, number> = {
    hook: 0,
    value: 0,
    format: 0,
    framework: 0,
    contrarian: 0,
    story: 0,
  };

  for (const pillar of PILLAR_NAMES) {
    const r = correlations[pillar];
    // Negative correlation: this pillar may hurt engagement.
    // Assign minimum floor weight rather than zero.
    rawWeights[pillar] = r < 0 ? MIN_WEIGHT : Math.abs(r);
  }

  // If all raw weights are at floor (all negative correlations), each gets equal weight
  const rawSum = PILLAR_NAMES.reduce((sum, p) => sum + rawWeights[p], 0);

  const calibrated: CalibratedWeights = {
    hook: 0,
    value: 0,
    format: 0,
    framework: 0,
    contrarian: 0,
    story: 0,
  };

  if (rawSum === 0) {
    // Degenerate case: all correlations are exactly 0. Equal weights.
    const equalWeight = 1 / PILLAR_NAMES.length;
    for (const pillar of PILLAR_NAMES) {
      calibrated[pillar] = Math.round(equalWeight * 10000) / 10000;
    }
  } else {
    for (const pillar of PILLAR_NAMES) {
      calibrated[pillar] =
        Math.round((rawWeights[pillar] / rawSum) * 10000) / 10000;
    }
  }

  // Correct for floating-point rounding so weights sum to exactly 1.0.
  // Adjust the largest weight to absorb the rounding difference.
  const weightSum = PILLAR_NAMES.reduce((sum, p) => sum + calibrated[p], 0);
  const roundingDiff = Math.round((1.0 - weightSum) * 10000) / 10000;
  if (roundingDiff !== 0) {
    // Find the pillar with the largest weight to absorb the diff
    let largestPillar = PILLAR_NAMES[0];
    for (const pillar of PILLAR_NAMES) {
      if (calibrated[pillar] > calibrated[largestPillar]) {
        largestPillar = pillar;
      }
    }
    calibrated[largestPillar] =
      Math.round((calibrated[largestPillar] + roundingDiff) * 10000) / 10000;
  }

  // Persist to pillar_metrics table
  const now = new Date().toISOString();

  for (let i = 0; i < PILLAR_NAMES.length; i++) {
    const pillarName = PILLAR_NAMES[i];
    const { error: updateError } = await supabaseClient
      .from("pillar_metrics")
      .update({
        engagement_correlation: correlations[pillarName],
        calibrated_weight: calibrated[pillarName],
        last_calibrated_at: now,
      })
      .eq("pillar_name", pillarName);

    if (updateError) {
      throw new Error(
        `Failed to update pillar_metrics for ${pillarName}: ${updateError.message}`,
      );
    }
  }

  return calibrated;
}

/**
 * Reads the most recently calibrated weights from the pillar_metrics table.
 *
 * Returns null if calibration has never been run (any calibrated_weight is null).
 */
export async function getCalibratedWeights(
  supabaseClient: SupabaseClient,
): Promise<CalibratedWeights | null> {
  const { data, error } = await supabaseClient
    .from("pillar_metrics")
    .select("pillar_name, calibrated_weight")
    .in("pillar_name", [...PILLAR_NAMES]);

  if (error) {
    throw new Error(`Failed to read calibrated weights: ${error.message}`);
  }

  if (!data || data.length !== PILLAR_NAMES.length) {
    return null;
  }

  const weights: Partial<CalibratedWeights> = {};

  for (const row of data) {
    const pillar = row.pillar_name as keyof CalibratedWeights;
    if (row.calibrated_weight === null || row.calibrated_weight === undefined) {
      return null;
    }
    weights[pillar] = Number(row.calibrated_weight);
  }

  // Verify all 6 pillars are present
  for (const pillar of PILLAR_NAMES) {
    if (weights[pillar] === undefined) {
      return null;
    }
  }

  return weights as CalibratedWeights;
}
