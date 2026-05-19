import type { Metadata } from "next";
import "./globals.css";
import { Sidebar } from "@/components/sidebar";
import { Providers } from "@/components/providers";
import { isAuthenticated } from "@/lib/auth";

export const metadata: Metadata = {
  title: "LinkedIn Content Intelligence Engine",
  description: "Public demo of an AI-assisted LinkedIn content workflow",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const authed = await isAuthenticated();

  return (
    <html lang="en">
      <body className="min-h-screen bg-bg text-text antialiased">
        {authed ? (
          <Providers>
            <a
              href="#main-content"
              className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-accent focus:px-4 focus:py-2 focus:text-white"
            >
              Skip to content
            </a>
            <div className="flex h-screen">
              <Sidebar />
              <main id="main-content" className="flex-1 overflow-auto">
                {children}
              </main>
            </div>
          </Providers>
        ) : (
          <main className="min-h-screen">{children}</main>
        )}
      </body>
    </html>
  );
}
