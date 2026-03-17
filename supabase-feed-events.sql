-- supabase-feed-events.sql
-- Run once in Supabase SQL Editor.
-- Adds columns to posts table used by widget feed events,
-- and enables Realtime for posts, likes and comments tables.

-- 1. Ensure posts table has content and image_url columns (optional — app stores content in payload.text)
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS content text;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS image_url text;

-- 2. Add index on posts.created_at for fast feed queries
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON public.posts(created_at DESC);

-- 3. Enable Realtime for posts, likes and comments tables
-- (posts needed so feed updates appear in real-time for followers)
-- (likes/comments needed so notification subscriptions work)
ALTER PUBLICATION supabase_realtime ADD TABLE public.posts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.likes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.comments;

-- If any of the above throw "relation already exists in publication", use this safe version instead:
-- DO $$
-- BEGIN
--   IF NOT EXISTS (
--     SELECT 1 FROM pg_publication_tables
--     WHERE pubname = 'supabase_realtime' AND tablename = 'posts'
--   ) THEN
--     ALTER PUBLICATION supabase_realtime ADD TABLE public.posts;
--   END IF;
--   IF NOT EXISTS (
--     SELECT 1 FROM pg_publication_tables
--     WHERE pubname = 'supabase_realtime' AND tablename = 'likes'
--   ) THEN
--     ALTER PUBLICATION supabase_realtime ADD TABLE public.likes;
--   END IF;
--   IF NOT EXISTS (
--     SELECT 1 FROM pg_publication_tables
--     WHERE pubname = 'supabase_realtime' AND tablename = 'comments'
--   ) THEN
--     ALTER PUBLICATION supabase_realtime ADD TABLE public.comments;
--   END IF;
-- END
-- $$;
