"use client";

import { useState, useCallback } from "react";
import type { RefObject } from "react";
import type { ComplianceResult, GenerationContext } from "@/lib/types";

/**
 * useCompliance — extracted from use-content-studio.ts (v6 compliance block)
 *
 * Manages compliance scan state and the three compliance actions:
 *   - runComplianceScan: POST to /api/compliance, store result, optionally persist to post
 *   - handleComplianceFix: replace flagged_line in output with suggestion
 *   - handleComplianceDismiss: mark a flag as dismissed without changing output
 *
 * @param autoUpdate - PATCH saved post with arbitrary fields (no-op when no post saved yet)
 * @param outputRef  - ref tracking the latest output string (avoids stale closure)
 * @param buildGenerationContext - returns current GenerationContext for the compliance request
 * @param savedPostIdRef - ref tracking the current saved post id (gates autoUpdate calls)
 * @param setOutput  - state setter for the output string (used by handleComplianceFix)
 */
export function useCompliance(
  autoUpdate: (patch: Record<string, unknown>) => Promise<void>,
  outputRef: RefObject<string>,
  buildGenerationContext: () => GenerationContext,
  savedPostIdRef: RefObject<string | null>,
  setOutput: (value: string) => void,
) {
  const [complianceResult, setComplianceResult] =
    useState<ComplianceResult | null>(null);
  const [isScanning, setIsScanning] = useState(false);

  // v6: Fire compliance scan — posts to /api/compliance, stores result, persists to saved post
  const runComplianceScan = useCallback(
    async (content?: string) => {
      const postContent = content || outputRef.current;
      if (!postContent) return;

      setIsScanning(true);
      try {
        const res = await fetch("/api/compliance", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            postContent,
            generationContext: buildGenerationContext(),
          }),
        });
        if (res.ok) {
          const result: ComplianceResult = await res.json();
          setComplianceResult(result);

          // Persist to post
          if (savedPostIdRef.current) {
            autoUpdate({ compliance_results: result });
          }
        }
      } catch {
        // non-blocking
      } finally {
        setIsScanning(false);
      }
    },
    [buildGenerationContext, autoUpdate, outputRef, savedPostIdRef],
  );

  // v6: Replace the flagged line with the suggestion and record acceptance
  const handleComplianceFix = useCallback(
    (flagIndex: number, suggestion: string) => {
      if (!complianceResult) return;
      const flag = complianceResult.flags[flagIndex];
      const currentOutput = outputRef.current;
      const newOutput = currentOutput.replace(flag.line, suggestion);

      if (newOutput === currentOutput) {
        console.warn(
          "Compliance fix: exact match not found for flagged line",
          flag.line,
        );
      }

      setOutput(newOutput);
      if (savedPostIdRef.current) {
        autoUpdate({ generated_content: newOutput });
      }

      setComplianceResult((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          userActions: { ...prev.userActions, [flagIndex]: "accepted" },
        };
      });
    },
    [complianceResult, autoUpdate, outputRef, savedPostIdRef, setOutput],
  );

  // v6: Mark a flag dismissed without touching the output
  const handleComplianceDismiss = useCallback((flagIndex: number) => {
    setComplianceResult((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        userActions: { ...prev.userActions, [flagIndex]: "dismissed" },
      };
    });
  }, []);

  return {
    complianceResult,
    isScanning,
    setComplianceResult,
    runComplianceScan,
    handleComplianceFix,
    handleComplianceDismiss,
  };
}
