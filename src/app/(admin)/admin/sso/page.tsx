import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import SSOManager from './SSOManager'

export const metadata = { title: 'SSO — Connexion Entreprise' }

export default async function SSOPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/connexion')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!profile || !['admin', 'coordinateur'].includes(profile.role)) redirect('/admin')

  const { data: providers } = await supabase
    .from('sso_providers')
    .select('*')
    .order('created_at', { ascending: false })

  return <SSOManager initialProviders={providers ?? []} />
}
