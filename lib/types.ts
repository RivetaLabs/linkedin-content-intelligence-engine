// TypeScript types derived from Supabase schema (lib/database.types.ts)
import type { Database } from "./database.types";

export type Template =
  | "story"
  | "contrarian"
  | "framework"
  | "data-insight"
  | "listicle"
  | "polish";
export type Model = "claude" | "gpt4o";
export type Mode = "create" | "polish";
export type PostSource = "generated" | "linkedin";
export type ImageStyle = "photo" | "graphic" | "scene" | "auto";
export type ImageModel = "flash" | "pro";
export type Audience = "expert" | "leadership" | "hybrid";

// Template value for API requests (allows "auto" for classifier detection)
export type TemplateOrAuto = Template | "auto";
export type AudienceOrAuto = Audience | "auto";

export interface ClassifierResponse {
  template: Exclude<Template, "polish">;
  audience: Audience;
}

// Normalized reaction breakdown from LinkedIn
export interface ReactionBreakdown {
  like: number;
  support: number;
  love: number;
  insight: number;
  celebrate: number;
  funny: number;
}

// Reaction percentages (each type / total)
export interface ReactionProfile {
  like: number;
  love: number;
  insight: number;
  support: number;
  celebrate: number;
  funny: number;
}

type PostRow = Database["public"]["Tables"]["posts"]["Row"];

export interface Post extends Omit<
  PostRow,
  | "template"
  | "model"
  | "mode"
  | "source"
  | "audience"
  | "reaction_breakdown"
  | "score_explanation"
  | "scoring_tips"
  | "compliance_results"
> {
  template: Template;
  model: Model;
  mode: Mode;
  source: PostSource;
  audience: Audience | null;
  reaction_breakdown: ReactionBreakdown | null;
  score_explanation: ScoreExplanation | null;
  scoring_tips: string[] | null;
  compliance_results: ComplianceResult | null;
}

export type PostInsert = Database["public"]["Tables"]["posts"]["Insert"];
export type PostUpdate = Database["public"]["Tables"]["posts"]["Update"];

export interface ScoreExplanation {
  hook: string;
  value: string;
  format: string;
  framework: string;
  contrarian: string;
  story: string;
  overall: string;
}

type SettingsRow = Database["public"]["Tables"]["settings"]["Row"];

export interface Settings extends Omit<SettingsRow, "default_model"> {
  default_model: Model;
}

type InsightsCacheRow = Database["public"]["Tables"]["insights_cache"]["Row"];

export interface InsightsCache extends Omit<
  InsightsCacheRow,
  "aggregate_stats" | "ai_summary" | "suggested_next"
> {
  aggregate_stats: AggregateStats;
  ai_summary: string | null;
  suggested_next: SuggestedAction[];
}

export interface AggregateStats {
  total_posts: number;
  avg_content_score_total: number;
  avg_engagement_total: number;
  pillar_averages: PillarAverages;
  template_breakdown: Record<Template, number>;
  top_performers: string[]; // post IDs
  source_breakdown: { generated: number; linkedin: number };
}

export interface PillarAverages {
  hook: number;
  value: number;
  format: number;
  framework: number;
  contrarian: number;
  story: number;
}

export interface SuggestedAction {
  title: string;
  description: string;
  priority: "high" | "medium" | "low";
}

// Post Intelligence types (injected into prompts from real post data)

export interface PostIntelligenceData {
  aggregate: {
    totalPosts: number;
    avgScore: number;
    primaryPillarAvg: number;
    weakestPillar: { name: string; score: number };
    optimalWordRange: [number, number];
    reactionPatterns?: {
      avgProfile: ReactionProfile;
      templateTargets: Record<
        string,
        { targetReaction: string; avgPercent: number }
      >;
    };
  };
  examples: CuratedExample[];
}

export interface CuratedExample {
  role: "top_performer" | "sleeper_hit" | "anti_pattern";
  score: number;
  engagement: number;
  contentPreview: string;
  dominantReaction?: string;
  dominantReactionPercent?: number;
}

// Image generation types

export interface GenerateImageRequest {
  postContent: string;
  style: ImageStyle;
  model: ImageModel;
  pillarScores?: ScoreResponse;
  template?: Template;
  audience?: Audience;
}

export interface GenerateImageResponse {
  image: string;
  mimeType: string;
  style: ImageStyle;
  model: ImageModel;
}

export interface ReferenceImage {
  mimeType: string;
  data: string; // base64 encoded
}

// === v2: Iterative Content Studio Types ===

export type MessageRole = "user" | "assistant" | "system";
export type MessageType =
  | "chat"
  | "tip_apply"
  | "condense"
  | "research"
  | "deep_research"
  | "hook_variation"
  | "framework_build";

type ConversationRow = Database["public"]["Tables"]["conversations"]["Row"];
export type Conversation = ConversationRow;

