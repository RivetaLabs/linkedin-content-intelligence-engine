// Shared helper: builds XML context block from GenerationContext
// Used by chat-refine, tip-refine, apply-all, condense prompts
// Enables compliance scan and source-fidelity checking

import type { GenerationContext } from "@/lib/types";

export function buildContextBlock(ctx?: GenerationContext): string {
  if (!ctx) return "";
  const parts = [`<generation_context>`];
  parts.push(`<original_input>${ctx.originalInput}</original_input>`);
  if (ctx.sourceArticle) {
    parts.push(`<source_article>${ctx.sourceArticle}</source_article>`);
  }
  if (ctx.researchContext) {
    parts.push(`<research_context>${ctx.researchContext}</research_context>`);
  }
  parts.push(`<template>${ctx.resolvedTemplate}</template>`);
  parts.push(`<audience>${ctx.resolvedAudience}</audience>`);
  parts.push(`</generation_context>`);
  return parts.join("\n");
}
