export const runtime = "edge";

import { generateText } from "ai";
import { getClassifierModel } from "@/lib/ai/model-factory";
import {
  COMPLIANCE_SCAN_PROMPT,
  assembleComplianceScanPrompt,
} from "@/lib/prompts/scoring/compliance-scan";
import { extractJson, AiParseError } from "@/lib/api/parse-ai-response";
import { errorResponse, jsonResponse } from "@/lib/api/response";
import type { ComplianceResult } from "@/lib/types";

export async function POST(request: Request) {
  const startTime = Date.now();

  try {
    const { postContent, generationContext } = await request.json();

    if (!postContent) {
      return errorResponse("postContent required", 400);
    }

    const model = await getClassifierModel();
    const userPrompt = assembleComplianceScanPrompt(
      postContent,
      generationContext,
    );

    const { text } = await generateText({
      model,
      system: COMPLIANCE_SCAN_PROMPT,
      prompt: userPrompt,
    });

    let parsed: Omit<ComplianceResult, "scanDurationMs">;
    try {
      parsed = extractJson<Omit<ComplianceResult, "scanDurationMs">>(text);
    } catch (e) {
      return jsonResponse(
        {
          error: "Compliance scan returned invalid JSON",
          raw:
            e instanceof AiParseError
              ? e.rawText.slice(0, 200)
              : text.slice(0, 200),
        },
        502,
      );
    }

    const result: ComplianceResult = {
      ...parsed,
      scanDurationMs: Date.now() - startTime,
    };

    return jsonResponse(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Compliance scan failed";
    return errorResponse(message);
  }
}
