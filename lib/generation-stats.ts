// Queries generation performance by linking matched posts.
// Uses the generated_from_id FK set by post-matching.ts to join
// LinkedIn engagement data back to the generated post that produced it.
// v2: Adds getEditPatterns() for publication diff aggregation.

import type { SupabaseClient } from "@supabase/supabase-js";
import type { PublicationEdits } from "@/lib/post-matching";

export interface GenerationPerformance {
  totalMatched: number;
  avgEngagement: number;
  byTemplate: Record<string, { avgEngagement: number; count: number }>;
  byModel: Record<string, { avgEngagement: number; count: number }>;
  byGoldStandard: {
    id: string;
    template: string;
    avgEngagement: number;
    count: number;
  }[];
  topPerformers: {
    generatedId: string;
    linkedinId: string;
    engagement: number;
    template: string;
  }[];
}

interface LinkedInMatchedRow {
  id: string;
  generated_content: string;
  engagement_total: number | null;
  generated_from_id: string;
}

interface GeneratedPostRow {
  id: string;
  template: string;
  model: string;
  generation_metadata: Record<string, unknown> | null;
}

/**
 * Queries posts WHERE generated_from_id IS NOT NULL (matched pairs)
 * and joins engagement data from the LinkedIn side with metadata from the generated side.
 *
 * Returns aggregated performance broken down by template, model, gold standard, and top performers.
 */
export async function getGenerationPerformance(
  supabase: SupabaseClient,
): Promise<GenerationPerformance> {
  // Step 1: Fetch all LinkedIn posts that have been matched to a generated post
  const { data: matchedLinkedIn, error: liError } = await supabase
    .from("posts")
    .select("id, generated_content, engagement_total, generated_from_id")
    .eq("source", "linkedin")
    .not("generated_from_id", "is", null);

  if (liError) {
    throw new Error(
      `Failed to fetch matched LinkedIn posts: ${liError.message}`,
    );
  }

  if (!matchedLinkedIn || matchedLinkedIn.length === 0) {
    return {
      totalMatched: 0,
      avgEngagement: 0,
      byTemplate: {},
      byModel: {},
      byGoldStandard: [],
      topPerformers: [],
    };
  }

  const typedLinkedIn = matchedLinkedIn as LinkedInMatchedRow[];

  // Step 2: Fetch all generated posts that were matched (to get template, model, metadata)
  const generatedIds = Array.from(
    new Set(typedLinkedIn.map((p) => p.generated_from_id)),
  );

  // Supabase .in() has a practical limit. Batch if needed (unlikely for single user).
  const { data: generatedPosts, error: genError } = await supabase
    .from("posts")
    .select("id, template, model, generation_metadata")
    .in("id", generatedIds);

  if (genError) {
    throw new Error(`Failed to fetch generated posts: ${genError.message}`);
  }

  // Build lookup map: generated post ID -> metadata
  const genMap = new Map<string, GeneratedPostRow>();
  if (generatedPosts) {
    for (const gp of generatedPosts as GeneratedPostRow[]) {
      genMap.set(gp.id, gp);
    }
  }

  // Step 3: Join and compute aggregates
  interface JoinedPair {
    linkedinId: string;
    generatedId: string;
    engagement: number;
    template: string;
    model: string;
    goldStandardId: string | null;
  }

  const pairs: JoinedPair[] = [];

  for (const liPost of typedLinkedIn) {
    const gen = genMap.get(liPost.generated_from_id);
    if (!gen) continue;

    const engagement = liPost.engagement_total ?? 0;
    const goldStandardId = extractGoldStandardId(gen.generation_metadata);

    pairs.push({
      linkedinId: liPost.id,
      generatedId: gen.id,
      engagement,
      template: gen.template,
      model: gen.model,
      goldStandardId,
    });
  }

  if (pairs.length === 0) {
    return {
      totalMatched: 0,
      avgEngagement: 0,
      byTemplate: {},
      byModel: {},
      byGoldStandard: [],
      topPerformers: [],
    };
  }

  // Step 4: Compute overall average
  const totalEngagement = pairs.reduce((sum, p) => sum + p.engagement, 0);
  const avgEngagement =
    Math.round((totalEngagement / pairs.length) * 100) / 100;

  // Step 5: Aggregate by template
  const byTemplate = aggregateBy(pairs, (p) => p.template);

  // Step 6: Aggregate by model
  const byModel = aggregateBy(pairs, (p) => p.model);

  // Step 7: Aggregate by gold standard
  const goldStandardAccum = new Map<
    string,
    { template: string; totalEngagement: number; count: number }
  >();
  for (const p of pairs) {
    if (!p.goldStandardId) continue;
    const existing = goldStandardAccum.get(p.goldStandardId);
    if (existing) {
      existing.totalEngagement += p.engagement;
      existing.count++;
    } else {
      goldStandardAccum.set(p.goldStandardId, {
        template: p.template,
        totalEngagement: p.engagement,
        count: 1,
      });
    }
  }

  const goldStandardEntries: [
    string,
    { template: string; totalEngagement: number; count: number },
  ][] = [];
  goldStandardAccum.forEach((data, id) => {
    goldStandardEntries.push([id, data]);
  });

  const byGoldStandard = goldStandardEntries
    .map(([id, data]) => ({
      id,
      template: data.template,
      avgEngagement:
        Math.round((data.totalEngagement / data.count) * 100) / 100,
      count: data.count,
    }))
    .sort((a, b) => b.avgEngagement - a.avgEngagement);

  // Step 8: Top performers (sorted by engagement, top 10)
  const topPerformers = [...pairs]
    .sort((a, b) => b.engagement - a.engagement)
    .slice(0, 10)
    .map((p) => ({
      generatedId: p.generatedId,
      linkedinId: p.linkedinId,
      engagement: p.engagement,
      template: p.template,
    }));

  return {
    totalMatched: pairs.length,
    avgEngagement,
    byTemplate,
    byModel,
    byGoldStandard,
    topPerformers,
  };
}

