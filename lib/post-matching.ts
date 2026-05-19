// Fuzzy-matches generated posts to LinkedIn scraped posts.
// When the creator generates a post, copies it, publishes on LinkedIn,
// and we later scrape it, this module connects the two via word overlap.
// v2: Computes publication_edits (section-level diffs) on each match
//     to track what she changes between copy and publish.

import type { SupabaseClient } from "@supabase/supabase-js";

export interface MatchResult {
  matched: number;
  unmatched: number;
  total: number;
  editsComputed: number;
}

export interface PublicationEdits {
  overlap_pct: number;
  hook_changed: boolean;
  body_changed: boolean;
  cta_changed: boolean;
  words_added: number;
  words_removed: number;
  net_word_change: number;
  added_phrases: string[];
  removed_phrases: string[];
  section_diffs: {
    hook?: { before: string; after: string };
    body?: { before: string; after: string };
    cta?: { before: string; after: string };
  };
}

interface PostSections {
  hook: string;
  body: string;
  cta: string;
}

interface GeneratedPost {
  id: string;
  generated_content: string;
}

interface LinkedInPost {
  id: string;
  generated_content: string;
}

/**
 * Strips punctuation and lowercases text for normalized word comparison.
 * Removes all non-alphanumeric characters except spaces.
 */
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Computes word overlap ratio between two texts.
 * Returns a value between 0 and 1: (shared unique words) / (max unique words of either text).
 * Both texts are normalized (lowercased, punctuation stripped) before comparison.
 */
export function computeWordOverlap(a: string, b: string): number {
  const wordsA = new Set(normalizeText(a).split(" ").filter(Boolean));
  const wordsB = new Set(normalizeText(b).split(" ").filter(Boolean));

  const maxSize = Math.max(wordsA.size, wordsB.size);
  if (maxSize === 0) return 0;

  let shared = 0;
  wordsA.forEach((word) => {
    if (wordsB.has(word)) {
      shared++;
    }
  });

  return shared / maxSize;
}

// --- Publication Diff Analysis ---

/**
 * Splits a LinkedIn post into hook/body/CTA sections using paragraph breaks.
 * - Hook: first paragraph (before first double-newline)
 * - CTA: last paragraph (after last double-newline)
 * - Body: everything in between
 *
 * Edge cases:
 * - Single paragraph: hook only (no body, no CTA)
 * - Two paragraphs: hook + CTA (no body)
 * - Three+: hook + body paragraphs + CTA
 */
export function splitIntoSections(text: string): PostSections {
  const paragraphs = text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);

  if (paragraphs.length === 0) return { hook: "", body: "", cta: "" };
  if (paragraphs.length === 1)
    return { hook: paragraphs[0], body: "", cta: "" };
  if (paragraphs.length === 2)
    return { hook: paragraphs[0], body: "", cta: paragraphs[1] };

  return {
    hook: paragraphs[0],
    body: paragraphs.slice(1, -1).join("\n\n"),
    cta: paragraphs[paragraphs.length - 1],
  };
}

/**
 * Extracts word trigrams (3-word sequences) from text.
 * Used to identify meaningful phrases for diff analysis.
 * Returns in order of appearance for stable results.
 */
function extractTrigrams(text: string): string[] {
  const words = normalizeText(text).split(" ").filter(Boolean);
  const trigrams: string[] = [];
  for (let i = 0; i <= words.length - 3; i++) {
    trigrams.push(`${words[i]} ${words[i + 1]} ${words[i + 2]}`);
  }
  return trigrams;
}

/**
 * Computes a structured diff between the generated post and the LinkedIn-published version.
 * Identifies which sections changed, what phrases were added/removed, and word count deltas.
 *
 * This is the core of the "what did she change?" analysis.
 * Stored as `publication_edits` JSONB on the LinkedIn post row.
 *
 * Section change threshold: <85% word overlap = "changed".
 * Phrase detection uses trigrams (3-word sequences) unique to each version.
 */
