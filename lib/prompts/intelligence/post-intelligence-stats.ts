// Statistical computation extracted from post-intelligence.ts
// Pure functions: no Supabase, no I/O. Safe to import in any context.

import type {
  Template,
  Post,
  CuratedExample,
  ReactionBreakdown,
  ReactionProfile,
  PostIntelligenceData,
} from "@/lib/types";
import { TEMPLATE_REACTION_AFFINITY } from "@/lib/constants/affinity-map";
export { TEMPLATE_REACTION_AFFINITY } from "@/lib/constants/affinity-map";

// Pillar column mapping per template
export const TEMPLATE_PRIMARY_PILLAR: Record<
  Exclude<Template, "polish">,
  { column: keyof Post; name: string }
> = {
  story: { column: "story_score", name: "Story-to-Lesson" },
  contrarian: { column: "contrarian_score", name: "Contrarian" },
  framework: { column: "framework_score", name: "Frameworks" },
  "data-insight": { column: "value_score", name: "Value-First" },
  listicle: { column: "framework_score", name: "Frameworks" },
};

export const PILLAR_COLUMNS = [
  { column: "hook_score" as const, name: "Hook" },
  { column: "value_score" as const, name: "Value" },
  { column: "format_score" as const, name: "Format" },
  { column: "framework_score" as const, name: "Frameworks" },
  { column: "contrarian_score" as const, name: "Contrarian" },
  { column: "story_score" as const, name: "Story" },
];

export const MIN_POSTS_THRESHOLD = 10;

/**
 * Returns the best available date for a post.
 * Prefers posted_at (original publish date) over created_at (import date).
 * LinkedIn posts were bulk-imported so created_at is the same for all of them.
 */
export function postDate(post: Post): string {
  return post.posted_at ?? post.created_at;
}

/**
 * Computes recency weight based on post age.
 * Recent posts get full weight, older posts decay to 0.5.
 */
export function recencyWeight(dateStr: string): number {
  const ageMs = Date.now() - new Date(dateStr).getTime();
  const ageDays = ageMs / (1000 * 60 * 60 * 24);
  if (ageDays < 30) return 1.0;
  if (ageDays < 90) return 0.85;
  if (ageDays < 180) return 0.7;
  return 0.5;
}

/**
 * Weighted random selection from an array using provided weights.
 * Returns the selected item's index, or -1 if weights sum to 0.
 */
export function weightedRandomIndex(weights: number[]): number {
  const total = weights.reduce((sum, w) => sum + w, 0);
  if (total === 0) return -1;
  let r = Math.random() * total;
  for (let i = 0; i < weights.length; i++) {
    r -= weights[i];
    if (r <= 0) return i;
  }
  return weights.length - 1;
}

/**
 * Truncates content to a character limit at a word boundary.
 */
function truncate(text: string, maxChars: number): string {
  if (text.length <= maxChars) return text;
  const truncated = text.slice(0, maxChars);
  const lastSpace = truncated.lastIndexOf(" ");
  return (
    (lastSpace > maxChars * 0.6 ? truncated.slice(0, lastSpace) : truncated) +
    "..."
  );
}

export function computeDominantPercent(
  breakdown: ReactionBreakdown | null,
  dominant: string | null,
): number | undefined {
  if (!breakdown || !dominant) return undefined;
  const total = Object.values(breakdown).reduce((sum, v) => sum + v, 0);
  if (total === 0) return undefined;
  const value = breakdown[dominant as keyof ReactionBreakdown];
  if (value === undefined) return undefined;
  return Math.round((value / total) * 1000) / 1000;
}

export function getMedian(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0
    ? sorted[mid]
    : (sorted[mid - 1] + sorted[mid]) / 2;
}

// Classify a post by its highest pillar score (fallback when template is NULL)
export function classifyByPillar(post: Post): string {
  const pillars: [string, number][] = [
    ["story", post.story_score ?? 0],
    ["contrarian", post.contrarian_score ?? 0],
    ["framework", post.framework_score ?? 0],
    ["data-insight", post.value_score ?? 0],
    ["listicle", post.framework_score ?? 0],
  ];
  return pillars.reduce((best, curr) => (curr[1] > best[1] ? curr : best))[0];
}

/**
 * Selects 3 curated examples with distinct pedagogical roles.
 * Uses weighted random sampling to prevent pattern lock-in.
 */
