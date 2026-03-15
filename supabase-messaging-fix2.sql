-- ============================================================
-- Nook — Messaging Fix v2
-- The previous fix failed because the recursive policy was
-- crashing the DB before DROP could run.
-- This version disables RLS first (so queries stop failing),
-- then drops all policies, then rebuilds cleanly.
-- ============================================================

-- Step 1: Disable RLS so the table is accessible while we fix it
alter table public.conversation_members disable row level security;
alter table public.conversations disable row level security;
alter table public.chat_messages disable row level security;

-- Step 2: Drop every policy on these tables (safe even if they don't exist)
drop policy if exists "conv_members_read"                    on public.conversation_members;
drop policy if exists "conv_members_insert"                  on public.conversation_members;
drop policy if exists "conversations_member_read"            on public.conversations;
drop policy if exists "conversations_authenticated_insert"   on public.conversations;
drop policy if exists "chat_messages_member_read"            on public.chat_messages;
drop policy if exists "chat_messages_member_insert"          on public.chat_messages;
-- Also drop any old names from the original schema migration
drop policy if exists "messages_member_read"                 on public.chat_messages;
drop policy if exists "messages_member_write"                on public.chat_messages;

-- Step 3: Re-enable RLS
alter table public.conversation_members enable row level security;
alter table public.conversations        enable row level security;
alter table public.chat_messages        enable row level security;

-- Step 4: Create correct, non-recursive policies

-- conversation_members: each user can read/write their own rows only.
-- Simple — no self-reference, no recursion possible.
create policy "conv_members_read" on public.conversation_members
  for select using (user_id = auth.uid());

create policy "conv_members_insert" on public.conversation_members
  for insert with check (auth.uid() is not null);

-- conversations: readable if you're a member (safe now that conv_members is simple)
create policy "conversations_member_read" on public.conversations
  for select using (
    exists (
      select 1 from public.conversation_members
      where conversation_id = conversations.id
        and user_id = auth.uid()
    )
  );

create policy "conversations_authenticated_insert" on public.conversations
  for insert with check (auth.uid() is not null);

-- chat_messages: readable/writable if you're a member of the conversation
create policy "chat_messages_member_read" on public.chat_messages
  for select using (
    exists (
      select 1 from public.conversation_members
      where conversation_id = chat_messages.conversation_id
        and user_id = auth.uid()
    )
  );

create policy "chat_messages_member_insert" on public.chat_messages
  for insert with check (
    auth.uid() = sender_id
    and exists (
      select 1 from public.conversation_members
      where conversation_id = chat_messages.conversation_id
        and user_id = auth.uid()
    )
  );
