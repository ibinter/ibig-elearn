/**
 * Applique un fichier SQL sur la base Supabase.
 * Passe par le pooler (IPv4) quand l'hôte direct db.<ref>.supabase.co (IPv6) est injoignable.
 * Usage : node scripts/db-apply.mjs supabase/migrations/047_scorm_xapi.sql
 */
import pg from 'pg'
import { readFileSync } from 'fs'
import { config } from 'dotenv'

config({ path: '.env.local', quiet: true })

const file = process.argv[2]
if (!file) { console.error('Usage : node scripts/db-apply.mjs <fichier.sql>'); process.exit(1) }

const url = new URL(process.env.DATABASE_URL)
const ref = url.hostname.split('.')[1]
const client = new pg.Client({
  host: process.env.SUPABASE_POOLER_HOST ?? 'aws-1-eu-west-1.pooler.supabase.com',
  port: 5432,
  user: `postgres.${ref}`,
  password: decodeURIComponent(url.password),
  database: 'postgres',
  ssl: { rejectUnauthorized: false },
})

await client.connect()
try {
  await client.query(readFileSync(file, 'utf8'))
  console.log(`✅ ${file} appliqué`)
} finally {
  await client.end()
}
