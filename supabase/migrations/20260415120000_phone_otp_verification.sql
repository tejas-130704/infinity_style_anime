-- Phone OTP verification for checkout & account

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS phone_verified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS alt_phone TEXT,
  ADD COLUMN IF NOT EXISTS alt_phone_verified BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS alt_phone_verified_at TIMESTAMPTZ;

COMMENT ON COLUMN public.profiles.phone_verified IS 'Set true after successful OTP for profiles.phone';
COMMENT ON COLUMN public.profiles.alt_phone IS 'Optional alternate contact; verify separately';

CREATE TABLE IF NOT EXISTS public.phone_otp_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  phone_normalized TEXT NOT NULL,
  scope TEXT NOT NULL CHECK (scope IN ('primary', 'alternate')),
  otp_hash TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  attempts INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT phone_otp_unique_user_scope UNIQUE (user_id, scope)
);

CREATE INDEX IF NOT EXISTS phone_otp_expires_idx ON public.phone_otp_challenges(expires_at);

ALTER TABLE public.phone_otp_challenges ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.phone_otp_challenges IS 'OTP challenges; accessed only via service role from API routes';
