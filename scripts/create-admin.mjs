/**
 * Creates or updates the dashboard admin in Supabase Auth and sets profiles.is_admin.
 *
 * Requires in .env.local:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *   NEXT_PUBLIC_SUPABASE_ANON_KEY  OR  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY  (for login test)
 *
 * Usage: npm run seed:admin
 *
 * Defaults (override with ADMIN_EMAIL / ADMIN_PASSWORD in .env.local):
 *   admin@gmail.com / Admin@123
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync, existsSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')

function loadEnvLocal() {
  const p = join(root, '.env.local')
  if (!existsSync(p)) return
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
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()
const anonKey = (
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY ||
  ''
).trim()
const email = (process.env.ADMIN_EMAIL || 'admin@gmail.com').trim()
const password = (process.env.ADMIN_PASSWORD || 'Admin@123').trim()

if (!url || !serviceKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local')
  process.exit(1)
}

const admin = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

async function findUserByEmail(target) {
  let page = 1
  const perPage = 1000
  for (;;) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage })
    if (error) throw error
    const u = data.users.find((x) => x.email?.toLowerCase() === target.toLowerCase())
    if (u) return u
    if (!data.users.length || data.users.length < perPage) return null
    page += 1
  }
}

async function ensurePasswordAndConfirmed(userId) {
  const { error: e1 } = await admin.auth.admin.updateUserById(userId, { password })
  if (e1) throw new Error(`Set password failed: ${e1.message}`)
  const { error: e2 } = await admin.auth.admin.updateUserById(userId, { email_confirm: true })
  if (e2) throw new Error(`Confirm email failed: ${e2.message}`)
}

async function main() {
  let userId

  const existing = await findUserByEmail(email)
  if (existing) {
    userId = existing.id
    await ensurePasswordAndConfirmed(userId)
    console.log('Updated password + confirmed email for:', email)
    const { data: ucheck } = await admin.auth.admin.getUserById(userId)
    console.log('email_confirmed_at:', ucheck.user?.email_confirmed_at || '(null — still not confirmed)')
    if (ucheck.user?.identities?.length) {
      console.log(
        'identities:',
        ucheck.user.identities.map((i) => `${i.provider} (${i.identity_id?.slice(0, 8)}…)`).join(', ')
      )
    }
  } else {
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name: 'Admin' },
    })
    if (error) {
      console.error('createUser failed:', error.message)
      if (error.message?.toLowerCase().includes('already')) {
        console.error('Try: delete this user in Supabase → Authentication → Users, then run npm run seed:admin again.')
      }
      process.exit(1)
    }
    userId = data.user.id
    await ensurePasswordAndConfirmed(userId)
    console.log('Created user:', email)
  }

  const { error: pErr } = await admin.from('profiles').upsert(
    { id: userId, name: 'Admin', is_admin: true },
    { onConflict: 'id' }
  )
  if (pErr) {
    const { error: u2 } = await admin.from('profiles').update({ is_admin: true }).eq('id', userId)
    if (u2) throw u2
  }

  console.log('profiles.is_admin = true for', userId)

  if (!anonKey) {
    console.log('')
    console.warn('(!) Add NEXT_PUBLIC_SUPABASE_ANON_KEY or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY to .env.local')
    console.warn('    to match this project — the app cannot sign in without the same URL + anon/publishable key.')
    return
  }

  const anonClient = createClient(url, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
  const { data: signData, error: signErr } = await anonClient.auth.signInWithPassword({ email, password })
  if (signErr) {
    console.log('')
    console.error('LOGIN TEST FAILED (same check as the browser):', signErr.message)
    console.error('Common fixes:')
    console.error('  1) .env.local NEXT_PUBLIC_SUPABASE_URL must match the project where this user exists.')
    console.error('  2) NEXT_PUBLIC_* anon/publishable key must be from the SAME project (Settings → API).')
    console.error('  3) If this email only uses "Sign in with Google", use Google or remove that user and run this script again.')
    process.exit(1)
  }

  await anonClient.auth.signOut()
  console.log('')
  console.log('OK — signInWithPassword succeeded with your public key (browser login should work).')
  console.log('  Email:', email)
  console.log('  Password: (what you set in ADMIN_PASSWORD or default Admin@123)')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
