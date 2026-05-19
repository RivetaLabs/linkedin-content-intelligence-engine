"use client";

import { CheckCircle, AlertTriangle, Shield, Loader2 } from "lucide-react";
import type { ComplianceResult, ComplianceFlag } from "@/lib/types";

interface ComplianceCheckProps {
  result: ComplianceResult | null;
  isScanning: boolean;
  onFix: (flagIndex: number, suggestion: string) => void;
  onDismiss: (flagIndex: number) => void;
  onRescan: () => void;
}

const SEVERITY_STYLES: Record<
  string,
  { bg: string; border: string; icon: string }
> = {
  critical: {
    bg: "bg-red-500/10",
    border: "border-red-500/30",
    icon: "text-red-400",
  },
  warning: {
    bg: "bg-yellow-500/10",
    border: "border-yellow-500/30",
    icon: "text-yellow-400",
  },
  info: {
    bg: "bg-blue-500/10",
    border: "border-blue-500/30",
    icon: "text-blue-400",
  },
};

function FlagCard({
  flag,
  index,
  onFix,
  onDismiss,
}: {
  flag: ComplianceFlag;
  index: number;
  onFix: (index: number, suggestion: string) => void;
  onDismiss: (index: number) => void;
}) {
  const style = SEVERITY_STYLES[flag.severity];
  return (
    <div
      className={`${style.bg} ${style.border} border rounded-lg p-3 space-y-2`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <AlertTriangle className={`w-4 h-4 ${style.icon}`} />
          <span className="text-xs font-medium uppercase tracking-wide text-text-secondary">
            {flag.category.replace(/_/g, " ")}
          </span>
        </div>
        <span
          className={`text-xs px-2 py-0.5 rounded-full ${style.bg} ${style.icon}`}
        >
          {flag.severity}
        </span>
      </div>
      <p className="text-sm text-text-secondary">{flag.explanation}</p>
      <div className="bg-surface-secondary/50 rounded p-2 text-xs">
        <p className="text-text-secondary line-through">{flag.line}</p>
        <p className="text-text-primary mt-1">{flag.suggestion}</p>
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => onFix(index, flag.suggestion)}
          className="text-xs px-3 py-1 bg-accent/20 text-accent rounded hover:bg-accent/30 transition"
        >
          Use Fix
        </button>
        <button
          onClick={() => onDismiss(index)}
          className="text-xs px-3 py-1 bg-surface-secondary text-text-secondary rounded hover:bg-surface-secondary/80 transition"
        >
          Keep Original
        </button>
      </div>
    </div>
  );
}

export function ComplianceCheck({
  result,
  isScanning,
  onFix,
  onDismiss,
  onRescan,
}: ComplianceCheckProps) {
  if (isScanning) {
    return (
      <div className="flex items-center gap-2 text-text-secondary text-sm p-3">
        <Loader2 className="w-4 h-4 animate-spin" />
        Scanning for compliance issues...
      </div>
    );
  }

  if (!result) return null;

  if (result.passed && result.flags.length === 0) {
    return (
      <div className="flex items-center gap-2 text-green-400 text-sm p-3">
        <CheckCircle className="w-4 h-4" />
        No compliance issues found
        <button
          onClick={onRescan}
          className="ml-auto text-xs text-text-secondary hover:text-text-primary"
        >
          Re-scan
        </button>
      </div>
    );
  }

  const criticalCount = result.flags.filter(
    (f) => f.severity === "critical",
  ).length;
  const warningCount = result.flags.filter(
    (f) => f.severity === "warning",
  ).length;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm">
          <Shield className="w-4 h-4 text-yellow-400" />
          <span>
            {criticalCount > 0 && (
              <span className="text-red-400">{criticalCount} critical</span>
            )}
            {criticalCount > 0 && warningCount > 0 && " · "}
            {warningCount > 0 && (
              <span className="text-yellow-400">{warningCount} warnings</span>
            )}
          </span>
        </div>
        <button
          onClick={onRescan}
          className="text-xs text-text-secondary hover:text-text-primary"
        >
          Re-scan
        </button>
      </div>
      {result.flags.map((flag, i) => (
        <FlagCard
          key={i}
          flag={flag}
          index={i}
          onFix={onFix}
          onDismiss={onDismiss}
        />
      ))}
    </div>
  );
}
