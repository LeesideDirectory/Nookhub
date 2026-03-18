-- Admin RPC functions — bypass RLS for admin-only profile mutations.
-- Run once in Supabase SQL Editor.
--
-- Root cause of the bug: profiles_own_update only allows auth.uid() = id,
-- so the admin's update({ suspended }) calls silently affected 0 rows.
-- SECURITY DEFINER functions run as the DB owner and bypass RLS, but they
-- still have access to auth.uid() so we can verify the caller is genuinely
-- the admin before doing anything.

-- 1. Add is_admin flag to profiles (safe to re-run)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;

-- 2. Mark the admin account
UPDATE public.profiles SET is_admin = true WHERE id = 'b13abdda-9561-4b54-a452-1a533d84b5a8';

-- 3. SECURITY DEFINER function: suspend / restore a user
--    Only succeeds if the caller has is_admin = true in their profile row.
CREATE OR REPLACE FUNCTION public.admin_set_user_suspended(
  target_user_id UUID,
  is_suspended    BOOLEAN
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verify the caller is the admin (this SELECT bypasses RLS since we're SECURITY DEFINER)
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true
  ) THEN
    RAISE EXCEPTION 'Access denied: admin only';
  END IF;

  UPDATE public.profiles SET suspended = is_suspended WHERE id = target_user_id;
END;
$$;

-- 4. SECURITY DEFINER function: flag / unflag a user (same issue, same fix)
CREATE OR REPLACE FUNCTION public.admin_set_user_flagged(
  target_user_id UUID,
  is_flagged      BOOLEAN
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true
  ) THEN
    RAISE EXCEPTION 'Access denied: admin only';
  END IF;

  UPDATE public.profiles SET flagged = is_flagged WHERE id = target_user_id;
END;
$$;
