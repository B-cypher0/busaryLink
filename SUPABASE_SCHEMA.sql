-- ============================================================
-- BursaryLink — Supabase Schema
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- 1. APPLICATIONS TABLE
create table if not exists public.applications (
  id            uuid default gen_random_uuid() primary key,
  user_id       uuid references auth.users(id) on delete cascade not null,
  full_name     text,
  id_number     text,
  phone         text,
  province      text,
  race          text,
  gender        text,
  disability    text default 'None',
  monthly_income numeric,
  grade         text,
  institution   text,
  field_of_study text,
  avg           numeric,
  s_math        numeric,
  s_science     numeric,
  s_english     numeric,
  s_biology     numeric,
  s_accounting  numeric,
  s_geography   numeric,
  statement     text,
  career_goal   text,
  results_url   text,
  score         integer default 0,
  bursaries     text[],
  updated_at    timestamptz default now()
);

-- 2. ROW LEVEL SECURITY
alter table public.applications enable row level security;

-- Students can only see and edit their own application
create policy "Students manage own application"
  on public.applications
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Admins (service role) can read all — used for the Review page
-- (The Review page will need the service role key or an admin check)
-- For now, allow authenticated reads for admin UI:
create policy "Authenticated users can read all (admin)"
  on public.applications
  for select
  using (auth.role() = 'authenticated');

-- 3. STORAGE BUCKET for results documents
insert into storage.buckets (id, name, public)
values ('results-docs', 'results-docs', true)
on conflict do nothing;

-- Allow authenticated users to upload to their own folder
create policy "Students upload own results"
  on storage.objects
  for insert
  with check (
    bucket_id = 'results-docs'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- Allow public reads (so admins can view docs via URL)
create policy "Public can read results docs"
  on storage.objects
  for select
  using (bucket_id = 'results-docs');
