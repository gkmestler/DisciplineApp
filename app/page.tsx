import { createClient } from "@/lib/supabase/server";
import { startOfTodayISO } from "@/lib/discipline";
import AppShell from "@/components/AppShell";
import HomeClient from "./HomeClient";
import type { DisciplineItem, DisciplineLog } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const supabase = createClient();

  // Active + slipped items appear on the home list
  const itemsPromise = supabase
    .from("discipline_items")
    .select("*")
    .in("status", ["active", "slipped"])
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  const todayISO = startOfTodayISO();
  const todayLogsPromise = supabase
    .from("discipline_logs")
    .select("points")
    .gte("logged_at", todayISO);

  const lifetimeLogsPromise = supabase
    .from("discipline_logs")
    .select("points");

  const [{ data: items }, { data: todayLogs }, { data: lifetimeLogs }] =
    await Promise.all([itemsPromise, todayLogsPromise, lifetimeLogsPromise]);

  const dailyScore =
    (todayLogs as Pick<DisciplineLog, "points">[] | null)?.reduce(
      (sum, l) => sum + l.points,
      0
    ) ?? 0;

  const lifetimeRaw =
    (lifetimeLogs as Pick<DisciplineLog, "points">[] | null)?.reduce(
      (sum, l) => sum + l.points,
      0
    ) ?? 0;
  const lifetimeXp = Math.max(0, lifetimeRaw);

  return (
    <AppShell>
      <HomeClient
        items={(items as DisciplineItem[] | null) ?? []}
        initialDailyScore={dailyScore}
        initialLifetimeXp={lifetimeXp}
      />
    </AppShell>
  );
}
