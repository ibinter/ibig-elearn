/**
 * Crée un compte administrateur sur IBIG E-LEARN
 * Usage: node scripts/create-admin.mjs
 */
import { config } from 'dotenv'
import pg from 'pg'
config({ path: '.env.local' })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const DATABASE_URL = process.env.DATABASE_URL

const EMAIL = process.env.ADMIN_EMAIL || 'admin@ibiglearn.com'
const PASSWORD = process.env.ADMIN_PASSWORD  // requis via env
const FULL_NAME = 'Administrateur IBIG'

if (!PASSWORD) { console.error('❌ ADMIN_PASSWORD requis : ADMIN_PASSWORD=xxx node scripts/create-admin.mjs'); process.exit(1) }

console.log('👤 Création du compte admin...')

// 1. Créer via Supabase Auth Admin API
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
    user_metadata: { full_name: FULL_NAME, role: 'admin' },
  }),
})

const data = await res.json()
let userId

if (!res.ok) {
  if (data.msg?.includes('already been registered') || data.code === 'email_exists') {
    console.log('  ℹ️  Utilisateur déjà existant dans auth.users')
  } else {
    console.error('  ❌ Erreur API Auth:', JSON.stringify(data))
    process.exit(1)
  }
} else {
  userId = data.id
  console.log(`  ✓ Utilisateur créé: ${userId}`)
}

// 2. Récupérer l'ID depuis auth.users si déjà existant
const client = new pg.Client({ connectionString: DATABASE_URL, ssl: { rejectUnauthorized: false } })
await client.connect()

const authUser = await client.query(`SELECT id FROM auth.users WHERE email = $1 LIMIT 1`, [EMAIL])
if (authUser.rows.length === 0) {
  console.error('❌ Utilisateur introuvable dans auth.users')
  await client.end(); process.exit(1)
}
userId = authUser.rows[0].id
console.log(`  ✓ ID: ${userId}`)

// 3. Upsert profil avec rôle admin
await client.query(
  `INSERT INTO profiles (id, email, full_name, role)
   VALUES ($1, $2, $3, 'admin')
   ON CONFLICT (id) DO UPDATE SET
     full_name = EXCLUDED.full_name,
     role = 'admin'`,
  [userId, EMAIL, FULL_NAME]
)
console.log(`  ✓ Profil admin créé/mis à jour`)

await client.end()

console.log('\n✅ Compte admin prêt !')
console.log(`   Email    : ${EMAIL}`)
console.log(`   Dashboard : https://ibig-elearn.vercel.app/admin`)
console.log('\n⚠️  Changez le mot de passe après votre première connexion !')
