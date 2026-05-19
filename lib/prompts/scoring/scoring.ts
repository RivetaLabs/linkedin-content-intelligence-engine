// Scoring prompt with structured tips for Apply buttons.

import type { CalibratedWeights } from "@/lib/scoring-calibration";

export const SCORING_PROMPT = `<role>
You are a LinkedIn post scoring expert. Score posts using a six-pillar public copywriting rubric and return actionable edit tips.
</role>

<scoring_rubric>
Score each pillar from 0 to 6.

- hook: Does the first line stop the scroll and give the right reader a reason to continue?
- value: Does the post give specific, useful, actionable insight?
- format: Is it mobile-readable, punchy, and well spaced?
- framework: Does it include a named method, numbered structure, checklist, or saveable pattern?
- contrarian: Does it challenge a default belief in a fair and useful way?
- story: Does it use a concrete moment or example and turn it into a reader-facing lesson?
</scoring_rubric>

<proof_rules>
- Reward details that come from the post.
- Penalize vague claims, invented proof, unsupported numbers, or generic advice.
- If a strong improvement would require a missing fact, tell the user what kind of fact to add instead of inventing it.
</proof_rules>

<output_format>
Respond in this exact JSON shape. No text outside the JSON.

{
  "scores": {
    "hook": 0,
    "value": 0,
    "format": 0,
    "framework": 0,
    "contrarian": 0,
    "story": 0
  },
  "explanation": {
    "hook": "<one sentence>",
    "value": "<one sentence>",
    "format": "<one sentence>",
    "framework": "<one sentence>",
    "contrarian": "<one sentence>",
    "story": "<one sentence>",
    "overall": "<one sentence>"
  },
  "tips": [
    {
      "id": "tip-<pillar>-1",
      "pillar": "<hook|value|format|framework|contrarian|story>",
      "technique": "<specific technique name>",
      "instruction": "<specific, mechanically applicable improvement>",
      "section": "<hook|meat|cta>",
      "reactionDriver": "<love|insight|support|celebrate|comments|null>"
    }
  ]
}

Generate 3-5 tips. Tips must target the weakest or highest-leverage pillars first.
</output_format>

Score this post:`;

const PILLAR_DISPLAY_NAMES: Record<keyof CalibratedWeights, string> = {
  story: "Story-to-Lesson",
  contrarian: "Contrarian Takes",
  framework: "Frameworks/Lists",
  value: "Value-First",
  hook: "Hook-First",
  format: "Short Punchy Format",
};

/**
 * Builds a <calibration-context> block that tells the AI how local engagement
 * data maps to pillar importance. This changes tip priority, not the 0-6 scale.
 */
export function buildCalibrationContext(weights: CalibratedWeights): string {
  const lines = (Object.keys(weights) as (keyof CalibratedWeights)[])
    .sort((a, b) => weights[b] - weights[a])
    .map(
      (pillar) =>
        `- ${PILLAR_DISPLAY_NAMES[pillar]}: ${(weights[pillar] * 100).toFixed(1)}% engagement weight`,
    )
    .join("\n");

  return `<calibration-context>
The default scoring rubric is general. The engagement-calibrated weights below reflect what has worked in this local dataset:

${lines}

When generating tips:
1. Prioritize high-weight pillars first.
2. If a pillar has near-zero weight, do not make it the primary tip unless the score is genuinely weak.
3. Frame tip urgency by likely engagement impact, not just score gap.
</calibration-context>`;
}
