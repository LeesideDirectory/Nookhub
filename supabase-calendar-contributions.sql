-- Add contributor_events column to calendar_shares
-- This stores events added by the RECIPIENT (the person shared with),
-- separate from the sharer's own events which live in the `events` column.
-- The sharer's debounce sync only ever touches `events`, so contributions are safe.

ALTER TABLE calendar_shares
  ADD COLUMN IF NOT EXISTS contributor_events jsonb NOT NULL DEFAULT '[]'::jsonb;

-- Allow recipients to update the row (to append/remove their contributions).
-- The sharer already has full access via the existing ALL policy.
DROP POLICY IF EXISTS "Recipients can contribute events" ON calendar_shares;
CREATE POLICY "Recipients can contribute events" ON calendar_shares
  FOR UPDATE
  USING (auth.uid() = to_user_id)
  WITH CHECK (auth.uid() = to_user_id);
