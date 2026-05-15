import { createClient } from "@/lib/supabase/server";
import AppShell from "@/components/AppShell";
import LogClient from "./LogClient";
import type { DisciplineLog } from "@/lib/types";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 30;

export default async function LogPage() {
  const supabase = createClient();
  const { data } = await supabase
    .from("discipline_logs")
    .select("*")
    .order("logged_at", { ascending: false })
    .limit(PAGE_SIZE);

  return (
    <AppShell>
      <LogClient
        initial={(data as DisciplineLog[] | null) ?? []}
        pageSize={PAGE_SIZE}
      />
    </AppShell>
  );
}
