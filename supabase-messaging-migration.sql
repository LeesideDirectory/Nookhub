-- ============================================================
-- Nook — Messaging Migration
-- Run this in: Supabase Dashboard → SQL Editor → New query
--
-- Fixes:
--   1. Creates chat_messages table (referenced by useMessages.js
--      but never actually created in the original schema)
--   2. Adds missing RLS policies for conversations and
--      conversation_members (RLS was enabled but no policies
--      existed, so ALL reads/writes were silently denied)
-- ============================================================


-- ── 1. chat_messages ─────────────────────────────────────────
-- This is the table useMessages.js actually queries.
-- The original schema had a different "messages" table with
-- different column names (user_id/body vs sender_id/content).

create table if not exists public.chat_messages (
  id               uuid default gen_random_uuid() primary key,
  conversation_id  uuid references public.conversations(id) on delete cascade not null,
  sender_id        uuid references auth.users(id) on delete cascade not null,
  content          text not null,
  created_at       timestamptz default now()
);

create index if not exists idx_chat_messages_convo
  on public.chat_messages(conversation_id, created_at asc);

alter table public.chat_messages enable row level security;


-- ── 2. RLS policies for conversations ────────────────────────
-- Members can read conversations they belong to.
-- Any authenticated user can create a conversation.

do $$ begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'conversations' and policyname = 'conversations_member_read'
  ) then
    execute $p$
      create policy "conversations_member_read" on public.conversations
        for select using (
          exists (
            select 1 from public.conversation_members
            where conversation_id = conversations.id
              and user_id = auth.uid()
          )
        )
    $p$;
  end if;
end $$;

do $$ begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'conversations' and policyname = 'conversations_authenticated_insert'
  ) then
    execute $p$
      create policy "conversations_authenticated_insert" on public.conversations
        for insert with check (auth.uid() is not null)
    $p$;
  end if;
end $$;


-- ── 3. RLS policies for conversation_members ─────────────────
-- A user can read membership rows for any conversation they
-- are themselves a member of.
-- Any authenticated user can insert membership rows
-- (the app always adds the current user as a member).

do $$ begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'conversation_members' and policyname = 'conv_members_read'
  ) then
    execute $p$
      create policy "conv_members_read" on public.conversation_members
        for select using (
          user_id = auth.uid()
          or exists (
            select 1 from public.conversation_members cm2
            where cm2.conversation_id = conversation_members.conversation_id
              and cm2.user_id = auth.uid()
          )
        )
    $p$;
  end if;
end $$;

do $$ begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'conversation_members' and policyname = 'conv_members_insert'
  ) then
    execute $p$
      create policy "conv_members_insert" on public.conversation_members
        for insert with check (auth.uid() is not null)
    $p$;
  end if;
end $$;


-- ── 4. RLS policies for chat_messages ────────────────────────
-- Members of a conversation can read and post messages.

do $$ begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'chat_messages' and policyname = 'chat_messages_member_read'
  ) then
    execute $p$
      create policy "chat_messages_member_read" on public.chat_messages
        for select using (
          exists (
            select 1 from public.conversation_members
            where conversation_id = chat_messages.conversation_id
              and user_id = auth.uid()
          )
        )
    $p$;
  end if;
end $$;

do $$ begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'chat_messages' and policyname = 'chat_messages_member_insert'
  ) then
    execute $p$
      create policy "chat_messages_member_insert" on public.chat_messages
        for insert with check (
          auth.uid() = sender_id
          and exists (
            select 1 from public.conversation_members
            where conversation_id = chat_messages.conversation_id
              and user_id = auth.uid()
          )
        )
    $p$;
  end if;
end $$;


-- ── Done ──────────────────────────────────────────────────────
-- After running this, messaging (DMs + group chats) should work:
--   • Creating conversations and adding members will succeed
--   • fetchConversations will return the user's conversations
--   • sendMessage will insert into chat_messages
--   • fetchMessages will return messages for a conversation
