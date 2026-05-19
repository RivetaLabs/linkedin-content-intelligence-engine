// Supabase data fetching extracted from post-intelligence.ts

import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  Template,
  Audience,
  Post,
  PostIntelligenceData,
} from "@/lib/types";
import {
  TEMPLATE_PRIMARY_PILLAR,
  MIN_POSTS_THRESHOLD,
  selectCuratedExamples,
  computeAggregate,
} from "./post-intelligence-stats";

/**
 * Fetches scored posts from Supabase with audience filtering.
 * Returns null if fewer than MIN_POSTS_THRESHOLD posts qualify.
 */
export async function fetchPostIntelligence(
  supabase: SupabaseClient,
  template: Exclude<Template, "polish">,
  audience: Audience,
): Promise<PostIntelligenceData | null> {
  try {
    // Build query: all scored posts
    let query = supabase
      .from("posts")
      .select(
        "id, created_at, posted_at, generated_content, source, template, audience, word_count, " +
          "hook_score, value_score, format_score, framework_score, contrarian_score, story_score, " +
          "content_score_total, engagement_total, likes, comments, shares, " +
          "reaction_breakdown, dominant_reaction, comment_ratio",
      )
      .not("content_score_total", "is", null);

    // Audience filtering: NULL posts always match, hybrid sees everything
    if (audience !== "hybrid") {
      query = query.or(`audience.is.null,audience.eq.${audience}`);
    }

    const { data: posts, error } = await query;

    if (error) {
      console.warn("Post intelligence query failed:", error.message);
      return null;
    }

    if (!posts || posts.length < MIN_POSTS_THRESHOLD) {
      return null;
    }

    const pillar = TEMPLATE_PRIMARY_PILLAR[template];
    const typedPosts = posts as unknown as Post[];
    const examples = selectCuratedExamples(typedPosts, pillar.column, template);
    const aggregate = computeAggregate(typedPosts, pillar);

    return { aggregate, examples };
  } catch (err) {
    console.warn("Post intelligence fetch error:", err);
    return null;
  }
}

/**
 * Fetches opening lines from the 5 most recent generated posts.
 * Used for the novelty directive's avoid-openings section.
 */
export async function fetchRecentOpeningLines(
  supabase: SupabaseClient,
): Promise<string[]> {
  try {
    const { data, error } = await supabase
      .from("posts")
      .select("generated_content")
      .eq("source", "generated")
      .order("created_at", { ascending: false })
      .limit(5);

    if (error || !data) return [];

    return data
      .map((row: { generated_content: string }) => {
        const content = row.generated_content.trim();
        // Extract first sentence (up to first period, question mark, or exclamation)
        const match = content.match(/^[^.!?\n]+[.!?]?/);
        return match ? match[0].trim() : content.slice(0, 100);
      })
      .filter((line: string) => line.length > 0);
  } catch {
    return [];
  }
}