type MessageRow = Database["public"]["Tables"]["messages"]["Row"];

export interface Message extends Omit<MessageRow, "metadata"> {
  metadata: Record<string, unknown> | null;
}

type PostVersionRow = Database["public"]["Tables"]["post_versions"]["Row"];

export interface PostVersion extends Omit<PostVersionRow, "scores"> {
  scores: Record<string, number> | null;
}

// Structured scoring tip (v2 replaces string[] tips)
export interface ScoringTip {
  id: string; // e.g. "tip-hook-1"
  pillar: keyof ScoreResponse["scores"];
  technique: string; // direct-response copywriting technique name (e.g. "You Pivot", "PPE", "Show the Math")
  instruction: string; // Full actionable instruction
  section?: "hook" | "meat" | "cta"; // Which post section this applies to
  reactionDriver?:
    | "love"
    | "insight"
    | "support"
    | "celebrate"
    | "comments"
    | null;
}

// Generation context passed through all refinement routes for compliance + source fidelity
export interface GenerationContext {
  originalInput: string;
  sourceArticle: string | null;
  researchContext: string | null;
  resolvedTemplate: string;
  resolvedAudience: string;
}

// Compliance scan types
export type ComplianceFlagCategory =
  | "FABRICATED_EXPERIENCE"
  | "ROLE_INFLATION"
  | "UNVERIFIABLE_CLAIM"
  | "UNSOURCED_ATTRIBUTION"
  | "ENGAGEMENT_OVERREACH"
  | "OVERBROAD_PROMISE"
  | "SOURCE_DRIFT"
  | "PROFESSIONAL_RISK"
  | "DOMAIN_DRIFT";

export interface ComplianceFlag {
  category: ComplianceFlagCategory;
  severity: "critical" | "warning" | "info";
  line: string;
  explanation: string;
  suggestion: string;
}

export type ComplianceContentType = "leadership" | "expert" | "hybrid";

export interface ComplianceResult {
  flags: ComplianceFlag[];
  contentType: ComplianceContentType;
  scanDurationMs: number;
  passed: boolean;
  userActions?: Record<number, "accepted" | "dismissed">;
}

export interface ComplianceRequest {
  postContent: string;
  generationContext?: GenerationContext;
}

// Chat API request
export interface ChatRequest {
  conversationId: string;
  currentPost: string;
  messages: Pick<Message, "role" | "content">[];
  instruction: string;
  model: Model;
  generationContext?: GenerationContext;
}

// Refine API request (tip apply, condense, hook variation, framework build)
export type RefineType =
  | "tip_apply"
  | "condense"
  | "hook_variation"
  | "framework_build"
  | "apply_all";

export interface RefineRequest {
  conversationId: string;
  currentPost: string;
  refineType: RefineType;
  instruction: string; // The specific tip or condense instruction
  model: Model;
  metadata?: Record<string, unknown>; // e.g. { tipId: "tip-hook-1", targetPercent: 75 }
  generationContext?: GenerationContext;
}

// Research API request
export interface ResearchRequest {
  query: string;
  conversationId: string;
  currentPost?: string; // optional context
  depth: "quick" | "deep";
  model: Model;
}

// API request/response types

export interface GenerateRequest {
  mode: Mode;
  template: TemplateOrAuto;
  input: string;
  model: Model;
  audience?: AudienceOrAuto;
  researchContext?: string;
  researchAngle?: string;
}

export interface ScoreRequest {
  content: string;
}

export interface ScoreResponse {
  scores: {
    hook: number;
    value: number;
    format: number;
    framework: number;
    contrarian: number;
    story: number;
  };
  weighted_total: number;
  explanation: ScoreExplanation;
  tips: ScoringTip[];
}

// === v3: Framework Builder, Hook Variations, Apply-All, Condense Types ===

// v3: Framework builder response
export interface FrameworkOption {
  name: string;
  type: "acronym" | "metaphor" | "number_outcome";
  steps: string[];
  integrationPreview: string;
}

export interface FrameworkBuilderResponse {
  options: FrameworkOption[];
  postContext: string;
}

// v3: Hook variation response
export interface HookVariation {
  hook: string;
  category:
    | "statement"
    | "command"
    | "question"
    | "narrative"
    | "label"
    | "conditional"
    | "exclamation";
  bucket: "proven" | "adjacent" | "experimental";
}

// v3: Apply-all request
export interface ApplyAllRequest {
  conversationId?: string;
  currentPost: string;
  tips: ScoringTip[];
  model: Model;
}

// v3: Condense request
export interface CondenseRequest {
  conversationId?: string;
  currentPost: string;
  targetPercent: number;
  currentScores?: ScoreResponse["scores"];
  model: Model;
}

// Template metadata for UI
export interface TemplateInfo {
  id: Template;
  name: string;
  description: string;
  icon: string;
  placeholder: string;
}
