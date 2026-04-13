/**
 * Scans public/assests/poster for images and upserts them as limited_edition products:
 *   selling price ₹299 (29900 paisa), MRP ₹600 (60000 paisa).
 *
 * Requires: NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY in .env.local
 *
 * Usage: npm run seed:posters
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync, existsSync, readdirSync, statSync } from 'fs'
import { dirname, join, extname, basename, relative } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')

const PRICE_PAISE = 29_900 // ₹299
const ORIGINAL_PAISE = 60_000 // ₹600
const CATEGORY = 'limited_edition'
const EXTS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif', '.avif'])

const DESCRIPTION =
  'Premium limited edition anime poster print. High-quality art print — gallery-ready. MRP ₹600; special launch price ₹299.'

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

function slugify(s) {
  return String(s)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

function isLikelyHash(nameNoExt) {
  return /^[a-f0-9]{24,}$/i.test(nameNoExt)
}

function titleFromBasename(nameNoExt) {
  if (isLikelyHash(nameNoExt)) {
    return `Limited edition poster — ${nameNoExt.slice(0, 8)}…`
  }
  const spaced = nameNoExt.replace(/[-_]+/g, ' ').replace(/([a-z])([A-Z])/g, '$1 $2')
  const words = spaced.split(/\s+/).filter(Boolean)
  return words
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ')
}

function walkImages(dir) {
  const out = []
  for (const ent of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, ent.name)
    if (ent.isDirectory()) {
      out.push(...walkImages(p))
      continue
    }
    const ext = extname(ent.name).toLowerCase()
    if (!EXTS.has(ext)) continue
    out.push(p)
  }
  return out
}

loadEnvLocal()

const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()

if (!url || !serviceKey) {
  console.error('Need NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local')
  process.exit(1)
}

const posterDir = join(root, 'public', 'assests', 'poster')
if (!existsSync(posterDir)) {
  console.error('Missing folder:', posterDir)
  process.exit(1)
}

const absFiles = walkImages(posterDir)
if (absFiles.length === 0) {
  console.error('No image files found in', posterDir)
  process.exit(1)
}

const publicRoot = join(root, 'public')
const rows = absFiles.map((abs) => {
  const relFromPublic = relative(publicRoot, abs).replace(/\\/g, '/')
  const web = '/' + relFromPublic
  const base = basename(abs, extname(abs))
  const slug = ('le-poster-' + slugify(base)).slice(0, 96)
  const name = `${titleFromBasename(base)} — Limited edition`
  return {
    name,
    description: DESCRIPTION,
    price: PRICE_PAISE,
    original_price: ORIGINAL_PAISE,
    category: CATEGORY,
    image_url: web,
    model_url: null,
    slug,
    rating: 4.6,
    rating_count: 128,
    stock_quantity: 100,
    is_featured: false,
  }
})

const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const { error: probe } = await supabase.from('products').select('id', { count: 'exact', head: true })
if (probe) {
  console.error('Cannot query products:', probe.message)
  process.exit(1)
}

const { error } = await supabase.from('products').upsert(rows, { onConflict: 'slug' })

if (error) {
  console.error('Upsert failed:', error.message)
  process.exit(1)
}

console.log('OK — upserted', rows.length, 'poster(s) as limited_edition @ ₹299 (MRP ₹600):')
for (const r of rows) {
  console.log(' ', r.slug, '→', r.image_url)
}
