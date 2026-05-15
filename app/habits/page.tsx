import { createClient } from "@/lib/supabase/server";
import AppShell from "@/components/AppShell";
import HabitsClient from "./HabitsClient";
import type { DisciplineItem } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function HabitsPage() {
  const supabase = createClient();
  const { data: items } = await supabase
    .from("discipline_items")
    .select("*")
    .in("status", ["graduated", "slipped"])
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  return (
    <AppShell>
      <HabitsClient items={(items as DisciplineItem[] | null) ?? []} />
    </AppShell>
  );
}
