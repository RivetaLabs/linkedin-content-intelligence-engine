"use client";

import { TEMPLATES } from "@/lib/constants/templates";
import { type Template } from "@/lib/types";
import {
  BookOpen,
  Zap,
  LayoutGrid,
  BarChart3,
  ListOrdered,
  Sparkles,
} from "lucide-react";

const ICON_MAP: Record<string, React.ComponentType<{ size?: number }>> = {
  BookOpen,
  Zap,
  LayoutGrid,
  BarChart3,
  ListOrdered,
};

const SUBTITLES: Record<Template, string> = {
  story: "Personal → lesson",
  contrarian: "Challenge norms",
  framework: "Numbered steps",
  "data-insight": "Lead with stats",
  listicle: "Numbered tips",
  polish: "Refine draft",
};

interface Props {
  selected: Template | null;
  onChange: (t: Template | null) => void;
  disabled?: boolean;
}

export function TemplateSelector({ selected, onChange, disabled }: Props) {
  const isAutoSelected = selected === null;

  return (
    <div className="space-y-3">
      {/* Auto-detect Hero Row */}
      <button
        onClick={() => onChange(null)}
        disabled={disabled}
        aria-pressed={isAutoSelected}
        className={`flex w-full items-center gap-3 rounded-lg border p-4 text-left transition-all ${
          isAutoSelected
            ? "border-accent bg-accent/10"
            : "border-border bg-surface hover:border-accent/50 hover:bg-surface-hover"
        } disabled:opacity-50`}
      >
        <Sparkles
          size={20}
          className={isAutoSelected ? "text-accent" : "text-text-secondary"}
        />
        <div>
          <span
            className={`text-sm font-medium ${
              isAutoSelected ? "text-accent" : "text-text"
            }`}
          >
            Auto-detect
          </span>
          <p className="text-xs text-text-secondary">
            We&apos;ll match the best format to your content
          </p>
        </div>
      </button>

      {/* Template Grid */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
        {TEMPLATES.filter((t) => t.id !== "polish").map((t) => {
          const Icon = ICON_MAP[t.icon];
          const active = selected === t.id;
          const subtitle = SUBTITLES[t.id as Template];
          return (
            <button
              key={t.id}
              onClick={() => onChange(t.id as Template)}
              disabled={disabled}
              aria-pressed={active}
              className={`flex min-h-[44px] flex-col items-start gap-1 rounded-lg border p-3 text-left transition-all ${
                active
                  ? "border-accent bg-accent/10 text-text"
                  : "border-border bg-surface text-text-secondary hover:border-accent/50 hover:bg-surface-hover"
              } disabled:opacity-50`}
            >
              {Icon && <Icon size={18} />}
              <span className="text-xs font-medium">{t.name}</span>
              <span className="text-[10px] leading-tight text-text-secondary">
                {subtitle}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
