-- ============================================================================
-- Morning Nook — let visitors see the owner's chosen sources
--
-- Run this in Supabase → SQL Editor, AFTER supabase-morning-nook.sql.
-- Safe to re-run.
-- ============================================================================
--
-- Why this is needed:
--   A user's Morning Nook source selection lives in `user_data` under the key
--   'morning_nook_prefs'. That table is owner-only by default, so when someone
--   visits a public profile the widget had no way to know which sources the
--   owner had switched on, and fell back to the defaults.
--
-- What this does:
--   Extends the existing `user_data_public_keys_read` policy (from
--   supabase-priv-prefs-public-read.sql) to also expose 'morning_nook_prefs' —
--   but ONLY for users who have actually made their Morning Nook widget public.
--
--   So the rule is: if you've published the widget, your source list is
--   readable alongside it. If you haven't, nobody can read it. Turning the
--   widget off or private makes it private again immediately, with no extra
--   step to remember.
--
--   'bio_links' and 'priv_prefs' keep their existing behaviour exactly.
-- ============================================================================

DROP POLICY IF EXISTS "user_data_bio_links_public_read" ON public.user_data;
DROP POLICY IF EXISTS "user_data_public_keys_read"      ON public.user_data;

CREATE POLICY "user_data_public_keys_read"
  ON public.user_data
  FOR SELECT
  USING (
    -- unchanged: needed for bio links/email and the allowMessages toggle
    key IN ('bio_links', 'priv_prefs')

    -- new: Morning Nook source selection, but only for a published widget
    OR (
      key = 'morning_nook_prefs'
      AND EXISTS (
        SELECT 1
        FROM public.widget_configs wc
        WHERE wc.user_id   = user_data.user_id
          AND wc.widget_id = 'morning'
          AND wc.enabled   IS TRUE
          AND wc.public    IS TRUE
      )
    )
  );

-- ── Check it worked ─────────────────────────────────────────────────────────
-- Should return one row, with the new policy definition:
--
--   SELECT policyname, qual
--   FROM pg_policies
--   WHERE tablename = 'user_data' AND policyname = 'user_data_public_keys_read';
