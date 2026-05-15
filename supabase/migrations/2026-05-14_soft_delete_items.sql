-- =========================================================================
-- Migration: 2026-05-14 (b)
-- Adds soft-delete to discipline_items so accidental deletes can be undone.
-- =========================================================================

alter table public.discipline_items
  add column if not exists deleted_at timestamptz;

create index if not exists discipline_items_user_active_idx
  on public.discipline_items (user_id) where deleted_at is null;
