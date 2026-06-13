import type { Metadata } from "next";
import Link from "next/link";
import { MobileNav } from "@/components/MobileNav";
import "./globals.css";

export const metadata: Metadata = {
  title: "World Cup Predictor League",
  description: "Private friends-only World Cup predictor game"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <header className="border-b border-white/10 bg-pitch-950/90 backdrop-blur">
          <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
            <Link href="/predict" className="text-base font-black tracking-wide text-white">
              World Cup Predictor League
            </Link>
            <nav className="hidden items-center gap-2 md:flex">
              <Link className="nav-link" href="/predict">
                Predict
              </Link>
              <Link className="nav-link" href="/my-picks">
                My Picks
              </Link>
              <Link className="nav-link" href="/leaderboard">
                Leaderboard
              </Link>
              <Link className="nav-link" href="/admin">
                Admin
              </Link>
            </nav>
          </div>
        </header>
        <main className="mx-auto min-h-[calc(100vh-73px)] max-w-5xl px-4 py-6 pb-28 md:pb-10">{children}</main>
        <MobileNav />
      </body>
    </html>
  );
}
