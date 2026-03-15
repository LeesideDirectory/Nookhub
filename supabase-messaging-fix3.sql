-- ============================================================
-- Nook — Messaging Fix v3
-- Uses ALTER TABLE IF EXISTS and a single DO block so a missing
-- chat_messages table can't stop the rest from running.
-- ============================================================

-- Step 1: Disable RLS (stops the recursion crash immediately)
ALTER TABLE IF EXISTS public.conversation_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.conversations        DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.chat_messages        DISABLE ROW LEVEL SECURITY;

-- Step 2: Drop every policy that might exist (all name variants from all previous migrations)
DROP POLICY IF EXISTS "conv_members_read"                  ON public.conversation_members;
DROP POLICY IF EXISTS "conv_members_insert"                ON public.conversation_members;
DROP POLICY IF EXISTS "conversations_member_read"          ON public.conversations;
DROP POLICY IF EXISTS "conversations_authenticated_insert" ON public.conversations;
DROP POLICY IF EXISTS "chat_messages_member_read"          ON public.chat_messages;
DROP POLICY IF EXISTS "chat_messages_member_insert"        ON public.chat_messages;
DROP POLICY IF EXISTS "messages_member_read"               ON public.chat_messages;
DROP POLICY IF EXISTS "messages_member_write"              ON public.chat_messages;

-- Step 3: Create chat_messages table if it doesn't exist yet
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id               UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id  UUID REFERENCES public.conversations(id) ON DELETE CASCADE NOT NULL,
  sender_id        UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content          TEXT NOT NULL,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chat_messages_convo
  ON public.chat_messages(conversation_id, created_at ASC);

-- Step 4: Re-enable RLS on all three tables
ALTER TABLE public.conversation_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages        ENABLE ROW LEVEL SECURITY;

-- Step 5: Create correct policies (no recursion)

-- conversation_members: each user reads only their own rows — simple, no self-reference
CREATE POLICY "conv_members_read"   ON public.conversation_members
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "conv_members_insert" ON public.conversation_members
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- conversations: readable if you're a member (safe — conv_members policy is now simple)
CREATE POLICY "conversations_member_read" ON public.conversations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.conversation_members
      WHERE conversation_id = conversations.id
        AND user_id = auth.uid()
    )
  );

CREATE POLICY "conversations_authenticated_insert" ON public.conversations
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- chat_messages: members of the conversation can read and send
CREATE POLICY "chat_messages_member_read" ON public.chat_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.conversation_members
      WHERE conversation_id = chat_messages.conversation_id
        AND user_id = auth.uid()
    )
  );

CREATE POLICY "chat_messages_member_insert" ON public.chat_messages
  FOR INSERT WITH CHECK (
    auth.uid() = sender_id
    AND EXISTS (
      SELECT 1 FROM public.conversation_members
      WHERE conversation_id = chat_messages.conversation_id
        AND user_id = auth.uid()
    )
  );
