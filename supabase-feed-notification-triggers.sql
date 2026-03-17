-- supabase-feed-notification-triggers.sql
-- Run once in Supabase SQL Editor.
--
-- Creates server-side triggers that insert a row into the notifications table
-- whenever someone likes or comments on another user's post.
-- This is the most reliable notification mechanism — it runs inside Postgres
-- so it works regardless of whether any client is online.
--
-- Also adds the notifications table to the Realtime publication so the
-- post owner's client receives the new notification row in real-time.

-- ── 1. Add notifications table to Realtime publication ───────────────────
-- (Safe — uses DO block to skip if already a member)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'notifications'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
  END IF;
END
$$;

-- ── 2. Trigger function: notify post owner on like ───────────────────────
CREATE OR REPLACE FUNCTION public.notify_on_like()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_owner        UUID;
  v_liker_name   TEXT;
  v_post_content TEXT;
  v_post_payload JSONB;
  v_desc         TEXT;
BEGIN
  -- Get the post owner
  SELECT user_id, content, payload
    INTO v_owner, v_post_content, v_post_payload
    FROM public.posts WHERE id = NEW.post_id;

  -- Skip if post not found or if the liker is the post owner
  IF v_owner IS NULL OR v_owner = NEW.user_id THEN
    RETURN NEW;
  END IF;

  -- Get the liker's display name
  SELECT COALESCE(name, handle, 'Someone')
    INTO v_liker_name
    FROM public.profiles WHERE id = NEW.user_id;
  v_liker_name := COALESCE(v_liker_name, 'Someone');

  -- Build a short description of the liked post
  v_desc := COALESCE(
    v_post_payload->'post'->>'title',
    v_post_payload->'book'->>'title',
    v_post_payload->'activity'->>'type',
    LEFT(v_post_content, 40),
    'your post'
  );

  -- Insert the notification for the post owner
  INSERT INTO public.notifications (user_id, type, uid, name, text)
  VALUES (v_owner, 'like', NEW.user_id::TEXT, v_liker_name,
          v_liker_name || ' liked: ' || v_desc);

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_on_like ON public.likes;
CREATE TRIGGER trg_notify_on_like
  AFTER INSERT ON public.likes
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_like();

-- ── 3. Trigger function: notify post owner on comment ────────────────────
CREATE OR REPLACE FUNCTION public.notify_on_comment()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_owner          UUID;
  v_commenter_name TEXT;
  v_post_content   TEXT;
  v_post_payload   JSONB;
  v_preview        TEXT;
  v_notif_text     TEXT;
BEGIN
  -- Get the post owner
  SELECT user_id, content, payload
    INTO v_owner, v_post_content, v_post_payload
    FROM public.posts WHERE id = NEW.post_id;

  -- Skip if post not found or if the commenter is the post owner
  IF v_owner IS NULL OR v_owner = NEW.user_id THEN
    RETURN NEW;
  END IF;

  -- Get the commenter's display name
  SELECT COALESCE(name, handle, 'Someone')
    INTO v_commenter_name
    FROM public.profiles WHERE id = NEW.user_id;
  v_commenter_name := COALESCE(v_commenter_name, 'Someone');

  -- Build a short post preview for the notification text
  v_preview := COALESCE(
    v_post_payload->'post'->>'title',
    LEFT(v_post_content, 40)
  );

  v_notif_text := v_commenter_name || ' commented on your post' ||
    CASE
      WHEN v_preview IS NOT NULL AND v_preview != ''
      THEN ': "' || v_preview ||
           CASE WHEN LENGTH(COALESCE(v_post_content, '')) > 40 THEN '…' ELSE '' END ||
           '"'
      ELSE ''
    END;

  -- Insert the notification for the post owner
  INSERT INTO public.notifications (user_id, type, uid, name, text)
  VALUES (v_owner, 'comment', NEW.user_id::TEXT, v_commenter_name, v_notif_text);

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_on_comment ON public.comments;
CREATE TRIGGER trg_notify_on_comment
  AFTER INSERT ON public.comments
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_comment();
