import { supabase } from "@/lib/supabase";
import { errorResponse } from "@/lib/api/response";

export async function GET() {
  const { data: posts, error } = await supabase
    .from("posts")
    .select(
      "id, source, template, generated_content, hook_score, value_score, format_score, framework_score, contrarian_score, story_score, content_score_total, engagement_total, likes, comments, shares, word_count, created_at",
    )
    .order("created_at", { ascending: false });

  if (error) {
    return errorResponse(error.message);
  }

  const headers = [
    "id",
    "source",
    "template",
    "content_preview",
    "hook",
    "value",
    "format",
    "framework",
    "contrarian",
    "story",
    "content_score_total",
    "engagement",
    "likes",
    "comments",
    "shares",
    "word_count",
    "created_at",
  ];

  function escapeCSV(val: string | number | null): string {
    if (val === null || val === undefined) return "";
    const str = String(val);
    if (str.includes(",") || str.includes('"') || str.includes("\n")) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  }

  const rows = (posts ?? []).map((p) => {
    const preview = (p.generated_content || "")
      .slice(0, 100)
      .replace(/\n/g, " ");
    const wc =
      p.word_count ??
      (p.generated_content || "").split(/\s+/).filter(Boolean).length;
    return [
      p.id,
      p.source,
      p.template,
      preview,
      p.hook_score,
      p.value_score,
      p.format_score,
      p.framework_score,
      p.contrarian_score,
      p.story_score,
      p.content_score_total,
      p.engagement_total,
      p.likes,
      p.comments,
      p.shares,
      wc,
      p.created_at,
    ]
      .map(escapeCSV)
      .join(",");
  });

  const csv = [headers.join(","), ...rows].join("\n");

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="lci-engine-posts-${new Date().toISOString().split("T")[0]}.csv"`,
    },
  });
}
