"use client";

import { useState, useCallback, useRef } from "react";
import { computeWordCount } from "@/lib/version-manager";
import type { Mode, Model } from "@/lib/types";

export interface PersistenceRefs {
  inputRef: React.RefObject<string>;
  modeRef: React.RefObject<Mode>;
  templateRef: React.RefObject<string>;
  resolvedTemplateRef: React.RefObject<string | null>;
  resolvedAudienceRef: React.RefObject<string | null>;
  modelRef: React.RefObject<Model>;
}

export interface PersistenceState {
  savedPostId: string | null;
}

export interface PersistenceActions {
  autoSave: (
    content: string,
    generationMetadata?: Record<string, unknown>,
  ) => Promise<string | null>;
  autoUpdate: (patch: Record<string, unknown>) => Promise<void>;
  persistConversation: (postId: string) => Promise<string | null>;
  persistMessage: (
    conversationId: string,
    role: string,
    content: string,
    messageType?: string,
    metadata?: Record<string, unknown>,
  ) => Promise<void>;
  persistVersion: (
    postId: string | null,
    conversationId: string | null,
    versionNumber: number,
    content: string,
    scores: unknown,
    changeDescription: string,
  ) => Promise<void>;
  recordRefinement: (
    newContent: string,
    refinementEntry: Record<string, unknown>,
  ) => Promise<void>;
  setSavedPostId: (id: string | null) => void;
  resetPersistence: () => void;
}

// Pure async functions — exported for direct testing without React context

export async function execAutoSave(
  content: string,
  refs: {
    inputRef: React.RefObject<string>;
    modeRef: React.RefObject<Mode>;
    templateRef: React.RefObject<string>;
    resolvedTemplateRef: React.RefObject<string | null>;
    resolvedAudienceRef: React.RefObject<string | null>;
    modelRef: React.RefObject<Model>;
  },
  generationMetadata?: Record<string, unknown>,
): Promise<string | null> {
  try {
    const body: Record<string, unknown> = {
      user_input: refs.inputRef.current,
      generated_content: content,
      template:
        refs.resolvedTemplateRef.current ||
        (refs.modeRef.current === "polish"
          ? "polish"
          : refs.templateRef.current),
      model: refs.modelRef.current,
      mode: refs.modeRef.current,
      source: "generated",
      audience: refs.resolvedAudienceRef.current || null,
      // conversation_id omitted — linked later via persistConversation to avoid FK violation
      word_count: computeWordCount(content),
      refinement_history: [],
    };
    if (generationMetadata) {
      body.generation_metadata = generationMetadata;
    }
    const res = await fetch("/api/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (res.ok) {
      const data = await res.json();
      return data.id as string;
    }
  } catch {
    // Auto-save is non-critical; don't block generation UX
  }
  return null;
}

export async function execAutoUpdate(
  id: string,
  patch: Record<string, unknown>,
): Promise<void> {
  try {
    await fetch(`/api/posts/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
  } catch {
    // Non-critical
  }
}

export async function execPersistConversation(
  postId: string,
): Promise<string | null> {
  try {
    const res = await fetch("/api/conversations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ post_id: postId }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.id;
  } catch (e) {
    console.error("[persistConversation] failed:", e);
    return null;
  }
}

export async function execPersistMessage(
  conversationId: string,
  role: string,
  content: string,
  messageType: string = "chat",
  metadata?: Record<string, unknown>,
): Promise<void> {
  try {
    await fetch("/api/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        conversation_id: conversationId,
        role,
        content,
        message_type: messageType,
        metadata,
      }),
    });
  } catch (e) {
    console.error("[persistMessage] failed:", e);
  }
}

export async function execPersistVersion(
  postId: string | null,
  conversationId: string | null,
  versionNumber: number,
  content: string,
  scores: unknown,
  changeDescription: string,
): Promise<void> {
  try {
    await fetch("/api/versions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        post_id: postId,
        conversation_id: conversationId,
        version_number: versionNumber,
        content,
        scores,
        change_description: changeDescription,
      }),
    });
  } catch (e) {
    console.error("[persistVersion] failed:", e);
  }
}

// Hook — wraps the pure functions with React state and ref management

export function usePersistence(
  refs: PersistenceRefs,
): PersistenceState & PersistenceActions {
  const [savedPostId, setSavedPostId] = useState<string | null>(null);
  const savedPostIdRef = useRef<string | null>(null);
  savedPostIdRef.current = savedPostId;

  // v4: Local refinement history accumulator (sent as full array on each PATCH)
  const refinementHistoryRef = useRef<Record<string, unknown>[]>([]);

  // v4: Auto-save generated post to DB (fires once after generation completes)
  const autoSave = useCallback(
    async (
      content: string,
      generationMetadata?: Record<string, unknown>,
    ): Promise<string | null> => {
      const id = await execAutoSave(content, refs, generationMetadata);
      if (id) {
        setSavedPostId(id);
      }
      return id;
    },
    [refs],
  );

  // v4: Patch saved post with updated content, scores, or refinement history
  const autoUpdate = useCallback(async (patch: Record<string, unknown>) => {
    const id = savedPostIdRef.current;
    if (!id) return;
    await execAutoUpdate(id, patch);
  }, []);

  // v6: Persist conversation — creates conversation record linked to post
  const persistConversation = useCallback(
    async (postId: string): Promise<string | null> => {
      return execPersistConversation(postId);
    },
    [],
  );

  // v6: Persist a single message to a conversation
  const persistMessage = useCallback(
    async (
      conversationId: string,
      role: string,
      content: string,
      messageType: string = "chat",
      metadata?: Record<string, unknown>,
    ) => {
      return execPersistMessage(
        conversationId,
        role,
        content,
        messageType,
        metadata,
      );
    },
    [],
  );

  // v6: Persist a post version snapshot
  const persistVersion = useCallback(
    async (
      postId: string | null,
      conversationId: string | null,
      versionNumber: number,
      content: string,
      scores: unknown,
      changeDescription: string,
    ) => {
      return execPersistVersion(
        postId,
        conversationId,
        versionNumber,
        content,
        scores,
        changeDescription,
      );
    },
    [],
  );

  // v4: Record a refinement and sync content + history to DB
  const recordRefinement = useCallback(
    async (newContent: string, refinementEntry: Record<string, unknown>) => {
      refinementHistoryRef.current = [
        ...refinementHistoryRef.current,
        { ...refinementEntry, at: new Date().toISOString() },
      ];
      await autoUpdate({
        generated_content: newContent,
        word_count: computeWordCount(newContent),
        refinement_history: refinementHistoryRef.current,
      });
    },
    [autoUpdate],
  );

  const resetPersistence = useCallback(() => {
    setSavedPostId(null);
    refinementHistoryRef.current = [];
  }, []);

  return {
    savedPostId,
    setSavedPostId,
    autoSave,
    autoUpdate,
    persistConversation,
    persistMessage,
    persistVersion,
    recordRefinement,
    resetPersistence,
  };
}
