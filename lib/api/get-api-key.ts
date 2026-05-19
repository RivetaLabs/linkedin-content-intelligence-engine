// Shared API key resolver: env-first, then Supabase (encrypted), then throw/null
// Used by model-factory and research to avoid repeated resolution logic.

import { supabase } from "@/lib/supabase";
import { decrypt } from "@/lib/crypto";

export async function getApiKey(
  envName: string,
  supabaseColumn: string,
  options?: { required?: boolean },
): Promise<string | null> {
  const required = options?.required ?? true;

  const envValue = process.env[envName];
  if (envValue) return envValue;

  const { data } = await supabase
    .from("settings")
    .select(supabaseColumn)
    .single();

  const encrypted = data?.[supabaseColumn as keyof typeof data] as
    | string
    | null;
  if (encrypted) {
    return decrypt(encrypted);
  }

  if (required) {
    const friendlyName = envName.replace(/_/g, " ").toLowerCase();
    throw new Error(`No ${friendlyName} configured. Add one in Settings.`);
  }

  return null;
}
