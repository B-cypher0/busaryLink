-- Run in Supabase SQL Editor

-- StudentHub table
CREATE TABLE IF NOT EXISTS public.student_hub (
  id          uuid default gen_random_uuid() primary key,
  user_id     uuid references auth.users(id) on delete cascade not null unique,
  course      text,
  current_year integer default 1,
  results     jsonb default '{}',
  updated_at  timestamptz default now()
);
ALTER TABLE public.student_hub ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Students manage own hub" ON public.student_hub FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Authenticated read hub" ON public.student_hub FOR SELECT USING (auth.role() = 'authenticated');

-- Add missing columns to applications
ALTER TABLE public.applications ADD COLUMN IF NOT EXISTS doc_verified boolean DEFAULT false;
ALTER TABLE public.applications ADD COLUMN IF NOT EXISTS email text;
