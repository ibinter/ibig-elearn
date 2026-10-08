/**
 * Audit des requêtes : rejoue chaque `.from('table').select('colonnes')` du code
 * sur la base (0 ligne renvoyée) et signale les colonnes / relations inexistantes.
 * Usage : node scripts/audit-queries.mjs
 */
import { readFileSync, readdirSync, statSync } from 'fs'
import { join } from 'path'
import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'

config({ path: '.env.local', quiet: true })
const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

const files = []
const walk = d => { for (const f of readdirSync(d)) { const p = join(d, f); statSync(p).isDirectory() ? walk(p) : /\.(tsx?|mjs)$/.test(f) && files.push(p) } }
walk('src')

const RE = /\.from\(\s*['"`](\w+)['"`]\s*\)\s*\.select\(\s*(['"`])([\s\S]*?)\2/g
const seen = new Map()
for (const f of files) {
  const src = readFileSync(f, 'utf8')
  for (const m of src.matchAll(RE)) {
    const [, table, , cols] = m
    if (cols.includes('${')) continue
    const line = src.slice(0, m.index).split('\n').length
    const key = `${table}|${cols.replace(/\s+/g, ' ').trim()}`
    if (!seen.has(key)) seen.set(key, [])
    seen.get(key).push(`${f.replace(/\\/g, '/')}:${line}`)
  }
}

let bad = 0
const entries = [...seen.entries()]
for (let i = 0; i < entries.length; i += 10) {
  await Promise.all(entries.slice(i, i + 10).map(async ([key, where]) => {
    const [table, cols] = key.split('|')
    const { error } = await db.from(table).select(cols).limit(0)
    if (error) { bad++; console.log(`✗ ${table}: ${error.message}\n    ${where.join('\n    ')}`) }
  }))
}
console.log(`\n${seen.size} requêtes vérifiées, ${bad} en erreur.`)
