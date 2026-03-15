-- calendar_contributions: events added by recipients to shared calendars.
-- Visible to ALL participants: the calendar owner (sharer) AND every recipient.
-- This replaces the contributor_events column approach from v1.

-- 1. If you already ran supabase-calendar-contributions.sql, clean up first:
ALTER TABLE calendar_shares DROP COLUMN IF EXISTS contributor_events;
DROP POLICY IF EXISTS "Recipients can contribute events" ON calendar_shares;

-- 2. Create the shared contributions table
CREATE TABLE IF NOT EXISTS calendar_contributions (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  calendar_owner_id uuid NOT NULL,   -- the user who OWNS the calendar (sharer)
  cat_id           text NOT NULL,    -- which calendar category
  contributor_id   uuid NOT NULL,    -- the user who ADDED this event
  event_data       jsonb NOT NULL,   -- { id, title, date, endDate, time, endTime, note }
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE calendar_contributions ENABLE ROW LEVEL SECURITY;

-- Calendar owner can see all contributions to their calendars
CREATE POLICY "Owners can see contributions" ON calendar_contributions
  FOR SELECT USING (auth.uid() = calendar_owner_id);

-- Contributors can fully manage their own contributions
CREATE POLICY "Contributors manage own" ON calendar_contributions
  FOR ALL
  USING  (auth.uid() = contributor_id)
  WITH CHECK (auth.uid() = contributor_id);

-- Any recipient of the same shared calendar can see all contributions to it
CREATE POLICY "Recipients can see contributions" ON calendar_contributions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM calendar_shares
      WHERE calendar_shares.from_user_id = calendar_contributions.calendar_owner_id
        AND calendar_shares.cat_id       = calendar_contributions.cat_id
        AND calendar_shares.to_user_id   = auth.uid()
    )
  );

CREATE INDEX IF NOT EXISTS cal_contrib_owner_cat_idx ON calendar_contributions (calendar_owner_id, cat_id);
CREATE INDEX IF NOT EXISTS cal_contrib_contributor_idx ON calendar_contributions (contributor_id);
