import { supabase } from "@/lib/supabase";
import { calibrateWeights } from "@/lib/scoring-calibration";
import { computeAudienceIntelligence } from "@/lib/audience-intelligence";
import { errorResponse, jsonResponse } from "@/lib/api/response";

export async function GET() {
  // Get cached insights
  const { data: cache } = await supabase
    .from("insights_cache")
    .select("*")
    .single();

  if (cache) {
    return jsonResponse(cache);
  }

  // Compute fresh insights from posts
  const { data: posts, error } = await supabase
    .from("posts")
    .select("*")
    .order("engagement_total", { ascending: false });

  if (error) return errorResponse(error.message);
  if (!posts || posts.length === 0) {
    return jsonResponse({
      aggregate_stats: {
        total_posts: 0,
        avg_content_score_total: 0,
        avg_engagement_total: 0,
        pillar_averages: {
          hook: 0,
          value: 0,
          format: 0,
          framework: 0,
          contrarian: 0,
          story: 0,
        },
        template_breakdown: {},
        top_performers: [],
        source_breakdown: { generated: 0, linkedin: 0 },
      },
      ai_summary: null,
      suggested_next: [],
      post_count: 0,
    });
  }

  const scored = posts.filter((p) => p.content_score_total !== null);
  const pillarFields = [
    "hook_score",
    "value_score",
    "format_score",
    "framework_score",
    "contrarian_score",
    "story_score",
  ] as const;
  const pillarNames = [
    "hook",
    "value",
    "format",
    "framework",
    "contrarian",
    "story",
  ] as const;

  const pillarAverages: Record<string, number> = {};
  for (let i = 0; i < pillarFields.length; i++) {
    const field = pillarFields[i];
    const values = scored
      .filter((p) => p[field] !== null)
      .map((p) => Number(p[field]));
    pillarAverages[pillarNames[i]] =
      values.length > 0
        ? Math.round(
            (values.reduce((a, b) => a + b, 0) / values.length) * 100,
          ) / 100
        : 0;
  }

  const templateBreakdown: Record<string, number> = {};
  for (const p of posts) {
    templateBreakdown[p.template] = (templateBreakdown[p.template] || 0) + 1;
  }

  const generated = posts.filter((p) => p.source === "generated").length;
  const linkedin = posts.filter((p) => p.source === "linkedin").length;

  const stats = {
    total_posts: posts.length,
    avg_content_score_total:
      scored.length > 0
        ? Math.round(
            (scored.reduce((a, p) => a + Number(p.content_score_total), 0) /
              scored.length) *
              100,
          ) / 100
        : 0,
    avg_engagement_total:
      posts.length > 0
        ? Math.round(
            posts.reduce((a, p) => a + (p.engagement_total || 0), 0) /
              posts.length,
          )
        : 0,
    pillar_averages: pillarAverages,
    template_breakdown: templateBreakdown,
    top_performers: posts.slice(0, 5).map((p) => p.id),
    source_breakdown: { generated, linkedin },
  };

  // Upsert cache (atomic, no race condition)
  await supabase.from("insights_cache").upsert(
    {
      is_singleton: true,
      aggregate_stats: stats,
      post_count: posts.length,
      last_computed_at: new Date().toISOString(),
    },
    { onConflict: "is_singleton" },
  );

  // v4: Run calibration and audience intelligence in parallel (non-blocking)
  const [calibratedWeights, audienceIntel] = await Promise.all([
    calibrateWeights(supabase).catch(() => null),
    computeAudienceIntelligence(supabase).catch(() => null),
  ]);

  return jsonResponse({
    aggregate_stats: stats,
    ai_summary: null,
    suggested_next: [],
    post_count: posts.length,
    calibrated_weights: calibratedWeights,
    audience_intelligence: audienceIntel,
  });
}
