-- Track per-user read position in each conversation (cross-device unread fix)
-- Run once in Supabase SQL Editor.

-- 1. Add last_read_at column to conversation_members
ALTER TABLE public.conversation_members
  ADD COLUMN IF NOT EXISTS last_read_at TIMESTAMPTZ;

-- 2. Allow members to update their own row (needed to write last_read_at)
CREATE POLICY "conv_members_update_own"
  ON public.conversation_members
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