export function computePublicationEdits(
  generatedText: string,
  linkedinText: string,
): PublicationEdits {
  // Overall overlap
  const overlapPct = Math.round(
    computeWordOverlap(generatedText, linkedinText) * 100,
  );

  // Section-level comparison
  const genSections = splitIntoSections(generatedText);
  const liSections = splitIntoSections(linkedinText);

  const SECTION_CHANGE_THRESHOLD = 0.85;

  const hookOverlap = computeWordOverlap(genSections.hook, liSections.hook);
  const bodyOverlap =
    genSections.body && liSections.body
      ? computeWordOverlap(genSections.body, liSections.body)
      : genSections.body === liSections.body
        ? 1
        : 0;
  const ctaOverlap = computeWordOverlap(genSections.cta, liSections.cta);

  const hookChanged = hookOverlap < SECTION_CHANGE_THRESHOLD;
  const bodyChanged = bodyOverlap < SECTION_CHANGE_THRESHOLD;
  const ctaChanged = ctaOverlap < SECTION_CHANGE_THRESHOLD;

  // Word count deltas (unique words added/removed)
  const genWords = generatedText.split(/\s+/).filter(Boolean);
  const liWords = linkedinText.split(/\s+/).filter(Boolean);
  const genWordSet = new Set(genWords.map((w) => w.toLowerCase()));
  const liWordSet = new Set(liWords.map((w) => w.toLowerCase()));

  let wordsAdded = 0;
  let wordsRemoved = 0;
  liWordSet.forEach((w) => {
    if (!genWordSet.has(w)) wordsAdded++;
  });
  genWordSet.forEach((w) => {
    if (!liWordSet.has(w)) wordsRemoved++;
  });

  // Phrase-level analysis using trigrams
  const genTrigramSet = new Set(extractTrigrams(generatedText));
  const liTrigramSet = new Set(extractTrigrams(linkedinText));

  // Added phrases: trigrams in LinkedIn version but not in generated (she added them)
  const addedPhrases: string[] = [];
  liTrigramSet.forEach((t) => {
    if (!genTrigramSet.has(t)) addedPhrases.push(t);
  });

  // Removed phrases: trigrams in generated but not in LinkedIn (she removed them)
  const removedPhrases: string[] = [];
  genTrigramSet.forEach((t) => {
    if (!liTrigramSet.has(t)) removedPhrases.push(t);
  });

  // Section diffs: only include sections that actually changed
  const sectionDiffs: PublicationEdits["section_diffs"] = {};
  if (hookChanged) {
    sectionDiffs.hook = { before: genSections.hook, after: liSections.hook };
  }
  if (bodyChanged) {
    sectionDiffs.body = { before: genSections.body, after: liSections.body };
  }
  if (ctaChanged) {
    sectionDiffs.cta = { before: genSections.cta, after: liSections.cta };
  }

  return {
    overlap_pct: overlapPct,
    hook_changed: hookChanged,
    body_changed: bodyChanged,
    cta_changed: ctaChanged,
    words_added: wordsAdded,
    words_removed: wordsRemoved,
    net_word_change: liWords.length - genWords.length,
    added_phrases: addedPhrases.slice(0, 10),
    removed_phrases: removedPhrases.slice(0, 10),
    section_diffs: sectionDiffs,
  };
}

// --- Main Matching Function ---

/**
 * Main matching function: connects generated posts to their LinkedIn scraped counterparts.
 *
 * Algorithm:
 * 1. Fetches all generated posts that were copied (copied_at IS NOT NULL).
 * 2. Fetches all recent LinkedIn posts without a match yet (generated_from_id IS NULL).
 * 3. For each LinkedIn post, finds the best matching generated post via word overlap.
 * 4. Threshold: >80% word overlap = match.
 * 5. Each generated post can only match one LinkedIn post (best match wins).
 * 6. Sets generated_from_id on matched LinkedIn posts.
 * 7. Computes publication_edits (section-level diff) for each match.
 *
 * Returns counts of matched, unmatched, total LinkedIn posts, and edits computed.
 */
