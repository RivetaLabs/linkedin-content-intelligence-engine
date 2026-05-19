import { supabase } from "@/lib/supabase";
import { encrypt } from "@/lib/crypto";
import { errorResponse, jsonResponse } from "@/lib/api/response";

export async function GET() {
  const { data, error } = await supabase.from("settings").select("*").single();

  if (error && error.code !== "PGRST116") {
    return errorResponse(error.message);
  }

  if (!data) {
    return jsonResponse({
      has_anthropic_key: !!process.env.ANTHROPIC_API_KEY,
      has_openai_key: !!process.env.OPENAI_API_KEY,
      has_search_key: !!process.env.SEARCH_API_KEY,
      linkedin_profile_url: null,
      default_model: "claude",
      default_target_length: 75,
    });
  }

  return jsonResponse({
    has_anthropic_key:
      !!data.anthropic_api_key_encrypted || !!process.env.ANTHROPIC_API_KEY,
    has_openai_key:
      !!data.openai_api_key_encrypted || !!process.env.OPENAI_API_KEY,
    has_search_key:
      !!data.search_api_key_encrypted || !!process.env.SEARCH_API_KEY,
    linkedin_profile_url: data.linkedin_profile_url,
    default_model: data.default_model,
    default_target_length: data.default_target_length ?? 75,
  });
}

export async function PUT(request: Request) {
  const body = await request.json();
  const updates: Record<string, unknown> = {};

  if (body.anthropic_api_key !== undefined) {
    updates.anthropic_api_key_encrypted = body.anthropic_api_key
      ? await encrypt(body.anthropic_api_key)
      : null;
  }
  if (body.openai_api_key !== undefined) {
    updates.openai_api_key_encrypted = body.openai_api_key
      ? await encrypt(body.openai_api_key)
      : null;
  }
  if (body.search_api_key !== undefined) {
    if (body.search_api_key) {
      updates.search_api_key_encrypted = await encrypt(body.search_api_key);
    } else {
      updates.search_api_key_encrypted = null;
    }
  }
  if (body.linkedin_profile_url !== undefined) {
    updates.linkedin_profile_url = body.linkedin_profile_url;
  }
  if (body.default_model !== undefined) {
    updates.default_model = body.default_model;
  }
  if (body.default_target_length !== undefined) {
    updates.default_target_length = body.default_target_length;
  }

  // Check if settings row exists
  const { data: existing } = await supabase
    .from("settings")
    .select("id")
    .single();

  let result;
  if (existing) {
    result = await supabase
      .from("settings")
      .update(updates)
      .eq("id", existing.id)
      .select()
      .single();
  } else {
    result = await supabase
      .from("settings")
      .insert({
        ...updates,
        password_hash: "initial",
      })
      .select()
      .single();
  }

  if (result.error) {
    return errorResponse(result.error.message);
  }

  return jsonResponse({ success: true });
}
