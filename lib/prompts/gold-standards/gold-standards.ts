// Gold Standard: Dynamic selection from Supabase with 30-min TTL cache
// Replaced hardcoded 25-post pool (Session 13) with runtime query
// Polish mode still uses static guidance (different calibration needs)

import type { Template } from "@/lib/types";
import {
  selectGoldStandard,
  type GoldStandardSelection,
} from "@/lib/ai/get-gold-standard";

// Re-export for backward compatibility
export type { GoldStandardCandidate } from "@/lib/ai/get-gold-standard";

/**
 * Returns a gold standard post for the given template.
 * Dynamic: queries Supabase (cached 30 min), weighted random selection.
 * Polish mode: returns static voice-preservation guidance.
 */
export async function getGoldStandard(template: Template): Promise<string> {
  if (template === "polish") {
    return POLISH_GOLD_STANDARD;
  }
  const result = await selectGoldStandard(
    template as Exclude<Template, "polish">,
  );
  return result?.xml ?? "";
}

/**
 * Returns gold standard XML + metadata for generation tracking.
 * Used by generate route to record which gold standard was injected.
 */
export async function getGoldStandardWithMetadata(
  template: Exclude<Template, "polish">,
): Promise<GoldStandardSelection | null> {
  return selectGoldStandard(template);
}

// Polish gold standard: static voice-preservation guidance
// (Different calibration needs -- not template-specific)
export const POLISH_GOLD_STANDARD = `<gold_standard_polish>
<guidance>
When polishing, preserve the author's voice and intent while improving structure.

Priority order:
1. Strengthen the hook (Two-Part Hook: Call Out + Condition)
2. Apply PPE rhythm to key points (Punch-Punch-Explain)
3. Add You Pivot near the end ("If you're facing...")
4. Ensure mobile-friendly formatting (one idea per line, white space)
5. Add question CTA if missing

NEVER change:
- The core story or anecdote
- Personal details and specific numbers
- Named frameworks
- The overall tone and voice
- Industry-specific terminology
</guidance>
</gold_standard_polish>`;
