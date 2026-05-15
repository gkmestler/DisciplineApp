import type { DisciplineItem, PointValue } from "./types";

export const POINT_VALUES: PointValue[] = [1, 3, 5, 10];

// Default consecutive-wins-to-graduate by point value. Each item may override
// via its own `graduation_threshold` column.
export const GRADUATION_THRESHOLDS: Record<PointValue, number> = {
  1: 14,
  3: 10,
  5: 7,
  10: 5,
};

export function defaultThresholdFor(points: PointValue): number {
  return GRADUATION_THRESHOLDS[points];
}

export function getThreshold(
  item: Pick<DisciplineItem, "points" | "graduation_threshold">
): number {
  return item.graduation_threshold ?? GRADUATION_THRESHOLDS[item.points];
}

export const XP_THRESHOLDS = [100, 300, 600, 1000, 1500, 2200, 3000, 4200, 6000];

export interface XpProgress {
  current: number;
  nextThreshold: number | null;
  prevThreshold: number;
  ratio: number; // 0..1 between prev and next
  capped: boolean; // true once past final threshold
}

export function xpProgress(lifetimeXp: number): XpProgress {
  const xp = Math.max(0, lifetimeXp);
  let prev = 0;
  for (let i = 0; i < XP_THRESHOLDS.length; i++) {
    const t = XP_THRESHOLDS[i];
    if (xp < t) {
      return {
        current: xp,
        nextThreshold: t,
        prevThreshold: prev,
        ratio: prev === t ? 1 : (xp - prev) / (t - prev),
        capped: false,
      };
    }
    prev = t;
  }
  return {
    current: xp,
    nextThreshold: null,
    prevThreshold: prev,
    ratio: 1,
    capped: true,
  };
}

// Day boundary helper — "today" in the user's local TZ.
export function startOfTodayISO(): string {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  return start.toISOString();
}
