-- Add identity fields to profiles for Google sign-in visibility.
-- Run in Supabase SQL Editor (safe to re-run).

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS email TEXT,
  ADD COLUMN IF NOT EXISTS auth_provider TEXT,
  ADD COLUMN IF NOT EXISTS provider_user_id TEXT,
  ADD COLUMN IF NOT EXISTS email_verified BOOLEAN,
  ADD COLUMN IF NOT EXISTS last_sign_in_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS profiles_auth_provider_idx ON public.profiles(auth_provider);
CREATE INDEX IF NOT EXISTS profiles_email_idx ON public.profiles(email);

