-- Enable Supabase Realtime for the follows table.
-- Run this ONCE in the Supabase SQL Editor (Database → SQL Editor).
--
-- This adds the follows table to the supabase_realtime publication so that
-- postgres_changes subscriptions on the follows table will fire correctly.
-- No REPLICA IDENTITY FULL is needed because we only subscribe to INSERT events
-- and use client-side filtering (no server-side row filter).

ALTER PUBLICATION supabase_realtime ADD TABLE public.follows;
