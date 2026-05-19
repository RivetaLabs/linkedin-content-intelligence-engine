"use client";

import { useState, useRef, useCallback } from "react";
import { Search, Zap, BookOpen, ArrowRight, Copy, Check } from "lucide-react";
import { useRouter } from "next/navigation";

interface SearchResult {
  query: string;
  depth: "quick" | "deep";
  content: string;
  timestamp: number;
}

export default function ResearchPage() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [depth, setDepth] = useState<"quick" | "deep">("quick");
  const [streaming, setStreaming] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [currentStream, setCurrentStream] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState<number | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const resultsEndRef = useRef<HTMLDivElement>(null);

  const handleSearch = useCallback(async () => {
    if (!query.trim() || streaming) return;

    setStreaming(true);
    setError("");
    setCurrentStream("");

    abortRef.current = new AbortController();

    try {
      const res = await fetch("/api/research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: query.trim(),
          conversationId: crypto.randomUUID(),
          depth,
          model: "claude",
        }),
        signal: abortRef.current.signal,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Research failed");
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error("No response stream");

      const decoder = new TextDecoder();
      let accumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        accumulated += chunk;
        setCurrentStream(accumulated);
      }

      // Save completed result
      const result: SearchResult = {
        query: query.trim(),
        depth,
        content: accumulated,
        timestamp: Date.now(),
      };

      setResults((prev) => [result, ...prev]);
      setCurrentStream("");
      setQuery("");

      // Scroll to results
      setTimeout(() => {
        resultsEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return;
      setError(err instanceof Error ? err.message : "Research failed");
    } finally {
      setStreaming(false);
      abortRef.current = null;
    }
  }, [query, depth, streaming]);

  function handleWritePost(result: SearchResult) {
    // Store research context in sessionStorage for the create page to pick up
    sessionStorage.setItem(
      "researchContext",
      JSON.stringify({
        query: result.query,
        findings: result.content,
        depth: result.depth,
        timestamp: result.timestamp,
      }),
    );
    router.push("/create?fromResearch=1");
  }

  function handleCopy(content: string, index: number) {
    navigator.clipboard.writeText(content);
    setCopied(index);
    setTimeout(() => setCopied(null), 2000);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSearch();
    }
  }

  return (
    <div className="mx-auto max-w-4xl p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-semibold">Research</h1>
        <p className="mt-1 text-sm text-text-secondary">
          Search for specialized market, domain strategy, and expert insights. Results
          feed directly into post creation.
        </p>
      </div>

      {/* Search Input */}
      <div className="mb-4 rounded-lg border border-border bg-surface p-4">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary"
            />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="What do you want to research? e.g., 'AI adoption trends for small teams'"
              className="w-full rounded-lg border border-border bg-bg py-2.5 pl-10 pr-4 text-sm text-text placeholder-text-secondary outline-none transition-colors focus:border-accent"
              disabled={streaming}
            />
          </div>
          <button
            onClick={handleSearch}
            disabled={streaming || !query.trim()}
            className="flex items-center gap-2 rounded-lg bg-accent px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-hover disabled:opacity-50"
          >
            <Search size={14} />
            {streaming ? "Searching..." : "Search"}
          </button>
        </div>

        {/* Depth Toggle */}
        <div className="mt-3 flex items-center gap-2">
          <span className="text-xs text-text-secondary">Depth:</span>
          <button
            onClick={() => setDepth("quick")}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
              depth === "quick"
                ? "bg-accent text-white"
                : "bg-surface-hover text-text-secondary hover:text-text"
            }`}
            disabled={streaming}
          >
            <Zap size={12} />
            Quick
          </button>
          <button
            onClick={() => setDepth("deep")}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
              depth === "deep"
                ? "bg-accent text-white"
                : "bg-surface-hover text-text-secondary hover:text-text"
            }`}
            disabled={streaming}
          >
            <BookOpen size={12} />
            Deep
          </button>
          <span className="ml-2 text-[11px] text-text-secondary">
            {depth === "quick"
              ? "2-3 paragraph summary"
              : "Structured brief with findings, implications, and data"}
          </span>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 rounded-lg border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
          {error}
        </div>
      )}

      {/* Currently Streaming */}
      {streaming && currentStream && (
        <div className="mb-4 rounded-lg border border-accent/30 bg-accent/5 p-4">
          <div className="mb-2 flex items-center gap-2">
            <div className="h-2 w-2 animate-pulse rounded-full bg-accent" />
            <span className="text-xs font-medium text-accent">
              Researching: {query}
            </span>
          </div>
          <div className="whitespace-pre-wrap text-sm leading-relaxed text-text">
            {currentStream}
          </div>
        </div>
      )}

      {/* Streaming placeholder (before text arrives) */}
      {streaming && !currentStream && (
        <div className="mb-4 rounded-lg border border-border bg-surface p-4">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 animate-pulse rounded-full bg-accent" />
            <span className="text-xs text-text-secondary">
              Searching the web and synthesizing results...
            </span>
          </div>
          <div className="mt-3 space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="h-4 animate-pulse rounded bg-surface-hover"
                style={{ width: `${85 - i * 15}%` }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Results */}
      {results.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-sm font-medium text-text-secondary">
            Results ({results.length})
          </h2>
          {results.map((result, i) => (
            <div
              key={result.timestamp}
              className="rounded-lg border border-border bg-surface p-4"
            >
              {/* Result Header */}
              <div className="mb-3 flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-text">
                    {result.query}
                  </p>
                  <div className="mt-1 flex items-center gap-2">
                    <span
                      className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${
                        result.depth === "deep"
                          ? "bg-purple-500/10 text-purple-400"
                          : "bg-accent/10 text-accent"
                      }`}
                    >
                      {result.depth === "deep" ? "Deep" : "Quick"}
                    </span>
                    <span className="text-[10px] text-text-secondary">
                      {new Date(result.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleCopy(result.content, i)}
                    className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-text-secondary transition-colors hover:bg-surface-hover hover:text-text"
                  >
                    {copied === i ? (
                      <Check size={12} className="text-accent" />
                    ) : (
                      <Copy size={12} />
                    )}
                    {copied === i ? "Copied" : "Copy"}
                  </button>
                  <button
                    onClick={() => handleWritePost(result)}
                    className="flex items-center gap-1.5 rounded-md bg-accent px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-accent-hover"
                  >
                    Write a Post
                    <ArrowRight size={12} />
                  </button>
                </div>
              </div>

              {/* Result Content */}
              <div className="whitespace-pre-wrap text-sm leading-relaxed text-text">
                {result.content}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!streaming && results.length === 0 && (
        <div className="rounded-lg border border-border bg-surface px-8 py-12 text-center">
          <Search size={32} className="mx-auto mb-3 text-text-secondary" />
          <p className="mb-1 text-sm font-medium text-text">
            Research any topic
          </p>
          <p className="text-xs text-text-secondary">
            Search results are enhanced with a subject-matter domain strategy
            lens. Findings can be sent directly to the post creator.
          </p>
        </div>
      )}

      <div ref={resultsEndRef} />
    </div>
  );
}
