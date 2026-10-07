import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { notifyStaff, notifyUsers } from '@/lib/notify'
import { CANCEL_LIMIT_HOURS } from '@/lib/coaching'

/**
 * Actions sur une séance :
 *  - cancel   : apprenant (jusqu'à 24 h avant) ou coach (à tout moment) ; remboursement signalé à EDUFORM
 *  - complete : le coach marque la séance comme réalisée (après l'heure de début)
 *  - notes    : le coach enregistre ses notes privées
 */
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const { bookingId, action, reason, notes } = await req.json().catch(() => ({}))
  const admin = createAdminClient()
  const { data: b } = await admin.from('coaching_bookings')
    .select('id, status, starts_at, coach_id, learner_id, price_xof, offer:coaching_offers(title)').eq('id', bookingId).single()
  if (!b) return NextResponse.json({ error: 'Séance introuvable' }, { status: 404 })

  const isCoach = b.coach_id === user.id
  const isLearner = b.learner_id === user.id
  if (!isCoach && !isLearner) return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
  const title = ((Array.isArray(b.offer) ? b.offer[0] : b.offer) as { title?: string } | null)?.title ?? 'Séance de coaching'
  const now = new Date().toISOString()

  if (action === 'cancel') {
    if (!['confirmed', 'pending_payment'].includes(b.status)) return NextResponse.json({ error: 'Cette séance ne peut plus être annulée.' }, { status: 400 })
    const hoursLeft = (new Date(b.starts_at).getTime() - Date.now()) / 3600_000
    if (isLearner && !isCoach && b.status === 'confirmed' && hoursLeft < CANCEL_LIMIT_HOURS) {
      return NextResponse.json({ error: `L'annulation n'est possible que jusqu'à ${CANCEL_LIMIT_HOURS} h avant la séance. Contactez votre coach.` }, { status: 400 })
    }
    await admin.from('coaching_bookings').update({
      status: 'cancelled', cancelled_by: user.id, cancel_reason: typeof reason === 'string' ? reason.slice(0, 500) : null, updated_at: now,
    }).eq('id', b.id)

    const other = isCoach ? b.learner_id : b.coach_id
    await notifyUsers([other], {
      title: 'Séance de coaching annulée',
      body: `« ${title} » du ${new Date(b.starts_at).toLocaleString('fr-FR', { dateStyle: 'long', timeStyle: 'short', timeZone: 'Africa/Abidjan' })} a été annulée${isCoach ? ' par le coach' : ''}.`,
      link: isCoach ? '/mes-seances' : '/formateur/coaching',
    })
    if (b.status === 'confirmed' && b.price_xof > 0) {
      const { data: pay } = await admin.from('payments').select('id, provider_reference').eq('coaching_booking_id', b.id).eq('status', 'completed').maybeSingle()
      if (pay) {
        await notifyStaff({
          title: 'Remboursement coaching à traiter',
          body: `« ${title} » annulée par ${isCoach ? 'le coach' : 'l\'apprenant'} — ${b.price_xof} FCFA, réf. ${pay.provider_reference}.`,
          link: '/admin/coaching',
        })
      }
    }
    return NextResponse.json({ ok: true })
  }

  if (action === 'complete') {
    if (!isCoach) return NextResponse.json({ error: 'Réservé au coach' }, { status: 403 })
    if (b.status !== 'confirmed' || new Date(b.starts_at).getTime() > Date.now()) {
      return NextResponse.json({ error: 'La séance doit avoir commencé pour être marquée comme réalisée.' }, { status: 400 })
    }
    await admin.from('coaching_bookings').update({ status: 'completed', updated_at: now }).eq('id', b.id)
    return NextResponse.json({ ok: true })
  }

  if (action === 'notes') {
    if (!isCoach) return NextResponse.json({ error: 'Réservé au coach' }, { status: 403 })
    await admin.from('coaching_bookings').update({ coach_notes: typeof notes === 'string' ? notes.slice(0, 5000) : null, updated_at: now }).eq('id', b.id)
    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ error: 'Action inconnue' }, { status: 400 })
}
