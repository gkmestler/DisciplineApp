"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { POINT_VALUES, getThreshold } from "@/lib/discipline";
import type { DisciplineItem, PointValue } from "@/lib/types";

async function requireUser() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  return { supabase, userId: user.id };
}

export interface LogResult {
  delta: number;
  item: DisciplineItem;
  graduationPrompt?: { itemId: string; itemName: string; consecutive: number };
}

export async function createItem(formData: FormData): Promise<void> {
  const name = String(formData.get("name") ?? "").trim();
  const pointsRaw = Number(formData.get("points"));
  const thresholdRaw = formData.get("graduation_threshold");
  if (!name) throw new Error("Name required");
  if (!POINT_VALUES.includes(pointsRaw as PointValue)) {
    throw new Error("Invalid point value");
  }

  let threshold: number | null = null;
  if (thresholdRaw !== null && thresholdRaw !== "") {
    const n = Number(thresholdRaw);
    if (!Number.isFinite(n) || n < 1 || n > 999) {
      throw new Error("Threshold must be between 1 and 999");
    }
    threshold = Math.floor(n);
  }

  const { supabase, userId } = await requireUser();
  const { error } = await supabase.from("discipline_items").insert({
    user_id: userId,
    name,
    points: pointsRaw,
    status: "active",
    graduation_threshold: threshold,
  });
  if (error) throw error;
  revalidatePath("/");
}

export async function updateItem(
  itemId: string,
  formData: FormData
): Promise<void> {
  const name = String(formData.get("name") ?? "").trim();
  const pointsRaw = Number(formData.get("points"));
  const thresholdRaw = formData.get("graduation_threshold");
  if (!name) throw new Error("Name required");
  if (!POINT_VALUES.includes(pointsRaw as PointValue)) {
    throw new Error("Invalid point value");
  }

  let threshold: number | null = null;
  if (thresholdRaw !== null && thresholdRaw !== "") {
    const n = Number(thresholdRaw);
    if (!Number.isFinite(n) || n < 1 || n > 999) {
      throw new Error("Threshold must be between 1 and 999");
    }
    threshold = Math.floor(n);
  }

  const { supabase } = await requireUser();
  const { error } = await supabase
    .from("discipline_items")
    .update({
      name,
      points: pointsRaw,
      graduation_threshold: threshold,
    })
    .eq("id", itemId);
  if (error) throw error;

  revalidatePath("/");
  revalidatePath("/habits");
}

export async function deleteItem(itemId: string): Promise<void> {
  // Soft delete: set deleted_at so the row is hidden from the UI but can be
  // restored within the undo window. Past logs are preserved either way.
  const { supabase } = await requireUser();
  const { error } = await supabase
    .from("discipline_items")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", itemId);
  if (error) throw error;
  revalidatePath("/");
  revalidatePath("/habits");
}

export async function restoreItem(itemId: string): Promise<void> {
  const { supabase } = await requireUser();
  const { error } = await supabase
    .from("discipline_items")
    .update({ deleted_at: null })
    .eq("id", itemId);
  if (error) throw error;
  revalidatePath("/");
  revalidatePath("/habits");
}

export async function logDisciplined(itemId: string): Promise<LogResult> {
  const { supabase, userId } = await requireUser();

  const { data: item, error: fetchErr } = await supabase
    .from("discipline_items")
    .select("*")
    .eq("id", itemId)
    .single();
  if (fetchErr || !item) throw fetchErr ?? new Error("Item not found");

  const typedItem = item as DisciplineItem;
  const delta = typedItem.points;
  const newWins = typedItem.consecutive_wins + 1;
  const threshold = getThreshold(typedItem);
  const shouldPrompt =
    typedItem.status !== "graduated" && newWins >= threshold;

  // Insert log
  const { error: logErr } = await supabase.from("discipline_logs").insert({
    user_id: userId,
    item_id: typedItem.id,
    item_name: typedItem.name,
    points: delta,
    was_disciplined: true,
  });
  if (logErr) throw logErr;

  // Update item — slipped items return to graduated on a win
  const nextStatus = typedItem.status === "slipped" ? "graduated" : typedItem.status;
  const { error: updErr } = await supabase
    .from("discipline_items")
    .update({
      consecutive_wins: newWins,
      total_logs: typedItem.total_logs + 1,
      status: nextStatus,
    })
    .eq("id", typedItem.id);
  if (updErr) throw updErr;

  const updatedItem: DisciplineItem = {
    ...typedItem,
    consecutive_wins: newWins,
    total_logs: typedItem.total_logs + 1,
    status: nextStatus,
  };

  revalidatePath("/");
  revalidatePath("/habits");
  revalidatePath("/log");

  return {
    delta,
    item: updatedItem,
    graduationPrompt: shouldPrompt
      ? { itemId: typedItem.id, itemName: typedItem.name, consecutive: newWins }
      : undefined,
  };
}

