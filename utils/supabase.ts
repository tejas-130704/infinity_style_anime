import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
/** Dashboard “publishable” key or legacy anon key — same role for client-side access. */
const supabaseKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

/**
 * Singleton client for quick client-side usage (e.g. `useEffect` demos).
 * This app also uses `@/lib/supabase/client` (SSR cookies) for auth + API routes.
 */
export const supabase = createClient(supabaseUrl, supabaseKey)
