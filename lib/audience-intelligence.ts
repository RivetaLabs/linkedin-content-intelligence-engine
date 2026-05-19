// Audience Intelligence: analyzes LinkedIn comments to build audience profile
// Computes top commenters, topic triggers, audience composition, and engagement by topic
// Stores results in a singleton table for caching and prompt injection

import type { SupabaseClient } from "@supabase/supabase-js";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AudienceIntelligenceData {
  topCommenters: { name: string; headline: string; commentCount: number }[];
  topicTriggers: { topic: string; avgEngagement: number; postCount: number }[];
  audienceProfile: Record<string, number>; // category -> percentage
  engagementByTopic: Record<string, { avgEngagement: number; count: number }>;
}

interface CommentRow {
  actor_name: string;
  actor_headline: string | null;
  commentary: string;
  linkedin_post_id: string;
}

interface PostRow {
  id: string;
  generated_content: string;
  template: string | null;
  engagement_total: number | null;
  comments: number | null;
}

interface SingletonRow {
  id: string;
  computed_at: string;
  top_commenters: AudienceIntelligenceData["topCommenters"];
  topic_triggers: AudienceIntelligenceData["topicTriggers"];
  audience_profile: AudienceIntelligenceData["audienceProfile"];
  engagement_by_topic: AudienceIntelligenceData["engagementByTopic"];
  is_singleton: boolean;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const TOP_COMMENTERS_LIMIT = 20;
const MIN_COMMENTS_FOR_ANALYSIS = 5;

// Headline keywords for audience classification.
// Each category maps to an array of case-insensitive keywords to match.
const AUDIENCE_CATEGORIES: Record<string, string[]> = {
  expert: [
    "founder",
    "operator",
    "product",
    "strategy",
    "customer",
    "research",
    "analytics",
    "engineering",
    "security",
    "growth",
    "sales",
    "marketing",
    "operations",
    "data",
  ],
  leadership: [
    "vp",
    "vice president",
    "director",
    "head of",
    "chief",
    "cmo",
    "cto",
    "coo",
    "cfo",
    "svp",
    "senior vice president",
    "managing director",
    "general manager",
    "president",
    "partner",
    "principal",
    "executive",
    "c-suite",
    "board member",
    "board director",
  ],
  startup: [
    "founder",
    "co-founder",
    "cofounder",
    "ceo",
    "startup",
    "entrepreneur",
    "built",
    "bootstrapped",
    "venture",
    "early-stage",
    "seed",
    "series a",
  ],
  consulting: [
    "consultant",
    "consulting",
    "advisor",
    "advisory",
    "freelance",
    "independent",
    "strategy",
    "strategist",
    "management consulting",
    "mckinsey",
    "bain",
    "bcg",
    "deloitte",
    "pwc",
    "accenture",
    "kpmg",
    "ey",
  ],
  academic: [
    "professor",
    "phd",
    "ph.d",
    "researcher",
    "academic",
    "university",
    "lecturer",
    "faculty",
    "postdoc",
    "post-doc",
    "doctoral",
    "tenure",
    "adjunct",
    "associate professor",
    "assistant professor",
    "department of",
    "school of",
    "institute",
  ],
};

// Stop words filtered out during topic keyword extraction.
// Includes common English words plus LinkedIn-specific filler.
const STOP_WORDS = new Set([
  "the",
  "a",
  "an",
  "and",
  "or",
  "but",
  "in",
  "on",
  "at",
  "to",
  "for",
  "of",
  "with",
  "by",
  "from",
  "is",
  "it",
  "its",
  "as",
  "be",
  "was",
  "are",
  "were",
  "been",
  "being",
  "have",
  "has",
  "had",
  "do",
  "does",
  "did",
  "will",
  "would",
  "could",
  "should",
  "may",
  "might",
  "can",
  "this",
  "that",
  "these",
  "those",
  "i",
  "you",
  "he",
  "she",
  "we",
  "they",
  "me",
  "him",
  "her",
  "us",
  "them",
  "my",
  "your",
  "his",
  "our",
  "their",
  "what",
  "which",
  "who",
  "when",
  "where",
  "how",
  "why",
  "all",
  "each",
  "every",
  "both",
  "few",
  "more",
  "most",
  "other",
  "some",
  "such",
  "no",
  "not",
  "only",
  "same",
  "so",
  "than",
  "too",
  "very",
  "just",
  "about",
  "also",
  "back",
  "been",
  "before",
  "even",
  "first",
  "get",
  "go",
  "got",
  "here",
  "if",
  "into",
  "know",
  "like",
  "make",
  "many",
  "much",
  "new",
  "now",
  "one",
  "over",
  "out",
  "own",
  "people",
  "say",
  "see",
  "still",
  "take",
  "think",
  "time",
  "up",
  "want",
  "way",
  "well",
  "work",
  "year",
  "after",
  "then",
  "them",
  "two",
  "day",
  "part",
  "come",
  "made",
  "find",
  "long",
  "look",
  "down",
  "need",
  "thing",
  "right",
  "going",
  "point",
  "great",
  "post",
  "linkedin",
  "content",
  "thanks",
  "thank",
  "agree",
  "love",
  "really",
  "good",
  "yes",
  "sure",
  "true",
  "absolutely",
]);

const MIN_WORD_LENGTH = 4;
const TOP_TOPICS_LIMIT = 30;

// ---------------------------------------------------------------------------
// Main compute function
// ---------------------------------------------------------------------------

/**
 * Queries linkedin_comments and posts, builds audience intelligence,
 * and upserts the singleton row in audience_intelligence.
 *
 * Accepts a SupabaseClient to allow caller-provided clients (test isolation,
 * different auth contexts). Returns the computed data, or null if there is
 * insufficient data to analyze.
 */
export async function computeAudienceIntelligence(
  supabaseClient: SupabaseClient,
): Promise<AudienceIntelligenceData | null> {
  try {
    // ------------------------------------------------------------------
    // Step 1: Fetch comments and posts in parallel
    // ------------------------------------------------------------------
    const [commentsResult, postsResult] = await Promise.all([
      supabaseClient
        .from("linkedin_comments")
        .select("actor_name, actor_headline, commentary, linkedin_post_id"),
      supabaseClient
        .from("posts")
        .select("id, generated_content, template, engagement_total, comments")
        .not("engagement_total", "is", null),
    ]);

    if (commentsResult.error) {
      console.warn(
        "[audience-intelligence] Comments query failed:",
        commentsResult.error.message,
      );
      return null;
    }

    if (postsResult.error) {
      console.warn(
        "[audience-intelligence] Posts query failed:",
        postsResult.error.message,
      );
      return null;
    }

    const comments = (commentsResult.data ?? []) as CommentRow[];
    const posts = (postsResult.data ?? []) as PostRow[];

    if (comments.length < MIN_COMMENTS_FOR_ANALYSIS) {
      console.warn(
        `[audience-intelligence] Only ${comments.length} comments found, need at least ${MIN_COMMENTS_FOR_ANALYSIS}.`,
      );
      return null;
    }

    // Build a lookup map from post_id to post data
    const postsById = new Map<string, PostRow>();
    for (const post of posts) {
      postsById.set(post.id, post);
    }

    // ------------------------------------------------------------------
    // Step 2: Top commenters
    // ------------------------------------------------------------------
    const topCommenters = buildTopCommenters(comments);

    // ------------------------------------------------------------------
    // Step 3: Topic triggers from high-engagement posts
    // ------------------------------------------------------------------
    const topicTriggers = buildTopicTriggers(posts);

    // ------------------------------------------------------------------
    // Step 4: Audience composition from commenter headlines
    // ------------------------------------------------------------------
    const audienceProfile = buildAudienceProfile(comments);

    // ------------------------------------------------------------------
    // Step 5: Engagement by post template
    // ------------------------------------------------------------------
    const engagementByTopic = buildEngagementByTemplate(posts);

    const data: AudienceIntelligenceData = {
      topCommenters,
      topicTriggers,
      audienceProfile,
      engagementByTopic,
    };

    // ------------------------------------------------------------------
    // Step 6: Upsert singleton row
    // ------------------------------------------------------------------
    await upsertSingleton(supabaseClient, data);

    return data;
  } catch (err) {
    console.warn("[audience-intelligence] Compute failed:", err);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Cached read
// ---------------------------------------------------------------------------

/**
 * Fetches the cached audience intelligence from the singleton table.
 * Returns null if no data has been computed yet.
 */
export async function getAudienceIntelligence(
  supabaseClient: SupabaseClient,
): Promise<AudienceIntelligenceData | null> {
  try {
    const { data, error } = await supabaseClient
      .from("audience_intelligence")
      .select(
        "top_commenters, topic_triggers, audience_profile, engagement_by_topic",
      )
      .eq("is_singleton", true)
      .single();

    if (error || !data) {
      return null;
    }

    const row = data as unknown as Pick<
      SingletonRow,
      | "top_commenters"
      | "topic_triggers"
      | "audience_profile"
      | "engagement_by_topic"
    >;

    return {
      topCommenters: row.top_commenters ?? [],
      topicTriggers: row.topic_triggers ?? [],
      audienceProfile: row.audience_profile ?? {},
      engagementByTopic: row.engagement_by_topic ?? {},
    };
  } catch (err) {
    console.warn("[audience-intelligence] Get failed:", err);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Prompt block formatter
// ---------------------------------------------------------------------------

/**
 * Formats audience intelligence data as an XML block for system prompt injection.
 * Follows the same XML structure conventions used by post-intelligence.ts.
 */
export function formatAudienceIntelligenceBlock(
  data: AudienceIntelligenceData,
): string {
  // Top commenters section
  const commenterEntries = data.topCommenters
    .slice(0, 10) // Limit to top 10 in prompt to save tokens
    .map(
      (c) =>
        `    <commenter name="${escapeXmlAttr(c.name)}" headline="${escapeXmlAttr(c.headline)}" comments="${c.commentCount}" />`,
    )
    .join("\n");

  // Topic triggers section
  const topicEntries = data.topicTriggers
    .slice(0, 15) // Limit to top 15 topics
    .map(
      (t) =>
        `    <topic keyword="${escapeXmlAttr(t.topic)}" avg-engagement="${t.avgEngagement}" post-count="${t.postCount}" />`,
    )
    .join("\n");

  // Audience composition section
  const profileEntries = Object.entries(data.audienceProfile)
    .filter(([, pct]) => pct > 0)
    .sort(([, a], [, b]) => b - a)
    .map(([cat, pct]) => `${cat}="${pct}%"`)
    .join(" ");

  // Engagement by template section
  const templateEntries = Object.entries(data.engagementByTopic)
    .sort(([, a], [, b]) => b.avgEngagement - a.avgEngagement)
    .map(
      ([tmpl, stats]) =>
        `    <template name="${escapeXmlAttr(tmpl)}" avg-engagement="${stats.avgEngagement}" count="${stats.count}" />`,
    )
    .join("\n");

  return `<audience-intelligence>
  <top-commenters count="${data.topCommenters.length}">
    These are the creator's most engaged repeat commenters. Consider referencing their professional contexts when crafting content.
${commenterEntries}
  </top-commenters>
  <topic-triggers>
    Keywords extracted from high-engagement posts. Use these topics to increase comment likelihood.
${topicEntries}
  </topic-triggers>
  <audience-composition ${profileEntries}>
    Percentage breakdown of commenter professional backgrounds. Tailor vocabulary and examples to the dominant segments.
  </audience-composition>
  <engagement-by-template>
    Average engagement by post template. Consider which formats resonate most.
${templateEntries}
  </engagement-by-template>
</audience-intelligence>`;
}

// ---------------------------------------------------------------------------
// Internal: top commenters
// ---------------------------------------------------------------------------

/**
 * Groups comments by author_name, counts frequency, and returns the top N
 * sorted by comment count descending. Uses the most recent headline per author.
 */
function buildTopCommenters(
  comments: CommentRow[],
): AudienceIntelligenceData["topCommenters"] {
  const map = new Map<
    string,
    { name: string; headline: string; count: number }
  >();

  for (const c of comments) {
    const name = (c.actor_name ?? "").trim();
    if (!name) continue;

    const existing = map.get(name);
    if (existing) {
      existing.count += 1;
      // Prefer non-empty headline (take latest non-empty one)
      if (c.actor_headline && c.actor_headline.trim()) {
        existing.headline = c.actor_headline.trim();
      }
    } else {
      map.set(name, {
        name,
        headline: (c.actor_headline ?? "").trim(),
        count: 1,
      });
    }
  }

  return Array.from(map.values())
    .filter((entry) => entry.count >= 2) // Only repeat commenters
    .sort((a, b) => b.count - a.count)
    .slice(0, TOP_COMMENTERS_LIMIT)
    .map((entry) => ({
      name: entry.name,
      headline: entry.headline,
      commentCount: entry.count,
    }));
}

// ---------------------------------------------------------------------------
// Internal: topic triggers
// ---------------------------------------------------------------------------

/**
 * Extracts meaningful keywords from the top 20% of posts by comment count,
 * computes each keyword's average engagement across posts it appears in.
 */
function buildTopicTriggers(
  posts: PostRow[],
): AudienceIntelligenceData["topicTriggers"] {
  if (posts.length === 0) return [];

  // Sort by comments descending, take top 20%
  const withComments = posts
    .filter((p) => (p.comments ?? 0) > 0)
    .sort((a, b) => (b.comments ?? 0) - (a.comments ?? 0));

  const topCount = Math.max(1, Math.ceil(withComments.length * 0.2));
  const topPosts = withComments.slice(0, topCount);

  if (topPosts.length === 0) return [];

  // Extract words from top posts and build keyword-to-engagement mapping
  // Also scan ALL posts for each keyword to get the real average engagement
  const keywordCounts = new Map<string, number>(); // keyword -> appearances in top posts

  for (const post of topPosts) {
    const words = extractKeywords(post.generated_content);
    const uniqueWords = new Set(words);
    for (const word of uniqueWords) {
      keywordCounts.set(word, (keywordCounts.get(word) ?? 0) + 1);
    }
  }

  // Filter to keywords appearing in at least 2 top posts (signal, not noise)
  const significantKeywords = Array.from(keywordCounts.entries())
    .filter(([, count]) => count >= 2)
    .map(([keyword]) => keyword);

  if (significantKeywords.length === 0) {
    // Fallback: take top 30 by frequency even if only 1 appearance
    const fallback = Array.from(keywordCounts.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, TOP_TOPICS_LIMIT)
      .map(([keyword]) => keyword);
    return computeKeywordEngagement(fallback, posts);
  }

  return computeKeywordEngagement(significantKeywords, posts);
}

/**
 * For each keyword, find all posts containing it and compute average engagement.
 */
function computeKeywordEngagement(
  keywords: string[],
  posts: PostRow[],
): AudienceIntelligenceData["topicTriggers"] {
  const results: AudienceIntelligenceData["topicTriggers"] = [];

  for (const keyword of keywords) {
    const matchingPosts = posts.filter((p) => {
      const content = p.generated_content.toLowerCase();
      return content.includes(keyword);
    });

    if (matchingPosts.length === 0) continue;

    const totalEngagement = matchingPosts.reduce(
      (sum, p) => sum + (p.engagement_total ?? 0),
      0,
    );
    const avgEngagement = Math.round(totalEngagement / matchingPosts.length);

    results.push({
      topic: keyword,
      avgEngagement,
      postCount: matchingPosts.length,
    });
  }

  return results
    .sort((a, b) => b.avgEngagement - a.avgEngagement)
    .slice(0, TOP_TOPICS_LIMIT);
}

/**
 * Extracts meaningful lowercase words from text.
 * Filters stop words, short words, and purely numeric tokens.
 */
function extractKeywords(text: string): string[] {
  const cleaned = text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return cleaned
    .split(" ")
    .filter(
      (word) =>
        word.length >= MIN_WORD_LENGTH &&
        !STOP_WORDS.has(word) &&
        !/^\d+$/.test(word),
    );
}

// ---------------------------------------------------------------------------
// Internal: audience composition
// ---------------------------------------------------------------------------

/**
 * Classifies commenters into professional categories based on headline keywords.
 * Each commenter is counted once. A commenter can match multiple categories,
 * but each category match is counted independently, then normalized to 100%.
 */
function buildAudienceProfile(
  comments: CommentRow[],
): AudienceIntelligenceData["audienceProfile"] {
  // Deduplicate by actor name, keeping the most informative headline
  const authorHeadlines = new Map<string, string>();
  for (const c of comments) {
    const name = (c.actor_name ?? "").trim();
    if (!name) continue;
    const headline = (c.actor_headline ?? "").trim();
    const existing = authorHeadlines.get(name);
    // Keep the longer headline (more informative)
    if (!existing || headline.length > existing.length) {
      authorHeadlines.set(name, headline);
    }
  }

  const totalAuthors = authorHeadlines.size;
  if (totalAuthors === 0) {
    return {
      expert: 0,
      leadership: 0,
      startup: 0,
      consulting: 0,
      academic: 0,
      other: 0,
    };
  }

  const categoryCounts: Record<string, number> = {
    expert: 0,
    leadership: 0,
    startup: 0,
    consulting: 0,
    academic: 0,
  };

  let classifiedCount = 0;

  for (const [, headline] of authorHeadlines) {
    if (!headline) continue;
    const lower = headline.toLowerCase();
    let matched = false;

    for (const [category, keywords] of Object.entries(AUDIENCE_CATEGORIES)) {
      const hasMatch = keywords.some((kw) => lower.includes(kw));
      if (hasMatch) {
        categoryCounts[category] += 1;
        matched = true;
      }
    }

    if (matched) {
      classifiedCount += 1;
    }
  }

  // Compute "other" as authors who matched no category
  const unclassifiedCount = totalAuthors - classifiedCount;

  // Normalize all counts to percentages of total unique authors
  const profile: Record<string, number> = {};
  for (const [category, count] of Object.entries(categoryCounts)) {
    profile[category] = Math.round((count / totalAuthors) * 100);
  }
  profile["other"] = Math.round((unclassifiedCount / totalAuthors) * 100);

  // Ensure percentages are sensible (rounding can cause drift).
  // The total may exceed 100 because one author can match multiple categories.
  // This is intentional: a "VP at Pfizer" is both expert and leadership.
  // The "other" percentage represents authors matching NO category.

  return profile;
}

// ---------------------------------------------------------------------------
// Internal: engagement by template
// ---------------------------------------------------------------------------

/**
 * Groups posts by template and computes average engagement per template.
 */
function buildEngagementByTemplate(
  posts: PostRow[],
): AudienceIntelligenceData["engagementByTopic"] {
  const templateMap = new Map<
    string,
    { totalEngagement: number; count: number }
  >();

  for (const post of posts) {
    const template = post.template ?? "unknown";
    const engagement = post.engagement_total ?? 0;

    const existing = templateMap.get(template);
    if (existing) {
      existing.totalEngagement += engagement;
      existing.count += 1;
    } else {
      templateMap.set(template, { totalEngagement: engagement, count: 1 });
    }
  }

  const result: AudienceIntelligenceData["engagementByTopic"] = {};
  for (const [template, stats] of templateMap) {
    result[template] = {
      avgEngagement:
        stats.count > 0 ? Math.round(stats.totalEngagement / stats.count) : 0,
      count: stats.count,
    };
  }

  return result;
}

// ---------------------------------------------------------------------------
// Internal: singleton upsert
// ---------------------------------------------------------------------------

/**
 * Upserts the computed data into the audience_intelligence singleton table.
 * Uses is_singleton=true as the conflict target for idempotent writes.
 */
async function upsertSingleton(
  supabaseClient: SupabaseClient,
  data: AudienceIntelligenceData,
): Promise<void> {
  const payload = {
    is_singleton: true,
    computed_at: new Date().toISOString(),
    top_commenters: data.topCommenters,
    topic_triggers: data.topicTriggers,
    audience_profile: data.audienceProfile,
    engagement_by_topic: data.engagementByTopic,
  };

  // Try update first (most common path after initial compute)
  const { data: existing, error: selectError } = await supabaseClient
    .from("audience_intelligence")
    .select("id")
    .eq("is_singleton", true)
    .single();

  if (selectError || !existing) {
    // No existing row, insert
    const { error: insertError } = await supabaseClient
      .from("audience_intelligence")
      .insert(payload);

    if (insertError) {
      console.warn(
        "[audience-intelligence] Insert failed:",
        insertError.message,
      );
    }
    return;
  }

  // Existing row found, update it
  const { error: updateError } = await supabaseClient
    .from("audience_intelligence")
    .update(payload)
    .eq("id", existing.id);

  if (updateError) {
    console.warn("[audience-intelligence] Update failed:", updateError.message);
  }
}

// ---------------------------------------------------------------------------
// Internal: XML escape helper
// ---------------------------------------------------------------------------

/**
 * Escapes characters that are not safe inside XML attribute values.
 */
function escapeXmlAttr(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/'/g, "&apos;");
}
