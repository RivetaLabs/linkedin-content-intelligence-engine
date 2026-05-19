"use client";

import { useState, useEffect } from "react";
import { Key, Check, ExternalLink, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";

interface SettingsState {
  has_anthropic_key: boolean;
  has_openai_key: boolean;
  has_search_key: boolean;
  linkedin_profile_url: string | null;
  default_model: string;
  default_target_length: number;
}

export default function SettingsPage() {
  const router = useRouter();
  const [settings, setSettings] = useState<SettingsState | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [anthropicKey, setAnthropicKey] = useState("");
  const [openaiKey, setOpenaiKey] = useState("");
  const [searchKey, setSearchKey] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [targetLength, setTargetLength] = useState(75);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((d) => {
        setSettings(d);
        setLinkedinUrl(d.linkedin_profile_url || "");
        setTargetLength(d.default_target_length ?? 75);
      })
      .finally(() => setLoading(false));
  }, []);

  async function handleSave() {
    setSaving(true);
    setMessage("");

    const body: Record<string, unknown> = {};
    if (anthropicKey) body.anthropic_api_key = anthropicKey;
    if (openaiKey) body.openai_api_key = openaiKey;
    if (searchKey) body.search_api_key = searchKey;
    if (linkedinUrl !== settings?.linkedin_profile_url) {
      body.linkedin_profile_url = linkedinUrl;
    }
    if (targetLength !== settings?.default_target_length) {
      body.default_target_length = targetLength;
    }

    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        setMessage("Settings saved.");
        setAnthropicKey("");
        setOpenaiKey("");
        setSearchKey("");
        // Refresh settings
        const fresh = await fetch("/api/settings").then((r) => r.json());
        setSettings(fresh);
      } else {
        const data = await res.json();
        setMessage(`Error: ${data.error}`);
      }
    } catch {
      setMessage("Failed to save settings.");
    } finally {
      setSaving(false);
    }
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl p-6">
        <h1 className="text-xl font-semibold">Settings</h1>
        <div className="mt-6 space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="h-20 animate-pulse rounded-lg border border-border bg-surface"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl p-6">
      <h1 className="mb-6 text-xl font-semibold">Settings</h1>

      {/* API Keys */}
      <div className="mb-6 space-y-4">
        <h2 className="text-sm font-medium text-text-secondary">API Keys</h2>

        {/* Anthropic */}
        <div className="rounded-lg border border-border bg-surface p-4">
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Key size={14} className="text-text-secondary" />
              <span className="text-sm font-medium">Anthropic (Claude)</span>
              {settings?.has_anthropic_key && (
                <span className="flex items-center gap-1 text-xs text-accent">
                  <Check size={12} /> Active
                </span>
              )}
            </div>
            <a
              href="https://console.anthropic.com/settings/keys"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs text-text-secondary hover:text-accent"
            >
              Get key <ExternalLink size={10} />
            </a>
          </div>
          <p className="mb-2 text-xs text-text-secondary">
            Required for content generation and scoring. Go to
            console.anthropic.com, create an API key, and paste it here.
          </p>
          <input
            type="password"
            value={anthropicKey}
            onChange={(e) => setAnthropicKey(e.target.value)}
            placeholder={
              settings?.has_anthropic_key
                ? "Key saved. Enter new key to replace."
                : "Paste Anthropic API key"
            }
            className="w-full rounded border border-border bg-bg px-3 py-2 text-sm text-text outline-none focus:border-accent"
          />
        </div>

        {/* OpenAI */}
        <div className="rounded-lg border border-border bg-surface p-4">
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Key size={14} className="text-text-secondary" />
              <span className="text-sm font-medium">OpenAI (GPT-4o)</span>
              {settings?.has_openai_key && (
                <span className="flex items-center gap-1 text-xs text-accent">
                  <Check size={12} /> Active
                </span>
              )}
            </div>
            <a
              href="https://platform.openai.com/api-keys"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs text-text-secondary hover:text-accent"
            >
              Get key <ExternalLink size={10} />
            </a>
          </div>
          <p className="mb-2 text-xs text-text-secondary">
            Optional. Enables GPT-4o as an alternative model. Go to
            platform.openai.com, create an API key, and paste it here.
          </p>
          <input
            type="password"
            value={openaiKey}
            onChange={(e) => setOpenaiKey(e.target.value)}
            placeholder={
              settings?.has_openai_key
                ? "Key saved. Enter new key to replace."
                : "Paste OpenAI API key"
            }
            className="w-full rounded border border-border bg-bg px-3 py-2 text-sm text-text outline-none focus:border-accent"
          />
        </div>

        {/* Tavily (Search) */}
        <div className="rounded-lg border border-border bg-surface p-4">
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Key size={14} className="text-text-secondary" />
              <span className="text-sm font-medium">Tavily (Research)</span>
              {settings?.has_search_key && (
                <span className="flex items-center gap-1 text-xs text-accent">
                  <Check size={12} /> Active
                </span>
              )}
            </div>
            <a
              href="https://tavily.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs text-text-secondary hover:text-accent"
            >
              Get key <ExternalLink size={10} />
            </a>
          </div>
          <p className="mb-2 text-xs text-text-secondary">
            Optional. Enables in-app web research for post content. Go to
            tavily.com, create an API key, and paste it here.
          </p>
          <input
            type="password"
            value={searchKey}
            onChange={(e) => setSearchKey(e.target.value)}
            placeholder={
              settings?.has_search_key
                ? "Key saved. Enter new key to replace."
                : "Paste search API key"
            }
            className="w-full rounded border border-border bg-bg px-3 py-2 text-sm text-text outline-none focus:border-accent"
          />
        </div>

      </div>

      {/* LinkedIn URL */}
      <div className="mb-6">
        <h2 className="mb-2 text-sm font-medium text-text-secondary">
          LinkedIn Profile
        </h2>
        <input
          type="url"
          value={linkedinUrl}
          onChange={(e) => setLinkedinUrl(e.target.value)}
          placeholder="https://www.linkedin.com/in/your-profile"
          className="w-full rounded-lg border border-border bg-surface px-4 py-2.5 text-sm text-text outline-none focus:border-accent"
        />
      </div>

      {/* Default Target Length */}
      <div className="mb-6">
        <h2 className="mb-2 text-sm font-medium text-text-secondary">
          Default Post Length
        </h2>
        <p className="mb-3 text-xs text-text-secondary">
          Sets the default condense target when adjusting post length. You can
          always override this per post.
        </p>
        <div className="flex items-center gap-3">
          {[
            { label: "Concise (60%)", value: 60 },
            { label: "Tighter (75%)", value: 75 },
            { label: "Full (100%)", value: 100 },
          ].map((opt) => (
            <button
              key={opt.value}
              onClick={() => setTargetLength(opt.value)}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                targetLength === opt.value
                  ? "bg-accent text-white"
                  : "bg-surface text-text-secondary hover:text-text"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Save */}
      <div className="mb-8 flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={saving}
          className="rounded-lg bg-accent px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-hover disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save Settings"}
        </button>
        {message && (
          <span
            className={`text-sm ${message.startsWith("Error") ? "text-danger" : "text-accent"}`}
          >
            {message}
          </span>
        )}
      </div>

      {/* Logout */}
      <div className="border-t border-border pt-6">
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 text-sm text-text-secondary transition-colors hover:text-danger"
        >
          <LogOut size={14} />
          Sign out
        </button>
      </div>
    </div>
  );
}
