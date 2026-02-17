import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Hardwood Flooring Price Comparison",
  description: "Compare hardwood flooring prices across 13 US regions",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-page text-text-primary antialiased">
        <header className="border-b border-border bg-card">
          <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
            <Link href="/" className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent-blue text-white font-bold text-sm">
                HF
              </div>
              <div>
                <h1 className="text-lg font-semibold text-text-primary">
                  Hardwood Flooring Comps
                </h1>
                <p className="text-xs text-text-muted">
                  Price intelligence across 13 US regions
                </p>
              </div>
            </Link>
          </div>
        </header>
        <main>{children}</main>
        <footer className="border-t border-border bg-card mt-12">
          <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
            <p className="text-sm text-text-muted text-center">
              Hardwood Flooring Price Comparison Dashboard &mdash; Market
              intelligence for flooring professionals
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
