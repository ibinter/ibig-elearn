import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { BOOKING_HORIZON_DAYS, HOLD_MINUTES, generateSlots } from '@/lib/coaching'
import { confirmCoachingBooking, expireStaleHolds } from '@/lib/coaching-server'
import { createGeniusPayCheckout } from '@/lib/payment/geniuspay'

/**
 * Réservation d'un créneau : vérifie l'offre et la disponibilité, bloque le créneau
 * (HOLD_MINUTES) puis lance le paiement GeniusPay (fournisseur par défaut). Séance gratuite : confirmée directement.
 */
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Connectez-vous pour réserver.' }, { status: 401 })

  const { offerId, start, goal } = await req.json().catch(() => ({}))
  if (typeof offerId !== 'string' || typeof start !== 'string') return NextResponse.json({ error: 'Créneau invalide' }, { status: 400 })

  const admin = createAdminClient()
  const { data: offer } = await admin.from('coaching_offers')
    .select('id, title, coach_id, duration_min, price_xof, is_active, coach:profiles(timezone, is_partner)')
    .eq('id', offerId).single()
  const coach = (Array.isArray(offer?.coach) ? offer?.coach[0] : offer?.coach) as { timezone?: string; is_partner?: boolean } | null
  if (!offer || !offer.is_active || !coach?.is_partner) return NextResponse.json({ error: 'Cette offre n\'est plus disponible.' }, { status: 404 })
  if (offer.coach_id === user.id) return NextResponse.json({ error: 'Vous ne pouvez pas réserver votre propre séance.' }, { status: 400 })

  await expireStaleHolds(offer.coach_id)

  // Le créneau demandé doit faire partie des créneaux réellement disponibles
  const from = new Date()
  const to = new Date(from.getTime() + (BOOKING_HORIZON_DAYS + 1) * 86400_000)
  const [{ data: availability }, { data: busy }] = await Promise.all([
    admin.from('coach_availability').select('weekday, start_time, end_time').eq('coach_id', offer.coach_id),
    admin.rpc('coach_busy_slots', { p_coach: offer.coach_id, p_from: from.toISOString(), p_to: to.toISOString() }),
  ])
  const slots = generateSlots({
    availability: availability ?? [], busy: (busy ?? []) as { starts_at: string; ends_at: string }[],
    durationMin: offer.duration_min, timezone: coach.timezone || 'Africa/Abidjan',
  })
  const slot = slots.find(s => s.start === new Date(start).toISOString())
  if (!slot) return NextResponse.json({ error: 'Ce créneau vient d\'être réservé ou n\'est plus disponible. Choisissez-en un autre.' }, { status: 409 })

  const isFree = offer.price_xof <= 0
  const { data: booking, error } = await admin.from('coaching_bookings').insert({
    offer_id: offer.id,
    coach_id: offer.coach_id,
    learner_id: user.id,
    starts_at: slot.start,
    ends_at: slot.end,
    status: 'pending_payment',
    price_xof: offer.price_xof,
    learner_goal: typeof goal === 'string' ? goal.trim().slice(0, 1000) || null : null,
    hold_expires_at: new Date(Date.now() + HOLD_MINUTES * 60000).toISOString(),
  }).select('id').single()
  if (error || !booking) {
    // violation de l'index unique : course entre deux réservations
    return NextResponse.json({ error: 'Ce créneau vient d\'être réservé. Choisissez-en un autre.' }, { status: 409 })
  }

  if (isFree) {
    await confirmCoachingBooking(booking.id)
    return NextResponse.json({ redirect: '/mes-seances?reservee=1' })
  }

  // Paiement via GeniusPay (fournisseur prioritaire par défaut), même circuit que les formations
  const transactionId = `IBIG-CO-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`
  const { data: payment } = await admin.from('payments').insert({
    user_id: user.id,
    course_id: null,
    coaching_booking_id: booking.id,
    amount: offer.price_xof,
    currency: 'XOF',
    method: 'mobile_money',
    provider: 'geniuspay',
    provider_reference: transactionId,
    status: 'pending',
    invoice_number: transactionId,
    metadata: { kind: 'coaching', offer_id: offer.id },
  }).select('id').single()

  const { data: learner } = await admin.from('profiles').select('full_name, email, phone, country').eq('id', user.id).single()
  const appUrl = process.env.NEXT_PUBLIC_APP_URL
  const gp = await createGeniusPayCheckout({
    amountXof: offer.price_xof,
    description: `Coaching IBIG : ${offer.title}`,
    customer: { name: learner?.full_name, email: learner?.email, phone: learner?.phone, country: learner?.country },
    successUrl: `${appUrl}/mes-seances?paiement=${transactionId}`,
    errorUrl: `${appUrl}/coaching/${offer.id}?paiement=echec`,
    metadata: { ibig_transaction_id: transactionId, payment_id: payment?.id ?? '', user_id: user.id, booking_id: booking.id },
  })
  if (!gp.ok) {
    await admin.from('payments').update({ status: 'failed' }).eq('id', payment?.id)
    await admin.from('coaching_bookings').update({ status: 'expired' }).eq('id', booking.id)
    return NextResponse.json({ error: "Le paiement n'a pas pu être initialisé. Réessayez." }, { status: 502 })
  }
  await admin.from('payments').update({ metadata: { kind: 'coaching', offer_id: offer.id, geniuspay_reference: gp.reference } }).eq('id', payment?.id)
  return NextResponse.json({ paymentUrl: gp.checkoutUrl })
}
