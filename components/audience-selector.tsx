"use client";

import type { AudienceOrAuto } from "@/lib/types";

interface AudienceSelectorProps {
  value: AudienceOrAuto;
  onChange: (value: AudienceOrAuto) => void;
  disabled?: boolean;
}

const OPTIONS: {
  value: AudienceOrAuto;
  label: string;
  subtitle: string;
}[] = [
  {
    value: "auto",
    label: "Auto-detect",
    subtitle: "We'll match to your content",
  },
  {
    value: "expert",
    label: "Industry Post",
    subtitle: "Domain, product, operations",
  },
  {
    value: "leadership",
    label: "Personal Story",
    subtitle: "Career, leadership, lessons",
  },
];

export function AudienceSelector({
  value,
  onChange,
  disabled,
}: AudienceSelectorProps) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-xs text-text-secondary">Audience</span>
      <div className="flex gap-2">
        {OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            disabled={disabled}
            aria-pressed={value === opt.value}
            className={`flex min-h-[44px] flex-col items-start rounded-lg border px-4 py-3 text-left transition-colors ${
              value === opt.value
                ? "border-accent/30 bg-accent/10"
                : "border-border bg-surface hover:border-accent/50 hover:bg-surface-hover"
            } disabled:opacity-50`}
          >
            <span
              className={`text-sm font-medium ${
                value === opt.value ? "text-accent" : "text-text"
              }`}
            >
              {opt.label}
            </span>
            <span className="text-[11px] text-text-secondary">
              {opt.subtitle}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
