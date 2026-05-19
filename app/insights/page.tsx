"use client";

import { useState, useEffect } from "react";
import type { AggregateStats } from "@/lib/types";
import {
  BarChart3,
  FileText,
  TrendingUp,
  Lightbulb,
  Download,
} from "lucide-react";

const PILLAR_LABELS: Record<string, { label: string; color: string }> = {
  hook: { label: "Hook", color: "bg-rose-500" },
  value: { label: "Value", color: "bg-amber-500" },
  format: { label: "Format", color: "bg-cyan-500" },
  framework: { label: "Framework", color: "bg-purple-500" },
  contrarian: { label: "Contrarian", color: "bg-blue-500" },
  story: { label: "Story", color: "bg-emerald-500" },
};

function findLowestPillar(
  pillarAverages: Record<string, number>,
): { name: string; score: number } | null {
  let lowest: { name: string; score: number } | null = null;
  for (const [name, score] of Object.entries(pillarAverages)) {
    if (!lowest || score < lowest.score) {
      lowest = { name, score };
    }
  }
  return lowest;
}

export default function InsightsPage() {
  const [stats, setStats] = useState<AggregateStats | null>(null);
  const [summary, setSummary] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [topPosts, setTopPosts] = useState<
    { id: string; content: string; engagement: number; contentScore: number }[]
  >([]);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/insights");
        const data = await res.json();
        setStats(data.aggregate_stats);
        setSummary(data.ai_summary);

        // Load top posts
        if (data.aggregate_stats?.top_performers?.length) {
          const postsRes = await fetch("/api/posts?limit=5");
          const posts = await postsRes.json();
          if (Array.isArray(posts)) {
            setTopPosts(
              posts.slice(0, 5).map((p: Record<string, unknown>) => ({
                id: p.id as string,
                content: ((p.generated_content as string) || "").slice(0, 100),
                engagement: (p.engagement_total as number) || 0,
                contentScore: Number(p.content_score_total) || 0,
              })),
            );
          }
        }
      } catch {
        // Non-critical
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const lowestPillar = stats
    ? findLowestPillar(
        stats.pillar_averages as unknown as Record<string, number>,
      )
    : null;

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl space-y-4 p-6">
        <h1 className="text-xl font-semibold">Insights</h1>
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-32 animate-pulse rounded-lg border border-border bg-surface"
          />
        ))}
      </div>
    );
  }

  if (!stats || stats.total_posts === 0) {
    return (
      <div className="mx-auto max-w-4xl p-6">
        <h1 className="mb-6 text-xl font-semibold">Insights</h1>
        <div className="py-12 text-center text-text-secondary">
          <BarChart3 size={48} className="mx-auto mb-3 opacity-40" />
          <p>
            No posts to analyze yet. Start creating posts or import your
            LinkedIn history.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Insights</h1>
        <a
          href="/api/insights/export"
          download
          className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm text-text-secondary transition-colors hover:bg-surface-hover hover:text-text"
        >
          <Download size={14} />
          Export post data
        </a>
      </div>

      {/* Recommendation Card */}
      {lowestPillar && (
        <div className="mb-6 rounded-lg border border-warning/40 bg-warning/10 p-5">
          <div className="mb-3 flex items-center gap-2">
            <TrendingUp size={18} className="text-warning" />
            <span className="text-sm font-medium text-warning">
              Growth opportunity
            </span>
          </div>
          <p className="mb-2 text-sm text-text">
            Your{" "}
            <strong className="capitalize text-warning">
              {lowestPillar.name}
            </strong>{" "}
            score ({lowestPillar.score.toFixed(1)}/6) is your biggest
            opportunity for improvement.
          </p>
          <p className="mb-4 text-xs text-text-secondary">
            Posts with strong {lowestPillar.name.toLowerCase()} elements get
            higher engagement. Try incorporating more{" "}
            {lowestPillar.name.toLowerCase()} techniques in your next post.
          </p>
          <a
            href={`/create?template=${lowestPillar.name.toLowerCase()}`}
            className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
          >
            Create a {lowestPillar.name} post →
          </a>
        </div>
      )}

      {/* Overview Cards */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-lg border border-border bg-surface p-4">
          <div className="flex items-center gap-2 text-text-secondary">
            <FileText size={14} />
            <span className="text-xs">Total Posts</span>
          </div>
          <p className="mt-1 text-2xl font-semibold">{stats.total_posts}</p>
        </div>
        <div className="rounded-lg border border-border bg-surface p-4">
          <div className="flex items-center gap-2 text-text-secondary">
            <TrendingUp size={14} />
            <span className="text-xs">Avg Engagement</span>
          </div>
          <p className="mt-1 text-2xl font-semibold">
            {stats.avg_engagement_total}
          </p>
        </div>
        <div className="rounded-lg border border-border bg-surface p-4">
          <div className="flex items-center gap-2 text-text-secondary">
            <BarChart3 size={14} />
            <span className="text-xs">Avg Score</span>
          </div>
          <p className="mt-1 text-2xl font-semibold text-accent">
            {stats.avg_content_score_total.toFixed(1)}/6
          </p>
        </div>
        <div className="rounded-lg border border-border bg-surface p-4">
          <div className="flex items-center gap-2 text-text-secondary">
            <Lightbulb size={14} />
            <span className="text-xs">LinkedIn Posts</span>
          </div>
          <p className="mt-1 text-2xl font-semibold">
            {stats.source_breakdown.linkedin}
          </p>
        </div>
      </div>

      {/* Pillar Averages */}
      <div className="mb-6 rounded-lg border border-border bg-surface p-4">
        <h2 className="mb-3 text-sm font-medium">
          Score breakdown by engagement factor
        </h2>
        <div className="space-y-3">
          {Object.entries(stats.pillar_averages).map(([key, val]) => {
            const config = PILLAR_LABELS[key];
            const pct = ((val as number) / 6) * 100;
            const isLowest = lowestPillar?.name === key;
            return (
              <div key={key} className="flex items-center gap-3">
                <span
                  className={`w-20 text-xs capitalize ${isLowest ? "font-medium text-warning" : "text-text-secondary"}`}
                >
                  {config?.label || key}
                </span>
                <div className="flex-1">
                  <div className="h-2.5 overflow-hidden rounded-full bg-surface-hover">
                    <div
                      className={`h-full rounded-full transition-all ${config?.color || "bg-accent"}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
                <span
                  className={`w-12 text-right font-mono text-xs ${isLowest ? "text-warning" : "text-text"}`}
                >
                  {(val as number).toFixed(1)}/6
                </span>
                <a
                  href={`/tips/${key}`}
                  className="w-14 text-right text-[11px] text-accent hover:underline"
                >
                  {isLowest ? "Improve →" : "Tips →"}
                </a>
              </div>
            );
          })}
        </div>
      </div>

      {/* Content Type Breakdown */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg border border-border bg-surface p-4">
          <h2 className="mb-3 text-sm font-medium">Posts by template type</h2>
          <div className="space-y-2">
            {Object.entries(stats.template_breakdown).map(
              ([template, count]) => (
                <div
                  key={template}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="capitalize text-text-secondary">
                    {template}
                  </span>
                  <span className="font-mono text-text">{count as number}</span>
                </div>
              ),
            )}
          </div>
        </div>

        <div className="rounded-lg border border-border bg-surface p-4">
          <h2 className="mb-3 text-sm font-medium">Posts by source</h2>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-text-secondary">Generated</span>
              <span className="font-mono text-text">
                {stats.source_breakdown.generated}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-text-secondary">LinkedIn</span>
              <span className="font-mono text-text">
                {stats.source_breakdown.linkedin}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Top 5 Performers */}
      {topPosts.length > 0 && (
        <div className="rounded-lg border border-border bg-surface p-4">
          <h2 className="mb-3 text-sm font-medium">Top 5 Posts</h2>
          <div className="space-y-2">
            {topPosts.map((post, i) => (
              <div
                key={post.id}
                className="flex items-start gap-3 rounded-lg bg-bg p-3"
              >
                <span className="text-xs font-semibold text-accent">
                  #{i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-text">
                    {post.content}...
                  </p>
                  <div className="mt-1 flex gap-3 text-[10px] text-text-secondary">
                    <span>Engagement: {post.engagement}</span>
                    <span>Score: {post.contentScore.toFixed(1)}/6</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AI Summary */}
      {summary && (
        <div className="mt-6 rounded-lg border border-accent/30 bg-accent/5 p-4">
          <h2 className="mb-2 text-sm font-medium text-accent">AI Summary</h2>
          <p className="text-sm leading-relaxed text-text">{summary}</p>
        </div>
      )}
    </div>
  );
}
