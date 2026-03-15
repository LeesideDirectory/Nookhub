-- ============================================================
-- Nook — Allow public read of bio_links from user_data
-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor)
-- ============================================================

-- The user_data table currently has a single "all" policy that only
-- allows owners to read/write their own rows. We need to add a
-- separate SELECT policy so that any authenticated user can read
-- the 'bio_links' key (name, email, website links shown on public profiles).
-- The owner-only write policy is unchanged.

drop policy if exists "user_data_bio_links_public_read" on public.user_data;

create policy "user_data_bio_links_public_read"
  on public.user_data
  for select
  using (key = 'bio_links');
