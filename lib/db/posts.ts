/**
 * Post data access module.
 * Centralizes all post mutations with generated column stripping baked in.
 *
 * Generated columns (content_score_total, engagement_total) are Postgres computed
 * columns and must never appear in INSERT or UPDATE payloads. Centralizing
 * here makes it structurally impossible to have one mutation path strip and
 * another forget (the Session 19 incident: POST stripped, PATCH did not,
 * 10-day silent breakage).
 */

import { supabase } from "@/lib/supabase";
import type { Post } from "@/lib/types";

function stripForInsert(
  body: Record<string, unknown>,
): Record<string, unknown> {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { content_score_total, engagement_total, id, ...safe } = body;
  return safe;
}

function stripForUpdate(
  body: Record<string, unknown>,
): Record<string, unknown> {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { content_score_total, engagement_total, id, created_at, ...safe } = body;
  return safe;
}

export async function createPost(
  body: Record<string, unknown>,
): Promise<{ data: Post | null; error: { message: string } | null }> {
  const safeBody = stripForInsert(body);
  const { data, error } = await supabase
    .from("posts")
    .insert(safeBody)
    .select()
    .single();
  return { data: data as Post | null, error };
}

export async function updatePost(
  id: string,
  body: Record<string, unknown>,
): Promise<{ data: Post | null; error: { message: string } | null }> {
  const safeBody = stripForUpdate(body);
  const { data, error } = await supabase
    .from("posts")
    .update({ ...safeBody, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();
  return { data: data as Post | null, error };
}

export async function deletePost(
  id: string,
): Promise<{ data: null; error: { message: string } | null }> {
  const { error } = await supabase.from("posts").delete().eq("id", id);
  return { data: null, error };
}

export async function getPost(
  id: string,
): Promise<{ data: Post | null; error: { message: string } | null }> {
  const { data, error } = await supabase
    .from("posts")
    .select("*")
    .eq("id", id)
    .single();
  return { data: data as Post | null, error };
}

export interface ListPostsOptions {
  source?: string;
  template?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

export async function listPosts(
  options: ListPostsOptions = {},
): Promise<{ data: Post[] | null; error: { message: string } | null }> {
  const { source, template, search, limit = 50, offset = 0 } = options;
  let query = supabase
    .from("posts")
    .select("*")
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (source) query = query.eq("source", source);
  if (template) query = query.eq("template", template);
  if (search) query = query.ilike("generated_content", `%${search}%`);

  const { data, error } = await query;
  return { data: data as Post[] | null, error };
}
