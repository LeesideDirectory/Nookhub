-- ============================================================================
-- Morning Nook — daily updates cache
-- Run this once in Supabase → SQL Editor.
-- Safe to re-run (all statements are idempotent).
-- ============================================================================

-- ── 1. The cache table ──────────────────────────────────────────────────────
-- One row per source. `items` holds that source's latest headlines as a JSON
-- array. The 6am Netlify job overwrites these rows; every user reads them.
create table if not exists public.daily_feed (
  source_id   text primary key,
  source_name text        not null default '',
  items       jsonb       not null default '[]'::jsonb,
  fetched_at  timestamptz not null default now(),
  ok          boolean     not null default true,
  error       text
);

comment on table public.daily_feed is
  'Morning Nook cache. Written only by the Netlify scheduled function (service role). Readable by everyone.';

-- ── 2. Row Level Security ───────────────────────────────────────────────────
alter table public.daily_feed enable row level security;

-- Everyone (including logged-out visitors on public profiles) can read.
drop policy if exists "daily_feed_public_read" on public.daily_feed;
create policy "daily_feed_public_read"
  on public.daily_feed for select
  using (true);

-- No insert/update/delete policies are created on purpose.
-- The Netlify function writes using the SERVICE ROLE key, which bypasses RLS.
-- This means no logged-in user can ever tamper with the cached headlines.

-- ── 3. A tiny run log (handy for debugging "why is it stale?") ──────────────
create table if not exists public.daily_feed_runs (
  id          uuid primary key default gen_random_uuid(),
  ran_at      timestamptz not null default now(),
  trigger     text        not null default 'schedule',  -- 'schedule' | 'manual'
  ok          boolean     not null default true,
  summary     jsonb       not null default '{}'::jsonb,
  duration_ms integer
);

alter table public.daily_feed_runs enable row level security;

drop policy if exists "daily_feed_runs_public_read" on public.daily_feed_runs;
create policy "daily_feed_runs_public_read"
  on public.daily_feed_runs for select
  using (true);

create index if not exists daily_feed_runs_ran_at_idx
  on public.daily_feed_runs (ran_at desc);

-- ── 4. Seed the rows so the UI has something to show before the first run ───
insert into public.daily_feed (source_id, source_name, items, ok, error)
values
  ('morningbrew',  'Morning Brew',          '[]'::jsonb, true, null),
  ('bbc',          'BBC News',              '[]'::jsonb, true, null),
  ('bbc-world',    'BBC World',             '[]'::jsonb, true, null),
  ('bbc-tech',     'BBC Technology',        '[]'::jsonb, true, null),
  ('bbc-business', 'BBC Business',          '[]'::jsonb, true, null),
  ('rte',          'RTÉ News',              '[]'::jsonb, true, null),
  ('rte-business', 'RTÉ Business',          '[]'::jsonb, true, null),
  ('rte-ents',     'RTÉ Entertainment',     '[]'::jsonb, true, null),
  ('exploding',    'Exploding Topics',      '[]'::jsonb, true, null),
  ('trends-ie',    'Trending in Ireland',   '[]'::jsonb, true, null),
  ('hackernews',   'Hacker News',           '[]'::jsonb, true, null),
  ('techcrunch',   'TechCrunch',            '[]'::jsonb, true, null)
on conflict (source_id) do nothing;

-- ── 5. Housekeeping: keep only the last 100 run-log rows ────────────────────
create or replace function public.prune_daily_feed_runs()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  delete from public.daily_feed_runs
  where id in (
    select id from public.daily_feed_runs
    order by ran_at desc
    offset 100
  );
  return null;
end; $$;

drop trigger if exists trg_prune_daily_feed_runs on public.daily_feed_runs;
create trigger trg_prune_daily_feed_runs
  after insert on public.daily_feed_runs
  for each statement execute function public.prune_daily_feed_runs();

-- ── Done ────────────────────────────────────────────────────────────────────
-- User preferences (which sources are switched on) are NOT stored here.
-- They live in the existing `user_data` table under key 'morning_nook_prefs',
-- which already has the correct owner-only RLS policies. Nothing to add.
