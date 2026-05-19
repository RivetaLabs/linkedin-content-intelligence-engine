// XML assembly extracted from post-intelligence.ts

import type { CuratedExample, PostIntelligenceData } from "@/lib/types";

const ROLE_LABELS: Record<CuratedExample["role"], string> = {
  top_performer: "Study this post's approach. Note what makes it effective.",
  sleeper_hit:
    "This post outperformed its score. The audience responded to something the rubric underweights.",
  anti_pattern: "This post underperformed. Avoid its structural patterns.",
};

export function formatReactionPatterns(
  patterns: NonNullable<PostIntelligenceData["aggregate"]["reactionPatterns"]>,
): string {
  const { avgProfile, templateTargets } = patterns;
  const avgAttrs = Object.entries(avgProfile)
    .map(([k, v]) => `${k}="${v}"`)
    .join(" ");

  const targetEntries = Object.entries(templateTargets)
    .map(
      ([tmpl, t]) =>
        `    <target template="${tmpl}" reaction="${t.targetReaction}" avg-percent="${t.avgPercent}" />`,
    )
    .join("\n");

  return `  <reaction-patterns>
    <avg-profile ${avgAttrs} />
    <template-targets>
${targetEntries}
    </template-targets>
  </reaction-patterns>`;
}

/**
 * Formats post intelligence data + recent openings into an XML block
 * for injection into the system prompt.
 */
export function formatPostIntelligenceBlock(
  data: PostIntelligenceData,
  recentOpenings: string[],
): string {
  const { aggregate, examples } = data;

  const exampleEntries = examples
    .map((ex) => {
      const label = ROLE_LABELS[ex.role];
      return `    <example role="${ex.role}" score="${ex.score}" engagement="${ex.engagement}"${
        ex.dominantReaction
          ? ` dominant-reaction="${ex.dominantReaction}" reaction-pct="${ex.dominantReactionPercent}"`
          : ""
      }
             label="${label}">
      ${ex.contentPreview}
    </example>`;
    })
    .join("\n");

  let noveltyDirective = `  <novelty-directive>
    Do not replicate the hook patterns, sentence structures, or topic angles from the examples above. Use them to understand WHAT works, then find a fresh angle.`;

  if (recentOpenings.length > 0) {
    const avoidLines = recentOpenings
      .map((line) => `      - "${line}"`)
      .join("\n");
    noveltyDirective += `
    <avoid-openings>
      Do NOT open with anything resembling these recent openings:
${avoidLines}
    </avoid-openings>`;
  }

  noveltyDirective += `
  </novelty-directive>`;

  const reactionBlock = aggregate.reactionPatterns
    ? `\n${formatReactionPatterns(aggregate.reactionPatterns)}`
    : "";

  return `<post-intelligence>
  <aggregate total="${aggregate.totalPosts}" avg-score="${aggregate.avgScore}" primary-pillar-avg="${aggregate.primaryPillarAvg}"
             weakest="${aggregate.weakestPillar.name}:${aggregate.weakestPillar.score}" optimal-words="${aggregate.optimalWordRange[0]}-${aggregate.optimalWordRange[1]}" />
  <examples>
${exampleEntries}
  </examples>${reactionBlock}
${noveltyDirective}
</post-intelligence>`;
}
