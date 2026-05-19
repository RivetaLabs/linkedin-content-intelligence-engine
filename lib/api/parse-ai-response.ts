/**
 * Unified AI output JSON parser.
 *
 * LLMs inconsistently wrap JSON in markdown fences, add preamble text, or
 * return bare JSON. This module is the single place that handles all three
 * shapes so each API route doesn't re-implement the same fence-stripping.
 *
 * Replaces:
 * - app/api/compliance/route.ts inline .replace() regex (lines 34-37)
 * - lib/scoring-math.ts extractJsonFromResponse() text.match(/\{[\s\S]*\}/)
 * - lib/classifier-utils.ts inline .replace() regex (line 23)
 */

/**
 * Thrown when extractJson cannot parse valid JSON from the AI response.
 * Carries the original rawText so callers can log or surface it.
 */
export class AiParseError extends Error {
  readonly rawText: string;

  constructor(message: string, rawText: string) {
    super(message);
    this.name = "AiParseError";
    this.rawText = rawText;
  }
}

/**
 * Extracts and parses JSON from an AI response string.
 *
 * Strategy (in order):
 * 1. Throw on empty/whitespace-only input.
 * 2. Strip ```json or bare ``` fences (case-insensitive).
 * 3. Try JSON.parse on the cleaned text.
 * 4. Fall back to extracting the first {...} or [...] block via regex.
 * 5. Throw AiParseError (with rawText) on all parse failures.
 */
export function extractJson<T>(text: string): T {
  if (!text || !text.trim()) {
    throw new AiParseError("AI response was empty", text);
  }

  // Strip opening and closing markdown code fences (```json or ```)
  const cleaned = text
    .replace(/^[\s]*```(?:json)?\s*/i, "")
    .replace(/\s*```[\s]*$/i, "")
    .trim();

  // Attempt 1: parse the cleaned text directly
  try {
    return JSON.parse(cleaned) as T;
  } catch {
    // fall through to regex extraction
  }

  // Attempt 2: extract first {...} or [...] block (handles preamble/postamble)
  const objectMatch = cleaned.match(/\{[\s\S]*\}/);
  const arrayMatch = cleaned.match(/\[[\s\S]*\]/);

  // Pick whichever appears first in the string
  let block: string | null = null;
  if (objectMatch && arrayMatch) {
    block =
      objectMatch.index! <= arrayMatch.index! ? objectMatch[0] : arrayMatch[0];
  } else {
    block = objectMatch?.[0] ?? arrayMatch?.[0] ?? null;
  }

  if (block) {
    try {
      return JSON.parse(block) as T;
    } catch {
      // fall through to throw
    }
  }

  throw new AiParseError(`AI response did not contain valid JSON`, text);
}
