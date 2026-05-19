"use client";

import { useState, useCallback } from "react";
import type { PostVersion } from "@/lib/types";
import { computeWordCount } from "@/lib/version-manager";

export function useVersioning(
  scoreAndSync: (content: string) => Promise<unknown>,
  setOutput: (content: string) => void,
) {
  const [versions, setVersions] = useState<PostVersion[]>([]);
  const [currentVersionIndex, setCurrentVersionIndex] = useState(0);

  const addVersion = useCallback(
    (
      content: string,
      changeDescription: string,
      conversationId: string | null,
    ) => {
      const newVersion: PostVersion = {
        id: crypto.randomUUID(),
        post_id: null,
        conversation_id: conversationId,
        version_number: versions.length + 1,
        content,
        scores: null,
        word_count: computeWordCount(content),
        change_description: changeDescription,
        created_at: new Date().toISOString(),
      };
      setVersions((prev) => [...prev, newVersion]);
      setCurrentVersionIndex(versions.length);
    },
    [versions.length],
  );

  const handleVersionChange = useCallback(
    (versionNum: number) => {
      const idx = versionNum - 1;
      if (idx >= 0 && idx < versions.length) {
        setCurrentVersionIndex(idx);
        setOutput(versions[idx].content);
        // Rescore if version has no cached scores
        if (!versions[idx].scores) {
          scoreAndSync(versions[idx].content);
        }
      }
    },
    [versions, scoreAndSync, setOutput],
  );

  const resetVersions = useCallback(() => {
    setVersions([]);
    setCurrentVersionIndex(0);
  }, []);

  return {
    versions,
    setVersions,
    currentVersionIndex,
    addVersion,
    handleVersionChange,
    resetVersions,
  };
}
