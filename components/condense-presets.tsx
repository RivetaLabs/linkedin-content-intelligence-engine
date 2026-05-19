"use client";

interface CondensePresetsProps {
  onCondense: (percent: number) => void;
  activePercent: number | null;
  disabled?: boolean;
  wordCount?: number;
}

const PRESETS = [
  { label: "Concise", percent: 60 },
  { label: "Tighter", percent: 75 },
  { label: "Full", percent: 100 },
] as const;

export function CondensePresets({
  onCondense,
  activePercent,
  disabled,
  wordCount,
}: CondensePresetsProps) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-sm text-text-secondary">Length:</span>
      {PRESETS.map(({ label, percent }) => {
        const isActive = activePercent === percent;
        const isTooShort =
          percent === 60 && wordCount !== undefined && wordCount < 150;

        return (
          <button
            key={percent}
            onClick={() => onCondense(percent)}
            disabled={disabled || isTooShort}
            className={`rounded px-2 py-0.5 text-sm font-medium transition-colors ${
              isActive
                ? "bg-accent text-white"
                : "text-text-secondary hover:bg-surface-hover hover:text-text"
            } disabled:opacity-30`}
            title={
              isTooShort
                ? "Post too short to condense further"
                : `${label} (${percent}%)`
            }
          >
            {label} ({percent}%)
          </button>
        );
      })}
    </div>
  );
}
