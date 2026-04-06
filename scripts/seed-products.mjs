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
  /* ─── Posters ─── */
  {
    name: 'Infinity Castle -- Night',
    description: 'A1 poster print, matte finish. Infinity Castle arc inspired skyline -- deep purples and crimson glow.',
    price: 249900,
    original_price: 399900,
    category: 'posters',
    image_url: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=800&q=80',
    model_url: null,
    slug: 'demo-poster-infinity-castle-night',
    rating: 4.5,
    rating_count: 2341,
  },
  {
    name: 'Breathing Blade -- Teal',
    description: 'Limited run poster. High-contrast silhouette with teal energy accents.',
    price: 199900,
    original_price: 349900,
    category: 'posters',
    image_url: 'https://images.unsplash.com/photo-1618336753974-aae8e04506aa?w=800&q=80',
    model_url: null,
    slug: 'demo-poster-breathing-blade-teal',
    rating: 4.2,
    rating_count: 892,
  },
  {
    name: 'Moonlit Corridor',
    description: 'Art print -- endless corridor under moonlight. Fits standard frames.',
    price: 179900,
    original_price: null,
    category: 'posters',
    image_url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&q=80',
    model_url: null,
    slug: 'demo-poster-moonlit-corridor',
    rating: 4.0,
    rating_count: 512,
  },

  /* ─── Action Figures ─── */
  {
    name: 'Tanjiro Kamado -- Water Breathing Figure',
    description: 'Highly detailed collector action figure of Tanjiro in Water Breathing stance. Hand-painted finish with weathered effects. Comes in a collector display box with certificate of authenticity.',
    price: 189900,
    original_price: 329900,
    category: 'action_figures',
    image_url: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=800&q=80',
    model_url: null,
    model_name: 'Tanjiro Kamado -- Water Form',
    color: 'Black,Green',
    is_multi_color: true,
    height_cm: 25,
    weight_g: 380,
    slug: 'demo-figure-tanjiro-kamado',
    rating: 4.3,
    rating_count: 1205,
  },
  {
    name: 'Naruto Uzumaki -- Sage Mode Figure',
    description: 'Premium resin action figure in Sage Mode pose. Swappable hands, glowing eye detail, wind-effect base. Limited to 500 units worldwide.',
    price: 249900,
    original_price: 439900,
    category: 'action_figures',
    image_url: 'https://images.unsplash.com/photo-1580477667995-2b94f01c9516?w=800&q=80',
    model_url: '/assests/models/naruto_sage.glb',
    model_name: 'Uzumaki Naruto -- Sage Mode',
    color: 'Orange',
    is_multi_color: false,
    height_cm: 30,
    weight_g: 520,
    slug: 'demo-figure-naruto-sage',
    rating: 4.7,
    rating_count: 3892,
  },
  {
    name: 'Satoru Gojo -- Infinity Veil Figure',
    description: 'Scale figure of Gojo with his iconic Infinity technique visual effect. Resin cast with UV reactive details under blacklight. The most detailed Gojo figure on the market.',
    price: 349900,
    original_price: 599900,
    category: 'action_figures',
    image_url: 'https://images.unsplash.com/photo-1571757767119-68b8dbed8c97?w=800&q=80',
    model_url: '/assests/models/gojo.glb',
    model_name: 'Satoru Gojo -- Infinity Form',
    color: 'White,Blue',
    is_multi_color: true,
    height_cm: 28,
    weight_g: 610,
    slug: 'demo-figure-gojo-infinity',
    rating: 4.9,
    rating_count: 7421,
  },
  {
    name: 'Roronoa Zoro -- Three-Sword Style',
    description: 'Zoro action figure with three katanas (Wado Ichimonji, Sandai Kitetsu, Enma). Articulated joints, multiple pose accessories included.',
    price: 219900,
    original_price: 379900,
    category: 'action_figures',
    image_url: 'https://images.unsplash.com/photo-1612036782180-6f0b6cd846fe?w=800&q=80',
    model_url: '/assests/models/zoro.glb',
    model_name: 'Zoro -- Three Sword Form',
    color: 'Green',
    is_multi_color: false,
    height_cm: 27,
    weight_g: 450,
    slug: 'demo-figure-zoro-three-sword',
    rating: 4.6,
    rating_count: 2134,
  },

  /* ─── Limited Edition ─── */
  {
    name: 'Infinity Castle -- Crimson Gate',
    description: 'Premium limited edition numbered print. Only 200 units. UV protective glaze coat, gallery-ready framing options.',
    price: 599900,
    original_price: 999900,
    category: 'limited_edition',
    image_url: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=800&q=80',
    model_url: null,
    slug: 'demo-limited-crimson-gate',
    rating: 4.8,
    rating_count: 341,
  },

  /* ─── 3D Models (legacy) ─── */
  {
    name: 'Chibi Demon Statue -- STL',
    description: '3D printable model (STL). Pre-supported mesh included. Personal use only.',
    price: 349900,
    original_price: null,
    category: '3d_models',
    image_url: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&q=80',
    model_url: null,
    slug: 'demo-3d-chibi-demon-statue',
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
    console.error('Run supabase/complete_setup.sql in Supabase SQL Editor, then run this again.')
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
    console.error('\nFix:')
    console.error('  1) Supabase SQL Editor -> run supabase/complete_setup.sql')
    console.error('  2) In SQL Editor run: NOTIFY pgrst, \'reload schema\';')
    console.error('  3) Wait ~30s, then: npm run seed:products')
  }
  process.exit(1)
}

console.log('OK -- upserted', DEMO.length, 'demo products (slug conflict = updated).')

const { count } = await supabase.from('products').select('id', { count: 'exact', head: true })
console.log('Total products in DB:', count ?? 0)
console.log('\nAction figure products seeded with full metadata:')
console.log('  - model_name, color, is_multi_color, height_cm, weight_g')
console.log('  - original_price (for discount display)')
console.log('  - rating + rating_count')
console.log('\nNext: open http://localhost:3000/shop?category=action_figures to see 3D view UI')
