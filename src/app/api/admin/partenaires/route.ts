import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { notifyUsers } from '@/lib/notify'
import { buildPartnerTerms, PARTNER_TERMS_VERSION } from '@/lib/partner'

/**
 * Actions EDUFORM sur une candidature :
 *  - offer   : proposer la convention (part formateur en %, conditions particulières)
 *  - reject  : refuser avec motif (le candidat peut corriger et re-soumettre)
 *  - suspend : suspendre un partenaire (bloque la création / soumission de formations)
 */
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  const { data: me } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!['admin', 'coordinateur'].includes(me?.role ?? '')) return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })

  const { applicationId, action, sharePct, specialConditions, reason, adminNote } = await req.json().catch(() => ({}))
  const { data: app } = await supabase.from('instructor_applications').select('*').eq('id', applicationId).single()
  if (!app) return NextResponse.json({ error: 'Candidature introuvable' }, { status: 404 })

  const now = new Date().toISOString()

  if (action === 'offer') {
    const share = Number(sharePct)
    if (!Number.isFinite(share) || share <= 0 || share >= 100) {
      return NextResponse.json({ error: 'La part formateur doit être comprise entre 1 et 99 %.' }, { status: 400 })
    }
    // Une seule offre active à la fois
    await supabase.from('partner_agreements').update({ status: 'revoked' }).eq('user_id', app.user_id).eq('status', 'offered')
    const { error } = await supabase.from('partner_agreements').insert({
      user_id: app.user_id,
      application_id: app.id,
      instructor_share_pct: share,
      terms_version: PARTNER_TERMS_VERSION,
      terms_snapshot: buildPartnerTerms({ instructorName: app.full_name, sharePct: share, specialConditions }),
      special_conditions: specialConditions?.trim() || null,
      offered_by: user.id,
    })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    await supabase.from('instructor_applications').update({
      status: 'terms_offered', reviewed_at: now, reviewed_by: user.id, admin_note: adminNote ?? app.admin_note, updated_at: now,
    }).eq('id', app.id)
    await notifyUsers([app.user_id], {
      title: 'Candidature retenue — conditions de partenariat',
      body: `IBIG EDUFORM vous propose un partenariat avec ${share} % des revenus de vos formations. Consultez et signez la convention.`,
      link: '/devenir-partenaire',
    })
    return NextResponse.json({ ok: true })
  }

  if (action === 'reject') {
    if (typeof reason !== 'string' || reason.trim().length < 10) {
      return NextResponse.json({ error: 'Indiquez un motif de refus (10 caractères minimum).' }, { status: 400 })
    }
    await supabase.from('instructor_applications').update({
      status: 'rejected', rejection_reason: reason.trim(), reviewed_at: now, reviewed_by: user.id, updated_at: now,
    }).eq('id', app.id)
    await notifyUsers([app.user_id], {
      title: 'Candidature formateur : modifications demandées',
      body: reason.trim(),
      link: '/devenir-partenaire',
    })
    return NextResponse.json({ ok: true })
  }

  if (action === 'suspend') {
    await supabase.from('instructor_applications').update({ status: 'suspended', admin_note: reason ?? app.admin_note, updated_at: now }).eq('id', app.id)
    await supabase.from('partner_agreements').update({ status: 'revoked' }).eq('user_id', app.user_id).eq('status', 'accepted')
    // is_partner est un champ protégé : mise à jour avec la clé service
    await createAdminClient().from('profiles').update({ is_partner: false }).eq('id', app.user_id)
    await notifyUsers([app.user_id], {
      title: 'Partenariat suspendu',
      body: reason?.trim() || 'Votre partenariat formateur a été suspendu. Contactez IBIG EDUFORM.',
      link: '/devenir-partenaire',
    })
    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ error: 'Action inconnue' }, { status: 400 })
}
