-- ============================================================
-- supabase-signup-fix.sql
-- Adds created_at to profiles and backfills real signup dates
-- from auth.users so the admin signup chart shows real data.
--
-- Safe to re-run (uses IF NOT EXISTS / OR REPLACE).
-- Run this in: Supabase Dashboard → SQL Editor
-- ============================================================

-- 1. Add created_at column to profiles (default NOW() for any
--    future rows that don't go through the trigger below)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- 2. Backfill existing profiles with the REAL signup date from
--    auth.users (profiles.id IS the auth user id in Supabase)
UPDATE public.profiles p
SET created_at = u.created_at
FROM auth.users u
WHERE p.id = u.id;

-- 3. Function: copy created_at from auth.users on new profile insert
--    so the column is always accurate going forward.
CREATE OR REPLACE FUNCTION public.set_profile_created_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Pull the real signup timestamp from auth.users
  SELECT created_at INTO NEW.created_at
  FROM auth.users
  WHERE id = NEW.id;

  -- Fallback: use current time if auth row is somehow missing
  IF NEW.created_at IS NULL THEN
    NEW.created_at := NOW();
  END IF;

  RETURN NEW;
END;
$$;

-- 4. Trigger: fires BEFORE INSERT on profiles
DROP TRIGGER IF EXISTS trg_profile_created_at ON public.profiles;
CREATE TRIGGER trg_profile_created_at
  BEFORE INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.set_profile_created_at();
