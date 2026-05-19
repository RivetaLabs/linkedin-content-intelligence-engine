"use client";

import { createContext, useContext } from "react";
import {
  useContentStudio,
  type ContentStudioState,
  type ContentStudioActions,
} from "@/lib/hooks/use-content-studio";

type ContentStudioContextType = ContentStudioState & ContentStudioActions;

const ContentStudioContext = createContext<ContentStudioContextType | null>(
  null,
);

export function ContentStudioProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const studio = useContentStudio();
  return (
    <ContentStudioContext.Provider value={studio}>
      {children}
    </ContentStudioContext.Provider>
  );
}

export function useContentStudioContext(): ContentStudioContextType {
  const ctx = useContext(ContentStudioContext);
  if (!ctx) {
    throw new Error(
      "useContentStudioContext must be used within ContentStudioProvider",
    );
  }
  return ctx;
}
