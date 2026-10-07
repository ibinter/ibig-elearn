import { createAdminClient } from '@/lib/supabase/admin'
import { notifyUsers } from '@/lib/notify'
import { sendEmail } from '@/lib/email'
import { jitsiRoomUrl } from '@/lib/coaching'
import { SITE_URL } from '@/lib/site'

const fmt = (iso: string) =>
  new Date(iso).toLocaleString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit', timeZone: 'Africa/Abidjan' }) + ' (GMT)'

/** Libère les créneaux bloqués dont le délai de paiement est dépassé. */
export async function expireStaleHolds(coachId?: string) {
  const admin = createAdminClient()
  let q = admin.from('coaching_bookings').update({ status: 'expired', updated_at: new Date().toISOString() })
    .eq('status', 'pending_payment').lt('hold_expires_at', new Date().toISOString())
  if (coachId) q = q.eq('coach_id', coachId)
  await q
}

/** Confirme une séance (après paiement validé ou si elle est gratuite) et prévient coach + apprenant. */
export async function confirmCoachingBooking(bookingId: string) {
  const admin = createAdminClient()
  const { data: b } = await admin.from('coaching_bookings')
    .select('id, status, starts_at, meeting_url, coach_id, learner_id, offer:coaching_offers(title, duration_min, format)')
    .eq('id', bookingId).single()
  if (!b || b.status === 'confirmed' || b.status === 'completed') return

  const meetingUrl = b.meeting_url ?? jitsiRoomUrl(b.id)
  await admin.from('coaching_bookings').update({
    status: 'confirmed', meeting_url: meetingUrl, hold_expires_at: null, updated_at: new Date().toISOString(),
  }).eq('id', b.id)

  const offer = (Array.isArray(b.offer) ? b.offer[0] : b.offer) as { title: string; duration_min: number; format: string } | null
  const when = fmt(b.starts_at)
  const title = offer?.title ?? 'Séance de coaching'

  await notifyUsers([b.learner_id], {
    title: 'Séance de coaching confirmée',
    body: `« ${title} » — ${when}. Le lien de visio est disponible dans « Mes séances ».`,
    link: '/mes-seances',
  })
  await notifyUsers([b.coach_id], {
    title: 'Nouvelle séance réservée',
    body: `« ${title} » — ${when}.`,
    link: '/formateur/coaching',
  })

  try {
    const { data: people } = await admin.from('profiles').select('id, full_name, email').in('id', [b.learner_id, b.coach_id])
    const learner = people?.find(p => p.id === b.learner_id)
    const coach = people?.find(p => p.id === b.coach_id)
    const block = (who: string) => `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto">
        <h2 style="color:#0B3D91">Séance de coaching confirmée</h2>
        <p>Bonjour ${who},</p>
        <p><strong>${title}</strong> — ${offer?.duration_min ?? ''} min<br/>${when}</p>
        <p>Avec : ${who === learner?.full_name ? coach?.full_name : learner?.full_name}</p>
        <p><a href="${SITE_URL}/mes-seances" style="background:#0B3D91;color:#fff;padding:12px 18px;border-radius:10px;text-decoration:none">Voir la séance et le lien de visio</a></p>
        <p style="color:#6b7280;font-size:13px">Annulation gratuite jusqu'à 24 h avant la séance depuis votre espace.</p>
      </div>`
    if (learner?.email) await sendEmail({ to: learner.email, subject: `Séance confirmée — ${title}`, html: block(learner.full_name ?? '') })
    if (coach?.email) await sendEmail({ to: coach.email, subject: `Nouvelle séance réservée — ${title}`, html: block(coach.full_name ?? '') })
  } catch (e) { console.error('[coaching] email', e) }
}
