"use client";

import { useEffect, useState, useTransition } from "react";
import ItemRow from "@/components/ItemRow";
import Swipeable from "@/components/Swipeable";
import AddItemSheet from "@/components/AddItemSheet";
import Toast from "@/components/Toast";
import { deleteItem, demoteToActive, restoreItem } from "@/app/actions";
import type { DisciplineItem } from "@/lib/types";

export default function HabitsClient({
  items: propItems,
}: {
  items: DisciplineItem[];
}) {
  const [items, setItems] = useState<DisciplineItem[]>(propItems);
  const [openId, setOpenId] = useState<string | null>(null);
  const [, setTick] = useState(0);
  const [demotingId, setDemotingId] = useState<string | null>(null);
  const [, startDemote] = useTransition();
  const [editingItem, setEditingItem] = useState<DisciplineItem | null>(null);
  const [recentlyDeleted, setRecentlyDeleted] = useState<DisciplineItem | null>(
    null
  );

  function handleItemUpdate(updated: DisciplineItem) {
    // Habits shows graduated + slipped. If an item transitioned back to
    // active (e.g. second consecutive fail on a slipped item), drop it.
    if (updated.status === "active") {
      setItems((prev) => prev.filter((i) => i.id !== updated.id));
      return;
    }
    setItems((prev) =>
      prev.map((i) => (i.id === updated.id ? updated : i))
    );
  }

  function handleDemote(id: string) {
    setDemotingId(id);
    startDemote(async () => {
      try {
        await demoteToActive(id);
        setItems((prev) => prev.filter((i) => i.id !== id));
      } catch {
        // swallow; user can retry
      } finally {
        setDemotingId(null);
      }
    });
  }

  useEffect(() => {
    setItems((prev) => {
      const merged = prev.map((i) => {
        const fresh = propItems.find((p) => p.id === i.id);
        return fresh ?? i;
      });
      const prevIds = new Set(prev.map((i) => i.id));
      const additions = propItems.filter((p) => !prevIds.has(p.id));
      return [...additions, ...merged];
    });
  }, [propItems]);

  return (
    <div className="px-5 pt-8">
      <header className="mb-6">
        <h1
          className="text-4xl font-black uppercase tracking-tight leading-none"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Habits
        </h1>
        <p className="text-ink-200 text-sm mt-1">Locked in. Don't slip.</p>
      </header>

      {items.length === 0 ? (
        <div className="card-soft p-6 text-center mt-12">
          <p className="text-white text-base mb-1 font-bold">
            Nothing locked in yet.
          </p>
          <p className="text-ink-200 text-sm">Start building.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.id}>
              <div className="flex items-center justify-between mb-2 px-1">
                <div className="flex items-center gap-2">
                  <span
                    className={`text-[9px] uppercase tracking-widest px-1.5 py-0.5 rounded border ${
                      item.status === "slipped"
                        ? "text-accent-loss border-accent-loss/40"
                        : "text-accent-win border-accent-win/40"
                    }`}
                  >
                    {item.status}
                  </span>
                  <span className="text-[10px] uppercase tracking-widest text-ink-200">
                    {item.total_logs} logs
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleDemote(item.id)}
                  disabled={demotingId === item.id}
                  className="tap text-[10px] uppercase tracking-widest text-ink-100 border border-ink-500 px-2 py-1 rounded disabled:opacity-50"
                >
                  {demotingId === item.id ? "..." : "↩ Move back"}
                </button>
              </div>
              <Swipeable
                rounded
                isOpen={openId === item.id}
                onOpen={() => setOpenId(item.id)}
                onClose={() =>
                  setOpenId((prev) => (prev === item.id ? null : prev))
                }
                onDelete={() => deleteItem(item.id)}
                onAfterDelete={() => {
                  setItems((prev) => prev.filter((i) => i.id !== item.id));
                  setOpenId((prev) => (prev === item.id ? null : prev));
                  setRecentlyDeleted(item);
                }}
              >
                <ItemRow
                  item={item}
                  onDelta={() => setTick((t) => t + 1)}
                  onItemUpdate={handleItemUpdate}
                  onEditClick={setEditingItem}
                />
              </Swipeable>
            </div>
          ))}
        </div>
      )}

      {items.length > 0 && (
        <p className="text-[10px] uppercase tracking-widest text-ink-300 text-center mt-4">
          Swipe a row left to delete.
        </p>
      )}

      <AddItemSheet
        open={editingItem !== null}
        onClose={() => setEditingItem(null)}
        editing={editingItem}
      />

      <Toast
        open={recentlyDeleted !== null}
        message={`Deleted "${recentlyDeleted?.name ?? ""}"`}
        actionLabel="Undo"
        onAction={() => {
          if (!recentlyDeleted) return;
          const item = recentlyDeleted;
          setRecentlyDeleted(null);
          setItems((prev) => [item, ...prev]);
          restoreItem(item.id).catch(() => {
            setItems((prev) => prev.filter((i) => i.id !== item.id));
          });
        }}
        onDismiss={() => setRecentlyDeleted(null)}
      />
    </div>
  );
}
