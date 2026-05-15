"use client";

import { useEffect, useRef, useState, ReactNode, useTransition } from "react";

const REVEAL_PX = 96; // width of the delete drawer
const OPEN_THRESHOLD = 48;
const DIRECTION_LOCK_PX = 8;

export default function Swipeable({
  children,
  isOpen,
  onOpen,
  onClose,
  onDelete,
  onAfterDelete,
  label = "Delete",
  rounded = false,
}: {
  children: ReactNode;
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
  onDelete: () => Promise<void> | void;
  onAfterDelete?: () => void;
  label?: string;
  /** Add rounded corners to the wrapper. Use when the row is a standalone card. */
  rounded?: boolean;
}) {
  const [dragX, setDragX] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [pending, startTransition] = useTransition();

  const startXRef = useRef(0);
  const startYRef = useRef(0);
  const pointerIdRef = useRef<number | null>(null);
  const lockedRef = useRef<"h" | "v" | null>(null);
  const elRef = useRef<HTMLDivElement | null>(null);

  function onPointerDown(e: React.PointerEvent) {
    if (removing || pending) return;
    startXRef.current = e.clientX;
    startYRef.current = e.clientY;
    pointerIdRef.current = e.pointerId;
    lockedRef.current = null;
    // NOTE: do NOT capture pointer here — inner buttons need to receive click.
    // We only capture once horizontal swipe is confirmed.
  }

  function onPointerMove(e: React.PointerEvent) {
    if (pointerIdRef.current === null) return;
    const dx = e.clientX - startXRef.current;
    const dy = e.clientY - startYRef.current;

    if (lockedRef.current === null) {
      if (Math.abs(dx) < DIRECTION_LOCK_PX && Math.abs(dy) < DIRECTION_LOCK_PX) {
        return; // not enough movement yet
      }
      if (Math.abs(dx) > Math.abs(dy)) {
        lockedRef.current = "h";
        try {
          (e.currentTarget as Element).setPointerCapture(e.pointerId);
        } catch {
          /* ignore */
        }
        setDragging(true);
      } else {
        lockedRef.current = "v";
        pointerIdRef.current = null; // let vertical scroll proceed
        return;
      }
    }
    if (lockedRef.current !== "h") return;

    const base = isOpen ? -REVEAL_PX : 0;
    let next = base + dx;
    if (next > 0) next = next * 0.3; // resist rightward drag past 0
    if (next < -REVEAL_PX - 24) next = -REVEAL_PX - 24;
    setDragX(next);
  }

  function onPointerUp() {
    const wasHorizontal = lockedRef.current === "h";
    pointerIdRef.current = null;
    lockedRef.current = null;
    if (!wasHorizontal) {
      setDragging(false);
      return;
    }
    setDragging(false);
    if (dragX <= -OPEN_THRESHOLD) {
      setDragX(-REVEAL_PX);
      onOpen();
    } else {
      setDragX(0);
      onClose();
    }
  }

  useEffect(() => {
    if (dragging) return;
    setDragX(isOpen ? -REVEAL_PX : 0);
  }, [isOpen, dragging]);

  function handleDelete() {
    setRemoving(true);
    startTransition(async () => {
      try {
        await onDelete();
        setTimeout(() => onAfterDelete?.(), 220);
      } catch {
        setRemoving(false);
      }
    });
  }

  const translate = dragging ? dragX : isOpen ? -REVEAL_PX : 0;
  const radius = rounded ? "rounded-[14px]" : "";

  return (
    <div
      ref={elRef}
      className={`relative overflow-hidden transition-[max-height,opacity,margin] duration-200 ${radius} ${
        removing ? "max-h-0 my-0 opacity-0" : "opacity-100"
      }`}
      style={{ maxHeight: removing ? 0 : 400 }}
    >
      <button
        type="button"
        onClick={handleDelete}
        disabled={pending}
        className={`absolute inset-y-0 right-0 w-[96px] bg-accent-loss text-black font-bold uppercase tracking-widest text-xs flex items-center justify-center tap ${radius}`}
      >
        {pending ? "..." : label}
      </button>

      <div
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        style={{
          transform: `translateX(${translate}px)`,
          transition: dragging
            ? "none"
            : "transform 220ms cubic-bezier(0.16, 1, 0.3, 1)",
          touchAction: "pan-y",
        }}
        className={`relative bg-[#0f0f0f] ${radius}`}
      >
        {children}
      </div>
    </div>
  );
}
