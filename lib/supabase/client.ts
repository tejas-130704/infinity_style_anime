import { createBrowserClient } from '@supabase/ssr'
import { getPublicSupabaseEnv, SUPABASE_ENV_HINT } from './env'

export function createClient() {
  const env = getPublicSupabaseEnv()
  if (!env) {
    throw new Error(`Supabase is not configured. ${SUPABASE_ENV_HINT}`)
  }
  return createBrowserClient(env.url, env.anonKey)
}
