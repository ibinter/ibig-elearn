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

  const [{ data: providers }, { data: orgs }] = await Promise.all([
    supabase.from('sso_providers')
      .select('*, org:b2b_organizations(id, name)')
      .order('created_at', { ascending: false }),
    supabase.from('b2b_organizations').select('id, name').order('name'),
  ])

  return <SSOManager initialProviders={providers ?? []} orgs={orgs ?? []} />
}
