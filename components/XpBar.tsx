"use client";

import { xpProgress } from "@/lib/discipline";

export default function XpBar({ xp }: { xp: number }) {
  const p = xpProgress(xp);
  const pct = Math.round(p.ratio * 100);
  return (
    <div className="mt-2">
      <div className="h-1.5 bg-ink-600 rounded overflow-hidden">
        <div
          className="h-full bg-white transition-all duration-700 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="flex justify-between text-[10px] uppercase tracking-widest text-ink-200 mt-2">
        <span>{p.prevThreshold}</span>
        <span>{p.capped ? "MAX" : p.nextThreshold}</span>
      </div>
    </div>
  );
}
