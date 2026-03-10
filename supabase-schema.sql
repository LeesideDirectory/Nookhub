-- ============================================================
-- Nook — Supabase Schema
-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor)
-- ============================================================

-- 1. User profiles (extends Supabase auth.users)
create table if not exists public.profiles (
  id            uuid references auth.users(id) on delete cascade primary key,
  email         text,
  name          text not null default '',
  handle        text unique,
  bio           text default '',
  avatar_color  text default '#C9B8F0',
  avatar_url    text,
  joined        timestamptz default now(),
  updated_at    timestamptz default now()
);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, name, handle)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'handle', '@' || split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 2. Generic user data store (widget state, preferences, etc.)
create table if not exists public.user_data (
  id          bigint generated always as identity primary key,
  user_id     uuid references auth.users(id) on delete cascade not null,
  key         text not null,
  value       jsonb not null default '{}',
  updated_at  timestamptz default now(),
  unique(user_id, key)
);

-- 3. Social follows
create table if not exists public.follows (
  follower_id   uuid references auth.users(id) on delete cascade,
  following_id  uuid references auth.users(id) on delete cascade,
  created_at    timestamptz default now(),
  primary key (follower_id, following_id)
);

-- 4. Feed posts
create table if not exists public.posts (
  id          uuid default gen_random_uuid() primary key,
  user_id     uuid references auth.users(id) on delete cascade not null,
  type        text not null, -- blog | photo | reading | goal | mood
  payload     jsonb not null default '{}',
  is_public   boolean default true,
  created_at  timestamptz default now()
);

-- 5. Post likes
create table if not exists public.likes (
  user_id   uuid references auth.users(id) on delete cascade,
  post_id   uuid references public.posts(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (user_id, post_id)
);

-- 6. Comments
create table if not exists public.comments (
  id          uuid default gen_random_uuid() primary key,
  post_id     uuid references public.posts(id) on delete cascade not null,
  user_id     uuid references auth.users(id) on delete cascade not null,
  body        text not null,
  created_at  timestamptz default now()
);

-- 7. Direct messages / conversations
create table if not exists public.conversations (
  id          uuid default gen_random_uuid() primary key,
  type        text default 'dm', -- dm | group
  name        text,
  created_at  timestamptz default now()
);

create table if not exists public.conversation_members (
  conversation_id  uuid references public.conversations(id) on delete cascade,
  user_id          uuid references auth.users(id) on delete cascade,
  joined_at        timestamptz default now(),
  primary key (conversation_id, user_id)
);

create table if not exists public.messages (
  id               uuid default gen_random_uuid() primary key,
  conversation_id  uuid references public.conversations(id) on delete cascade not null,
  user_id          uuid references auth.users(id) on delete cascade not null,
  body             text not null,
  created_at       timestamptz default now()
);

-- ============================================================
-- Row Level Security
-- ============================================================

alter table public.profiles             enable row level security;
alter table public.user_data            enable row level security;
alter table public.follows              enable row level security;
alter table public.posts                enable row level security;
alter table public.likes                enable row level security;
alter table public.comments             enable row level security;
alter table public.conversations        enable row level security;
alter table public.conversation_members enable row level security;
alter table public.messages             enable row level security;

-- profiles: public read, own write
create policy "profiles_public_read"  on public.profiles for select using (true);
create policy "profiles_own_update"   on public.profiles for update using (auth.uid() = id);

-- user_data: private to owner
create policy "user_data_own"  on public.user_data for all using (auth.uid() = user_id);

-- follows: public read, own write
create policy "follows_public_read"   on public.follows for select using (true);
create policy "follows_own_insert"    on public.follows for insert with check (auth.uid() = follower_id);
create policy "follows_own_delete"    on public.follows for delete using (auth.uid() = follower_id);

-- posts: public read if is_public, own all
create policy "posts_public_read"  on public.posts for select using (is_public = true or auth.uid() = user_id);
create policy "posts_own_write"    on public.posts for insert with check (auth.uid() = user_id);
create policy "posts_own_update"   on public.posts for update using (auth.uid() = user_id);
create policy "posts_own_delete"   on public.posts for delete using (auth.uid() = user_id);

-- likes: public read, own write
create policy "likes_public_read"  on public.likes for select using (true);
create policy "likes_own_write"    on public.likes for insert with check (auth.uid() = user_id);
create policy "likes_own_delete"   on public.likes for delete using (auth.uid() = user_id);

-- comments: public read, own write
create policy "comments_public_read"  on public.comments for select using (true);
create policy "comments_own_write"    on public.comments for insert with check (auth.uid() = user_id);
create policy "comments_own_delete"   on public.comments for delete using (auth.uid() = user_id);

-- messages: members only
create policy "messages_member_read" on public.messages for select
  using (exists (
    select 1 from public.conversation_members
    where conversation_id = messages.conversation_id and user_id = auth.uid()
  ));
create policy "messages_member_write" on public.messages for insert
  with check (auth.uid() = user_id and exists (
    select 1 from public.conversation_members
    where conversation_id = messages.conversation_id and user_id = auth.uid()
  ));

-- ============================================================
-- Useful indexes
-- ============================================================
create index if not exists idx_user_data_user_key  on public.user_data(user_id, key);
create index if not exists idx_posts_user          on public.posts(user_id, created_at desc);
create index if not exists idx_follows_following   on public.follows(following_id);
create index if not exists idx_messages_convo      on public.messages(conversation_id, created_at asc);
