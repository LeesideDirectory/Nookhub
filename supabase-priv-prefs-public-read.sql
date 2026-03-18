-- ============================================================
-- Nook — Allow public read of priv_prefs from user_data
-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor)
-- ============================================================

-- PublicProfilePage needs to read a user's priv_prefs to know
-- whether to show the Message button (allowMessages setting).
-- We extend the existing bio_links policy to also cover priv_prefs,
-- or replace it with a combined policy.

DROP POLICY IF EXISTS "user_data_bio_links_public_read" ON public.user_data;
DROP POLICY IF EXISTS "user_data_public_keys_read"     ON public.user_data;

CREATE POLICY "user_data_public_keys_read"
  ON public.user_data
  FOR SELECT
  USING (key IN ('bio_links', 'priv_prefs'));
