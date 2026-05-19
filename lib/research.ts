// Shared research logic: web search + AI synthesis
// Used by both /api/research (direct) and /api/chat (research intent detection)

import { streamText } from "ai";
import { getModel } from "@/lib/ai/model-factory";
import {
  RESEARCH_PROMPT,
  RESEARCH_FALLBACK_PROMPT,
} from "@/lib/prompts/research/research";
import { getApiKey } from "@/lib/api/get-api-key";
import type { Model } from "@/lib/types";

export async function getSearchApiKey(): Promise<string | null> {
  return getApiKey("SEARCH_API_KEY", "search_api_key_encrypted", {
    required: false,
  });
}

export async function searchWeb(
  query: string,
  apiKey: string,
  depth: "quick" | "deep" = "quick",
): Promise<string> {
  const res = await fetch("https://api.tavily.com/search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      api_key: apiKey,
      query: `${query} LinkedIn thought leadership professional expertise`,
      search_depth: depth === "deep" ? "advanced" : "basic",
      max_results: depth === "deep" ? 8 : 5,
      include_answer: false,
    }),
  });

  if (!res.ok) {
    throw new Error(`Search API error: ${res.status}`);
  }

  const data = await res.json();
  const results = data.results || [];

  return results
    .map(
      (r: { title: string; url: string; content: string }) =>
        `Title: ${r.title}\nURL: ${r.url}\nContent: ${r.content}`,
    )
    .join("\n\n---\n\n");
}

export async function executeResearch(
  query: string,
  model: Model,
  depth: "quick" | "deep",
): Promise<Response> {
  const aiModel = await getModel(model);
  const searchKey = await getSearchApiKey();

  let systemPrompt: string;
  let userPrompt: string;

  if (searchKey) {
    try {
      const searchResults = await searchWeb(query, searchKey, depth);
      systemPrompt = RESEARCH_PROMPT;
      userPrompt = `<search-results>\n${searchResults}\n</search-results>\n\nResearch question: ${query}\nDepth: ${depth}`;
    } catch {
      systemPrompt = RESEARCH_FALLBACK_PROMPT;
      userPrompt = `Research question: ${query}\n\n(Web search was attempted but failed. Answer from training knowledge.)`;
    }
  } else {
    systemPrompt = RESEARCH_FALLBACK_PROMPT;
    userPrompt = `Research question: ${query}`;
  }

  const result = streamText({
    model: aiModel,
    system: systemPrompt,
    prompt: userPrompt,
  });

  return result.toTextStreamResponse();
}
