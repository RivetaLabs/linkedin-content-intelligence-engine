// Version management utility for iterative content studio
// Creates post_versions rows and tracks version state client-side

import { supabase } from "@/lib/supabase";
import type { PostVersion, ScoreResponse } from "@/lib/types";

export interface CreateVersionParams {
  postId?: string | null;
  conversationId: string;
  versionNumber: number;
  content: string;
  scores?: ScoreResponse | null;
  changeDescription: string;
}

export async function createVersion(
  params: CreateVersionParams,
): Promise<PostVersion | null> {
  const wordCount = params.content.trim().split(/\s+/).filter(Boolean).length;

  const { data, error } = await supabase
    .from("post_versions")
    .insert({
      post_id: params.postId || null,
      conversation_id: params.conversationId,
      version_number: params.versionNumber,
      content: params.content,
      scores: params.scores || null,
      word_count: wordCount,
      change_description: params.changeDescription,
    })
    .select()
    .single();

  if (error) {
    console.error("Failed to create version:", error);
    return null;
  }

  return data as PostVersion;
}

export async function fetchVersions(
  conversationId: string,
): Promise<PostVersion[]> {
  const { data, error } = await supabase
    .from("post_versions")
    .select("*")
    .eq("conversation_id", conversationId)
    .order("version_number", { ascending: true });

  if (error) {
    console.error("Failed to fetch versions:", error);
    return [];
  }

  return data as PostVersion[];
}

export function computeWordCount(content: string): number {
  return content.trim().split(/\s+/).filter(Boolean).length;
}
