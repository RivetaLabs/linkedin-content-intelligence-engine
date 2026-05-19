import { createPost, listPosts } from "@/lib/db/posts";
import { errorResponse, jsonResponse } from "@/lib/api/response";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const { data, error } = await listPosts({
    source: searchParams.get("source") ?? undefined,
    template: searchParams.get("template") ?? undefined,
    search: searchParams.get("search") ?? undefined,
    limit: parseInt(searchParams.get("limit") || "50"),
    offset: parseInt(searchParams.get("offset") || "0"),
  });
  if (error) return errorResponse(error.message);
  return jsonResponse(data);
}

export async function POST(request: Request) {
  const body = await request.json();
  const { data, error } = await createPost(body);
  if (error) return errorResponse(error.message);
  return jsonResponse(data);
}
