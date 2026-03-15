-- ============================================================
-- Calendar Shares — run once in Supabase SQL Editor
-- ============================================================
-- Creates the calendar_shares table that powers cross-user
-- calendar sharing in the Work → Calendar feature.
--
-- When user A shares a calendar category with user B:
--   • A snapshot of the category's events is written here
--   • B can read the row and see A's events (read-only)
--   • B gets a notification on next login
--   • The snapshot stays updated automatically (2.5 s debounce)
-- ============================================================

CREATE TABLE IF NOT EXISTS calendar_shares (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user_id  uuid NOT NULL,
  to_user_id    uuid NOT NULL,
  cat_id        text NOT NULL,
  cat_name      text NOT NULL,
  cat_color     text NOT NULL DEFAULT '#9B85D8',
  events        jsonb NOT NULL DEFAULT '[]'::jsonb,
  updated_at    timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT calendar_shares_unique UNIQUE (from_user_id, to_user_id, cat_id)
);

-- ── Row-Level Security ────────────────────────────────────────────────────

ALTER TABLE calendar_shares ENABLE ROW LEVEL SECURITY;

-- Sharers can insert, update, and delete their own share records
CREATE POLICY "Sharers can manage their shares"
  ON calendar_shares
  FOR ALL
  USING  (auth.uid() = from_user_id)
  WITH CHECK (auth.uid() = from_user_id);

-- Recipients can read shares that were sent to them
CREATE POLICY "Recipients can read their shares"
  ON calendar_shares
  FOR SELECT
  USING (auth.uid() = to_user_id);

-- ── Indexes ───────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS calendar_shares_to_user_idx
  ON calendar_shares (to_user_id);

CREATE INDEX IF NOT EXISTS calendar_shares_from_user_idx
  ON calendar_shares (from_user_id);
