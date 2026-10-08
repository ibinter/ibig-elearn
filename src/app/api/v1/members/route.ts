import { NextRequest, NextResponse } from 'next/server'
import { apiAuth } from '@/lib/integrations'

/** GET /api/v1/members — collaborateurs actifs de l'organisation. */
export async function GET(req: NextRequest) {
  const auth = await apiAuth(req)
  if (!auth) return NextResponse.json({ error: 'Clé d’API invalide' }, { status: 401 })
  const { data } = await auth.admin.from('organization_members')
    .select('user_id, role, joined_at, profile:profiles!organization_members_user_id_fkey(full_name, email, country, last_activity_date)')
    .eq('org_id', auth.orgId).eq('is_active', true).order('joined_at')
  return NextResponse.json({
    data: (data ?? []).map(m => {
      const p = m.profile as unknown as { full_name: string | null; email: string | null; country: string | null; last_activity_date: string | null } | null
      return { user_id: m.user_id, email: p?.email ?? null, name: p?.full_name ?? null, role: m.role, country: p?.country ?? null, joined_at: m.joined_at, last_active: p?.last_activity_date ?? null }
    }),
  })
}
