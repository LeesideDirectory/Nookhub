-- ============================================================
-- Nook — widget_configs table + RLS fix
-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor)
-- ============================================================

-- 1. Create widget_configs table if it doesn't already exist
create table if not exists public.widget_configs (
  id         bigint generated always as identity primary key,
  user_id    uuid references auth.users(id) on delete cascade not null,
  widget_id  text not null,
  enabled    boolean default false,
  public     boolean default false,
  color_idx  int default 0,
  sort_order int default 0,
  data       jsonb,
  updated_at timestamptz default now(),
  unique(user_id, widget_id)
);

-- 2. Enable Row Level Security
alter table public.widget_configs enable row level security;

-- 3. Drop any existing policies to avoid conflicts on re-run
drop policy if exists "widget_configs_public_read"  on public.widget_configs;
drop policy if exists "widget_configs_own_all"      on public.widget_configs;
drop policy if exists "widget_configs_own_select"   on public.widget_configs;
drop policy if exists "widget_configs_own_insert"   on public.widget_configs;
drop policy if exists "widget_configs_own_update"   on public.widget_configs;
drop policy if exists "widget_configs_own_delete"   on public.widget_configs;

-- 4. PUBLIC READ: any authenticated user can read widget configs
--    (needed for PublicProfilePage to show other users' widgets)
create policy "widget_configs_public_read"
  on public.widget_configs
  for select
  using (true);

-- 5. OWNER WRITE: users can only insert/update/delete their own rows
create policy "widget_configs_own_insert"
  on public.widget_configs
  for insert
  with check (auth.uid() = user_id);

create policy "widget_configs_own_update"
  on public.widget_configs
  for update
  using (auth.uid() = user_id);

create policy "widget_configs_own_delete"
  on public.widget_configs
  for delete
  using (auth.uid() = user_id);

-- 6. Index for fast lookups
create index if not exists idx_widget_configs_user on public.widget_configs(user_id, sort_order);
