"use client";

import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { TemplateSelector } from "@/components/template-selector";
import { ModelToggle } from "@/components/model-toggle";
import { AudienceSelector } from "@/components/audience-selector";
import { PostOutput } from "@/components/post-output";
import { PillarScorecard } from "@/components/pillar-scorecard";
import { ChatThread } from "@/components/chat-thread";
import { CondensePresets } from "@/components/condense-presets";
import {
  StepIndicator,
  getStepFromState,
  type CreateStep,
} from "@/components/create/step-indicator";
import { AfterTipsBanner } from "@/components/create/after-tips-banner";
import { QuickActions } from "@/components/create/quick-actions";
import { ComplianceCheck } from "@/components/create/compliance-check";
import { useContentStudioContext } from "@/lib/contexts/content-studio-context";
import { TEMPLATES } from "@/lib/constants/templates";
import { type Template } from "@/lib/types";
import {
  Sparkles,
  AlertCircle,
  Plus,
  BookOpen,
  X,
} from "lucide-react";
import { useSearchParams } from "next/navigation";

export default function CreatePostPage() {
  const studio = useContentStudioContext();
  const searchParams = useSearchParams();
  const [manualStep, setManualStep] = useState<CreateStep | null>(null);
  const refineRef = useRef<HTMLDivElement>(null);
  const finalizeRef = useRef<HTMLDivElement>(null);

  const selectedTemplate = TEMPLATES.find((t) => t.id === studio.template);

  // Research bridge: pick up research context from sessionStorage
  useEffect(() => {
    if (searchParams.get("fromResearch") === "1") {
      try {
        const stored = sessionStorage.getItem("researchContext");
        if (stored) {
          const data = JSON.parse(stored);
          studio.setResearchContext(data.findings);
          // Pre-fill input with the research query as a starting point
          if (!studio.input && data.query) {
            studio.setInput(data.query);
          }
          sessionStorage.removeItem("researchContext");
        }
      } catch {
        // Ignore parse errors
      }
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-detect step from state, allow manual override
  const autoStep = getStepFromState({
    hasOutput: !!studio.output,
    hasScores: !!studio.scores,
    hasAppliedTips: studio.appliedTipIds.length > 0,
    messageCount: studio.messages.length,
  });
  const currentStep = manualStep ?? autoStep;

  // Show after-tips banner when tips have been applied but user hasn't moved to refine
  const showAfterTipsBanner =
    studio.appliedTipIds.length > 0 &&
    studio.messages.length === 0 &&
    currentStep === "score";

  // Source detection nudge for source-sensitive topics without articles
  const showSourceNudge = useMemo(() => {
    if (!studio.input || studio.output) return false;
    const words = studio.input.trim().split(/\s+/).filter(Boolean);
    const sourceSensitiveKeywords =
      /study|research|benchmark|statistic|customer claim|legal|medical|financial|regulatory|compliance|security|revenue|pricing/i;
    return words.length < 100 && sourceSensitiveKeywords.test(studio.input);
  }, [studio.input, studio.output]);

  // Reset manual step when session resets
  useEffect(() => {
    if (!studio.output) setManualStep(null);
  }, [studio.output]);

  function handleStepClick(step: CreateStep) {
    setManualStep(step);
    if (step === "refine") {
      refineRef.current?.scrollIntoView({ behavior: "smooth" });
    } else if (step === "finalize") {
      finalizeRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }

  const handleContinueToRefine = useCallback(() => {
    setManualStep("refine");
    refineRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  const handleSkipToFinalize = useCallback(() => {
    setManualStep("finalize");
    finalizeRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  function formatLabel(s: string): string {
    return s
      .split("-")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
  }

  // F-031: First-time experience
  if (studio.hasKeys === false) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <div className="max-w-md space-y-4 text-center">
          <AlertCircle size={48} className="mx-auto text-warning" />
          <h2 className="text-xl font-semibold">Welcome to LCI Engine</h2>
          <p className="text-sm text-text-secondary">
            To get started, add your Claude API key in Settings.
          </p>
          <a
            href="/settings"
            className="inline-block rounded-lg bg-accent px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
          >
            Go to Settings
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-semibold">Create Post</h1>
          {studio.output && (
            <button
              onClick={studio.resetSession}
              className="flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs text-text-secondary transition-colors hover:bg-surface-hover hover:text-text"
            >
              <Plus size={14} />
              New Post
            </button>
          )}
        </div>
        <ModelToggle
          value={studio.model}
          onChange={studio.setModel}
          disabled={studio.streaming}
        />
      </div>

      {/* Step Indicator — visible once output exists */}
      {studio.output && (
        <StepIndicator
          currentStep={currentStep}
          onStepClick={handleStepClick}
        />
      )}

      {/* === STEP 1: COMPOSE === */}
      {/* Mode Toggle */}
      <div className="mb-4 flex gap-2">
        <button
          onClick={() => studio.setMode("create")}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            studio.mode === "create"
              ? "bg-accent text-white"
              : "bg-surface text-text-secondary hover:text-text"
          }`}
        >
          Create New
        </button>
        <button
          onClick={() => studio.setMode("polish")}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            studio.mode === "polish"
              ? "bg-accent text-white"
              : "bg-surface text-text-secondary hover:text-text"
          }`}
        >
          Polish My Draft
        </button>
      </div>

      {/* Template Selector + Audience (only in create mode) */}
      {studio.mode === "create" && (
        <div className="mb-4 space-y-3">
          <TemplateSelector
            selected={
              studio.template === "auto" ? null : (studio.template as Template)
            }
            onChange={(t) => studio.setTemplate(t ?? "auto")}
            disabled={studio.streaming}
          />
          <div className="flex items-center justify-between">
            <AudienceSelector
              value={studio.audience}
              onChange={studio.setAudience}
              disabled={studio.streaming}
            />
            {studio.template === "auto" && (
              <span className="text-xs text-text-secondary">
                No template selected. We'll match one to your content.
              </span>
            )}
          </div>
        </div>
      )}

      {/* Research Context Card with Angle Selector */}
      {studio.researchContext && (
        <div className="mb-4 rounded-lg border border-accent/30 bg-accent/5 p-4">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BookOpen size={16} className="text-accent" />
              <span className="text-sm font-medium text-accent">
                Research attached
              </span>
            </div>
            <button
              onClick={() => {
                studio.setResearchContext(null);
                studio.setResearchAngle(null);
              }}
              aria-label="Remove research context"
              className="rounded p-1.5 text-text-secondary transition-colors hover:bg-surface-hover hover:text-text"
            >
              <X size={16} />
            </button>
          </div>

          <p className="mb-3 text-xs text-text-secondary">
            Findings will be woven into your generated post
          </p>

          {/* Angle Selector */}
          <div>
            <span className="mb-2 block text-xs text-text-secondary">
              What angle should this post take?
            </span>
            <div className="flex flex-wrap gap-2">
              {[
                "Key insight",
                "Contrarian take",
                "Practical application",
                "Industry implications",
              ].map((angle) => (
                <button
                  key={angle}
                  onClick={() => studio.setResearchAngle(angle)}
                  className={`rounded-full border px-3 py-1.5 text-xs transition-colors ${
                    studio.researchAngle === angle
                      ? "border-accent bg-accent/20 text-accent"
                      : "border-border bg-surface text-text-secondary hover:border-accent/50"
                  }`}
                >
                  {angle}
                </button>
              ))}
              <button
                onClick={() => {
                  const custom = prompt("Enter custom angle:");
                  if (custom) studio.setResearchAngle(custom);
                }}
                className="rounded-full border border-dashed border-border px-3 py-1.5 text-xs text-text-secondary transition-colors hover:border-accent/50"
              >
                Custom...
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Input */}
      <div className="mb-4">
        <textarea
          value={studio.input}
          onChange={(e) => studio.setInput(e.target.value)}
          placeholder={
            studio.mode === "polish"
              ? "Paste your draft here..."
              : selectedTemplate?.placeholder ||
                "What do you want to write about?"
          }
          className="min-h-[120px] w-full resize-y rounded-lg border border-border bg-surface p-4 text-sm text-text placeholder-text-secondary outline-none transition-colors focus:border-accent"
          disabled={studio.streaming}
        />
      </div>

      {/* Source detection nudge */}
      {showSourceNudge && (
        <div className="mb-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 text-sm text-yellow-200">
          This topic may need source support. Paste a source article or research
          note for safer, more specific results.
        </div>
      )}

      {/* Generate Button */}
      <button
        onClick={studio.handleGenerate}
        disabled={studio.streaming || !studio.input.trim()}
        className="mb-6 flex items-center gap-2 rounded-lg bg-accent px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-hover disabled:opacity-50"
      >
        <Sparkles size={16} />
        {studio.streaming
          ? "Generating..."
          : studio.mode === "polish"
            ? "Polish Draft"
            : "Generate Post"}
      </button>

      {/* Error */}
      {studio.error && (
        <div className="mb-4 rounded-lg border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
          {studio.error}
        </div>
      )}

      {/* Detection Badge */}
      {(studio.detectedTemplate || studio.detectedAudience) &&
        studio.output && (
          <div className="mb-4 flex items-center gap-2">
            <span className="text-xs text-text-secondary">
              We matched your content to:
            </span>
            {studio.detectedTemplate && (
              <span className="rounded-md bg-accent/10 px-2 py-0.5 text-xs font-medium text-accent">
                {formatLabel(studio.detectedTemplate)}
              </span>
            )}
            {studio.detectedAudience && (
              <span className="rounded-md bg-accent/10 px-2 py-0.5 text-xs font-medium text-accent">
                {formatLabel(studio.detectedAudience)}
              </span>
            )}
          </div>
        )}

      {/* Article Mode Badge */}
      {studio.output &&
        !studio.streaming &&
        studio.input.trim().split(/\s+/).filter(Boolean).length > 300 && (
          <div className="mb-4">
            <span className="rounded-md bg-purple-500/10 px-2 py-0.5 text-xs font-medium text-purple-400">
              Article Mode
            </span>
          </div>
        )}

      {/* === STEP 2: SCORE (Output + Scorecard + Tips) === */}
      {studio.output && (
        <>
          <div className="grid gap-4 lg:grid-cols-3">
            <div className="space-y-4 lg:col-span-2">
              <PostOutput
                content={studio.output}
                streaming={studio.streaming}
                onRetry={studio.handleRetry}
                onEdit={studio.handleEdit}
                wordCount={studio.wordCount}
                savedPostId={studio.savedPostId}
                versionInfo={
                  studio.versions.length > 1
                    ? {
                        current: studio.currentVersionIndex + 1,
                        total: studio.versions.length,
                      }
                    : undefined
                }
                onVersionChange={studio.handleVersionChange}
              />

              {/* After-Tips Banner — the dead-end fix */}
              {showAfterTipsBanner && (
                <AfterTipsBanner
                  appliedCount={studio.appliedTipIds.length}
                  onContinueToRefine={handleContinueToRefine}
                  onSkipToFinalize={handleSkipToFinalize}
                />
              )}

              {/* === STEP 3: REFINE === */}
              <div
                ref={refineRef}
                className="rounded-lg border border-border bg-surface"
              >
                <div className="flex items-center gap-2 border-b border-border px-4 py-3">
                  <Sparkles size={14} className="text-accent" />
                  <span className="text-sm font-medium">Refine your post</span>
                </div>

                {/* Chat Input first (ChatGPT-style) */}
                <div className="border-b border-border">
                  <ChatThread
                    messages={studio.messages}
                    onSend={studio.handleChatSend}
                    onSelectFramework={studio.handleSelectFramework}
                    onSelectHook={studio.handleSelectHook}
                    streaming={studio.streaming}
                    disabled={studio.streaming}
                    placeholder="Tell me what to change... 'Make the hook stronger' or 'Add a personal story'"
                  />
                </div>

                {/* Quick Actions below */}
                {!studio.streaming && (
                  <div className="px-4 py-3">
                    <QuickActions
                      onAction={studio.handleChatSend}
                      disabled={studio.streaming}
                    />
                  </div>
                )}
              </div>

              {/* === STEP 4: FINALIZE === */}
              <div
                ref={finalizeRef}
                className="rounded-lg border border-border bg-surface p-4"
              >
                <p className="mb-3 text-xs font-medium text-text-secondary">
                  Review before posting
                </p>

                {/* Adjust Length */}
                {!studio.streaming && (
                  <div className="mb-3">
                    <CondensePresets
                      onCondense={studio.handleCondense}
                      activePercent={studio.activeCondensePercent}
                      disabled={studio.streaming}
                      wordCount={studio.wordCount}
                    />
                  </div>
                )}

                {/* Hook Variations + Compliance — inline row */}
                {!studio.streaming && (
                  <div className="flex items-center gap-3">
                    <button
                      onClick={studio.handleHookVariations}
                      disabled={studio.applyingTipId !== null}
                      className="rounded-lg border border-border px-3 py-1.5 text-sm text-text-secondary transition-colors hover:border-accent hover:text-text disabled:opacity-50"
                    >
                      {studio.applyingTipId === "hooks"
                        ? "Generating..."
                        : "Hook Variations"}
                    </button>
                    <div className="flex-1">
                      <ComplianceCheck
                        result={studio.complianceResult}
                        isScanning={studio.isScanning}
                        onFix={studio.handleComplianceFix}
                        onDismiss={studio.handleComplianceDismiss}
                        onRescan={() => studio.runComplianceScan()}
                      />
                    </div>
                  </div>
                )}
              </div>

            </div>

            {/* Scorecard — sticky sidebar */}
            <div>
              <PillarScorecard
                scores={studio.scores}
                loading={studio.scoring}
                onApplyTip={studio.handleApplyTip}
                onApplyAll={studio.handleApplyAll}
                onFrameworkBuild={studio.handleFrameworkBuild}
                appliedTipIds={studio.appliedTipIds}
                applyingTipId={studio.applyingTipId}
                previousScores={studio.previousScores}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