/**
 * Extracts gold_standard_id from the generation_metadata JSONB field.
 * Returns null if metadata is missing or does not contain the key.
 */
function extractGoldStandardId(
  metadata: Record<string, unknown> | null,
): string | null {
  if (!metadata) return null;
  const id = metadata.gold_standard_id;
  if (typeof id === "string" && id.length > 0) return id;
  return null;
}

/**
 * Groups items by a key function and computes average engagement per group.
 */
function aggregateBy<T extends { engagement: number }>(
  pairs: T[],
  keyFn: (item: T) => string,
): Record<string, { avgEngagement: number; count: number }> {
  const accum = new Map<string, { totalEngagement: number; count: number }>();

  for (const p of pairs) {
    const key = keyFn(p);
    const existing = accum.get(key);
    if (existing) {
      existing.totalEngagement += p.engagement;
      existing.count++;
    } else {
      accum.set(key, { totalEngagement: p.engagement, count: 1 });
    }
  }

  const result: Record<string, { avgEngagement: number; count: number }> = {};
  accum.forEach((data, key) => {
    result[key] = {
      avgEngagement:
        Math.round((data.totalEngagement / data.count) * 100) / 100,
      count: data.count,
    };
  });

  return result;
}

// --- Publication Edit Pattern Aggregation ---

export interface EditPatterns {
  totalEditsAnalyzed: number;
  avgOverlapPct: number;
  sectionChangeFrequency: {
    hook: number;
    body: number;
    cta: number;
  };
  avgNetWordChange: number;
  topAddedPhrases: { phrase: string; count: number }[];
  topRemovedPhrases: { phrase: string; count: number }[];
}

interface PublicationEditsRow {
  publication_edits: PublicationEdits;
}

/**
 * Aggregates publication edit patterns across all matched posts.
 * Answers questions like:
 * - "How much does she typically change?" (avgOverlapPct)
 * - "Which sections does she edit most?" (sectionChangeFrequency)
 * - "Does she add or remove words?" (avgNetWordChange)
 * - "What phrases does she consistently add/remove?" (topAddedPhrases, topRemovedPhrases)
 *
 * Requires matched posts with publication_edits populated by matchGeneratedToLinkedIn().
 */
export async function getEditPatterns(
  supabase: SupabaseClient,
): Promise<EditPatterns> {
  const { data, error } = await supabase
    .from("posts")
    .select("publication_edits")
    .not("publication_edits", "is", null);

  if (error) {
    throw new Error(`Failed to fetch publication edits: ${error.message}`);
  }

  if (!data || data.length === 0) {
    return {
      totalEditsAnalyzed: 0,
      avgOverlapPct: 0,
      sectionChangeFrequency: { hook: 0, body: 0, cta: 0 },
      avgNetWordChange: 0,
      topAddedPhrases: [],
      topRemovedPhrases: [],
    };
  }

  const edits = data as PublicationEditsRow[];
  const total = edits.length;

  // Average overlap: how much does she typically keep unchanged?
  const avgOverlapPct = Math.round(
    edits.reduce((sum, e) => sum + e.publication_edits.overlap_pct, 0) / total,
  );

  // Section change frequency: percentage of posts where each section was edited
  const hookChanges = edits.filter(
    (e) => e.publication_edits.hook_changed,
  ).length;
  const bodyChanges = edits.filter(
    (e) => e.publication_edits.body_changed,
  ).length;
  const ctaChanges = edits.filter(
    (e) => e.publication_edits.cta_changed,
  ).length;

  // Average net word change: positive = she adds words, negative = she trims
  const avgNetWordChange = Math.round(
    edits.reduce((sum, e) => sum + e.publication_edits.net_word_change, 0) /
      total,
  );

  // Phrase frequency: what does she consistently add or remove?
  const addedPhraseCounts = new Map<string, number>();
  const removedPhraseCounts = new Map<string, number>();

  for (const e of edits) {
    for (const phrase of e.publication_edits.added_phrases || []) {
      addedPhraseCounts.set(phrase, (addedPhraseCounts.get(phrase) || 0) + 1);
    }
    for (const phrase of e.publication_edits.removed_phrases || []) {
      removedPhraseCounts.set(
        phrase,
        (removedPhraseCounts.get(phrase) || 0) + 1,
      );
    }
  }

  // Sort by frequency, take top 15
  const topAddedPhrases = [...addedPhraseCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
    .map(([phrase, count]) => ({ phrase, count }));

  const topRemovedPhrases = [...removedPhraseCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
    .map(([phrase, count]) => ({ phrase, count }));

  return {
    totalEditsAnalyzed: total,
    avgOverlapPct,
    sectionChangeFrequency: {
      hook: Math.round((hookChanges / total) * 100),
      body: Math.round((bodyChanges / total) * 100),
      cta: Math.round((ctaChanges / total) * 100),
    },
    avgNetWordChange,
    topAddedPhrases,
    topRemovedPhrases,
  };
}
