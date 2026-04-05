/**
 * Verifies Supabase credentials from .env.local:
 *   - Public URL + anon/publishable key → read `products`
 *   - Service role key → read `products` (server/admin)
 *   - Optional: ADMIN_EMAIL + ADMIN_PASSWORD → signInWithPassword
 *
 * Usage: npm run test:supabase
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync, existsSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')

function loadEnvLocal() {
  const p = join(root, '.env.local')
  if (!existsSync(p)) {
    console.error('Missing .env.local — copy .env.example and add Supabase keys.')
    process.exit(1)
  }
  const raw = readFileSync(p, 'utf8')
  for (const line of raw.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq === -1) continue
    const key = trimmed.slice(0, eq).trim()
    let val = trimmed.slice(eq + 1).trim()
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1)
    }
    if (!process.env[key]) process.env[key] = val
  }
}

loadEnvLocal()

const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
const anonKey = (
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY ||
  ''
).trim()
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()

console.log('NEXT_PUBLIC_SUPABASE_URL:', url || '(missing)')
console.log('')

if (!url) {
  console.error('FAIL: NEXT_PUBLIC_SUPABASE_URL is not set.')
  process.exit(1)
}

if (!anonKey) {
  console.error('FAIL: Set NEXT_PUBLIC_SUPABASE_ANON_KEY or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY')
  process.exit(1)
}

const anonClient = createClient(url, anonKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const { error: pubErr, count } = await anonClient.from('products').select('id', { count: 'exact', head: true })

if (pubErr) {
  console.error('FAIL public key — query products:', pubErr.message)
  console.error('  Run supabase/complete_setup.sql in Supabase → SQL Editor.')
  process.exit(1)
}

console.log('OK  public (anon/publishable) key — products count:', count ?? 0)
if ((count ?? 0) === 0) {
  console.warn('WARN: No rows in products.')
  console.warn('     Option A: Supabase → SQL Editor → run supabase/complete_setup.sql')
  console.warn('     Option B: npm run seed:products  (needs tables + SUPABASE_SERVICE_ROLE_KEY)')
}

if (!serviceKey) {
  console.warn('WARN: SUPABASE_SERVICE_ROLE_KEY missing (needed for seed:admin & webhooks).')
} else {
  const svc = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
  const { error: svcErr, count: c2 } = await svc.from('products').select('id', { count: 'exact', head: true })
  if (svcErr) {
    console.error('FAIL service role — query products:', svcErr.message)
    process.exit(1)
  }
  console.log('OK  service role key — products count:', c2 ?? 0)
}

const email = process.env.ADMIN_EMAIL?.trim()
const password = process.env.ADMIN_PASSWORD?.trim()
if (email && password) {
  const { error: signErr } = await anonClient.auth.signInWithPassword({ email, password })
  console.log('')
  if (signErr) {
    console.error('FAIL sign-in (ADMIN_EMAIL / ADMIN_PASSWORD):', signErr.message)
    console.error('  Run: npm run seed:admin')
    process.exit(1)
  }
  console.log('OK  sign-in with ADMIN_EMAIL / ADMIN_PASSWORD')
  await anonClient.auth.signOut()
} else {
  console.log('')
  console.log('(Optional) Set ADMIN_EMAIL + ADMIN_PASSWORD to test password login.')
}

console.log('')
console.log('All credential checks passed.')
process.exit(0)
