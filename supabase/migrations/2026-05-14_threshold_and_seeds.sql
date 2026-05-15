-- =========================================================================
-- Migration: 2026-05-14
-- Adds:
--   1. graduation_threshold column on discipline_items (nullable; null falls
--      back to the default for the item's point value)
--   2. Updated handle_new_user trigger that also seeds 4 starter items
--
-- Safe to re-run.
-- =========================================================================

alter table public.discipline_items
  add column if not exists graduation_threshold int;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id) values (new.id)
  on conflict (id) do nothing;

  insert into public.discipline_items (user_id, name, points) values
    (new.id, 'Discomfort', 1),
    (new.id, 'Temptation', 3),
    (new.id, 'Sacrifice', 5),
    (new.id, 'Identity', 10)
  on conflict do nothing;

  return new;
end;
$$;
