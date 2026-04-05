/**
 * Inserts/updates demo products using the service role (no SQL Editor required).
 * Requires: NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY in .env.local
 * If you see "relation does not exist", run supabase/complete_setup.sql once in SQL Editor.
 *
 * Usage: npm run seed:products
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
    console.error('Missing .env.local')
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
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()

if (!url || !serviceKey) {
  console.error('Need NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local')
  process.exit(1)
}

const DEMO = [
  {
    name: 'Infinity Castle — Night',
    description:
      'A1 poster print, matte finish. Infinity Castle arc inspired skyline — deep purples and crimson glow.',
    price: 2499,
    category: 'posters',
    image_url: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=800&q=80',
    model_url: null,
    slug: 'demo-poster-infinity-castle-night',
  },
  {
    name: 'Breathing Blade — Teal',
    description: 'Limited run poster. High-contrast silhouette with teal energy accents.',
    price: 1999,
    category: 'posters',
    image_url: 'https://images.unsplash.com/photo-1618336753974-aae8e04506aa?w=800&q=80',
    model_url: null,
    slug: 'demo-poster-breathing-blade-teal',
  },
  {
    name: 'Moonlit Corridor',
    description: 'Art print — endless corridor under moonlight. Fits standard frames.',
    price: 1799,
    category: 'posters',
    image_url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&q=80',
    model_url: null,
    slug: 'demo-poster-moonlit-corridor',
  },
  {
    name: 'Chibi Demon Statue — STL',
    description: '3D printable model (STL). Pre-supported mesh included. Personal use only.',
    price: 3499,
    category: '3d_models',
    image_url: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&q=80',
    model_url: null,
    slug: 'demo-3d-chibi-demon-statue',
  },
  {
    name: 'Castle Spire — OBJ',
    description: 'Infinity Castle spire kitbash pack. OBJ + textures.',
    price: 4999,
    category: '3d_models',
    image_url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&q=80',
    model_url: null,
    slug: 'demo-3d-castle-spire',
  },
  {
    name: 'Katana Display Stand',
    description: 'Printable stand for 1/6 scale figures. STL bundle.',
    price: 1299,
    category: '3d_models',
    image_url: 'https://images.unsplash.com/photo-1635322966219-b75ed372eb01?w=800&q=80',
    model_url: null,
    slug: 'demo-3d-katana-stand',
  },
  {
    name: 'Custom Character — Commission Slot',
    description:
      'One slot: custom character illustration + poster. We contact you after purchase.',
    price: 9999,
    category: 'custom_designs',
    image_url: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=800&q=80',
    model_url: null,
    slug: 'demo-custom-character-commission',
  },
  {
    name: 'Custom Logo — Anime Style',
    description: 'Vector logo + social kit in anime aesthetic. 2 revision rounds.',
    price: 5999,
    category: 'custom_designs',
    image_url: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=800&q=80',
    model_url: null,
    slug: 'demo-custom-logo-anime',
  },
  {
    name: 'Wall Art — Your OC',
    description: 'Custom poster from your OC reference sheet. 18x24" max.',
    price: 7999,
    category: 'custom_designs',
    image_url: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=800&q=80',
    model_url: null,
    slug: 'demo-custom-wall-art-oc',
  },
]

const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const { error: probe } = await supabase.from('products').select('id', { count: 'exact', head: true })
if (probe) {
  const msg = probe.message || ''
  if (msg.includes('does not exist') || probe.code === '42P01') {
    console.error('Table public.products does not exist.')
    console.error('Run supabase/complete_setup.sql in Supabase → SQL Editor (creates tables + policies), then run this again.')
    process.exit(1)
  }
  console.error('Cannot query products:', msg)
  process.exit(1)
}

const { error } = await supabase.from('products').upsert(DEMO, { onConflict: 'slug' })

if (error) {
  console.error('Upsert failed:', error.message)
  if (
    error.message.includes('schema cache') ||
    error.message.includes('Could not find the table')
  ) {
    console.error('')
    console.error('Fix:')
    console.error('  1) Supabase → SQL Editor → run the full supabase/complete_setup.sql (creates public.products).')
    console.error('  2) In SQL Editor run: NOTIFY pgrst, \'reload schema\';')
    console.error('  3) Wait ~30s, then: npm run seed:products')
  }
  process.exit(1)
}

console.log('OK — upserted', DEMO.length, 'demo products (slug conflict = updated).')

const { count } = await supabase.from('products').select('id', { count: 'exact', head: true })
console.log('Total products in DB:', count ?? 0)
console.log('Next: npm run test:supabase')