export async function logFailed(itemId: string): Promise<LogResult> {
  const { supabase, userId } = await requireUser();

  const { data: item, error: fetchErr } = await supabase
    .from("discipline_items")
    .select("*")
    .eq("id", itemId)
    .single();
  if (fetchErr || !item) throw fetchErr ?? new Error("Item not found");

  const typedItem = item as DisciplineItem;

  // Determine penalty + status transition
  let penaltyMultiplier = 1;
  let nextStatus: DisciplineItem["status"] = typedItem.status;

  if (typedItem.status === "graduated") {
    penaltyMultiplier = 2;
    nextStatus = "slipped";
  } else if (typedItem.status === "slipped") {
    penaltyMultiplier = 2;
    nextStatus = "active";
  }

  const delta = -typedItem.points * penaltyMultiplier;

  const { error: logErr } = await supabase.from("discipline_logs").insert({
    user_id: userId,
    item_id: typedItem.id,
    item_name: typedItem.name,
    points: delta,
    was_disciplined: false,
  });
  if (logErr) throw logErr;

  const { error: updErr } = await supabase
    .from("discipline_items")
    .update({
      consecutive_wins: 0,
      total_logs: typedItem.total_logs + 1,
      status: nextStatus,
    })
    .eq("id", typedItem.id);
  if (updErr) throw updErr;

  const updatedItem: DisciplineItem = {
    ...typedItem,
    consecutive_wins: 0,
    total_logs: typedItem.total_logs + 1,
    status: nextStatus,
  };

  revalidatePath("/");
  revalidatePath("/habits");
  revalidatePath("/log");

  return { delta, item: updatedItem };
}

export async function graduateItem(itemId: string): Promise<void> {
  const { supabase } = await requireUser();
  const { error } = await supabase
    .from("discipline_items")
    .update({ status: "graduated" })
    .eq("id", itemId);
  if (error) throw error;
  revalidatePath("/");
  revalidatePath("/habits");
}

export async function dismissGraduation(itemId: string): Promise<void> {
  // No-op on the server (the prompt is client-side state). Exists for symmetry.
  void itemId;
}

export async function quickLog(
  name: string,
  points: number,
  disciplined: boolean
): Promise<{ delta: number }> {
  if (!POINT_VALUES.includes(points as PointValue)) {
    throw new Error("Invalid point value");
  }
  const cleanedName = name.trim() || "Quick Log";
  const delta = disciplined ? points : -points;

  const { supabase, userId } = await requireUser();
  const { error } = await supabase.from("discipline_logs").insert({
    user_id: userId,
    item_id: null,
    item_name: cleanedName,
    points: delta,
    was_disciplined: disciplined,
  });
  if (error) throw error;

  revalidatePath("/");
  revalidatePath("/log");
  return { delta };
}

export async function demoteToActive(itemId: string): Promise<void> {
  const { supabase } = await requireUser();
  const { error } = await supabase
    .from("discipline_items")
    .update({ status: "active", consecutive_wins: 0 })
    .eq("id", itemId);
  if (error) throw error;
  revalidatePath("/");
  revalidatePath("/habits");
}

export async function deleteLog(logId: string): Promise<void> {
  const { supabase } = await requireUser();

  // Fetch the log to know which item to recompute
  const { data: log, error: fetchErr } = await supabase
    .from("discipline_logs")
    .select("id, item_id")
    .eq("id", logId)
    .single();
  if (fetchErr || !log) throw fetchErr ?? new Error("Log not found");

  const { error: delErr } = await supabase
    .from("discipline_logs")
    .delete()
    .eq("id", logId);
  if (delErr) throw delErr;

  // If the log was tied to an item, recompute that item's counters
  if (log.item_id) {
    const { data: remaining, error: remErr } = await supabase
      .from("discipline_logs")
      .select("was_disciplined, logged_at")
      .eq("item_id", log.item_id)
      .order("logged_at", { ascending: false });
    if (remErr) throw remErr;

    const totalLogs = remaining?.length ?? 0;
    // consecutive_wins = count of wins from most recent log backwards until first fail
    let streak = 0;
    for (const r of remaining ?? []) {
      if (r.was_disciplined) streak += 1;
      else break;
    }

    const { error: updErr } = await supabase
      .from("discipline_items")
      .update({ total_logs: totalLogs, consecutive_wins: streak })
      .eq("id", log.item_id);
    if (updErr) throw updErr;
  }

  revalidatePath("/");
  revalidatePath("/habits");
  revalidatePath("/log");
}
