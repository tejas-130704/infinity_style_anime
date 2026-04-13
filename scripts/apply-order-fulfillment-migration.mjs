/**
 * Applies supabase/migrations/20260416120000_order_fulfillment_tracking.sql
 * to your Postgres database (Supabase: use the direct connection string, port 5432).
 *
 * Set DATABASE_URL in the environment or in .env.local, e.g.:
 *   postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres
 *
 * Usage: node scripts/apply-order-fulfillment-migration.mjs
 */

import { readFileSync, existsSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'
import pg from 'pg'

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

const url =
  process.env.DATABASE_URL ||
  process.env.DIRECT_URL ||
  process.env.SUPABASE_DB_URL ||
  ''

if (!url) {
  console.error(
    'Missing DATABASE_URL (or DIRECT_URL / SUPABASE_DB_URL). Add a Postgres URL to .env.local, then re-run.\n' +
      'Or run the SQL in Supabase Dashboard → SQL → New query:\n' +
      '  supabase/migrations/20260416120000_order_fulfillment_tracking.sql\n' +
      'or the fulfillment section in supabase/QUICK_FIX_EXISTING_DB.sql'
  )
  process.exit(1)
}

const sqlPath = join(root, 'supabase', 'migrations', '20260416120000_order_fulfillment_tracking.sql')
const sql = readFileSync(sqlPath, 'utf8')

const client = new pg.Client({ connectionString: url, ssl: url.includes('supabase') ? { rejectUnauthorized: false } : undefined })

try {
  await client.connect()
  await client.query(sql)
  console.log('Applied order fulfillment migration OK:', sqlPath)
} catch (e) {
  console.error(e.message || e)
  process.exit(1)
} finally {
  await client.end().catch(() => {})
}
