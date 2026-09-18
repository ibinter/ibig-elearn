import pg from 'pg'
import { readFileSync } from 'fs'
import { config } from 'dotenv'
config({ path: '.env.local' })
const c = new pg.Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } })
await c.connect()
const sql = readFileSync('supabase/migrations/notifications.sql', 'utf8')
try {
  await c.query(sql)
  console.log('✅ Table notifications créée')
} catch(e) {
  if (e.message.includes('already exists')) console.log('✓ Déjà existante')
  else console.error('❌', e.message)
}
await c.end()
