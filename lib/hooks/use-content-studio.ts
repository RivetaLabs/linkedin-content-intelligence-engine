"use client";

import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import type {
  Mode,
  Model,
  TemplateOrAuto,
  AudienceOrAuto,
  ScoreResponse,
  ScoringTip,
  PostVersion,
  Message,
  GenerationContext,
  ComplianceResult,
} from "@/lib/types";
import { computeWordCount } from "@/lib/version-manager";
import { useSettingsContext } from "@/lib/contexts/settings-context";
import { usePersistence } from "./use-persistence";
import { useScoring } from "./use-scoring";
import { useVersioning } from "./use-versioning";
import { useCompliance } from "./use-compliance";
import { useRefinement } from "./use-refinement";

export interface ContentStudioState {
  // Generation
  mode: Mode;
  template: TemplateOrAuto;
  audience: AudienceOrAuto;
  model: Model;
  input: string;
  output: string;
  streaming: boolean;
  error: string;

  // Scoring
  scores: ScoreResponse | null;
  previousScores: ScoreResponse | null;
  scoring: boolean;

  // Detection
  detectedTemplate: string | null;
  detectedAudience: string | null;
  resolvedTemplate: string | null;
  resolvedAudience: string | null;

  // Settings
  hasKeys: boolean | null;
  hasSearchKey: boolean;

  // v2: Conversation
  conversationId: string | null;
  messages: (Pick<Message, "role" | "content"> & { type?: string })[];
  versions: PostVersion[];
  currentVersionIndex: number;

  // v2: Tip application
  appliedTipIds: string[];
  applyingTipId: string | null;

  // v2: Condense
  activeCondensePercent: number | null;
  preCondenseContent: string | null;

  // UI
  wordCount: number;

  // v4: Auto-save
  savedPostId: string | null;

  // v5: Research bridge
  researchContext: string | null;
  researchAngle: string | null;

  // v6: Compliance scan
  complianceResult: ComplianceResult | null;
  isScanning: boolean;
}

export interface ContentStudioActions {
  setMode: (mode: Mode) => void;
  setTemplate: (template: TemplateOrAuto) => void;
  setAudience: (audience: AudienceOrAuto) => void;
  setModel: (model: Model) => void;
  setInput: (input: string) => void;
  setResearchContext: (ctx: string | null) => void;
  setResearchAngle: (angle: string | null) => void;
  handleGenerate: () => void;
  handleRetry: () => void;
  handleEdit: (content: string) => void;
  handleChatSend: (message: string) => void;
  handleApplyTip: (tip: ScoringTip) => void;
  handleApplyAll: () => void;
  handleCondense: (percent: number) => void;
  handleFrameworkBuild: () => void;
  handleHookVariations: () => void;
  handleSelectHook: (hookText: string) => void;
  handleSelectFramework: (name: string, steps: string[]) => void;
  handleVersionChange: (version: number) => void;
  resetSession: () => void;
  runComplianceScan: (content?: string) => void;
  handleComplianceFix: (flagIndex: number, suggestion: string) => void;
  handleComplianceDismiss: (flagIndex: number) => void;
}

