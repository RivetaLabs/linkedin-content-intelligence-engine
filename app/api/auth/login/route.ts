import { login } from "@/lib/auth";
import { errorResponse, jsonResponse } from "@/lib/api/response";

export async function POST(request: Request) {
  try {
    const { password } = await request.json();
    if (!password) {
      return errorResponse("Password required", 400);
    }

    await login(password);
    return jsonResponse({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Login failed";
    return errorResponse(message, 401);
  }
}
