"use client";

import type { ScoreResponse, ScoringTip } from "@/lib/types";
import { Check, Undo2, Loader2 } from "lucide-react";

const PILLAR_CONFIG = [
  { key: "story", label: "Story", weight: "25%", color: "bg-emerald-500" },
  {
    key: "contrarian",
    label: "Contrarian",
    weight: "20%",
    color: "bg-blue-500",
  },
  {
    key: "framework",
    label: "Framework",
    weight: "20%",
    color: "bg-purple-500",
  },
  { key: "value", label: "Value", weight: "15%", color: "bg-amber-500" },
  { key: "hook", label: "Hook", weight: "10%", color: "bg-rose-500" },
  { key: "format", label: "Format", weight: "10%", color: "bg-cyan-500" },
] as const;

const PILLAR_BADGE_COLORS: Record<string, string> = {
  hook: "bg-rose-500/15 text-rose-400",
  value: "bg-amber-500/15 text-amber-400",
  format: "bg-cyan-500/15 text-cyan-400",
  framework: "bg-purple-500/15 text-purple-400",
  contrarian: "bg-blue-500/15 text-blue-400",
  story: "bg-emerald-500/15 text-emerald-400",
};

interface Props {
  scores: ScoreResponse | null;
  loading?: boolean;
  onApplyTip?: (tip: ScoringTip) => void;
  onApplyAll?: () => void;
  appliedTipIds?: string[];
  applyingTipId?: string | null;
  previousScores?: ScoreResponse | null;
  onFrameworkBuild?: () => void;
}

export function PillarScorecard({
  scores,
  loading,
  onApplyTip,
  onApplyAll,
  appliedTipIds = [],
  applyingTipId,
  previousScores,
  onFrameworkBuild,
}: Props) {
  if (loading) {
    return (
      <div className="space-y-3 rounded-lg border border-border bg-surface p-4">
        <div className="h-4 w-32 animate-pulse rounded bg-surface-hover" />
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-6 animate-pulse rounded bg-surface-hover" />
        ))}
      </div>
    );
  }

  if (!scores) return null;

  const unappliedTips = (scores.tips || []).filter(
    (tip) => !appliedTipIds.includes(tip.id),
  );
  const scoreDelta = previousScores
    ? scores.weighted_total - previousScores.weighted_total
    : null;

  return (
    <div className="space-y-3 rounded-lg border border-border bg-surface p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-text">Engagement Score</h3>
        <div className="flex items-center gap-2">
          <span className="text-lg font-semibold text-accent">
            {scores.weighted_total.toFixed(1)}/6
          </span>
          {scoreDelta !== null && scoreDelta !== 0 && (
            <span
              className={`text-xs font-medium ${scoreDelta > 0 ? "text-emerald-400" : "text-rose-400"}`}
            >
              {scoreDelta > 0 ? "+" : ""}
              {scoreDelta.toFixed(1)}
            </span>
          )}
        </div>
      </div>

      {PILLAR_CONFIG.map(({ key, label, weight, color }) => {
        const score = scores.scores[key as keyof typeof scores.scores];
        const pct = (score / 6) * 100;
        return (
          <div key={key}>
            <div className="mb-1 flex items-center justify-between text-xs">
              <span className="text-text-secondary">
                {label}{" "}
                <span className="text-text-secondary/60">({weight})</span>
              </span>
              <span className="font-mono text-text">{score.toFixed(1)}</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-surface-hover">
              <div
                className={`h-full rounded-full transition-all duration-500 ${color}`}
                style={{ width: `${pct}%` }}
              />
            </div>
            {key === "framework" && onFrameworkBuild && (
              <button
                onClick={onFrameworkBuild}
                disabled={!!applyingTipId}
                className="mt-1 px-2 py-0.5 text-xs rounded bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 transition-colors disabled:opacity-50"
              >
                {applyingTipId === "framework"
                  ? "Building..."
                  : "Add Framework"}
              </button>
            )}
          </div>
        );
      })}

      {scores.tips && scores.tips.length > 0 && (
        <div className="mt-3 border-t border-border pt-3">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs font-medium text-text-secondary">Tips</p>
            {onApplyAll && unappliedTips.length > 1 && (
              <button
                onClick={onApplyAll}
                disabled={!!applyingTipId}
                className="rounded px-2 py-0.5 text-[10px] font-medium text-accent transition-colors hover:bg-accent/10 disabled:opacity-50"
              >
                Apply all tips ({unappliedTips.length})
              </button>
            )}
          </div>
          <ul className="space-y-2">
            {scores.tips.map((tip) => {
              const isApplied = appliedTipIds.includes(tip.id);
              const isApplying = applyingTipId === tip.id;
              const badgeColor =
                PILLAR_BADGE_COLORS[tip.pillar] ||
                "bg-text-secondary/15 text-text-secondary";

              return (
                <li key={tip.id} className="rounded-md bg-surface-hover/50 p-2">
                  <div className="mb-1 flex items-center gap-1.5">
                    <span
                      className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${badgeColor}`}
                    >
                      {tip.pillar}
                    </span>
                    <span className="text-[10px] font-medium text-text-secondary">
                      {tip.technique}
                    </span>
                  </div>
                  <p className="mb-1.5 text-xs leading-relaxed text-text-secondary">
                    {tip.instruction}
                  </p>
                  {onApplyTip && (
                    <button
                      onClick={() => onApplyTip(tip)}
                      disabled={isApplying || !!applyingTipId}
                      className={`flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-medium transition-colors ${
                        isApplied
                          ? "text-emerald-400"
                          : isApplying
                            ? "text-accent"
                            : "text-text-secondary hover:bg-accent/10 hover:text-accent"
                      } disabled:opacity-50`}
                    >
                      {isApplying ? (
                        <>
                          <Loader2 size={10} className="animate-spin" />
                          Applying...
                        </>
                      ) : isApplied ? (
                        <>
                          <Check size={10} />
                          Applied
                        </>
                      ) : (
                        "Apply"
                      )}
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
