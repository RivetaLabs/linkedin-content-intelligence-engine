// Re-export barrel for backward compatibility.
// Original 576-line file split into:
//   post-intelligence-data.ts  (Supabase queries)
//   post-intelligence-stats.ts (statistical computation)
//   post-intelligence-format.ts (XML assembly)

export {
  fetchPostIntelligence,
  fetchRecentOpeningLines,
} from "./post-intelligence-data";
export {
  formatPostIntelligenceBlock,
  formatReactionPatterns,
} from "./post-intelligence-format";
export {
  TEMPLATE_REACTION_AFFINITY,
  TEMPLATE_PRIMARY_PILLAR,
  selectCuratedExamples,
  computeAggregate,
} from "./post-intelligence-stats";
