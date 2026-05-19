/**
 * Unified HTTP response helpers for API routes.
 * Replaces 20+ hand-built Response constructions across 18 route files.
 */

const JSON_HEADERS = {
  "Content-Type": "application/json",
} as const;

export function errorResponse(message: string, status = 500): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: JSON_HEADERS,
  });
}

export function jsonResponse<T>(data: T, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: JSON_HEADERS,
  });
}