export function useContentStudio(): ContentStudioState & ContentStudioActions {
  // === Settings from context (replaces useEffect fetch) ===
  const settings = useSettingsContext();
  const hasKeys: boolean | null = settings.loading
    ? null
    : settings.hasAnthropicKey || settings.hasOpenAIKey;
  const hasSearchKey = settings.hasSearchKey;

  // === Local state that stays in orchestrator ===
  const [mode, setMode] = useState<Mode>("create");
  const [template, setTemplate] = useState<TemplateOrAuto>("auto");
  const [audience, setAudience] = useState<AudienceOrAuto>("auto");
  const [model, setModel] = useState<Model>("claude");
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState("");

  // Detection state
  const [detectedTemplate, setDetectedTemplate] = useState<string | null>(null);
  const [detectedAudience, setDetectedAudience] = useState<string | null>(null);
  const [resolvedTemplate, setResolvedTemplate] = useState<string | null>(null);
  const [resolvedAudience, setResolvedAudience] = useState<string | null>(null);

  // v2: Conversation
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<
    (Pick<Message, "role" | "content"> & { type?: string })[]
  >([]);

  // v5: Research bridge
  const [researchContext, setResearchContext] = useState<string | null>(null);
  const [researchAngle, setResearchAngle] = useState<string | null>(null);

  // === Refs for current values in async closures ===
  const outputRef = useRef(output);
  outputRef.current = output;
  const modelRef = useRef(model);
  modelRef.current = model;
  const inputRef = useRef(input);
  inputRef.current = input;
  const modeRef = useRef(mode);
  modeRef.current = mode;
  const templateRef = useRef(template);
  templateRef.current = template;
  const resolvedTemplateRef = useRef(resolvedTemplate);
  resolvedTemplateRef.current = resolvedTemplate;
  const resolvedAudienceRef = useRef(resolvedAudience);
  resolvedAudienceRef.current = resolvedAudience;
  const conversationIdRef = useRef(conversationId);
  conversationIdRef.current = conversationId;

  // === Set default model from settings ===
  useEffect(() => {
    if (settings.defaultModel && !settings.loading) {
      setModel(settings.defaultModel as Model);
    }
  }, [settings.defaultModel, settings.loading]);

  // === Build generation context for compliance and source fidelity ===
  const buildGenerationContext = useCallback((): GenerationContext => {
    const userInput = inputRef.current;
    const words = userInput.trim().split(/\s+/).filter(Boolean);
    const isArticle = words.length > 300 && userInput.includes("\n\n");
    return {
      originalInput: userInput,
      sourceArticle: isArticle ? userInput : null,
      researchContext: researchContext,
      resolvedTemplate: resolvedTemplateRef.current || "auto",
      resolvedAudience: resolvedAudienceRef.current || "auto",
    };
  }, [researchContext]);

  // === Read streaming response helper ===
  const readStream = useCallback(async (res: Response): Promise<string> => {
    const reader = res.body?.getReader();
    const decoder = new TextDecoder();
    let fullText = "";

    if (reader) {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        fullText += chunk;
        setOutput(fullText);
      }
    }

    return fullText;
  }, []);

  // === Compose sub-hooks ===

  // 1. Persistence
  const persistence = usePersistence({
    inputRef,
    modeRef,
    templateRef,
    resolvedTemplateRef,
    resolvedAudienceRef,
    modelRef,
  });
  const {
    savedPostId,
    autoSave,
    autoUpdate,
    persistConversation,
    persistMessage,
    persistVersion,
    recordRefinement,
    resetPersistence,
  } = persistence;

  // Orchestrator-level ref tracking savedPostId for sub-hooks that need it
  const savedPostIdRef = useRef<string | null>(null);
  savedPostIdRef.current = savedPostId;

  // 2. Scoring
  const scoring = useScoring(autoUpdate);
  const {
    scores,
    setScores,
    previousScores,
    setPreviousScores,
    scoring: isScoring,
    scoreAndSync,
  } = scoring;

  const scoresRef = useRef(scores);
  scoresRef.current = scores;

  // 3. Versioning
  const versioning = useVersioning(scoreAndSync, setOutput);
  const {
    versions,
    setVersions,
    currentVersionIndex,
    addVersion,
    handleVersionChange,
    resetVersions,
  } = versioning;

  // 4. Compliance
  const compliance = useCompliance(
    autoUpdate,
    outputRef,
    buildGenerationContext,
    savedPostIdRef,
    setOutput,
  );
  const {
    complianceResult,
    isScanning,
    setComplianceResult,
    runComplianceScan,
    handleComplianceFix,
    handleComplianceDismiss,
  } = compliance;

  // 5. Refinement
  const refinementDeps = useMemo(
    () => ({
      readStream,
      scoreAndSync,
      addVersion,
      recordRefinement,
      persistMessage,
      persistVersion,
      setOutput,
      setStreaming,
      setError,
      setMessages,
      setPreviousScores,
      buildGenerationContext,
      outputRef,
      modelRef,
      conversationIdRef,
      savedPostIdRef,
      scoresRef,
      versionsCount: versions.length,
      messages,
    }),
    [
      readStream,
      scoreAndSync,
      addVersion,
      recordRefinement,
      persistMessage,
      persistVersion,
      buildGenerationContext,
      versions.length,
      messages,
    ],
  );

  const refinement = useRefinement(refinementDeps);

  // === wordCount ===
  const wordCount = output ? computeWordCount(output) : 0;

  // === handleGenerate (stays in orchestrator, unique orchestration) ===
  const handleGenerate = useCallback(async () => {
    if (!input.trim()) return;
    setError("");
    setOutput("");
    setScores(null);
    setPreviousScores(null);
    setStreaming(true);
    setDetectedTemplate(null);
    setDetectedAudience(null);
    setResolvedTemplate(null);
    setResolvedAudience(null);
    setMessages([]);
    refinement.setAppliedTipIds([]);
    refinement.setApplyingTipId(null);
    refinement.setActiveCondensePercent(null);
    refinement.setPreCondenseContent(null);
    resetVersions();
    persistence.setSavedPostId(null);

    // Generate a new conversation ID
    const newConvId = crypto.randomUUID();
    setConversationId(newConvId);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode,
          template: mode === "polish" ? "polish" : template,
          input,
          model,
          audience: mode === "polish" ? undefined : audience,
          researchContext: researchContext || undefined,
          researchAngle: researchAngle ?? undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Generation failed");
        setStreaming(false);
        return;
      }

      // Read classification metadata
      const dt = res.headers.get("X-Detected-Template");
      const da = res.headers.get("X-Detected-Audience");
      const rt = res.headers.get("X-Resolved-Template");
      const ra = res.headers.get("X-Resolved-Audience");
      if (dt) setDetectedTemplate(dt);
      if (da) setDetectedAudience(da);
      if (rt) setResolvedTemplate(rt);
      if (ra) setResolvedAudience(ra);

      // v4: Read generation metadata from header
      const genMetaRaw = res.headers.get("X-Generation-Metadata");
      let generationMetadata: Record<string, unknown> | undefined;
      if (genMetaRaw) {
        try {
          generationMetadata = JSON.parse(genMetaRaw);
        } catch {
          // Ignore parse errors
        }
      }

      const fullText = await readStream(res);
      setStreaming(false);

      // Create initial version
      const v1: PostVersion = {
        id: crypto.randomUUID(),
        post_id: null,
        conversation_id: newConvId,
        version_number: 1,
        content: fullText,
        scores: null,
        word_count: computeWordCount(fullText),
        change_description: "Initial generation",
        created_at: new Date().toISOString(),
      };
      setVersions([v1]);

      // v4: Auto-save to DB immediately (before scoring)
      const postId = await autoSave(fullText, generationMetadata);

      // v6: Persist conversation and initial version
      if (postId) {
        const convId = await persistConversation(postId);
        if (convId) {
          conversationIdRef.current = convId;
          setConversationId(convId);
          persistVersion(
            postId,
            convId,
            1,
            fullText,
            null,
            "Initial generation",
          );
        }
      }

      // Auto-score and compliance scan in parallel
      scoreAndSync(fullText);
      runComplianceScan(fullText);
    } catch {
      setError("Failed to connect. Check your API keys in Settings.");
      setStreaming(false);
    }
  }, [
    input,
    mode,
    template,
    model,
    audience,
    researchContext,
    researchAngle,
    readStream,
    scoreAndSync,
    autoSave,
    persistConversation,
    persistVersion,
    runComplianceScan,
    setScores,
    setPreviousScores,
    resetVersions,
    setVersions,
    refinement,
    persistence,
  ]);

  // Retry generation
  const handleRetry = useCallback(() => {
    handleGenerate();
  }, [handleGenerate]);

  // Manual edit (stays in orchestrator, uses multiple sub-hook functions)
  const handleEdit = useCallback(
    (newContent: string) => {
      setPreviousScores(scores);
      setOutput(newContent);
      setScores(null);

      addVersion(newContent, "Manual edit", conversationId);

      // v4: Track refinement
      recordRefinement(newContent, { type: "manual_edit" });

      scoreAndSync(newContent);
    },
    [
      scores,
      conversationId,
      scoreAndSync,
      recordRefinement,
      addVersion,
      setPreviousScores,
      setScores,
    ],
  );

  // Reset entire session
  const resetSession = useCallback(() => {
    setOutput("");
    setScores(null);
    setPreviousScores(null);
    setError("");
    setStreaming(false);
    setDetectedTemplate(null);
    setDetectedAudience(null);
    setResolvedTemplate(null);
    setResolvedAudience(null);
    setConversationId(null);
    setMessages([]);
    resetVersions();
    refinement.resetRefinement();
    resetPersistence();
    setComplianceResult(null);
  }, [
    setScores,
    setPreviousScores,
    resetVersions,
    refinement,
    resetPersistence,
    setComplianceResult,
  ]);

  return {
    // State
    mode,
    template,
    audience,
    model,
    input,
    output,
    streaming,
    error,
    scores,
    previousScores,
    scoring: isScoring,
    detectedTemplate,
    detectedAudience,
    resolvedTemplate,
    resolvedAudience,
    hasKeys,
    hasSearchKey,
    conversationId,
    messages,
    versions,
    currentVersionIndex,
    appliedTipIds: refinement.appliedTipIds,
    applyingTipId: refinement.applyingTipId,
    activeCondensePercent: refinement.activeCondensePercent,
    preCondenseContent: refinement.preCondenseContent,
    wordCount,
    savedPostId,
    researchContext,
    researchAngle,
    complianceResult,
    isScanning,

    // Actions
    setMode,
    setTemplate,
    setAudience,
    setModel,
    setInput,
    setResearchContext,
    setResearchAngle,
    handleGenerate,
    handleRetry,
    handleEdit,
    handleChatSend: refinement.handleChatSend,
    handleApplyTip: refinement.handleApplyTip,
    handleApplyAll: refinement.handleApplyAll,
    handleCondense: refinement.handleCondense,
    handleFrameworkBuild: refinement.handleFrameworkBuild,
    handleHookVariations: refinement.handleHookVariations,
    handleSelectHook: refinement.handleSelectHook,
    handleSelectFramework: refinement.handleSelectFramework,
    handleVersionChange,
    resetSession,
    runComplianceScan,
    handleComplianceFix,
    handleComplianceDismiss,
  };
}
