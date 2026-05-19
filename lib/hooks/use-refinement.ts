"use client";

import { useState, useCallback } from "react";
import type { RefObject, Dispatch, SetStateAction } from "react";
import type {
  Model,
  ScoreResponse,
  ScoringTip,
  Message,
  GenerationContext,
} from "@/lib/types";
import { computeWordCount } from "@/lib/version-manager";

type ChatMessage = Pick<Message, "role" | "content"> & { type?: string };

export interface RefinementDeps {
  readStream: (res: Response) => Promise<string>;
  scoreAndSync: (content: string) => Promise<unknown>;
  addVersion: (content: string, desc: string, convId: string | null) => void;
  recordRefinement: (
    content: string,
    entry: Record<string, unknown>,
  ) => Promise<void>;
  persistMessage: (
    convId: string,
    role: string,
    content: string,
    type?: string,
    metadata?: Record<string, unknown>,
  ) => Promise<void>;
  persistVersion: (
    postId: string | null,
    convId: string | null,
    versionNum: number,
    content: string,
    scores: Record<string, number> | null,
    desc: string,
  ) => Promise<void>;
  setOutput: (content: string) => void;
  setStreaming: (val: boolean) => void;
  setError: (msg: string) => void;
  setMessages: Dispatch<SetStateAction<ChatMessage[]>>;
  setPreviousScores: (scores: ScoreResponse | null) => void;
  buildGenerationContext: () => GenerationContext;
  outputRef: RefObject<string>;
  modelRef: RefObject<Model>;
  conversationIdRef: RefObject<string | null>;
  savedPostIdRef: RefObject<string | null>;
  scoresRef: RefObject<ScoreResponse | null>;
  versionsCount: number;
  messages: ChatMessage[];
}

export interface RefinementState {
  appliedTipIds: string[];
  applyingTipId: string | null;
  activeCondensePercent: number | null;
  preCondenseContent: string | null;
}

export interface RefinementActions {
  handleChatSend: (message: string) => Promise<void>;
  handleApplyTip: (tip: ScoringTip) => Promise<void>;
  handleApplyAll: () => Promise<void>;
  handleCondense: (percent: number) => Promise<void>;
  handleFrameworkBuild: () => Promise<void>;
  handleHookVariations: () => Promise<void>;
  handleSelectHook: (hookText: string) => void;
  handleSelectFramework: (name: string, steps: string[]) => Promise<void>;
  setAppliedTipIds: Dispatch<SetStateAction<string[]>>;
  setApplyingTipId: (id: string | null) => void;
  setActiveCondensePercent: (percent: number | null) => void;
  setPreCondenseContent: (content: string | null) => void;
  resetRefinement: () => void;
}