export function selectCuratedExamples(
  posts: Post[],
  primaryPillarColumn: keyof Post,
  template: Exclude<Template, "polish">,
): CuratedExample[] {
  const examples: CuratedExample[] = [];
  const usedIds = new Set<string>();

  // Add effective_score (content_score_total * recency weight) to each post
  // Uses posted_at (original publish date) when available, not created_at (import date)
  const scored = posts.map((p) => ({
    post: p,
    effectiveScore: (p.content_score_total ?? 0) * recencyWeight(postDate(p)),
    pillarScore: (p[primaryPillarColumn] as number) ?? 0,
    engagement: p.engagement_total ?? 0,
  }));

  // --- ROLE 1: Top Performer ---
  // Top 5 by effective_score on primary pillar, weighted random
  const byPillar = [...scored]
    .filter((s) => s.pillarScore > 0)
    .sort(
      (a, b) =>
        b.pillarScore * recencyWeight(postDate(b.post)) -
        a.pillarScore * recencyWeight(postDate(a.post)),
    );
  const topCandidates = byPillar.slice(0, 5);

  if (topCandidates.length > 0) {
    const affinityReaction = TEMPLATE_REACTION_AFFINITY[template];
    const weights = topCandidates.map((c) => {
      const base = c.effectiveScore;
      const affinityBonus =
        c.post.dominant_reaction === affinityReaction ? base * 0.2 : 0;
      return base + affinityBonus;
    });
    const idx = weightedRandomIndex(weights);
    if (idx >= 0) {
      const pick = topCandidates[idx];
      usedIds.add(pick.post.id);
      examples.push({
        role: "top_performer",
        score: pick.post.content_score_total ?? 0,
        engagement: pick.engagement,
        contentPreview: truncate(pick.post.generated_content, 280),
        dominantReaction: pick.post.dominant_reaction ?? undefined,
        dominantReactionPercent: computeDominantPercent(
          pick.post.reaction_breakdown,
          pick.post.dominant_reaction,
        ),
      });
    }
  }

  // --- ROLE 2: Sleeper Hit ---
  // Moderate score (3.0-4.0 content_score_total) but engagement > 1.5x band average
  const midBand = scored.filter(
    (s) =>
      !usedIds.has(s.post.id) &&
      (s.post.content_score_total ?? 0) >= 3.0 &&
      (s.post.content_score_total ?? 0) <= 4.0 &&
      s.engagement > 0,
  );

  if (midBand.length > 0) {
    const bandAvgEngagement =
      midBand.reduce((sum, s) => sum + s.engagement, 0) / midBand.length;
    const sleepers = midBand.filter(
      (s) => s.engagement > bandAvgEngagement * 1.5,
    );

    if (sleepers.length > 0) {
      const weights = sleepers.map((s) => s.engagement);
      const idx = weightedRandomIndex(weights);
      if (idx >= 0) {
        const pick = sleepers[idx];
        usedIds.add(pick.post.id);
        examples.push({
          role: "sleeper_hit",
          score: pick.post.content_score_total ?? 0,
          engagement: pick.engagement,
          contentPreview: truncate(pick.post.generated_content, 280),
          dominantReaction: pick.post.dominant_reaction ?? undefined,
          dominantReactionPercent: computeDominantPercent(
            pick.post.reaction_breakdown,
            pick.post.dominant_reaction,
          ),
        });
      }
    }
  }

  // --- ROLE 3: Anti-Pattern ---
  // Bottom 20% on primary pillar AND low engagement, bottom 5
  const threshold20 = Math.ceil(scored.length * 0.2);
  const byPillarAsc = [...scored]
    .filter((s) => !usedIds.has(s.post.id) && s.pillarScore > 0)
    .sort((a, b) => a.pillarScore - b.pillarScore);
  const bottom20 = byPillarAsc.slice(0, threshold20);

  // From bottom 20%, take those with below-median engagement
  const medianEngagement = getMedian(scored.map((s) => s.engagement));
  const antiCandidates = bottom20
    .filter((s) => s.engagement <= medianEngagement)
    .slice(0, 5);

  if (antiCandidates.length > 0) {
    // Inverse weight: lower scores get higher selection probability
    const maxPillar = Math.max(...antiCandidates.map((c) => c.pillarScore)) + 1;
    const weights = antiCandidates.map((c) => maxPillar - c.pillarScore);
    const idx = weightedRandomIndex(weights);
    if (idx >= 0) {
      const pick = antiCandidates[idx];
      usedIds.add(pick.post.id);
      examples.push({
        role: "anti_pattern",
        score: pick.post.content_score_total ?? 0,
        engagement: pick.engagement,
        contentPreview: truncate(pick.post.generated_content, 200),
        dominantReaction: pick.post.dominant_reaction ?? undefined,
        dominantReactionPercent: computeDominantPercent(
          pick.post.reaction_breakdown,
          pick.post.dominant_reaction,
        ),
      });
    }
  }

  return examples;
}

