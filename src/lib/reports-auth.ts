import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * Droits sur les rapports : sans orgId → équipe IBIG (rapports plateforme) ;
 * avec orgId → responsables de l'organisation (périmètre limité à l'entreprise).
 */
export async function reportAccess(orgId: string | null) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const admin = createAdminClient()
  const { data: me } = await admin.from('profiles').select('role').eq('id', user.id).single()
  const staff = ['admin', 'coordinateur'].includes(me?.role ?? '')
  if (!orgId) return staff ? { user, admin, orgId: null } : null
  if (staff) return { user, admin, orgId }
  const { data: m } = await admin.from('organization_members').select('role').eq('org_id', orgId).eq('user_id', user.id).eq('is_active', true).maybeSingle()
  return m && ['owner', 'admin', 'manager'].includes(m.role) ? { user, admin, orgId } : null
}
