"use client";

import { useState, useCallback } from "react";
import type { ScoreResponse } from "@/lib/types";

export function useScoring(
  autoUpdate: (patch: Record<string, unknown>) => Promise<void>,
) {
  const [scores, setScores] = useState<ScoreResponse | null>(null);
  const [previousScores, setPreviousScores] = useState<ScoreResponse | null>(
    null,
  );
  const [scoring, setScoring] = useState(false);

  const scoreAndSync = useCallback(
    async (content: string): Promise<void> => {
      setScoring(true);
      try {
        const res = await fetch("/api/score", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content }),
        });
        if (res.ok) {
          const data: ScoreResponse = await res.json();
          setScores((prev) => {
            if (prev) setPreviousScores(prev);
            return data;
          });
          // Sync individual pillar scores to saved post.
          // content_score_total and engagement_total are Postgres generated columns — never included.
          if (data.scores) {
            await autoUpdate({
              hook_score: data.scores.hook,
              value_score: data.scores.value,
              format_score: data.scores.format,
              framework_score: data.scores.framework,
              contrarian_score: data.scores.contrarian,
              story_score: data.scores.story,
              score_explanation: data.explanation,
              scoring_tips: data.tips,
            });
          }
        }
      } catch {
        // Scoring is non-critical
      } finally {
        setScoring(false);
      }
    },
    [autoUpdate],
  );

  return {
    scores,
    setScores,
    previousScores,
    setPreviousScores,
    scoring,
    scoreAndSync,
  };
}