export function computeReactionPatterns(
  posts: Post[],
): PostIntelligenceData["aggregate"]["reactionPatterns"] {
  const withReactions = posts.filter((p) => p.reaction_breakdown != null);
  if (withReactions.length === 0) return undefined;

  // Compute average profile across all posts
  const totals = {
    like: 0,
    love: 0,
    insight: 0,
    support: 0,
    celebrate: 0,
    funny: 0,
  };
  let counted = 0;
  for (const p of withReactions) {
    const rb = p.reaction_breakdown!;
    const sum = Object.values(rb).reduce((s, v) => s + v, 0);
    if (sum === 0) continue;
    counted++;
    totals.like += rb.like / sum;
    totals.love += rb.love / sum;
    totals.insight += rb.insight / sum;
    totals.support += rb.support / sum;
    totals.celebrate += rb.celebrate / sum;
    totals.funny += rb.funny / sum;
  }
  if (counted === 0) return undefined;
  const n = counted;
  const avgProfile: ReactionProfile = {
    like: Math.round((totals.like / n) * 1000) / 1000,
    love: Math.round((totals.love / n) * 1000) / 1000,
    insight: Math.round((totals.insight / n) * 1000) / 1000,
    support: Math.round((totals.support / n) * 1000) / 1000,
    celebrate: Math.round((totals.celebrate / n) * 1000) / 1000,
    funny: Math.round((totals.funny / n) * 1000) / 1000,
  };

  // Compute per-template targets
  const templateTargets: Record<
    string,
    { targetReaction: string; avgPercent: number }
  > = {};
  for (const [tmpl, targetReaction] of Object.entries(
    TEMPLATE_REACTION_AFFINITY,
  )) {
    const templatePosts = withReactions.filter((p) => {
      // Use highest pillar to classify template if not set
      const t = p.template ?? classifyByPillar(p);
      return t === tmpl;
    });
    if (templatePosts.length === 0) {
      // Use overall average for this reaction
      templateTargets[tmpl] = {
        targetReaction,
        avgPercent: avgProfile[targetReaction as keyof ReactionProfile] ?? 0,
      };
      continue;
    }
    let reactionSum = 0;
    let tmplCounted = 0;
    for (const p of templatePosts) {
      const rb = p.reaction_breakdown!;
      const sum = Object.values(rb).reduce((s, v) => s + v, 0);
      if (sum === 0) continue;
      tmplCounted++;
      reactionSum += (rb[targetReaction as keyof ReactionBreakdown] ?? 0) / sum;
    }
    templateTargets[tmpl] = {
      targetReaction,
      avgPercent:
        tmplCounted > 0
          ? Math.round((reactionSum / tmplCounted) * 1000) / 1000
          : 0,
    };
  }

  return { avgProfile, templateTargets };
}

/**
 * Computes aggregate stats from scored posts.
 */
export function computeAggregate(
  posts: Post[],
  pillar: { column: keyof Post; name: string },
): PostIntelligenceData["aggregate"] {
  const totalPosts = posts.length;

  // Average content_score_total
  const avgScore =
    posts.reduce((sum, p) => sum + (p.content_score_total ?? 0), 0) / totalPosts;

  // Average of primary pillar
  const primaryPillarAvg =
    posts.reduce((sum, p) => sum + ((p[pillar.column] as number) ?? 0), 0) /
    totalPosts;

  // Weakest pillar across all 6
  let weakestPillar = { name: "", score: Infinity };
  for (const col of PILLAR_COLUMNS) {
    const avg =
      posts.reduce((sum, p) => sum + ((p[col.column] as number) ?? 0), 0) /
      totalPosts;
    if (avg < weakestPillar.score) {
      weakestPillar = { name: col.name, score: avg };
    }
  }

  // Optimal word count: 25th-75th percentile from top-quartile engagement posts
  const byEngagement = [...posts]
    .filter((p) => (p.engagement_total ?? 0) > 0 && p.word_count != null)
    .sort((a, b) => (b.engagement_total ?? 0) - (a.engagement_total ?? 0));
  const topQuartile = byEngagement.slice(
    0,
    Math.max(1, Math.ceil(byEngagement.length * 0.25)),
  );
  const wordCounts = topQuartile
    .map((p) => p.word_count!)
    .sort((a, b) => a - b);

  let optimalWordRange: [number, number] = [150, 280]; // sensible default
  if (wordCounts.length >= 2) {
    const p25 = wordCounts[Math.floor(wordCounts.length * 0.25)];
    const p75 = wordCounts[Math.floor(wordCounts.length * 0.75)];
    optimalWordRange = [p25, p75];
  } else if (wordCounts.length === 1) {
    optimalWordRange = [Math.max(50, wordCounts[0] - 50), wordCounts[0] + 50];
  }

  return {
    totalPosts,
    avgScore: Math.round(avgScore * 10) / 10,
    primaryPillarAvg: Math.round(primaryPillarAvg * 10) / 10,
    weakestPillar: {
      name: weakestPillar.name,
      score: Math.round(weakestPillar.score * 10) / 10,
    },
    optimalWordRange,
    reactionPatterns: computeReactionPatterns(posts),
  };
}
