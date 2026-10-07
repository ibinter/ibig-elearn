import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { seatsUsed } from '@/lib/org'

/** Retire un collaborateur (libère son siège) ou annule une invitation en attente. */
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const body = await request.json().catch(() => ({}))
  const orgId = String(body.orgId ?? '')
  const admin = createAdminClient()
  const { data: me } = await admin.from('organization_members').select('role')
    .eq('org_id', orgId).eq('user_id', user.id).eq('is_active', true).maybeSingle()
  if (!me || !['owner', 'admin', 'manager'].includes(me.role)) return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })

  if (body.action === 'cancel_invite') {
    await admin.from('org_invitations').delete().eq('id', String(body.invitationId)).eq('org_id', orgId).is('accepted_at', null)
  } else if (body.action === 'remove') {
    const userId = String(body.userId ?? '')
    if (userId === user.id) return NextResponse.json({ error: 'Vous ne pouvez pas vous retirer vous-même.' }, { status: 400 })
    const { data: target } = await admin.from('organization_members').select('id, role').eq('org_id', orgId).eq('user_id', userId).maybeSingle()
    if (!target) return NextResponse.json({ error: 'Collaborateur introuvable' }, { status: 404 })
    if (target.role === 'owner') return NextResponse.json({ error: 'Le propriétaire ne peut pas être retiré.' }, { status: 400 })
    if (target.role !== 'learner' && me.role === 'manager') return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
    await admin.from('organization_members').update({ is_active: false }).eq('id', target.id)
  } else {
    return NextResponse.json({ error: 'Action inconnue' }, { status: 400 })
  }

  await admin.from('organizations').update({ used_seats: await seatsUsed(admin, orgId) }).eq('id', orgId)
  return NextResponse.json({ ok: true })
}
