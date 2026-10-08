import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendEmail } from '@/lib/email'
import { addMember, addToCohort, seatsUsed } from '@/lib/org'
import { SITE_URL } from '@/lib/site'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const body = await request.json().catch(() => ({}))
  const orgId = String(body.orgId ?? '')
  const role = ['learner', 'manager'].includes(body.role) ? body.role : 'learner'
  const cohortId = body.cohortId ? String(body.cohortId) : null
  const emails = [...new Set(((body.emails ?? []) as unknown[]).map(e => String(e).trim().toLowerCase()).filter(e => EMAIL_RE.test(e)))]
  if (!orgId || emails.length === 0) return NextResponse.json({ error: 'Indiquez au moins une adresse email valide.' }, { status: 400 })
  if (emails.length > 100) return NextResponse.json({ error: '100 invitations maximum par envoi.' }, { status: 400 })

  const admin = createAdminClient()
  const { data: me } = await admin.from('organization_members').select('role')
    .eq('org_id', orgId).eq('user_id', user.id).eq('is_active', true).maybeSingle()
  if (!me || !['owner', 'admin', 'manager'].includes(me.role)) return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })

  const { data: org } = await admin.from('organizations').select('id, name, max_seats, is_active').eq('id', orgId).single()
  if (!org?.is_active) return NextResponse.json({ error: 'Organisation inactive' }, { status: 404 })
  if (cohortId) {
    const { data: c } = await admin.from('cohorts').select('id').eq('id', cohortId).eq('org_id', orgId).maybeSingle()
    if (!c) return NextResponse.json({ error: 'Parcours introuvable' }, { status: 404 })
  }

  const free = org.max_seats - await seatsUsed(admin, orgId)
  const { data: profiles } = await admin.from('profiles').select('id, email').in('email', emails)
  const byEmail = new Map((profiles ?? []).map(p => [String(p.email).toLowerCase(), p.id as string]))
  const { data: memberRows } = byEmail.size
    ? await admin.from('organization_members').select('user_id').eq('org_id', orgId).eq('is_active', true).in('user_id', [...byEmail.values()])
    : { data: [] }
  const already = new Set((memberRows ?? []).map(m => m.user_id))
  const needSeat = emails.filter(e => !(byEmail.has(e) && already.has(byEmail.get(e)!)))
  if (needSeat.length > free) {
    return NextResponse.json({ error: `Sièges insuffisants : ${Math.max(0, free)} disponible(s) pour ${needSeat.length} invitation(s).` }, { status: 400 })
  }

  const results: { email: string; status: 'added' | 'invited' | 'already_member' }[] = []
  const addedIds: string[] = []

  for (const email of emails) {
    const uid = byEmail.get(email)
    if (uid) {
      const r = await addMember(admin, orgId, uid, role, user.id)
      results.push({ email, status: r })
      addedIds.push(uid)
      continue
    }
    // Pas encore de compte : invitation par email (une seule active par adresse)
    await admin.from('org_invitations').delete().eq('org_id', orgId).eq('email', email).is('accepted_at', null)
    const { data: inv } = await admin.from('org_invitations')
      .insert({ org_id: orgId, email, role, cohort_id: cohortId, invited_by: user.id })
      .select('token').single()
    if (inv) {
      try {
        await sendEmail({
          to: email,
          subject: `${org.name} vous invite à vous former sur IBIG E-LEARNING`,
          html: `<div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;color:#111">
            <h2 style="color:#0B3D91">Vous êtes invité(e) !</h2>
            <p><strong>${org.name}</strong> vous offre l'accès à ses formations sur IBIG E-LEARNING.</p>
            <p><a href="${SITE_URL}/rejoindre/${inv.token}" style="display:inline-block;background:#FFA500;color:#000;font-weight:700;padding:12px 24px;border-radius:10px;text-decoration:none">Rejoindre l'espace de formation</a></p>
            <p style="color:#666;font-size:12px">Ce lien est valable 7 jours.</p></div>`,
        })
      } catch (e) { console.error('[org/invite] email', e) }
    }
    results.push({ email, status: 'invited' })
  }

  if (cohortId) await addToCohort(admin, orgId, cohortId, addedIds)
  await admin.from('organizations').update({ used_seats: await seatsUsed(admin, orgId) }).eq('id', orgId)

  return NextResponse.json({ results })
}
