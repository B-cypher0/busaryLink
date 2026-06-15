-- Run this in Supabase SQL Editor to add doc_verified column
ALTER TABLE public.applications ADD COLUMN IF NOT EXISTS doc_verified boolean DEFAULT false;
ALTER TABLE public.applications ADD COLUMN IF NOT EXISTS email text;
