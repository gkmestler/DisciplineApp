"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/", label: "Home" },
  { href: "/habits", label: "Habits" },
  { href: "/log", label: "Log" },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 bg-[#050505]/95 backdrop-blur border-t border-ink-500">
      <div className="max-w-md mx-auto grid grid-cols-3">
        {TABS.map((tab) => {
          const active =
            tab.href === "/" ? pathname === "/" : pathname.startsWith(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`tap py-4 text-center text-xs uppercase tracking-[0.25em] ${
                active ? "text-white" : "text-ink-200"
              }`}
            >
              <span className="relative">
                {tab.label}
                {active && (
                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-white rounded-full" />
                )}
              </span>
            </Link>
          );
        })}
      </div>
      <div className="h-[env(safe-area-inset-bottom)]" />
    </nav>
  );
}
