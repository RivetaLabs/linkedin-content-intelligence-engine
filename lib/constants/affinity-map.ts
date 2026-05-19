import type { Template } from "@/lib/types";

/**
 * Maps each template to its highest-affinity LinkedIn reaction type.
 * Used for gold standard selection and reaction pattern analysis.
 */
export const TEMPLATE_REACTION_AFFINITY: Record<
  Exclude<Template, "polish">,
  string
> = {
  story: "love",
  contrarian: "insight",
  framework: "insight",
  "data-insight": "insight",
  listicle: "celebrate",
};
