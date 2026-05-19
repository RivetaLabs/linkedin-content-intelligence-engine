// Prompt assembly: combines Layer 1 + Layer 2 + Audience Context + Layer 3 + Gold Standard + Dynamic Examples
// v3: Added article-to-post detection, gold standard injection, token budget monitoring
// Token budget raised from 2000 to 10000 (current total ~3500 with audience + examples)

import { BASE_SYSTEM_PROMPT } from "./core/base-system";
import { VOICE_PROFILE_PROMPT } from "./core/voice-profile";
import { STORY_TEMPLATE_PROMPT } from "@/lib/prompts/templates/story";
import { CONTRARIAN_TEMPLATE_PROMPT } from "@/lib/prompts/templates/contrarian";
import { FRAMEWORK_TEMPLATE_PROMPT } from "@/lib/prompts/templates/framework";
import { DATA_INSIGHT_TEMPLATE_PROMPT } from "@/lib/prompts/templates/data-insight";
import { LISTICLE_TEMPLATE_PROMPT } from "@/lib/prompts/templates/listicle";
import { POLISH_TEMPLATE_PROMPT } from "@/lib/prompts/templates/polish";
import { getAudienceContext } from "./audience/audience";
import { getRelevantExamples, formatExamplesBlock } from "./examples/examples";
import {
  getGoldStandard,
  POLISH_GOLD_STANDARD,
} from "./gold-standards/gold-standards";
import { ARTICLE_TO_POST_PROMPT } from "./article-to-post";
import type { Template, Mode, Audience } from "@/lib/types";

const TEMPLATE_PROMPTS: Record<Exclude<Template, "polish">, string> = {
  story: STORY_TEMPLATE_PROMPT,
  contrarian: CONTRARIAN_TEMPLATE_PROMPT,
  framework: FRAMEWORK_TEMPLATE_PROMPT,
  "data-insight": DATA_INSIGHT_TEMPLATE_PROMPT,
  listicle: LISTICLE_TEMPLATE_PROMPT,
};

export async function assembleSystemPrompt(
  mode: Mode,
  template: Template,
  audience: Audience = "hybrid",
  postIntelligence?: string | null,
  isArticle?: boolean,
  audienceIntelligenceBlock?: string | null,
): Promise<string> {
  const layer1 = BASE_SYSTEM_PROMPT;
  const layer2 = VOICE_PROFILE_PROMPT;

  // Polish mode: no audience context, no dynamic examples, no post intelligence
  if (mode === "polish" || template === "polish") {
    return `${layer1}\n\n${layer2}\n\n${POLISH_TEMPLATE_PROMPT}\n\n${POLISH_GOLD_STANDARD}`;
  }

  // Article mode: article-to-post transformation (no template, no examples, no gold standard)
  if (isArticle) {
    const piBlock = postIntelligence ? `\n\n${postIntelligence}` : "";
    const audienceBlock = getAudienceContext(
      audience,
      audienceIntelligenceBlock,
    );
    return `${layer1}\n\n${layer2}${piBlock}\n\n${audienceBlock}\n\n${ARTICLE_TO_POST_PROMPT}`;
  }

  // Standard mode: 7-layer assembly
  const piBlock = postIntelligence ? `\n\n${postIntelligence}` : "";
  const audienceBlock = getAudienceContext(audience, audienceIntelligenceBlock);
  const examples = getRelevantExamples(
    template as Exclude<Template, "polish">,
    audience,
    3,
  );
  const examplesBlock = formatExamplesBlock(examples);
  const resolvedTemplate = template as Exclude<Template, "polish">;
  const layer3 = TEMPLATE_PROMPTS[resolvedTemplate] || TEMPLATE_PROMPTS.story;
  const goldStandard = await getGoldStandard(resolvedTemplate);

  // Layer order: Base System > Voice Profile > Post Intelligence > Audience Context > Template > Gold Standard > Dynamic Examples
  const assembled = `${layer1}\n\n${layer2}${piBlock}\n\n${audienceBlock}\n\n${layer3}\n\n${goldStandard}\n\n${examplesBlock}`;

  // Token budget monitoring
  const estimatedTokens = Math.ceil(assembled.length / 4);
  if (estimatedTokens > 8000) {
    console.warn(
      `[prompt-assembly] Assembled prompt is ~${estimatedTokens} tokens, exceeds 8000 threshold`,
    );
  }

  return assembled;
}
