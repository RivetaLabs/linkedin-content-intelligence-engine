// Dynamic gold standard selection from Supabase with 30-min TTL cache
// Replaces hardcoded GOLD_STANDARD_POOL with runtime query
// Uses the same lightweight in-memory cache pattern as other prompt assets.

import { supabase } from "@/lib/supabase";
import type { Template } from "@/lib/types";
import { TEMPLATE_REACTION_AFFINITY } from "@/lib/constants/affinity-map";

export interface GoldStandardCandidate {
  id: string;
  linkedin_post_id: string | null;
  generated_content: string;
  template: Exclude<Template, "polish">;
  content_score_total: number;
  engagement_total: number;
  dominant_reaction: string | null;
  reaction_breakdown: Record<string, number> | null;
  word_count: number | null;
  posted_at: string | null;
  annotations: string;
}

interface ScoredCandidate extends GoldStandardCandidate {
  poolScore: number;
}

// Faith keywords for story template bonus
const FAITH_KEYWORDS = [
  "god",
  "faith",
  "prayer",
  "grace",
  "purpose",
  "seasons",
  "surrender",
];

// Tool delivery date: posts after this are "mm-assisted"
const TOOL_DELIVERY_DATE = new Date("2026-02-08");

// In-memory cache with 30-min TTL.
let cachedPool: ScoredCandidate[] | null = null;
let cacheTimestamp: number = 0;
const CACHE_TTL_MS = 30 * 60 * 1000;

/**
 * Queries Supabase for all gold standard candidates and computes poolScore.
 * Candidates must have: content_score_total >= 3.5, engagement data, and annotations.
 */
async function queryAndScore(): Promise<ScoredCandidate[]> {
  const { data, error } = await supabase
    .from("posts")
    .select(
      "id, linkedin_post_id, generated_content, template, " +
        "content_score_total, engagement_total, dominant_reaction, reaction_breakdown, " +
        "word_count, posted_at, annotations",
    )
    .gte("content_score_total", 3.5)
    .not("engagement_total", "is", null)
    .not("annotations", "is", null)
    .order("engagement_total", { ascending: false });

  if (error || !data || data.length === 0) {
    console.warn("[gold-standard] Query failed or empty:", error?.message);
    return [];
  }

  const candidates = data as unknown as GoldStandardCandidate[];

  // Compute engagement percentiles
  const engagements = candidates
    .map((c) => c.engagement_total)
    .sort((a, b) => a - b);

  return candidates.map((c) => {
    const engPercentile =
      engagements.indexOf(c.engagement_total) / engagements.length;
    const source =
      c.posted_at && new Date(c.posted_at) >= TOOL_DELIVERY_DATE
        ? "mm-assisted"
        : "organic";
    const wordCount = c.word_count ?? 0;
    const content = c.generated_content.toLowerCase();
    const hasQuestionCTA = c.generated_content.trim().endsWith("?");
    const hasFaithElement = FAITH_KEYWORDS.some((kw) => content.includes(kw));
    const affinityReaction = c.template
      ? TEMPLATE_REACTION_AFFINITY[c.template as Exclude<Template, "polish">]
      : null;

    const poolScore =
      c.content_score_total * 10 +
      engPercentile * 5 +
      (source === "mm-assisted" ? 20 : 0) +
      (affinityReaction && c.dominant_reaction === affinityReaction ? 10 : 0) +
      (wordCount >= 300 && wordCount <= 400 ? 5 : 0) +
      (hasQuestionCTA ? 5 : 0) +
      (hasFaithElement && c.template === "story" ? 5 : 0);

    return { ...c, poolScore };
  });
}

/**
 * Resets the gold standard cache. Used by tests for isolation between test cases.
 */
export function resetGoldStandardCache(): void {
  cachedPool = null;
  cacheTimestamp = 0;
}

/**
 * Returns the cached pool, refreshing if stale.
 */
async function getPool(): Promise<ScoredCandidate[]> {
  if (cachedPool && Date.now() - cacheTimestamp < CACHE_TTL_MS) {
    return cachedPool;
  }
  cachedPool = await queryAndScore();
  cacheTimestamp = Date.now();
  return cachedPool;
}

/**
 * Weighted random selection biased toward higher poolScore.
 */
function weightedRandomPick(
  candidates: ScoredCandidate[],
): ScoredCandidate | null {
  if (candidates.length === 0) return null;
  const weights = candidates.map((c) => c.poolScore);
  const total = weights.reduce((sum, w) => sum + w, 0);
  if (total === 0) return candidates[0];
  let r = Math.random() * total;
  for (let i = 0; i < candidates.length; i++) {
    r -= weights[i];
    if (r <= 0) return candidates[i];
  }
  return candidates[candidates.length - 1];
}

export interface GoldStandardSelection {
  xml: string;
  candidateId: string;
  candidateTemplate: Exclude<Template, "polish">;
}

/**
 * Selects a gold standard post for the given template.
 * Returns formatted XML string and the candidate's ID for metadata tracking.
 */
export async function selectGoldStandard(
  template: Exclude<Template, "polish">,
): Promise<GoldStandardSelection | null> {
  try {
    const pool = await getPool();
    const templateCandidates = pool.filter((c) => c.template === template);

    if (templateCandidates.length === 0) {
      // Fallback: pick from any template
      const pick = weightedRandomPick(pool);
      if (!pick) return null;
      return {
        xml: formatGoldStandardXml(pick),
        candidateId: pick.id,
        candidateTemplate: pick.template,
      };
    }

    const pick = weightedRandomPick(templateCandidates);
    if (!pick) return null;
    return {
      xml: formatGoldStandardXml(pick),
      candidateId: pick.id,
      candidateTemplate: pick.template,
    };
  } catch (err) {
    console.warn("[gold-standard] Selection failed:", err);
    return null;
  }
}

function formatGoldStandardXml(post: ScoredCandidate): string {
  const source =
    post.posted_at && new Date(post.posted_at) >= TOOL_DELIVERY_DATE
      ? "mm-assisted"
      : "organic";
  return `<gold_standard template="${post.template}" score="${post.content_score_total}" source="${source}">
<post>${post.generated_content}</post>
<techniques>
${post.annotations}
</techniques>
</gold_standard>`;
}
