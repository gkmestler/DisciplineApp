"use client";

import { useState } from "react";
import { logDisciplined, logFailed } from "@/app/actions";
import type { DisciplineItem } from "@/lib/types";

// Mirrors the server logic in app/actions.ts so we can update the score
// synchronously on tap, before the network round-trip resolves.
function predictDelta(item: DisciplineItem, disciplined: boolean): number {
  if (disciplined) return item.points;
  if (item.status === "graduated" || item.status === "slipped") {
    return -2 * item.points;
  }
  return -item.points;
}

export default function ItemRow({
  item,
  onDelta,
  onItemUpdate,
  onGraduationPrompt,
  onEditClick,
}: {
  item: DisciplineItem;
  onDelta: (delta: number) => void;
  onItemUpdate?: (item: DisciplineItem) => void;
  onGraduationPrompt?: (p: {
    itemId: string;
    itemName: string;
    consecutive: number;
  }) => void;
  onEditClick?: (item: DisciplineItem) => void;
}) {
  const [flash, setFlash] = useState<{ type: "win" | "loss"; id: number } | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);

  function handle(disciplined: boolean) {
    setError(null);

    // Synchronous optimistic update — fires this same frame.
    const predicted = predictDelta(item, disciplined);
    onDelta(predicted);
    setFlash((prev) => ({
      type: disciplined ? "win" : "loss",
      id: (prev?.id ?? 0) + 1,
    }));

    // Fire-and-forget server write. Reconcile or roll back on resolve.
    (async () => {
      try {
        const result = disciplined
          ? await logDisciplined(item.id)
          : await logFailed(item.id);
        const diff = result.delta - predicted;
        if (diff !== 0) onDelta(diff);
        onItemUpdate?.(result.item);
        if (result.graduationPrompt && onGraduationPrompt) {
          onGraduationPrompt(result.graduationPrompt);
        }
      } catch (e: any) {
        onDelta(-predicted);
        setError(e?.message ?? "Failed.");
      }
    })();
  }

  const isSlipped = item.status === "slipped";

  return (
    <div className="card-soft relative overflow-hidden px-4 py-3">
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="text-white font-medium truncate">{item.name}</p>
            {isSlipped && (
              <span className="text-[9px] uppercase tracking-widest text-accent-loss border border-accent-loss/40 px-1.5 py-0.5 rounded">
                Slipped
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 mt-0.5">
            <span className="text-xs text-ink-200">
              {item.points} pt{item.points === 1 ? "" : "s"}
            </span>
            <span className="text-xs text-ink-200">·</span>
            <span className="text-xs text-ink-200">
              {item.consecutive_wins} streak
            </span>
          </div>
        </div>
        {onEditClick && (
          <button
            type="button"
            onClick={() => onEditClick(item)}
            className="tap text-[10px] uppercase tracking-widest text-ink-200 hover:text-white px-2 py-1 border border-ink-500 rounded active:scale-95 transition-transform duration-75 ease-out"
          >
            Edit
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => handle(false)}
          className="tap py-3 rounded-lg bg-ink-700 border border-ink-500 text-accent-loss font-bold uppercase tracking-widest text-xs active:scale-[0.96] transition-transform duration-75 ease-out will-change-transform"
        >
          ✕ Failed
        </button>
        <button
          type="button"
          onClick={() => handle(true)}
          className="tap py-3 rounded-lg bg-ink-700 border border-ink-500 text-accent-win font-bold uppercase tracking-widest text-xs active:scale-[0.96] transition-transform duration-75 ease-out will-change-transform"
        >
          ✓ Locked
        </button>
      </div>

      {error && <p className="text-accent-loss text-xs mt-2">{error}</p>}

      {flash && (
        <div
          key={flash.id}
          className={`absolute inset-0 pointer-events-none ${
            flash.type === "win" ? "animate-flash-win" : "animate-flash-loss"
          }`}
        />
      )}
    </div>
  );
}
