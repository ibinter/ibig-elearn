/**
 * Script de migration — usage local uniquement
 * Définir DATABASE_URL dans .env.local avant d'exécuter
 *
 * Usage: node scripts/push-schema.mjs
 */
import pg from 'pg'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { config } from 'dotenv'

config({ path: '.env.local' })

const __dirname = dirname(fileURLToPath(import.meta.url))

const connectionString = process.env.DATABASE_URL
if (!connectionString) {
  console.error('❌ DATABASE_URL manquant dans .env.local')
  process.exit(1)
}

const client = new pg.Client({ connectionString, ssl: { rejectUnauthorized: false } })
await client.connect()
console.log('✅ Connecté à Supabase PostgreSQL')

const blocks = readFileSync(join(__dirname, '../supabase/migrations/001_schema.sql'), 'utf8')
  .split(/;\s*\n/)
  .map(s => s.trim())
  .filter(Boolean)

let ok = 0, errors = 0
for (const block of blocks) {
  try {
    await client.query(block)
    ok++
    process.stdout.write('.')
  } catch (err) {
    errors++
    console.error(`\n❌ ${err.message.split('\n')[0]}`)
  }
}
console.log(`\n✅ ${ok} OK, ${errors} erreurs`)
await client.end()
