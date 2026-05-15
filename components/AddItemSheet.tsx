"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { createItem, updateItem } from "@/app/actions";
import { POINT_VALUES, defaultThresholdFor } from "@/lib/discipline";
import type { DisciplineItem, PointValue } from "@/lib/types";

export default function AddItemSheet({
  open,
  onClose,
  editing,
}: {
  open: boolean;
  onClose: () => void;
  editing?: DisciplineItem | null;
}) {
  const isEdit = !!editing;

  const [name, setName] = useState("");
  const [points, setPoints] = useState<PointValue>(1);
  const [threshold, setThreshold] = useState<string>(
    String(defaultThresholdFor(1))
  );
  const [thresholdTouched, setThresholdTouched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const lastPointsRef = useRef<PointValue>(1);

  // When point selection changes, re-suggest the threshold unless the user
  // has manually edited it.
  useEffect(() => {
    if (points !== lastPointsRef.current) {
      lastPointsRef.current = points;
      if (!thresholdTouched) {
        setThreshold(String(defaultThresholdFor(points)));
      }
    }
  }, [points, thresholdTouched]);

  // Reset / pre-fill every time the sheet opens
  useEffect(() => {
    if (!open) return;
    if (editing) {
      setName(editing.name);
      setPoints(editing.points);
      const t =
        editing.graduation_threshold ?? defaultThresholdFor(editing.points);
      setThreshold(String(t));
      setThresholdTouched(editing.graduation_threshold !== null);
      lastPointsRef.current = editing.points;
    } else {
      setName("");
      setPoints(1);
      setThreshold(String(defaultThresholdFor(1)));
      setThresholdTouched(false);
      lastPointsRef.current = 1;
    }
    setError(null);
  }, [open, editing]);

  if (!open) return null;

  function submit() {
    setError(null);
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Give it a name.");
      return;
    }
    const fd = new FormData();
    fd.append("name", trimmed);
    fd.append("points", String(points));
    fd.append("graduation_threshold", threshold);
    startTransition(async () => {
      try {
        if (editing) {
          await updateItem(editing.id, fd);
        } else {
          await createItem(fd);
        }
        onClose();
      } catch (e: any) {
        setError(e?.message ?? "Failed to save.");
      }
    });
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
            className="text-3xl font-black uppercase tracking-tight mb-6"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {isEdit ? "Edit Discipline" : "New Discipline"}
          </h2>

          <label className="block text-[10px] uppercase tracking-widest text-ink-200 mb-2">
            What
          </label>
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Hit last set"
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

          <label className="block text-[10px] uppercase tracking-widest text-ink-200 mb-2">
            Times to graduate
          </label>
          <div className="flex items-center gap-3 mb-6">
            <input
              type="number"
              inputMode="numeric"
              min={1}
              max={999}
              value={threshold}
              onChange={(e) => {
                setThreshold(e.target.value);
                setThresholdTouched(true);
              }}
              className="w-24 bg-ink-700 border border-ink-500 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-white text-center font-bold"
            />
            <p className="text-ink-200 text-xs leading-relaxed flex-1">
              Wins in a row before it's offered as a habit.{" "}
              <button
                type="button"
                onClick={() => {
                  setThreshold(String(defaultThresholdFor(points)));
                  setThresholdTouched(false);
                }}
                className="text-white underline underline-offset-2"
              >
                Use default ({defaultThresholdFor(points)})
              </button>
            </p>
          </div>

          {error && <p className="text-accent-loss text-xs mb-3">{error}</p>}

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={onClose}
              className="tap py-4 rounded-lg border border-ink-500 text-ink-100 uppercase tracking-widest text-xs"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={submit}
              disabled={pending}
              className="tap py-4 rounded-lg bg-white text-black font-bold uppercase tracking-widest text-xs disabled:opacity-50"
            >
              {pending ? "..." : "Save"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
