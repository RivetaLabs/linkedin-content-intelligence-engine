// Extracted classifier utilities from app/api/generate/route.ts
// Pure functions for parsing classifier responses and detecting article input

import type { ClassifierResponse, Template, Audience } from "@/lib/types";
import { extractJson } from "@/lib/api/parse-ai-response";

const VALID_TEMPLATES: Exclude<Template, "polish">[] = [
  "story",
  "contrarian",
  "framework",
  "data-insight",
  "listicle",
];

const VALID_AUDIENCES: Audience[] = ["expert", "leadership", "hybrid"];

/**
 * Parses the AI classifier response text into a structured ClassifierResponse.
 * Handles: clean JSON, markdown code fences, invalid JSON, invalid field values.
 * Falls back to story/hybrid for any parsing failure.
 */
export function parseClassifierResponse(text: string): ClassifierResponse {
  try {
    const parsed = extractJson<{ template?: string; audience?: string }>(text);
    return {
      template: VALID_TEMPLATES.includes(
        parsed.template as Exclude<Template, "polish">,
      )
        ? (parsed.template as Exclude<Template, "polish">)
        : "story",
      audience: VALID_AUDIENCES.includes(parsed.audience as Audience)
        ? (parsed.audience as Audience)
        : "hybrid",
    };
  } catch {
    return { template: "story", audience: "hybrid" };
  }
}

/**
 * Detects whether user input qualifies as an article (>300 words, create mode only).
 * Article mode bypasses the classifier and uses the article-to-post prompt.
 */
export function isArticleInput(wordCount: number, mode: string): boolean {
  return wordCount > 300 && mode !== "polish";
}
