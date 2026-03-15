-- Fix: allow users to see ALL members of conversations they belong to.
--
-- The naive approach (conversation_id IN (SELECT ... FROM conversation_members WHERE user_id = auth.uid()))
-- causes infinite recursion (Postgres 42P17) because the policy references its own table.
--
-- The fix: a SECURITY DEFINER function that bypasses RLS to get the current user's
-- conversation IDs. The policy then calls this function, which queries conversation_members
-- as the function owner (bypassing RLS), breaking the recursion entirely.

-- Step 1: Create the helper function (runs as postgres, bypasses RLS)
CREATE OR REPLACE FUNCTION public.my_conversation_ids()
RETURNS SETOF UUID
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT conversation_id
  FROM conversation_members
  WHERE user_id = auth.uid();
$$;

-- Step 2: Replace the restrictive read policy with one that allows seeing all members
DROP POLICY IF EXISTS "conv_members_read" ON public.conversation_members;

CREATE POLICY "conv_members_read" ON public.conversation_members
  FOR SELECT USING (
    conversation_id IN (SELECT public.my_conversation_ids())
  );
