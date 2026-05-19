import { logout } from "@/lib/auth";
import { jsonResponse } from "@/lib/api/response";

export async function POST() {
  await logout();
  return jsonResponse({ success: true });
}
