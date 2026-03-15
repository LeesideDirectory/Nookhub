-- ============================================================
-- Nook — Messaging Fix (run this, replaces the previous migration)
-- Supabase Dashboard → SQL Editor → New query → Run
-- ============================================================

-- Drop the broken self-referential policy that causes the 500 error
drop policy if exists "conv_members_read" on public.conversation_members;

-- Simple replacement: each user can only read their own membership rows.
-- This is all fetchConversations needs (it queries where user_id = current user).
-- It also avoids the infinite-recursion crash.
create policy "conv_members_read" on public.conversation_members
  for select using (user_id = auth.uid());

-- Make sure the insert policy exists too
drop policy if exists "conv_members_insert" on public.conversation_members;
create policy "conv_members_insert" on public.conversation_members
  for insert with check (auth.uid() is not null);

-- Fix conversations policies (re-drop and recreate cleanly)
drop policy if exists "conversations_member_read" on public.conversations;
create policy "conversations_member_read" on public.conversations
  for select using (
    exists (
      select 1 from public.conversation_members
      where conversation_id = conversations.id
        and user_id = auth.uid()
    )
  );

drop policy if exists "conversations_authenticated_insert" on public.conversations;
create policy "conversations_authenticated_insert" on public.conversations
  for insert with check (auth.uid() is not null);

-- chat_messages policies (simple: conversation members can read/write)
drop policy if exists "chat_messages_member_read" on public.chat_messages;
create policy "chat_messages_member_read" on public.chat_messages
  for select using (
    exists (
      select 1 from public.conversation_members
      where conversation_id = chat_messages.conversation_id
        and user_id = auth.uid()
    )
  );

drop policy if exists "chat_messages_member_insert" on public.chat_messages;
create policy "chat_messages_member_insert" on public.chat_messages
  for insert with check (
    auth.uid() = sender_id
    and exists (
      select 1 from public.conversation_members
      where conversation_id = chat_messages.conversation_id
        and user_id = auth.uid()
    )
  );
