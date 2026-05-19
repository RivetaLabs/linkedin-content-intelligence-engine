import { errorResponse } from "@/lib/api/response";

export async function validateBody<T extends Record<string, unknown>>(
  request: Request,
  requiredFields: string[],
): Promise<{ data: T; error: null } | { data: null; error: Response }> {
  let body: T;
  try {
    body = await request.json();
  } catch {
    return { data: null, error: errorResponse("Invalid JSON body", 400) };
  }

  if (!body || typeof body !== "object") {
    return {
      data: null,
      error: errorResponse("Request body must be an object", 400),
    };
  }

  for (const field of requiredFields) {
    if (body[field] === undefined || body[field] === null) {
      return { data: null, error: errorResponse(`${field} required`, 400) };
    }
  }

  return { data: body, error: null };
}
