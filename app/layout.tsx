import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NewsSynth Studio — Multilingual News Synthesis Platform",
  description:
    "AI-powered multilingual newsroom studio for ingestion, fact extraction, and localized editorial synthesis.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 antialiased selection:bg-blue-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}

