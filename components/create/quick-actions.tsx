"use client";

const QUICK_ACTIONS = [
  {
    label: "Soften tone",
    prompt:
      "Soften the tone to be more observational and less adversarial, while keeping the core insight strong.",
  },
  {
    label: "Strengthen hook",
    prompt:
      "Make the opening hook more compelling. Use a Two-Part Hook: Call Out + Condition for Value.",
  },
  {
    label: "Make more concise",
    prompt:
      "Remove redundancy and tighten the post. Cut filler phrases and merge overlapping points. Keep the hook and CTA intact.",
  },
  {
    label: "Address the reader",
    prompt:
      "Add a You Pivot near the end that addresses the reader directly with how they can apply this insight.",
  },
  {
    label: "Add line breaks",
    prompt:
      "Reformat for mobile reading: one sentence per line at emphasis points, more line breaks, shorter paragraphs.",
  },
] as const;

interface QuickActionsProps {
  onAction: (prompt: string) => void;
  disabled?: boolean;
}

export function QuickActions({ onAction, disabled }: QuickActionsProps) {
  return (
    <div>
      <span className="mb-2 block text-[10px] text-text-secondary">
        Quick refinements:
      </span>
      <div className="flex flex-wrap gap-2">
        {QUICK_ACTIONS.map((action) => (
          <button
            key={action.label}
            onClick={() => onAction(action.prompt)}
            disabled={disabled}
            className="rounded-full border border-accent/40 bg-accent/20 px-3 py-2 text-xs font-medium text-accent transition-colors hover:bg-accent/30 disabled:opacity-50"
          >
            {action.label}
          </button>
        ))}
      </div>
    </div>
  );
}
