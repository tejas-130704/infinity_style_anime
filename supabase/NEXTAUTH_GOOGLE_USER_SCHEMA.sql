-- NextAuth Google users schema alignment for profiles (safe to re-run)

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS email TEXT,
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS role TEXT,
  ADD COLUMN IF NOT EXISTS avatar_url TEXT,
  ADD COLUMN IF NOT EXISTS last_sign_in_at TIMESTAMPTZ;

-- Backfill role from existing admin flag where role is missing.
UPDATE public.profiles
SET role = CASE WHEN is_admin THEN 'admin' ELSE 'user' END
WHERE role IS NULL;

ALTER TABLE public.profiles
  ALTER COLUMN role SET DEFAULT 'user';

-- Unique email for account matching in NextAuth callback logic.
CREATE UNIQUE INDEX IF NOT EXISTS profiles_email_unique_idx
  ON public.profiles (LOWER(email))
  WHERE email IS NOT NULL;

