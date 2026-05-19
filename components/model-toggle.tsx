"use client";

import type { Model } from "@/lib/types";

interface Props {
  value: Model;
  onChange: (m: Model) => void;
  disabled?: boolean;
}

export function ModelToggle({ value, onChange, disabled }: Props) {
  return (
    <div className="inline-flex rounded-lg border border-border bg-surface">
      <button
        onClick={() => onChange("claude")}
        disabled={disabled}
        className={`rounded-l-lg px-3 py-1.5 text-xs font-medium transition-colors ${
          value === "claude"
            ? "bg-accent text-white"
            : "text-text-secondary hover:text-text"
        } disabled:opacity-50`}
      >
        Claude
      </button>
      <button
        onClick={() => onChange("gpt4o")}
        disabled={disabled}
        className={`rounded-r-lg px-3 py-1.5 text-xs font-medium transition-colors ${
          value === "gpt4o"
            ? "bg-accent text-white"
            : "text-text-secondary hover:text-text"
        } disabled:opacity-50`}
      >
        GPT-4o
      </button>
    </div>
  );
}
