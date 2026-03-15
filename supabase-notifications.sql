-- supabase-notifications.sql
-- Run once in Supabase SQL Editor.
-- Creates the persistent notifications table used by the bell icon.

CREATE TABLE IF NOT EXISTS notifications (
  id           UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID         NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type         TEXT         NOT NULL,          -- 'follow' | 'like' | 'comment' | 'mention' | 'calendar_share'
  uid          TEXT,                           -- the user who triggered this notification (another user's UUID)
  name         TEXT,                           -- display name of the triggering user
  text         TEXT         NOT NULL,          -- human-readable notification text
  read         BOOLEAN      NOT NULL DEFAULT FALSE,
  created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Index to keep per-user queries fast
CREATE INDEX IF NOT EXISTS notifications_user_id_created_at
  ON notifications (user_id, created_at DESC);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Users can read their own notifications
CREATE POLICY "notifs_select" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert notifications for themselves only
-- (all notifications are created client-side by the recipient — no server-side triggers needed)
CREATE POLICY "notifs_insert" ON notifications
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can mark their own notifications read
CREATE POLICY "notifs_update" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own notifications
CREATE POLICY "notifs_delete" ON notifications
  FOR DELETE USING (auth.uid() = user_id);
