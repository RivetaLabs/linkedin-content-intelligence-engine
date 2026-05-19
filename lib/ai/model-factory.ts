// Shared model factory for all AI routes
// Extracts duplicated getAnthropicKey/getModel from generate + score routes

import { type LanguageModel } from "ai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createOpenAI } from "@ai-sdk/openai";
import { getApiKey } from "@/lib/api/get-api-key";
import type { Model } from "@/lib/types";

export async function getAnthropicKey(): Promise<string> {
  return (await getApiKey("ANTHROPIC_API_KEY", "anthropic_api_key_encrypted"))!;
}

export async function getModel(model: Model): Promise<LanguageModel> {
  if (model === "claude") {
    const key = await getAnthropicKey();
    const anthropic = createAnthropic({ apiKey: key });
    return anthropic("claude-sonnet-4-5-20250929");
  } else {
    const key = (await getApiKey(
      "OPENAI_API_KEY",
      "openai_api_key_encrypted",
    ))!;
    const openai = createOpenAI({ apiKey: key });
    return openai("gpt-4o");
  }
}

export async function getAnthropicScoringModel(): Promise<LanguageModel> {
  const key = await getAnthropicKey();
  const anthropic = createAnthropic({ apiKey: key });
  return anthropic("claude-sonnet-4-5-20250929");
}

export async function getClassifierModel(): Promise<LanguageModel> {
  const key = await getAnthropicKey();
  const anthropic = createAnthropic({ apiKey: key });
  return anthropic("claude-haiku-4-5-20251001");
}
