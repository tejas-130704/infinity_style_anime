/**
 * Returns URL + public anon/publishable key when both are set; otherwise null.
 * Supports both legacy `NEXT_PUBLIC_SUPABASE_ANON_KEY` and dashboard `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY`.
 */
export function getPublicSupabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
  const anonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY?.trim()
  if (!url || !anonKey) return null
  return { url, anonKey }
}

export const SUPABASE_ENV_HINT =
  'Copy .env.example to .env.local and set NEXT_PUBLIC_SUPABASE_URL plus either NEXT_PUBLIC_SUPABASE_ANON_KEY or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY (Supabase → Settings → API).'
