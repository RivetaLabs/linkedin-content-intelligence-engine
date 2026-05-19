import { supabase } from "@/lib/supabase";
import { errorResponse, jsonResponse } from "@/lib/api/response";
import { validateBody } from "@/lib/api/validate-body";

export async function POST(request: Request) {
  const { data: body, error: validationError } = await validateBody<{
    post_id?: string;
    conversation_id?: string;
    version_number: number;
    content: string;
    scores?: Record<string, number>;
    change_description?: string;
  }>(request, ["content", "version_number"]);

  if (validationError) return validationError;

  const {
    post_id,
    conversation_id,
    version_number,
    content,
    scores,
    change_description,
  } = body;

  const word_count = content
    ? content.trim().split(/\s+/).filter(Boolean).length
    : null;

  const { data, error } = await supabase
    .from("post_versions")
    .insert({
      post_id,
      conversation_id,
      version_number,
      content,
      scores,
      word_count,
      change_description,
    })
    .select()
    .single();

  if (error) return errorResponse(error.message);

  // Update post's current_version_id
  if (post_id) {
    const { error: linkError } = await supabase
      .from("posts")
      .update({ current_version_id: data.id })
      .eq("id", post_id);

    if (linkError) {
      console.error("[versions] post link failed:", linkError.message);
    }
  }

  return jsonResponse(data);
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const postId = searchParams.get("post_id");

  if (!postId) return errorResponse("post_id required", 400);

  const { data, error } = await supabase
    .from("post_versions")
    .select("*")
    .eq("post_id", postId)
    .order("version_number", { ascending: true });

  if (error) return errorResponse(error.message);
  return jsonResponse(data);
}
