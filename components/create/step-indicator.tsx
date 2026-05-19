"use client";

import { Check, PenLine, BarChart3, MessageSquare, Send } from "lucide-react";

export type CreateStep = "compose" | "score" | "refine" | "finalize";

const STEPS: {
  id: CreateStep;
  label: string;
  subtitle: string;
  icon: typeof PenLine;
}[] = [
  {
    id: "compose",
    label: "Compose",
    subtitle: "Write your idea",
    icon: PenLine,
  },
  {
    id: "score",
    label: "Score",
    subtitle: "See what\u2019s working",
    icon: BarChart3,
  },
  {
    id: "refine",
    label: "Refine",
    subtitle: "Improve with AI",
    icon: MessageSquare,
  },
  { id: "finalize", label: "Finalize", subtitle: "Check and copy", icon: Send },
];

const STEP_ORDER: CreateStep[] = ["compose", "score", "refine", "finalize"];

interface StepIndicatorProps {
  currentStep: CreateStep;
  onStepClick?: (step: CreateStep) => void;
}

export function StepIndicator({
  currentStep,
  onStepClick,
}: StepIndicatorProps) {
  const currentIndex = STEP_ORDER.indexOf(currentStep);

  return (
    <div className="mb-6 flex items-center justify-between">
      {STEPS.map((step, i) => {
        const isCompleted = i < currentIndex;
        const isActive = step.id === currentStep;
        const Icon = isCompleted ? Check : step.icon;

        return (
          <div key={step.id} className="flex flex-1 items-center">
            <button
              onClick={() => onStepClick?.(step.id)}
              className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-accent/15 text-accent"
                  : isCompleted
                    ? "text-emerald-400 hover:bg-surface-hover"
                    : "text-text-secondary hover:bg-surface-hover"
              }`}
            >
              <div
                className={`flex h-6 w-6 items-center justify-center rounded-full text-xs ${
                  isActive
                    ? "bg-accent text-white"
                    : isCompleted
                      ? "bg-emerald-500/20 text-emerald-400"
                      : "bg-surface-hover text-text-secondary"
                }`}
              >
                <Icon size={12} />
              </div>
              <span className="hidden sm:inline">
                <span>{step.label}</span>
                <span className="ml-1 text-[10px] font-normal text-text-secondary/70">
                  {step.subtitle}
                </span>
              </span>
            </button>
            {i < STEPS.length - 1 && (
              <div
                className={`mx-1 h-px flex-1 ${
                  i < currentIndex ? "bg-emerald-500/30" : "bg-border"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

export function getStepFromState(opts: {
  hasOutput: boolean;
  hasScores: boolean;
  hasAppliedTips: boolean;
  messageCount: number;
}): CreateStep {
  if (!opts.hasOutput) return "compose";
  if (!opts.hasScores) return "score";
  if (!opts.hasAppliedTips && opts.messageCount === 0) return "score";
  return "refine";
}
