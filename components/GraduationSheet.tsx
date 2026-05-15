"use client";

import { useTransition } from "react";
import { graduateItem } from "@/app/actions";

export default function GraduationSheet({
  itemId,
  itemName,
  consecutive,
  onClose,
  onGraduated,
}: {
  itemId: string;
  itemName: string;
  consecutive: number;
  onClose: () => void;
  onGraduated?: (itemId: string) => void;
}) {
  const [pending, startTransition] = useTransition();

  function onGraduate() {
    startTransition(async () => {
      await graduateItem(itemId);
      onGraduated?.(itemId);
      onClose();
    });
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/70 animate-fade-in" onClick={onClose}>
      <div
        className="absolute bottom-0 left-0 right-0 bg-ink-800 border-t border-ink-500 rounded-t-2xl p-6 pb-10 animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="max-w-md mx-auto">
          <div className="mx-auto w-10 h-1 bg-ink-400 rounded-full mb-6" />
          <p className="text-[10px] uppercase tracking-widest text-accent-win mb-2">
            Streak Locked
          </p>
          <h2
            className="text-3xl font-black uppercase tracking-tight mb-2 leading-none"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {itemName}
          </h2>
          <p className="text-ink-100 mb-8 leading-relaxed">
            You've done this <span className="text-white font-bold">{consecutive}</span>{" "}
            times in a row. Is this a habit now?
          </p>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={onClose}
              className="tap py-4 rounded-lg border border-ink-500 text-ink-100 uppercase tracking-widest text-xs"
              disabled={pending}
            >
              Not Yet
            </button>
            <button
              onClick={onGraduate}
              disabled={pending}
              className="tap py-4 rounded-lg bg-accent-win text-black font-bold uppercase tracking-widest text-xs disabled:opacity-50"
            >
              {pending ? "..." : "Graduate It"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
