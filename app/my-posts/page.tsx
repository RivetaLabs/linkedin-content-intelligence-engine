"use client";

import { useState, useEffect } from "react";
import {
  Copy,
  Check,
  Trash2,
  Search,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import type { Post, Template, PostSource } from "@/lib/types";

const TEMPLATE_LABELS: Record<Template, string> = {
  story: "Story",
  contrarian: "Contrarian",
  framework: "Framework",
  "data-insight": "Data",
  listicle: "Listicle",
  polish: "Polish",
};

export default function MyPostsPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<PostSource | "all">("all");
  const [search, setSearch] = useState("");
  const [templateFilter, setTemplateFilter] = useState<Template | "all">("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchPosts();
    }, 300);
    return () => clearTimeout(timeout);
  }, [tab, templateFilter, search]);

  async function fetchPosts() {
    setLoading(true);
    const params = new URLSearchParams();
    if (tab !== "all") params.set("source", tab);
    if (templateFilter !== "all") params.set("template", templateFilter);
    if (search) params.set("search", search);

    const res = await fetch(`/api/posts?${params}`);
    const data = await res.json();
    setPosts(Array.isArray(data) ? data : []);
    setLoading(false);
  }

  async function handleCopy(content: string, id: string) {
    await navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    fetch(`/api/posts/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ copied_at: new Date().toISOString() }),
    }).catch(() => {});
  }

  async function handleDelete(id: string) {
    if (!window.confirm("Delete this post? This cannot be undone.")) return;
    await fetch(`/api/posts/${id}`, { method: "DELETE" });
    setPosts((prev) => prev.filter((p) => p.id !== id));
  }

  function wordCount(text: string): number {
    return text.split(/\s+/).filter(Boolean).length;
  }

  return (
    <div className="mx-auto max-w-4xl p-6">
      <h1 className="mb-6 text-xl font-semibold">My Posts</h1>

      {/* Tabs */}
      <div className="mb-4 flex gap-2">
        {(["all", "generated", "linkedin"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-lg px-3 py-1.5 text-sm transition-colors ${
              tab === t
                ? "bg-accent text-white"
                : "bg-surface text-text-secondary hover:text-text"
            }`}
          >
            {t === "all" ? "All" : t === "generated" ? "Generated" : "LinkedIn"}
          </button>
        ))}
      </div>

      {/* Search + Filter */}
      <div className="mb-4 flex gap-2">
        <div className="relative flex-1">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search posts..."
            className="w-full rounded-lg border border-border bg-surface py-2 pl-8 pr-3 text-sm text-text outline-none focus:border-accent"
          />
        </div>
        <select
          value={templateFilter}
          onChange={(e) =>
            setTemplateFilter(e.target.value as Template | "all")
          }
          className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text outline-none"
        >
          <option value="all">All Templates</option>
          {Object.entries(TEMPLATE_LABELS).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>
      </div>

      {/* Posts */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="h-24 animate-pulse rounded-lg border border-border bg-surface"
            />
          ))}
        </div>
      ) : posts.length === 0 ? (
        <div className="py-12 text-center text-text-secondary">
          <p>No posts yet. Create your first one.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {posts.map((post) => {
            const expanded = expandedId === post.id;
            const preview = post.generated_content.slice(0, 150);
            const wc = wordCount(post.generated_content);
            return (
              <div
                key={post.id}
                className="rounded-lg border border-border bg-surface"
              >
                <button
                  onClick={() => setExpandedId(expanded ? null : post.id)}
                  className="flex w-full items-start justify-between gap-3 p-4 text-left"
                >
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex items-center gap-2">
                      <span className="rounded bg-surface-hover px-1.5 py-0.5 text-[10px] font-medium uppercase text-text-secondary">
                        {TEMPLATE_LABELS[post.template]}
                      </span>
                      <span className="rounded bg-surface-hover px-1.5 py-0.5 text-[10px] font-medium uppercase text-text-secondary">
                        {post.source}
                      </span>
                      {post.content_score_total !== null && (
                        <span className="text-xs font-mono text-accent">
                          Score: {Number(post.content_score_total).toFixed(1)}/6
                        </span>
                      )}
                      <span className="text-xs text-text-secondary">
                        {wc} words
                      </span>
                    </div>
                    <p className="text-sm text-text">
                      {expanded
                        ? ""
                        : `${preview}${post.generated_content.length > 150 ? "..." : ""}`}
                    </p>
                    <p className="mt-1 text-xs text-text-secondary">
                      {new Date(
                        post.source === "linkedin" && post.posted_at
                          ? post.posted_at
                          : post.created_at,
                      ).toLocaleDateString()}
                      {post.engagement_total
                        ? ` · ${post.engagement_total} engagement`
                        : ""}
                    </p>
                  </div>
                  {expanded ? (
                    <ChevronUp size={16} className="mt-1 text-text-secondary" />
                  ) : (
                    <ChevronDown
                      size={16}
                      className="mt-1 text-text-secondary"
                    />
                  )}
                </button>

                {expanded && (
                  <div className="border-t border-border px-4 pb-4 pt-3">
                    <div className="mb-3 whitespace-pre-wrap text-sm leading-relaxed text-text">
                      {post.generated_content}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() =>
                          handleCopy(post.generated_content, post.id)
                        }
                        className="flex items-center gap-1.5 rounded px-2.5 py-1.5 text-xs text-text-secondary hover:bg-surface-hover hover:text-text"
                      >
                        {copiedId === post.id ? (
                          <Check size={14} />
                        ) : (
                          <Copy size={14} />
                        )}
                        {copiedId === post.id ? "Copied" : "Copy"}
                      </button>
                      {post.source === "generated" && (
                        <button
                          onClick={() => handleDelete(post.id)}
                          className="flex items-center gap-1.5 rounded px-2.5 py-1.5 text-xs text-danger/70 hover:bg-danger/10 hover:text-danger"
                        >
                          <Trash2 size={14} />
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
