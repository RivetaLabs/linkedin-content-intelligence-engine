"use client";

import { Copy, Check, RefreshCw, Pencil, MoreHorizontal } from "lucide-react";
import { useState } from "react";

function VersionTabs({
  versionInfo,
  onVersionChange,
}: {
  versionInfo: { current: number; total: number };
  onVersionChange: (version: number) => void;
}) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const { current, total } = versionInfo;

  const maxVisible = 4;
  const showDropdown = total > maxVisible + 1;
  const visibleCount = showDropdown ? maxVisible : total;

  const visibleVersions = Array.from({ length: visibleCount }, (_, i) => i + 1);
  const hiddenVersions = showDropdown
    ? Array.from({ length: total - maxVisible }, (_, i) => i + maxVisible + 1)
    : [];

  return (
    <div className="relative flex items-center gap-0.5">
      {visibleVersions.map((v) => (
        <button
          key={v}
          onClick={() => onVersionChange(v)}
          aria-label={`v${v}`}
          aria-pressed={current === v}
          className={`min-h-[28px] min-w-[32px] rounded px-2 py-1 text-xs font-medium transition-colors ${
            current === v
              ? "bg-accent text-white"
              : "text-text-secondary hover:bg-surface-hover hover:text-text"
          }`}
        >
          v{v}
        </button>
      ))}

      {showDropdown && (
        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            aria-label="More versions"
            className={`min-h-[28px] min-w-[32px] rounded px-2 py-1 text-xs transition-colors ${
              hiddenVersions.includes(current)
                ? "bg-accent text-white"
                : "text-text-secondary hover:bg-surface-hover hover:text-text"
            }`}
          >
            <MoreHorizontal size={14} />
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 top-full z-10 mt-1 rounded-lg border border-border bg-surface py-1 shadow-lg">
              {hiddenVersions.map((v) => (
                <button
                  key={v}
                  onClick={() => {
                    onVersionChange(v);
                    setDropdownOpen(false);
                  }}
                  className={`block w-full px-3 py-1.5 text-left text-xs transition-colors ${
                    current === v
                      ? "bg-accent/10 text-accent"
                      : "text-text-secondary hover:bg-surface-hover hover:text-text"
                  }`}
                >
                  v{v}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface Props {
  content: string;
  streaming?: boolean;
  onRetry?: () => void;
  onEdit?: (content: string) => void;
  wordCount?: number;
  versionInfo?: { current: number; total: number };
  onVersionChange?: (version: number) => void;
  savedPostId?: string | null;
}

export function PostOutput({
  content,
  streaming,
  onRetry,
  onEdit,
  wordCount,
  versionInfo,
  onVersionChange,
  savedPostId,
}: Props) {
  const [copied, setCopied] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState(content);

  async function handleCopy() {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);

    // v4: Track copied_at to signal intent to publish
    if (savedPostId) {
      fetch(`/api/posts/${savedPostId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ copied_at: new Date().toISOString() }),
      }).catch(() => {
        // Non-critical
      });
    }
  }

  function handleSaveEdit() {
    onEdit?.(editContent);
    setEditing(false);
  }

  if (!content) return null;

  const displayWordCount =
    wordCount ?? content.trim().split(/\s+/).filter(Boolean).length;

  return (
    <div className="rounded-lg border border-border bg-surface">
      {/* Content */}
      <div className="p-4">
        {editing ? (
          <textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            className="min-h-[200px] w-full resize-y rounded border border-border bg-bg p-3 text-sm text-text outline-none focus:border-accent"
          />
        ) : (
          <div className="whitespace-pre-wrap text-sm leading-relaxed text-text">
            {content}
            {streaming && (
              <span className="ml-0.5 inline-block h-4 w-0.5 animate-pulse bg-accent" />
            )}
          </div>
        )}
      </div>

      {/* Actions */}
      {!streaming && (
        <div className="flex items-center justify-between border-t border-border px-4 py-2.5">
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 rounded px-2.5 py-1.5 text-xs text-text-secondary transition-colors hover:bg-surface-hover hover:text-text"
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
              {copied ? "Copied" : "Copy"}
            </button>

            {onRetry && (
              <button
                onClick={onRetry}
                className="flex items-center gap-1.5 rounded px-2.5 py-1.5 text-xs text-text-secondary transition-colors hover:bg-surface-hover hover:text-text"
              >
                <RefreshCw size={14} />
                Try Again
              </button>
            )}

            {onEdit && !editing && (
              <button
                onClick={() => {
                  setEditContent(content);
                  setEditing(true);
                }}
                className="flex items-center gap-1.5 rounded px-2.5 py-1.5 text-xs text-text-secondary transition-colors hover:bg-surface-hover hover:text-text"
              >
                <Pencil size={14} />
                Edit
              </button>
            )}

            {editing && (
              <>
                <button
                  onClick={handleSaveEdit}
                  className="flex items-center gap-1.5 rounded bg-accent px-2.5 py-1.5 text-xs text-white"
                >
                  Save Edit
                </button>
                <button
                  onClick={() => setEditing(false)}
                  className="rounded px-2.5 py-1.5 text-xs text-text-secondary hover:text-text"
                >
                  Cancel
                </button>
              </>
            )}
          </div>

          {/* Word count + Version indicator */}
          <div className="flex items-center gap-3">
            {versionInfo && onVersionChange && versionInfo.total > 1 && (
              <VersionTabs
                versionInfo={versionInfo}
                onVersionChange={onVersionChange}
              />
            )}
            <span className="text-[10px] text-text-secondary">
              {displayWordCount} words
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
