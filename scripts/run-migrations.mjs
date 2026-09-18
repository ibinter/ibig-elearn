/**
 * Exécute toutes les migrations SQL dans l'ordre
 * Usage: node scripts/run-migrations.mjs
 */
import pg from 'pg'
import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { config } from 'dotenv'

config({ path: '.env.local' })

const __dirname = dirname(fileURLToPath(import.meta.url))

const client = new pg.Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
})

await client.connect()
console.log('✅ Connecté à Supabase\n')

const MIGRATIONS = [
  'supabase/migrations/batch1_reviews_search_gamification.sql',
  'supabase/migrations/coupons.sql',
  'supabase/migrations/features_batch2.sql',
  'supabase/migrations/forum_discussions.sql',
  'supabase/migrations/messages.sql',
  'supabase/migrations/reviews.sql',
]

let totalOk = 0, totalErrors = 0

for (const file of MIGRATIONS) {
  const path = join(__dirname, '..', file)
  let sql
  try { sql = readFileSync(path, 'utf8') } catch { console.log(`⚠️  ${file} introuvable — ignoré`); continue }

  console.log(`\n📄 ${file}`)

  // Exécuter le fichier entier (préserve les fonctions dollar-quotées)
  let ok = 0, errors = 0
  try {
    await client.query(sql)
    ok = 1
    process.stdout.write('.')
  } catch (err) {
    const msg = err.message.split('\n')[0]
    if (msg.includes('already exists') || msg.includes('duplicate') || msg.includes('déjà')) {
      ok = 1
      process.stdout.write('·')
    } else {
      errors = 1
      console.error(`\n  ❌ ${msg.slice(0, 120)}`)
      // Réessayer bloc par bloc pour les erreurs partielles
      const blocks = sql
        .split(/;\s*(?=\n|$)/)
        .map(s => s.trim())
        .filter(s => s.length > 5 && !s.match(/^--/))
      let bOk = 0, bErr = 0
      for (const block of blocks) {
        try { await client.query(block); bOk++; process.stdout.write('.') }
        catch (e2) {
          const m2 = e2.message.split('\n')[0]
          if (m2.includes('already exists') || m2.includes('duplicate')) { bOk++; process.stdout.write('·') }
          else { bErr++; console.error(`\n  ❌ ${m2.slice(0, 100)}`) }
        }
      }
      ok = bOk; errors = bErr
    }
  }
  console.log(`\n  ✓ ${ok} OK, ${errors} erreurs`)
  totalOk += ok
  totalErrors += errors
}

console.log(`\n${'─'.repeat(50)}`)
console.log(`✅ Total: ${totalOk} OK, ${totalErrors} erreurs`)

await client.end()
