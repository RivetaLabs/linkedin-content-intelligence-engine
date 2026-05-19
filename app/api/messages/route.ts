import { supabase } from "@/lib/supabase";
import { errorResponse, jsonResponse } from "@/lib/api/response";
import { validateBody } from "@/lib/api/validate-body";

export async function POST(request: Request) {
  const { data: body, error: validationError } = await validateBody<{
    conversation_id: string;
    role: string;
    content: string;
    message_type?: string;
    metadata?: Record<string, unknown>;
  }>(request, ["conversation_id", "role", "content"]);

  if (validationError) return validationError;

  const { conversation_id, role, content, message_type, metadata } = body;

  const { data, error } = await supabase
    .from("messages")
    .insert({
      conversation_id,
      role,
      content,
      message_type: message_type || "chat",
      metadata: metadata || {},
    })
    .select()
    .single();

  if (error) return errorResponse(error.message);
  return jsonResponse(data);
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const conversationId = searchParams.get("conversation_id");

  if (!conversationId) return errorResponse("conversation_id required", 400);

  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });

  if (error) return errorResponse(error.message);
  return jsonResponse(data);
}
