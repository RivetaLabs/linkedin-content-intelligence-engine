"use client";

import { ContentStudioProvider } from "@/lib/contexts/content-studio-context";
import { SettingsProvider } from "@/lib/contexts/settings-context";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SettingsProvider>
      <ContentStudioProvider>{children}</ContentStudioProvider>
    </SettingsProvider>
  );
}
