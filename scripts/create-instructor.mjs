/**
 * Crée l'instructeur IBIG EDUFORM dans Supabase auth.users + profiles
 * Usage: node scripts/create-instructor.mjs
 */
import pg from 'pg'
import { config } from 'dotenv'

config({ path: '.env.local' })

const DB_URL = process.env.DATABASE_URL
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL

if (!DB_URL || !SERVICE_ROLE_KEY || !SUPABASE_URL) {
  console.error('❌ Variables manquantes dans .env.local'); process.exit(1)
}

const EMAIL = 'formateur@ibig-eduform.com'
const PASSWORD = 'IbigEduform2024!'
const FULL_NAME = 'IBIG EDUFORM'

// 1. Créer l'utilisateur via Supabase Auth Admin API
console.log('👤 Création de l\'instructeur via API Admin...')
const res = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
    'apikey': SERVICE_ROLE_KEY,
  },
  body: JSON.stringify({
    email: EMAIL,
    password: PASSWORD,
    email_confirm: true,
    user_metadata: { full_name: FULL_NAME, role: 'formateur' },
  }),
})

const data = await res.json()

if (!res.ok) {
  if (data.msg?.includes('already been registered') || data.code === 'email_exists') {
    console.log('  ℹ️  L\'utilisateur existe déjà dans auth.users')
  } else {
    console.error('  ❌ Erreur API:', JSON.stringify(data))
    process.exit(1)
  }
} else {
  console.log(`  ✓ Utilisateur créé: ${data.id}`)
}

// 2. Vérifier/créer le profil dans profiles
const client = new pg.Client({ connectionString: DB_URL, ssl: { rejectUnauthorized: false } })
await client.connect()
console.log('✅ Connecté à Supabase PostgreSQL')

// Récupérer l'ID depuis auth.users
const authUser = await client.query(
  `SELECT id FROM auth.users WHERE email = $1 LIMIT 1`,
  [EMAIL]
)

if (authUser.rows.length === 0) {
  console.error('❌ Utilisateur introuvable dans auth.users après création')
  await client.end(); process.exit(1)
}

const userId = authUser.rows[0].id
console.log(`  ✓ auth.users id: ${userId}`)

// Upsert dans profiles
await client.query(
  `INSERT INTO profiles (id, email, full_name, role)
   VALUES ($1, $2, $3, 'formateur')
   ON CONFLICT (id) DO UPDATE SET
     full_name = EXCLUDED.full_name,
     role = COALESCE(profiles.role, 'formateur')`,
  [userId, EMAIL, FULL_NAME]
)
console.log(`  ✓ Profil upsert: ${FULL_NAME} (${EMAIL})`)

await client.end()
console.log('\n✅ Instructeur prêt. Relancez: node scripts/sync-from-eduform.mjs')
