"use client";

import { createContext, useContext, useEffect, useState } from "react";

interface SettingsContextType {
  hasAnthropicKey: boolean;
  hasOpenAIKey: boolean;
  hasSearchKey: boolean;
  defaultModel: string;
  loading: boolean;
  refresh: () => void;
}

const SettingsContext = createContext<SettingsContextType | null>(null);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState({
    hasAnthropicKey: false,
    hasOpenAIKey: false,
    hasSearchKey: false,
    defaultModel: "claude",
    loading: true,
  });

  async function fetchSettings() {
    try {
      const res = await fetch("/api/settings");
      if (res.ok) {
        const data = await res.json();
        setSettings({
          hasAnthropicKey: data.has_anthropic_key ?? false,
          hasOpenAIKey: data.has_openai_key ?? false,
          hasSearchKey: data.has_search_key ?? false,
          defaultModel: data.default_model ?? "claude",
          loading: false,
        });
      } else {
        setSettings((s) => ({ ...s, loading: false }));
      }
    } catch {
      setSettings((s) => ({ ...s, loading: false }));
    }
  }

  useEffect(() => {
    fetchSettings();
  }, []);

  return (
    <SettingsContext.Provider value={{ ...settings, refresh: fetchSettings }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettingsContext(): SettingsContextType {
  const ctx = useContext(SettingsContext);
  if (!ctx) {
    throw new Error("useSettingsContext must be used within SettingsProvider");
  }
  return ctx;
}
