import pg from 'pg'
import { config } from 'dotenv'
config({ path: '.env.local' })
const c = new pg.Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } })
await c.connect()
const r = await c.query("SELECT column_name FROM information_schema.columns WHERE table_name='courses' ORDER BY ordinal_position")
console.log('Colonnes courses:', r.rows.map(x => x.column_name).join(', '))
await c.end()
