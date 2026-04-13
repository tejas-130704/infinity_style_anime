-- Encrypted Google OAuth token storage + provider identity (safe to re-run).
-- Tokens are AES-256-GCM ciphertext (base64) produced by the app — never store plaintext.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS google_access_token_enc TEXT,
  ADD COLUMN IF NOT EXISTS google_refresh_token_enc TEXT;

-- Match user spec: provider + provider_id (aligns with existing auth_provider / provider_user_id)
-- auth_provider / provider_user_id may already exist from GOOGLE_AUTH_PROFILE_SYNC.sql

CREATE UNIQUE INDEX IF NOT EXISTS profiles_provider_google_sub_unique_idx
  ON public.profiles (provider_user_id)
  WHERE provider_user_id IS NOT NULL AND auth_provider = 'google';
