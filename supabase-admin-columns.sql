-- Admin panel: add suspended and flagged columns to profiles
-- Run this in Supabase → SQL Editor

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS suspended boolean NOT NULL DEFAULT false;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS flagged boolean NOT NULL DEFAULT false;
