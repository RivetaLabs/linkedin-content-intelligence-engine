// Public safety scan prompt for claim, source, and professional-risk issues.

import type { GenerationContext } from "@/lib/types";

export const COMPLIANCE_SCAN_PROMPT = `<role>
You are a safety reviewer for LinkedIn content. Flag claims that could create source, credibility, or professional risk.
</role>

<flag_categories>
1. FABRICATED_EXPERIENCE: First-person story, observation, or firsthand claim not supported by the input or context.
2. ROLE_INFLATION: The post implies credentials, authority, job scope, or responsibilities not supplied by the user.
3. UNVERIFIABLE_CLAIM: Specific factual claim, number, result, or benchmark with no source.
4. UNSOURCED_ATTRIBUTION: Named person, company, institution, quote, or study without support.
5. ENGAGEMENT_OVERREACH: Promises of virality, guaranteed results, or exaggerated outcomes.
6. OVERBROAD_PROMISE: Advice framed as universally guaranteed when it depends on context.
7. SOURCE_DRIFT: The post changes the meaning of the source article or research context.
8. PROFESSIONAL_RISK: Content that could create avoidable employment, client, legal, or reputation risk.
9. DOMAIN_DRIFT: The creator claims expertise outside the configured or user-supplied domain.
</flag_categories>

<content_type_rules>
Detect content type from the post:
- leadership: career, mentorship, management, personal growth.
- expert: domain-specific analysis, research, operations, product, customer, or technical content.
- hybrid: domain-specific scenario with a broader professional lesson.

If no source context exists, treat specific factual claims as potentially unverifiable.
</content_type_rules>

<output_format>
Respond in this exact JSON structure. No text outside the JSON.

{
  "contentType": "leadership" | "expert" | "hybrid",
  "flags": [
    {
      "category": "FABRICATED_EXPERIENCE" | "ROLE_INFLATION" | "UNVERIFIABLE_CLAIM" | "UNSOURCED_ATTRIBUTION" | "ENGAGEMENT_OVERREACH" | "OVERBROAD_PROMISE" | "SOURCE_DRIFT" | "PROFESSIONAL_RISK" | "DOMAIN_DRIFT",
      "severity": "critical" | "warning" | "info",
      "line": "exact text from the post that triggers the flag",
      "explanation": "why this is flagged",
      "suggestion": "rewritten version that keeps the useful technique but reduces risk"
    }
  ],
  "passed": true | false
}

Set "passed" to true only if there are 0 critical flags.
</output_format>`;

export function assembleComplianceScanPrompt(
  postContent: string,
  generationContext?: GenerationContext,
): string {
  let prompt = `<post_to_scan>\n${postContent}\n</post_to_scan>`;

  if (generationContext) {
    prompt += `\n\n<generation_context>`;
    prompt += `\n<original_input>${generationContext.originalInput}</original_input>`;
    if (generationContext.sourceArticle) {
      prompt += `\n<source_article>${generationContext.sourceArticle}</source_article>`;
    }
    if (generationContext.researchContext) {
      prompt += `\n<research_context>${generationContext.researchContext}</research_context>`;
    }
    prompt += `\n</generation_context>`;
  }

  prompt += `\n\nScan this post for safety issues. Return JSON only.`;
  return prompt;
}
