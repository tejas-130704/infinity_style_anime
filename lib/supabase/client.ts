import type { SupabaseClient } from '@supabase/supabase-js'
import { createBrowserClient } from '@supabase/ssr'
import { getPublicSupabaseEnv, SUPABASE_ENV_HINT } from './env'

/**
 * Single browser client per tab. Multiple `createBrowserClient` instances fight over the same
 * GoTrue storage lock and cause "Lock … was not released" / AbortError in dev (Strict Mode).
 */
const globalForSupabase = globalThis as unknown as { __supabaseBrowser?: SupabaseClient }

export function createClient(): SupabaseClient {
  const env = getPublicSupabaseEnv()
  if (!env) {
    throw new Error(`Supabase is not configured. ${SUPABASE_ENV_HINT}`)
  }
  if (!globalForSupabase.__supabaseBrowser) {
    globalForSupabase.__supabaseBrowser = createBrowserClient(env.url, env.anonKey)
  }
  return globalForSupabase.__supabaseBrowser
}