export function useRefinement(
  deps: RefinementDeps,
): RefinementState & RefinementActions {
  const [appliedTipIds, setAppliedTipIds] = useState<string[]>([]);
  const [applyingTipId, setApplyingTipId] = useState<string | null>(null);
  const [activeCondensePercent, setActiveCondensePercent] = useState<
    number | null
  >(null);
  const [preCondenseContent, setPreCondenseContent] = useState<string | null>(
    null,
  );

  // Chat send — POST /api/chat, stream response, create version, persist, rescore
  const handleChatSend = useCallback(
    async (message: string) => {
      const currentOutput = deps.outputRef.current;
      const currentModel = deps.modelRef.current;
      const currentConvId = deps.conversationIdRef.current;

      // Add user message to chat
      deps.setMessages((prev) => [...prev, { role: "user", content: message }]);
      deps.setStreaming(true);
      deps.setError("");

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            conversationId: currentConvId,
            currentPost: currentOutput,
            messages: [...deps.messages, { role: "user", content: message }],
            instruction: message,
            model: currentModel,
            generationContext: deps.buildGenerationContext(),
          }),
        });

        if (!res.ok) {
          const data = await res.json();
          deps.setError(data.error || "Chat failed");
          deps.setStreaming(false);
          return;
        }

        const fullText = await deps.readStream(res);
        deps.setStreaming(false);

        // Add assistant response to chat
        deps.setMessages((prev) => [
          ...prev,
          { role: "assistant", content: fullText },
        ]);

        // Create new version
        deps.addVersion(
          fullText,
          `Chat: ${message.slice(0, 50)}`,
          currentConvId,
        );

        // Track refinement
        deps.recordRefinement(fullText, {
          type: "chat_edit",
          instruction: message.slice(0, 200),
        });

        // Persist messages and version
        const convId = deps.conversationIdRef.current;
        if (convId) {
          deps.persistMessage(convId, "user", message, "chat");
          deps.persistMessage(convId, "assistant", fullText, "chat");
          deps.persistVersion(
            deps.savedPostIdRef.current,
            convId,
            deps.versionsCount + 1,
            fullText,
            null,
            `Chat edit: ${message.slice(0, 50)}`,
          );
        }

        // Auto-rescore
        deps.setPreviousScores(deps.scoresRef.current);
        deps.scoreAndSync(fullText);
      } catch {
        deps.setError("Chat failed. Please try again.");
        deps.setStreaming(false);
      }
    },
    [deps],
  );

  // Apply single tip — POST /api/refine with tip_apply
  const handleApplyTip = useCallback(
    async (tip: ScoringTip) => {
      if (applyingTipId) return;
      const currentOutput = deps.outputRef.current;
      const currentModel = deps.modelRef.current;
      const currentConvId = deps.conversationIdRef.current;

      setApplyingTipId(tip.id);
      deps.setStreaming(true);

      try {
        const res = await fetch("/api/refine", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            conversationId: currentConvId,
            currentPost: currentOutput,
            refineType: "tip_apply",
            instruction: tip.instruction,
            model: currentModel,
            metadata: { tipId: tip.id },
            generationContext: deps.buildGenerationContext(),
          }),
        });

        if (!res.ok) {
          setApplyingTipId(null);
          deps.setStreaming(false);
          return;
        }

        const fullText = await deps.readStream(res);
        deps.setStreaming(false);
        setApplyingTipId(null);
        setAppliedTipIds((prev) => [...prev, tip.id]);

        // Add system message
        deps.setMessages((prev) => [
          ...prev,
          {
            role: "system" as const,
            content: `Applied tip: ${tip.technique} (${tip.pillar})`,
          },
        ]);

        // Create new version
        deps.addVersion(fullText, `Applied: ${tip.technique}`, currentConvId);

        // Track refinement
        deps.recordRefinement(fullText, {
          type: "tip_apply",
          tip_id: tip.id,
          pillar: tip.pillar,
          technique: tip.technique,
        });

        // Persist messages and version
        const convId = deps.conversationIdRef.current;
        if (convId) {
          deps.persistMessage(
            convId,
            "user",
            `Apply tip: ${tip.instruction}`,
            "tip_apply",
            { tipId: tip.id },
          );
          deps.persistMessage(convId, "assistant", fullText, "tip_apply");
          deps.persistVersion(
            deps.savedPostIdRef.current,
            convId,
            deps.versionsCount + 1,
            fullText,
            null,
            `Tip applied: ${tip.technique}`,
          );
        }

        // Auto-rescore
        deps.setPreviousScores(deps.scoresRef.current);
        deps.scoreAndSync(fullText);
      } catch {
        setApplyingTipId(null);
        deps.setStreaming(false);
      }
    },
    [applyingTipId, deps],
  );

  // Apply all tips in a single pass — POST /api/refine with apply_all
  const handleApplyAll = useCallback(async () => {
    const scores = deps.scoresRef.current;
    if (!scores?.tips || scores.tips.length === 0) return;

    const unappliedTips = scores.tips.filter(
      (t) => !appliedTipIds.includes(t.id),
    );
    if (unappliedTips.length === 0) return;

    setApplyingTipId("all");
    deps.setStreaming(true);

    try {
      const res = await fetch("/api/refine", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPost: deps.outputRef.current,
          refineType: "apply_all",
          instruction: "",
          model: deps.modelRef.current,
          metadata: {
            tips: unappliedTips.map((t) => ({
              instruction: t.instruction,
              pillar: t.pillar,
              section: t.section,
            })),
          },
          generationContext: deps.buildGenerationContext(),
        }),
      });

      if (!res.ok) {
        setApplyingTipId(null);
        deps.setStreaming(false);
        return;
      }

      const fullText = await deps.readStream(res);
      deps.setStreaming(false);

      // Mark all tips as applied
      setAppliedTipIds((prev) => [...prev, ...unappliedTips.map((t) => t.id)]);

      // Add system message
      deps.setMessages((prev) => [
        ...prev,
        {
          role: "system" as const,
          content: `Applied all ${unappliedTips.length} improvements`,
        },
      ]);

      // Create version
      deps.addVersion(
        fullText,
        `Applied all ${unappliedTips.length} tips`,
        deps.conversationIdRef.current,
      );

      // Track refinement
      deps.recordRefinement(fullText, {
        type: "apply_all",
        tip_count: unappliedTips.length,
      });

      // Persist messages and version
      const convId = deps.conversationIdRef.current;
      if (convId) {
        deps.persistMessage(
          convId,
          "user",
          `Apply all ${unappliedTips.length} tips`,
          "tip_apply",
        );
        deps.persistMessage(convId, "assistant", fullText, "tip_apply");
        deps.persistVersion(
          deps.savedPostIdRef.current,
          convId,
          deps.versionsCount + 1,
          fullText,
          null,
          `Applied all ${unappliedTips.length} tips`,
        );
      }

      // Re-score
      deps.setPreviousScores(scores);
      deps.scoreAndSync(fullText);
    } catch {
      deps.setStreaming(false);
    } finally {
      setApplyingTipId(null);
    }
  }, [appliedTipIds, deps]);

  // Condense — POST /api/refine with condense, or restore at 100%
  const handleCondense = useCallback(
    async (percent: number) => {
      const currentOutput = deps.outputRef.current;
      const currentModel = deps.modelRef.current;
      const currentConvId = deps.conversationIdRef.current;

      if (percent === 100) {
        // Restore original
        if (preCondenseContent) {
          deps.setOutput(preCondenseContent);
          setActiveCondensePercent(null);
          setPreCondenseContent(null);
          deps.setPreviousScores(deps.scoresRef.current);
          deps.scoreAndSync(preCondenseContent);
        }
        return;
      }

      // Save pre-condense content on first condense
      if (!preCondenseContent) {
        setPreCondenseContent(currentOutput);
      }

      setActiveCondensePercent(percent);
      deps.setStreaming(true);

      try {
        const scores = deps.scoresRef.current;
        const res = await fetch("/api/refine", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            conversationId: currentConvId,
            currentPost: preCondenseContent || currentOutput,
            refineType: "condense",
            instruction: `Condense to ${percent}%`,
            model: currentModel,
            metadata: {
              targetPercent: percent,
              currentScores: scores?.scores,
            },
            generationContext: deps.buildGenerationContext(),
          }),
        });

        if (!res.ok) {
          deps.setStreaming(false);
          return;
        }

        const fullText = await deps.readStream(res);
        deps.setStreaming(false);

        // Add system message
        deps.setMessages((prev) => [
          ...prev,
          {
            role: "system" as const,
            content: `Condensed to ${percent}% (${computeWordCount(fullText)} words)`,
          },
        ]);

        // Create new version
        deps.addVersion(fullText, `Condensed to ${percent}%`, currentConvId);

        // Track refinement
        deps.recordRefinement(fullText, {
          type: "condense",
          target_percent: percent,
        });

        // Persist messages and version
        const convId = deps.conversationIdRef.current;
        if (convId) {
          deps.persistMessage(
            convId,
            "user",
            `Condense to ${percent}%`,
            "condense",
          );
          deps.persistMessage(convId, "assistant", fullText, "condense");
          deps.persistVersion(
            deps.savedPostIdRef.current,
            convId,
            deps.versionsCount + 1,
            fullText,
            null,
            `Condensed to ${percent}%`,
          );
        }

        // Auto-rescore
        deps.setPreviousScores(scores);
        deps.scoreAndSync(fullText);
      } catch {
        deps.setStreaming(false);
      }
    },
    [preCondenseContent, deps],
  );

  // Framework builder — POST /api/refine with framework_build (chat-only, no version)
  const handleFrameworkBuild = useCallback(async () => {
    if (!deps.outputRef.current) return;

    setApplyingTipId("framework");
    deps.setStreaming(true);

    try {
      const res = await fetch("/api/refine", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPost: deps.outputRef.current,
          refineType: "framework_build",
          instruction: "",
          model: deps.modelRef.current,
          metadata: { scores: deps.scoresRef.current?.scores },
        }),
      });

      if (!res.ok) {
        setApplyingTipId(null);
        deps.setStreaming(false);
        return;
      }

      const fullText = await deps.readStream(res);
      deps.setStreaming(false);

      // Show framework options in chat thread (no version, no persistence)
      deps.setMessages((prev) => [
        ...prev,
        {
          role: "assistant" as const,
          content: fullText,
          type: "framework_build",
        },
      ]);
    } catch {
      deps.setStreaming(false);
    } finally {
      setApplyingTipId(null);
    }
  }, [deps]);

  // Hook variations — POST /api/refine with hook_variation (chat-only, no version)
  const handleHookVariations = useCallback(async () => {
    if (!deps.outputRef.current) return;

    setApplyingTipId("hooks");
    deps.setStreaming(true);

    try {
      const res = await fetch("/api/refine", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPost: deps.outputRef.current,
          refineType: "hook_variation",
          instruction: "",
          model: deps.modelRef.current,
        }),
      });

      if (!res.ok) {
        setApplyingTipId(null);
        deps.setStreaming(false);
        return;
      }

      const fullText = await deps.readStream(res);
      deps.setStreaming(false);

      // Show hook variations in chat thread (no version, no persistence)
      deps.setMessages((prev) => [
        ...prev,
        {
          role: "assistant" as const,
          content: fullText,
          type: "hook_variation",
        },
      ]);
    } catch {
      deps.setStreaming(false);
    } finally {
      setApplyingTipId(null);
    }
  }, [deps]);

  // Select a hook variation — local text manipulation (no API call)
  const handleSelectHook = useCallback(
    (hookText: string) => {
      if (!deps.outputRef.current) return;

      // Replace first 2-3 non-empty lines with selected hook
      const lines = deps.outputRef.current.split("\n");
      let splitIndex = 0;
      let nonEmptyCount = 0;
      for (let i = 0; i < lines.length && nonEmptyCount < 3; i++) {
        if (lines[i].trim()) nonEmptyCount++;
        splitIndex = i + 1;
      }

      const newContent = hookText + "\n\n" + lines.slice(splitIndex).join("\n");
      deps.setOutput(newContent);

      // Create version
      deps.addVersion(
        newContent,
        "Applied hook variation",
        deps.conversationIdRef.current,
      );

      // Track refinement
      deps.recordRefinement(newContent, { type: "hook_swap" });

      deps.setPreviousScores(deps.scoresRef.current);
      deps.scoreAndSync(newContent);
    },
    [deps],
  );

  // Select a framework — delegates to handleApplyTip with a constructed ScoringTip
  const handleSelectFramework = useCallback(
    async (frameworkName: string, steps: string[]) => {
      if (!deps.outputRef.current) return;

      const instruction = `Add the framework "${frameworkName}" with these steps: ${steps.join(", ")}. Integrate it naturally into the post body as a numbered list with parallel verb-driven labels.`;

      await handleApplyTip({
        id: "tip-framework-build",
        pillar: "framework",
        technique: "Name Your Framework",
        instruction,
        section: "meat",
      });
    },
    [handleApplyTip, deps],
  );

  const resetRefinement = useCallback(() => {
    setAppliedTipIds([]);
    setApplyingTipId(null);
    setActiveCondensePercent(null);
    setPreCondenseContent(null);
  }, []);

  return {
    // State
    appliedTipIds,
    applyingTipId,
    activeCondensePercent,
    preCondenseContent,

    // Actions
    handleChatSend,
    handleApplyTip,
    handleApplyAll,
    handleCondense,
    handleFrameworkBuild,
    handleHookVariations,
    handleSelectHook,
    handleSelectFramework,
    setAppliedTipIds,
    setApplyingTipId,
    setActiveCondensePercent,
    setPreCondenseContent,
    resetRefinement,
  };
}
