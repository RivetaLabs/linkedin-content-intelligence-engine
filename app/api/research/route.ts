// Research route: web search synthesis with subject-matter lens
// Edge Runtime for streaming. Fallback to Claude knowledge if no search key.

import { executeResearch } from "@/lib/research";
import { errorResponse } from "@/lib/api/response";
import type { ResearchRequest } from "@/lib/types";

export const runtime = "edge";
export const maxDuration = 30;

export async function POST(request: Request) {
  try {
    const body: ResearchRequest = await request.json();
    const { query, model, depth } = body;

    if (!query?.trim()) {
      return errorResponse("Research query is required", 400);
    }

    return await executeResearch(query, model, depth);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Research failed";
    return errorResponse(message);
  }
}
