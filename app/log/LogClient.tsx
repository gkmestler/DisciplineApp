"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import LogRow from "@/components/LogRow";
import type { DisciplineLog } from "@/lib/types";

function formatDateGroup(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const dayStart = new Date(d);
  dayStart.setHours(0, 0, 0, 0);

  if (dayStart.getTime() === today.getTime()) return "Today";
  if (dayStart.getTime() === yesterday.getTime()) return "Yesterday";
  return d.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export default function LogClient({
  initial,
  pageSize,
}: {
  initial: DisciplineLog[];
  pageSize: number;
}) {
  const supabase = createClient();
  const [logs, setLogs] = useState<DisciplineLog[]>(initial);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(initial.length < pageSize);
  const [openId, setOpenId] = useState<string | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (done) return;
    const el = sentinelRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      async (entries) => {
        if (!entries[0].isIntersecting || loading) return;
        setLoading(true);
        const last = logs[logs.length - 1];
        const { data, error } = await supabase
          .from("discipline_logs")
          .select("*")
          .order("logged_at", { ascending: false })
          .lt("logged_at", last.logged_at)
          .limit(pageSize);
        if (error) {
          setLoading(false);
          return;
        }
        const next = (data as DisciplineLog[] | null) ?? [];
        setLogs((prev) => [...prev, ...next]);
        if (next.length < pageSize) setDone(true);
        setLoading(false);
      },
      { rootMargin: "200px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [logs, loading, done, pageSize, supabase]);

  // Group by date
  const groups: { label: string; entries: DisciplineLog[] }[] = [];
  for (const log of logs) {
    const label = formatDateGroup(log.logged_at);
    const last = groups[groups.length - 1];
    if (last && last.label === label) last.entries.push(log);
    else groups.push({ label, entries: [log] });
  }

  return (
    <div className="px-5 pt-8">
      <header className="mb-6">
        <h1
          className="text-4xl font-black uppercase tracking-tight leading-none"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Log
        </h1>
        <p className="text-ink-200 text-sm mt-1">
          Receipts. Swipe left to delete.
        </p>
      </header>

      {logs.length === 0 ? (
        <div className="card-soft p-6 text-center mt-12">
          <p className="text-white text-base mb-1 font-bold">No entries yet.</p>
          <p className="text-ink-200 text-sm">Go do something.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {groups.map((g) => (
            <div key={g.label}>
              <p className="text-[10px] uppercase tracking-widest text-ink-200 mb-2 px-1">
                {g.label}
              </p>
              <div className="card-soft divide-y divide-ink-500 overflow-hidden">
                {g.entries.map((log) => (
                  <LogRow
                    key={log.id}
                    log={log}
                    isOpen={openId === log.id}
                    onOpen={() => setOpenId(log.id)}
                    onClose={() =>
                      setOpenId((prev) => (prev === log.id ? null : prev))
                    }
                    onDeleted={(id) => {
                      setLogs((prev) => prev.filter((l) => l.id !== id));
                      setOpenId((prev) => (prev === id ? null : prev));
                    }}
                  />
                ))}
              </div>
            </div>
          ))}

          {!done && (
            <div ref={sentinelRef} className="py-6 text-center">
              <span className="text-[10px] uppercase tracking-widest text-ink-200">
                {loading ? "Loading..." : ""}
              </span>
            </div>
          )}
          {done && logs.length > 0 && (
            <p className="text-center text-[10px] uppercase tracking-widest text-ink-200 py-6">
              End of log
            </p>
          )}
        </div>
      )}
    </div>
  );
}
