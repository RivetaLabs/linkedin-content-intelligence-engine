import { supabase } from "@/lib/supabase";
import { errorResponse, jsonResponse } from "@/lib/api/response";
import { validateBody } from "@/lib/api/validate-body";

export async function POST(request: Request) {
  const { data: body, error: validationError } = await validateBody<{
    post_id?: string;
  }>(request, []);

  if (validationError) return validationError;

  const { post_id } = body;

  const { data, error } = await supabase
    .from("conversations")
    .insert({ post_id })
    .select()
    .single();

  if (error) return errorResponse(error.message);

  // Link conversation to post
  if (post_id) {
    const { error: linkError } = await supabase
      .from("posts")
      .update({ conversation_id: data.id })
      .eq("id", post_id);

    if (linkError) {
      console.error("[conversations] post link failed:", linkError.message);
    }
  }

  return jsonResponse(data);
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const postId = searchParams.get("post_id");

  if (!postId) return errorResponse("post_id required", 400);

  const { data, error } = await supabase
    .from("conversations")
    .select("*")
    .eq("post_id", postId)
    .single();

  if (error) return errorResponse(error.message, 404);
  return jsonResponse(data);
}
