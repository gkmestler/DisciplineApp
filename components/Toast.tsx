"use client";

import { useEffect } from "react";

export default function Toast({
  open,
  message,
  actionLabel,
  onAction,
  onDismiss,
  duration = 5000,
}: {
  open: boolean;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  onDismiss: () => void;
  duration?: number;
}) {
  useEffect(() => {
    if (!open) return;
    const t = setTimeout(onDismiss, duration);
    return () => clearTimeout(t);
  }, [open, duration, onDismiss]);

  if (!open) return null;

  return (
    <div className="fixed bottom-20 left-0 right-0 z-40 px-4 pointer-events-none">
      <div className="max-w-md mx-auto pointer-events-auto">
        <div className="bg-ink-700 border border-ink-500 rounded-lg px-4 py-3 flex items-center justify-between gap-3 shadow-lg animate-slide-up">
          <span className="text-white text-sm truncate flex-1">{message}</span>
          {actionLabel && onAction && (
            <button
              type="button"
              onClick={onAction}
              className="tap shrink-0 text-xs uppercase tracking-widest text-white font-bold px-3 py-1 border border-ink-500 rounded active:scale-95 transition-transform duration-75 ease-out"
            >
              {actionLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
