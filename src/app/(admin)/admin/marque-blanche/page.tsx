import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import type { Tenant } from '@/types/tenant'
import TenantManager from './TenantManager'

export const metadata = { title: 'Marque blanche' }

export default async function MarqueBlanchePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/connexion')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!profile || !['admin', 'coordinateur'].includes(profile.role)) redirect('/admin')

  const { data: tenants } = await supabase
    .from('tenants')
    .select('*')
    .order('created_at', { ascending: false })

  return <TenantManager initialTenants={(tenants ?? []) as Tenant[]} />
}
