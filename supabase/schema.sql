-- DISCIPLINE — Supabase schema
-- Run this in the Supabase SQL editor (or psql) on a fresh project.

-- =========================================================================
-- EXTENSIONS
-- =========================================================================
create extension if not exists "uuid-ossp";

-- =========================================================================
-- TABLES
-- =========================================================================

-- Mirror of auth.users so we can FK from app tables.
create table if not exists public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.discipline_items (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users (id) on delete cascade,
  name text not null,
  points int not null check (points in (1, 3, 5, 10)),
  status text not null default 'active' check (status in ('active', 'graduated', 'slipped')),
  consecutive_wins int not null default 0,
  total_logs int not null default 0,
  graduation_threshold int,  -- if null, fall back to default by point value
  deleted_at timestamptz,    -- soft delete; row is hidden from lists when set
  created_at timestamptz not null default now()
);

create index if not exists discipline_items_user_active_idx
  on public.discipline_items (user_id) where deleted_at is null;

create index if not exists discipline_items_user_id_idx
  on public.discipline_items (user_id);
create index if not exists discipline_items_user_status_idx
  on public.discipline_items (user_id, status);

create table if not exists public.discipline_logs (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users (id) on delete cascade,
  item_id uuid references public.discipline_items (id) on delete set null,
  item_name text not null,
  points int not null,
  was_disciplined boolean not null,
  logged_at timestamptz not null default now()
);

create index if not exists discipline_logs_user_logged_at_idx
  on public.discipline_logs (user_id, logged_at desc);
create index if not exists discipline_logs_user_item_idx
  on public.discipline_logs (user_id, item_id);

-- =========================================================================
-- AUTO-PROVISION public.users ROW WHEN AN AUTH USER IS CREATED
-- =========================================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id) values (new.id)
  on conflict (id) do nothing;

  -- Seed default starter items so the first home screen isn't empty
  insert into public.discipline_items (user_id, name, points) values
    (new.id, 'Discomfort', 1),
    (new.id, 'Temptation', 3),
    (new.id, 'Sacrifice', 5),
    (new.id, 'Identity', 10)
  on conflict do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- =========================================================================
-- ROW LEVEL SECURITY
-- =========================================================================
alter table public.users enable row level security;
alter table public.discipline_items enable row level security;
alter table public.discipline_logs enable row level security;

-- users: a row can be read/managed only by itself
drop policy if exists "users_select_self" on public.users;
create policy "users_select_self" on public.users
  for select using (auth.uid() = id);

drop policy if exists "users_insert_self" on public.users;
create policy "users_insert_self" on public.users
  for insert with check (auth.uid() = id);

-- discipline_items: scoped to owner
drop policy if exists "items_select_own" on public.discipline_items;
create policy "items_select_own" on public.discipline_items
  for select using (auth.uid() = user_id);

drop policy if exists "items_insert_own" on public.discipline_items;
create policy "items_insert_own" on public.discipline_items
  for insert with check (auth.uid() = user_id);

drop policy if exists "items_update_own" on public.discipline_items;
create policy "items_update_own" on public.discipline_items
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "items_delete_own" on public.discipline_items;
create policy "items_delete_own" on public.discipline_items
  for delete using (auth.uid() = user_id);

-- discipline_logs: scoped to owner
drop policy if exists "logs_select_own" on public.discipline_logs;
create policy "logs_select_own" on public.discipline_logs
  for select using (auth.uid() = user_id);

drop policy if exists "logs_insert_own" on public.discipline_logs;
create policy "logs_insert_own" on public.discipline_logs
  for insert with check (auth.uid() = user_id);

drop policy if exists "logs_delete_own" on public.discipline_logs;
create policy "logs_delete_own" on public.discipline_logs
  for delete using (auth.uid() = user_id);
