"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/predict", label: "Predict" },
  { href: "/my-picks", label: "My Picks" },
  { href: "/leaderboard", label: "Leaderboard" }
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-pitch-950/95 px-3 py-2 backdrop-blur md:hidden">
      <div className="mx-auto grid max-w-lg grid-cols-3 gap-2">
        {items.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`rounded-md px-2 py-3 text-center text-sm font-semibold transition ${
                active ? "bg-grass-500 text-pitch-950" : "text-white/75 hover:bg-white/10 hover:text-white"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