export async function matchGeneratedToLinkedIn(
  supabase: SupabaseClient,
): Promise<MatchResult> {
  // Step 1: Fetch generated posts that were copied (intended for publishing)
  const { data: generatedPosts, error: genError } = await supabase
    .from("posts")
    .select("id, generated_content")
    .eq("source", "generated")
    .not("copied_at", "is", null);

  if (genError) {
    throw new Error(`Failed to fetch generated posts: ${genError.message}`);
  }

  if (!generatedPosts || generatedPosts.length === 0) {
    return { matched: 0, unmatched: 0, total: 0, editsComputed: 0 };
  }

  // Step 2: Fetch LinkedIn posts without a match yet
  const { data: linkedInPosts, error: liError } = await supabase
    .from("posts")
    .select("id, generated_content")
    .eq("source", "linkedin")
    .is("generated_from_id", null);

  if (liError) {
    throw new Error(`Failed to fetch LinkedIn posts: ${liError.message}`);
  }

  if (!linkedInPosts || linkedInPosts.length === 0) {
    return { matched: 0, unmatched: 0, total: 0, editsComputed: 0 };
  }

  const typedGenerated = generatedPosts as GeneratedPost[];
  const typedLinkedIn = linkedInPosts as LinkedInPost[];

  // Step 3: Pre-compute normalized first-100-char prefixes for fast filtering
  const genPrefixes = typedGenerated.map((gp) => ({
    id: gp.id,
    prefix: normalizeText(gp.generated_content.slice(0, 100)),
    content: gp.generated_content,
  }));

  // Step 4: For each LinkedIn post, find best matching generated post
  const claimedGeneratedIds = new Set<string>();

  interface PendingMatch {
    linkedInId: string;
    generatedId: string;
    overlap: number;
    linkedInContent: string;
    generatedContent: string;
  }

  const pendingMatches: PendingMatch[] = [];

  for (const liPost of typedLinkedIn) {
    const liPrefix = normalizeText(liPost.generated_content.slice(0, 100));

    let bestMatch: {
      id: string;
      overlap: number;
      content: string;
    } | null = null;

    for (const gp of genPrefixes) {
      // Fast prefix check: if first 100 chars have <50% overlap, skip full comparison
      const prefixWordsLI = new Set(liPrefix.split(" ").filter(Boolean));
      const prefixWordsGen = new Set(gp.prefix.split(" ").filter(Boolean));
      const prefixMax = Math.max(prefixWordsLI.size, prefixWordsGen.size);
      if (prefixMax > 0) {
        let prefixShared = 0;
        prefixWordsLI.forEach((w) => {
          if (prefixWordsGen.has(w)) prefixShared++;
        });
        const prefixOverlap = prefixShared / prefixMax;
        if (prefixOverlap < 0.5) continue;
      }

      // Full word overlap comparison
      const overlap = computeWordOverlap(liPost.generated_content, gp.content);

      if (overlap > 0.8 && (!bestMatch || overlap > bestMatch.overlap)) {
        bestMatch = { id: gp.id, overlap, content: gp.content };
      }
    }

    if (bestMatch) {
      pendingMatches.push({
        linkedInId: liPost.id,
        generatedId: bestMatch.id,
        overlap: bestMatch.overlap,
        linkedInContent: liPost.generated_content,
        generatedContent: bestMatch.content,
      });
    }
  }

  // Step 5: Resolve conflicts -- if multiple LinkedIn posts match the same generated post,
  // keep the one with the highest overlap. Sort descending by overlap to greedily assign.
  pendingMatches.sort((a, b) => b.overlap - a.overlap);

  const confirmedMatches: PendingMatch[] = [];
  for (const pm of pendingMatches) {
    if (claimedGeneratedIds.has(pm.generatedId)) continue;
    claimedGeneratedIds.add(pm.generatedId);
    confirmedMatches.push(pm);
  }

  // Step 6: Write matches + publication edits to DB
  let matched = 0;
  let editsComputed = 0;
  for (const cm of confirmedMatches) {
    // Compute section-level diff between generated and published versions
    const edits = computePublicationEdits(
      cm.generatedContent,
      cm.linkedInContent,
    );

    const { error: updateError } = await supabase
      .from("posts")
      .update({
        generated_from_id: cm.generatedId,
        publication_edits: edits,
      })
      .eq("id", cm.linkedInId);

    if (updateError) {
      console.error(
        `[post-matching] Failed to update LinkedIn post ${cm.linkedInId}: ${updateError.message}`,
      );
      continue;
    }
    matched++;
    editsComputed++;
  }

  return {
    matched,
    unmatched: typedLinkedIn.length - matched,
    total: typedLinkedIn.length,
    editsComputed,
  };
}
