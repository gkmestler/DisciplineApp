"use client";

import { useEffect, useState } from "react";
import { quickLog } from "@/app/actions";
import { POINT_VALUES } from "@/lib/discipline";
import type { PointValue } from "@/lib/types";

export default function QuickLogSheet({
  open,
  onClose,
  onLogged,
}: {
  open: boolean;
  onClose: () => void;
  onLogged: (delta: number) => void;
}) {
  const [name, setName] = useState("");
  const [points, setPoints] = useState<PointValue>(1);

  useEffect(() => {
    if (open) {
      setName("");
      setPoints(1);
    }
  }, [open]);

  if (!open) return null;

  function submit(disciplined: boolean) {
    // Optimistic: update score + close sheet synchronously. Server runs in
    // background; on failure, roll the delta back.
    const predicted = disciplined ? points : -points;
    onLogged(predicted);
    const submittedName = name;
    const submittedPoints = points;
    onClose();

    (async () => {
      try {
        const result = await quickLog(submittedName, submittedPoints, disciplined);
        const diff = result.delta - predicted;
        if (diff !== 0) onLogged(diff);
      } catch (e) {
        onLogged(-predicted);
        console.error("quickLog failed:", e);
      }
    })();
  }

  return (
    <div
      className="fixed inset-0 z-40 bg-black/60 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="absolute bottom-0 left-0 right-0 bg-ink-800 border-t border-ink-500 rounded-t-2xl p-6 pb-10 animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="max-w-md mx-auto">
          <div className="mx-auto w-10 h-1 bg-ink-400 rounded-full mb-6" />

          <h2
            className="text-3xl font-black uppercase tracking-tight mb-1"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Quick Log
          </h2>
          <p className="text-ink-200 text-xs mb-6">
            One-off entry. Won't create or affect any discipline.
          </p>

          <label className="block text-[10px] uppercase tracking-widest text-ink-200 mb-2">
            What
          </label>
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="What was it?"
            className="w-full bg-ink-700 border border-ink-500 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-white mb-6"
          />

          <label className="block text-[10px] uppercase tracking-widest text-ink-200 mb-2">
            Weight
          </label>
          <div className="grid grid-cols-4 gap-2 mb-6">
            {POINT_VALUES.map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setPoints(v)}
                className={`tap py-4 rounded-lg border text-2xl font-black active:scale-[0.96] transition-transform duration-75 ease-out ${
                  points === v
                    ? "bg-white text-black border-white"
                    : "bg-ink-700 text-white border-ink-500"
                }`}
                style={{ fontFamily: "var(--font-display)" }}
              >
                {v}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => submit(false)}
              className="tap py-4 rounded-lg bg-ink-700 border border-ink-500 text-accent-loss font-bold uppercase tracking-widest text-xs active:scale-[0.96] transition-transform duration-75 ease-out"
            >
              ✕ Failed
            </button>
            <button
              type="button"
              onClick={() => submit(true)}
              className="tap py-4 rounded-lg bg-ink-700 border border-ink-500 text-accent-win font-bold uppercase tracking-widest text-xs active:scale-[0.96] transition-transform duration-75 ease-out"
            >
              ✓ Disciplined
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
