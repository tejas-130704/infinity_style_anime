-- ============================================================
-- Login Activity Tracking Table
-- Run this in your Supabase SQL Editor (Database > SQL Editor)
-- ============================================================

create table if not exists public.login_activity (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.profiles(id) on delete cascade,
  provider     text not null default 'email',   -- 'google' | 'email'
  ip_address   text,
  user_agent   text,
  created_at   timestamptz not null default now()
);

-- Index for fast per-user lookups
create index if not exists login_activity_user_id_idx on public.login_activity(user_id, created_at desc);

-- ── Row Level Security ───────────────────────────────────────
alter table public.login_activity enable row level security;

-- Admins can read all activity
create policy "Admins can read all login activity"
  on public.login_activity for select
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.is_admin = true
    )
  );

-- Users can read their own login activity
create policy "Users can read own login activity"
  on public.login_activity for select
  using (user_id = auth.uid());

-- Only service role can insert (backend only, no client writes)
-- (service_role bypasses RLS by default — no extra policy needed)
