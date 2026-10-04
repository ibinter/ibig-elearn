import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'

const env = Object.fromEntries(
  readFileSync('.env.local', 'utf-8')
    .split('\n')
    .filter(l => l.includes('=') && !l.startsWith('#'))
    .map(l => { const i = l.indexOf('='); return [l.slice(0,i).trim(), l.slice(i+1).trim()] })
)

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
})

const users = [
  { email: 'admin@ibig-elearning.com',      password: 'Demo@IBIG2026!', full_name: 'Administrateur IBIG', role: 'admin' },
  { email: 'formateur@ibig-elearning.com',  password: 'Demo@IBIG2026!', full_name: 'Formateur Démo',      role: 'formateur' },
  { email: 'apprenant@ibig-elearning.com',  password: 'Demo@IBIG2026!', full_name: 'Apprenant Démo',      role: 'apprenant' },
]

for (const u of users) {
  const { data, error } = await supabase.auth.admin.createUser({
    email: u.email,
    password: u.password,
    email_confirm: true,
    user_metadata: { full_name: u.full_name },
  })

  if (error) {
    console.log(`⚠️  ${u.email} — ${error.message}`)
  } else {
    console.log(`✅ Créé : ${u.email}`)
  }

  const { error: pe } = await supabase.from('profiles')
    .update({ role: u.role, full_name: u.full_name, country: 'CI' })
    .eq('email', u.email)

  if (pe) console.error(`   ❌ Rôle non attribué : ${pe.message}`)
  else console.log(`   ✅ Rôle '${u.role}' attribué`)
}

console.log('\n=== ACCÈS DÉMO ===')
console.log('admin@ibig-elearning.com      / Demo@IBIG2026!')
console.log('formateur@ibig-elearning.com  / Demo@IBIG2026!')
console.log('apprenant@ibig-elearning.com  / Demo@IBIG2026!')
