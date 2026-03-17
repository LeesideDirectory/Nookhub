-- supabase-notification-source-id.sql
-- Run once in Supabase SQL Editor.
-- Adds source_id column to notifications table so like/comment
-- notifications can link back to the specific post.
-- Also updates the trigger functions to populate source_id.

-- ── 1. Add source_id column (safe — idempotent) ───────────────────────────
ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS source_id TEXT;

-- ── 2. Update notify_on_like to include source_id ─────────────────────────
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

  -- Insert the notification for the post owner (with source_id = post id)
  INSERT INTO public.notifications (user_id, type, uid, name, text, source_id)
  VALUES (v_owner, 'like', NEW.user_id::TEXT, v_liker_name,
          v_liker_name || ' liked: ' || v_desc,
          NEW.post_id::TEXT);

  RETURN NEW;
END;
$$;

-- ── 3. Update notify_on_comment to include source_id ─────────────────────
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

  -- Insert the notification for the post owner (with source_id = post id)
  INSERT INTO public.notifications (user_id, type, uid, name, text, source_id)
  VALUES (v_owner, 'comment', NEW.user_id::TEXT, v_commenter_name, v_notif_text,
          NEW.post_id::TEXT);

  RETURN NEW;
END;
$$;
