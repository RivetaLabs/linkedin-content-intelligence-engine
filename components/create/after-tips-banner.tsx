"use client";

import { ArrowRight, SkipForward } from "lucide-react";

interface AfterTipsBannerProps {
  appliedCount: number;
  onContinueToRefine: () => void;
  onSkipToFinalize: () => void;
}

export function AfterTipsBanner({
  appliedCount,
  onContinueToRefine,
  onSkipToFinalize,
}: AfterTipsBannerProps) {
  return (
    <div className="rounded-lg border border-accent/30 bg-accent/5 px-4 py-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-text">
          <span className="font-medium text-accent">
            {appliedCount} tip{appliedCount !== 1 ? "s" : ""} applied.
          </span>{" "}
          What next?
        </p>
        <div className="flex items-center gap-2">
          <button
            onClick={onContinueToRefine}
            className="flex items-center gap-1.5 rounded-lg bg-accent px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
          >
            Refine Post
            <ArrowRight size={14} />
          </button>
          <button
            onClick={onSkipToFinalize}
            className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm text-text-secondary transition-colors hover:bg-surface-hover hover:text-text"
          >
            Review before posting
            <SkipForward size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
