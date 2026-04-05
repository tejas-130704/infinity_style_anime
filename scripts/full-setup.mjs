/**
 * full-setup.mjs — schema + demo data + admin user via Supabase service role
 * Usage: npm run setup:full
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync, existsSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')

function loadEnvLocal() {
  const p = join(root, '.env.local')
  if (!existsSync(p)) { console.error('Missing .env.local'); process.exit(1) }
  for (const line of readFileSync(p, 'utf8').split('\n')) {
    const t = line.trim()
    if (!t || t.startsWith('#')) continue
    const eq = t.indexOf('=')
    if (eq === -1) continue
    const key = t.slice(0, eq).trim()
    let val = t.slice(eq + 1).trim()
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'")))
      val = val.slice(1, -1)
    if (!process.env[key]) process.env[key] = val
  }
}

loadEnvLocal()

const supabaseUrl   = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
const serviceKey    = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()
const anonKey       = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY || '').trim()
const adminEmail    = (process.env.ADMIN_EMAIL    || 'admin@gmail.com').trim()
const adminPassword = (process.env.ADMIN_PASSWORD || 'Admin@123').trim()

if (!supabaseUrl || !serviceKey) {
  console.error('Need NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY in .env.local')
  process.exit(1)
}

const svc = createClient(supabaseUrl, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } })

// ─── Step 1: Check if tables exist, try pg-meta SQL endpoint ─────────────────
console.log('1/3 Checking schema…')

const { error: probe } = await svc.from('products').select('id').limit(1)
const tablesExist = !probe

if (!tablesExist) {
  // Try Supabase internal pg-meta endpoint (may work for self-hosted or certain plans)
  const SCHEMA_SQL = readFileSync(join(root, 'supabase', 'complete_setup.sql'), 'utf8')
  const pgMetaUrl = `${supabaseUrl}/pg/query`
  let sqlRan = false
  try {
    const resp = await fetch(pgMetaUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${serviceKey}` },
      body: JSON.stringify({ query: SCHEMA_SQL }),
    })
    if (resp.ok) {
      console.log('    Schema applied via pg-meta.')
      sqlRan = true
    }
  } catch {}

  if (!sqlRan) {
    const projectRef = new URL(supabaseUrl).hostname.split('.')[0]
    console.log('')
    console.log('══════════════════════════════════════════════════════')
    console.log('  ACTION NEEDED — run schema SQL in Supabase (30 sec)')
    console.log('══════════════════════════════════════════════════════')
    console.log(`  1. Open this URL:`)
    console.log(`     https://supabase.com/dashboard/project/${projectRef}/sql/new`)
    console.log(`  2. Copy the full contents of:  supabase/complete_setup.sql`)
    console.log(`  3. Paste → click Run`)
    console.log(`  4. Come back and run:  npm run setup:full`)
    console.log('══════════════════════════════════════════════════════')
    process.exit(0)
  }
} else {
  console.log('    Tables already exist.')
}

// ─── Step 2: Demo products ───────────────────────────────────────────────────
console.log('2/3 Inserting demo products…')
await new Promise(r => setTimeout(r, 2000))

const DEMO = [
  { name: 'Infinity Castle — Night',  description: 'A1 poster print, matte finish. Infinity Castle arc inspired skyline — deep purples and crimson glow.', price: 2499, category: 'posters',        image_url: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=800&q=80', model_url: null, slug: 'demo-poster-infinity-castle-night' },
  { name: 'Breathing Blade — Teal',   description: 'Limited run poster. High-contrast silhouette with teal energy accents.',                                  price: 1999, category: 'posters',        image_url: 'https://images.unsplash.com/photo-1618336753974-aae8e04506aa?w=800&q=80', model_url: null, slug: 'demo-poster-breathing-blade-teal' },
  { name: 'Moonlit Corridor',          description: 'Art print — endless corridor under moonlight. Fits standard frames.',                                      price: 1799, category: 'posters',        image_url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&q=80', model_url: null, slug: 'demo-poster-moonlit-corridor' },
  { name: 'Chibi Demon Statue — STL',  description: '3D printable model (STL). Pre-supported mesh included.',                                                   price: 3499, category: '3d_models',     image_url: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&q=80', model_url: null, slug: 'demo-3d-chibi-demon-statue' },
  { name: 'Castle Spire — OBJ',        description: 'Infinity Castle spire kitbash pack. OBJ + textures.',                                                      price: 4999, category: '3d_models',     image_url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&q=80', model_url: null, slug: 'demo-3d-castle-spire' },
  { name: 'Katana Display Stand',       description: 'Printable stand for 1/6 scale figures. STL bundle.',                                                       price: 1299, category: '3d_models',     image_url: 'https://images.unsplash.com/photo-1635322966219-b75ed372eb01?w=800&q=80', model_url: null, slug: 'demo-3d-katana-stand' },
  { name: 'Custom Character — Commission Slot', description: 'One slot: custom character illustration + poster. We contact you after purchase.',                price: 9999, category: 'custom_designs', image_url: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=800&q=80', model_url: null, slug: 'demo-custom-character-commission' },
  { name: 'Custom Logo — Anime Style',  description: 'Vector logo + social kit in anime aesthetic. 2 revision rounds.',                                          price: 5999, category: 'custom_designs', image_url: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=800&q=80', model_url: null, slug: 'demo-custom-logo-anime' },
  { name: 'Wall Art — Your OC',         description: 'Custom poster from your OC reference sheet. 18x24" max.',                                                  price: 7999, category: 'custom_designs', image_url: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=800&q=80', model_url: null, slug: 'demo-custom-wall-art-oc' },
]

const { error: seedErr } = await svc.from('products').upsert(DEMO, { onConflict: 'slug' })
if (seedErr) {
  if (seedErr.message?.includes('schema cache') || seedErr.message?.includes('does not exist')) {
    const projectRef = new URL(supabaseUrl).hostname.split('.')[0]
    console.log('')
    console.log('══════════════════════════════════════════════════════')
    console.log('  Tables not found in Supabase — run SQL first:')
    console.log(`  https://supabase.com/dashboard/project/${projectRef}/sql/new`)
    console.log('  (paste supabase/complete_setup.sql → Run)')
    console.log('  Then: npm run setup:full')
    console.log('══════════════════════════════════════════════════════')
  } else {
    console.error('  Seed failed:', seedErr.message)
  }
  process.exit(1)
}

const { count } = await svc.from('products').select('id', { count: 'exact', head: true })
console.log(`    Done — ${count} products in DB.`)

// ─── Step 3: Admin user ───────────────────────────────────────────────────────
console.log('3/3 Creating admin user…')

async function findUserByEmail(email) {
  let page = 1
  for (;;) {
    const { data, error } = await svc.auth.admin.listUsers({ page, perPage: 1000 })
    if (error) throw error
    const u = data.users.find(x => x.email?.toLowerCase() === email.toLowerCase())
    if (u) return u
    if (!data.users.length || data.users.length < 1000) return null
    page++
  }
}

const existing = await findUserByEmail(adminEmail)
let userId
if (existing) {
  const { error } = await svc.auth.admin.updateUserById(existing.id, { password: adminPassword, email_confirm: true })
  if (error) throw error
  userId = existing.id
  console.log(`    Reset password for: ${adminEmail}`)
} else {
  const { data, error } = await svc.auth.admin.createUser({
    email: adminEmail, password: adminPassword, email_confirm: true,
    user_metadata: { name: 'Admin' }
  })
  if (error) throw error
  userId = data.user.id
  console.log(`    Created: ${adminEmail}`)
}

// Upsert profile with is_admin = true
await svc.from('profiles').upsert({ id: userId, name: 'Admin', is_admin: true }, { onConflict: 'id' })
  .then(({ error }) => error && svc.from('profiles').update({ is_admin: true }).eq('id', userId))
console.log(`    Admin flag: set`)

// ─── Verify login ─────────────────────────────────────────────────────────────
if (anonKey) {
  const anon = createClient(supabaseUrl, anonKey, { auth: { autoRefreshToken: false, persistSession: false } })
  const { error } = await anon.auth.signInWithPassword({ email: adminEmail, password: adminPassword })
  if (!error) {
    await anon.auth.signOut()
    console.log('    Login verified ✓')
  } else {
    console.warn('    Login check failed (may still be propagating):', error.message)
  }
}

console.log('')
console.log('══════════════════════════════════════════════════════')
console.log('  All done!')
console.log('  Admin dashboard:  /admin/dashboard')
console.log(`  Email   :  ${adminEmail}`)
console.log(`  Password:  ${adminPassword}`)
console.log('══════════════════════════════════════════════════════')
