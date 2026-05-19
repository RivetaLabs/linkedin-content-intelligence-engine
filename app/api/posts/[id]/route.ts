import { deletePost, updatePost } from "@/lib/db/posts";
import { errorResponse, jsonResponse } from "@/lib/api/response";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const { error } = await deletePost(id);
  if (error) return errorResponse(error.message);
  return jsonResponse({ success: true });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await request.json();
  const { data, error } = await updatePost(id, body);
  if (error) return errorResponse(error.message);
  return jsonResponse(data);
}
