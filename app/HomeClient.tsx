"use client";

import { useEffect, useState } from "react";
import AnimatedNumber from "@/components/AnimatedNumber";
import XpBar from "@/components/XpBar";
import ItemRow from "@/components/ItemRow";
import AddItemSheet from "@/components/AddItemSheet";
import QuickLogSheet from "@/components/QuickLogSheet";
import GraduationSheet from "@/components/GraduationSheet";
import Swipeable from "@/components/Swipeable";
import Toast from "@/components/Toast";
import { deleteItem, restoreItem } from "@/app/actions";
import type { DisciplineItem } from "@/lib/types";

export default function HomeClient({
  items: propItems,
  initialDailyScore,
  initialLifetimeXp,
}: {
  items: DisciplineItem[];
  initialDailyScore: number;
  initialLifetimeXp: number;
}) {
  const [items, setItems] = useState<DisciplineItem[]>(propItems);
  const [dailyScore, setDailyScore] = useState(initialDailyScore);
  const [lifetimeXp, setLifetimeXp] = useState(initialLifetimeXp);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<DisciplineItem | null>(null);
  const [quickOpen, setQuickOpen] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const [recentlyDeleted, setRecentlyDeleted] = useState<DisciplineItem | null>(
    null
  );

  function openCreate() {
    setEditingItem(null);
    setSheetOpen(true);
  }
  function openEdit(item: DisciplineItem) {
    setEditingItem(item);
    setSheetOpen(true);
  }
  function closeSheet() {
    setSheetOpen(false);
    setEditingItem(null);
  }
  const [gradPrompt, setGradPrompt] = useState<{
    itemId: string;
    itemName: string;
    consecutive: number;
  } | null>(null);

  // Sync new items in (additions) and refresh fields on existing rows (updates).
  // We deliberately do NOT remove rows that disappear from prop — those leave
  // through the swipe animation via onAfterDelete, so the row needs to stay
  // mounted while it collapses.
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

  function handleDelta(delta: number) {
    setDailyScore((s) => s + delta);
    setLifetimeXp((x) => Math.max(0, x + delta));
  }

  function handleItemUpdate(updated: DisciplineItem) {
    // Home only shows active + slipped. If the item just transitioned to
    // graduated (e.g. a slipped item that got a win), drop it from the list.
    if (updated.status === "graduated") {
      setItems((prev) => prev.filter((i) => i.id !== updated.id));
      return;
    }
    setItems((prev) =>
      prev.map((i) => (i.id === updated.id ? updated : i))
    );
  }

  function handleGraduated(graduatedItemId: string) {
    setItems((prev) => prev.filter((i) => i.id !== graduatedItemId));
  }

  return (
    <div className="px-5 pt-8">
      <header className="flex items-center justify-between mb-8">
        <h1
          className="text-2xl font-black tracking-tight"
          style={{ fontFamily: "var(--font-display)" }}
        >
          DISCIPLINE
        </h1>
        <form action="/auth/signout" method="post">
          <button
            type="submit"
            className="tap text-[10px] uppercase tracking-widest text-ink-200"
          >
            Sign out
          </button>
        </form>
      </header>

      <section className="card p-5 mb-3">
        <p className="text-[10px] uppercase tracking-widest text-ink-200 mb-1">
          Today
        </p>
        <div
          className={`text-7xl font-black leading-none ${
            dailyScore < 0 ? "text-accent-loss" : "text-white"
          }`}
          style={{ fontFamily: "var(--font-display)" }}
        >
          <AnimatedNumber value={dailyScore} />
        </div>
      </section>

      <section className="card p-5 mb-8">
        <div className="flex items-baseline justify-between">
          <p className="text-[10px] uppercase tracking-widest text-ink-200">
            Lifetime XP
          </p>
          <div
            className="text-2xl font-black text-white"
            style={{ fontFamily: "var(--font-display)" }}
          >
            <AnimatedNumber value={lifetimeXp} />
          </div>
        </div>
        <XpBar xp={lifetimeXp} />
      </section>

      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[10px] uppercase tracking-widest text-ink-200">
            Active
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setQuickOpen(true)}
              className="tap text-xs uppercase tracking-widest text-white border border-ink-500 px-3 py-1.5 rounded-md"
            >
              ⚡ Quick Log
            </button>
            <button
              onClick={openCreate}
              className="tap text-xs uppercase tracking-widest text-white border border-ink-500 px-3 py-1.5 rounded-md"
            >
              + Add
            </button>
          </div>
        </div>

        {items.length === 0 ? (
          <div className="card-soft p-6 text-center">
            <p className="text-white text-base mb-1 font-bold">
              No disciplines locked in.
            </p>
            <p className="text-ink-200 text-sm">
              Add the first thing you said you'd do.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {items.map((item) => (
              <Swipeable
                key={item.id}
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
                  onDelta={handleDelta}
                  onItemUpdate={handleItemUpdate}
                  onGraduationPrompt={setGradPrompt}
                  onEditClick={openEdit}
                />
              </Swipeable>
            ))}
          </div>
        )}

        <p className="text-[10px] uppercase tracking-widest text-ink-300 text-center mt-4">
          Swipe a row left to delete.
        </p>
      </section>

      <AddItemSheet
        open={sheetOpen}
        onClose={closeSheet}
        editing={editingItem}
      />
      <QuickLogSheet
        open={quickOpen}
        onClose={() => setQuickOpen(false)}
        onLogged={handleDelta}
      />

      {gradPrompt && (
        <GraduationSheet
          itemId={gradPrompt.itemId}
          itemName={gradPrompt.itemName}
          consecutive={gradPrompt.consecutive}
          onClose={() => setGradPrompt(null)}
          onGraduated={handleGraduated}
        />
      )}

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
            // restore failed — remove from local list again
            setItems((prev) => prev.filter((i) => i.id !== item.id));
          });
        }}
        onDismiss={() => setRecentlyDeleted(null)}
      />
    </div>
  );
}
