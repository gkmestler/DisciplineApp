"use client";

import Swipeable from "./Swipeable";
import { deleteLog } from "@/app/actions";
import type { DisciplineLog } from "@/lib/types";

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function LogRow({
  log,
  isOpen,
  onOpen,
  onClose,
  onDeleted,
}: {
  log: DisciplineLog;
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
  onDeleted: (id: string) => void;
}) {
  return (
    <Swipeable
      isOpen={isOpen}
      onOpen={onOpen}
      onClose={onClose}
      onDelete={() => deleteLog(log.id)}
      onAfterDelete={() => onDeleted(log.id)}
    >
      <div className="flex items-center justify-between px-4 py-3 cursor-grab active:cursor-grabbing">
        <div className="min-w-0 flex-1 pr-3">
          <p className="text-white truncate text-sm">{log.item_name}</p>
          <p className="text-[10px] uppercase tracking-widest text-ink-200 mt-0.5">
            {formatTime(log.logged_at)}
          </p>
        </div>
        <span
          className={`text-lg font-black tabular-nums ${
            log.points >= 0 ? "text-accent-win" : "text-accent-loss"
          }`}
          style={{ fontFamily: "var(--font-display)" }}
        >
          {log.points > 0 ? `+${log.points}` : log.points}
        </span>
      </div>
    </Swipeable>
  );
}
