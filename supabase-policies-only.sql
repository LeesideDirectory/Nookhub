-- Run this AFTER manually deleting all policies on conversation_members
-- and conversations via the Supabase Dashboard UI (Authentication > Policies)

-- conversation_members: simple, no recursion
CREATE POLICY "conv_members_read"   ON public.conversation_members
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "conv_members_insert" ON public.conversation_members
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- conversations: safe to reference conversation_members now that its policy is simple
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

-- chat_messages
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id               UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id  UUID REFERENCES public.conversations(id) ON DELETE CASCADE NOT NULL,
  sender_id        UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content          TEXT NOT NULL,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "chat_messages_member_read"   ON public.chat_messages;
DROP POLICY IF EXISTS "chat_messages_member_insert" ON public.chat_messages;

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
