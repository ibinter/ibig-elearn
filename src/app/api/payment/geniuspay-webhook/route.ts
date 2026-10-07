import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendEmail, inscriptionEmail } from '@/lib/email'
import { reportSaleToPartners } from '@/lib/referral'
import { verifyGeniusPaySignature } from '@/lib/payment/geniuspay'
import { confirmCoachingBooking } from '@/lib/coaching-server'

/**
 * Webhook GeniusPay (fournisseur par défaut).
 * Sécurité : signature HMAC obligatoire (refus si absente ou si le secret n'est pas configuré),
 * anti-rejeu, contrôle du montant payé, idempotence.
 */
export async function POST(request: NextRequest) {
  const rawBody = await request.text()

  const sig = verifyGeniusPaySignature(
    rawBody,
    request.headers.get('x-webhook-signature') ?? '',
    request.headers.get('x-webhook-timestamp') ?? '',
  )
  if (!sig.ok) {
    console.error('[geniuspay-webhook] refusé :', sig.reason ?? 'signature invalide')
    return NextResponse.json({ error: 'Signature invalide' }, { status: 401 })
  }

  let payload: { data?: { reference?: string; amount?: number | string; currency?: string; metadata?: Record<string, string> } }
  try { payload = JSON.parse(rawBody) } catch { return NextResponse.json({ error: 'JSON invalide' }, { status: 400 }) }

  const event = request.headers.get('x-webhook-event') ?? ''
  const ibigTransactionId = payload?.data?.metadata?.ibig_transaction_id
  if (!ibigTransactionId) return NextResponse.json({ received: true })

  const supabase = createAdminClient()
  const { data: payment } = await supabase.from('payments').select('*').eq('provider_reference', ibigTransactionId).single()
  if (!payment) return NextResponse.json({ error: 'Paiement introuvable' }, { status: 404 })

  // Échec / annulation : libérer le créneau de coaching éventuel
  if (event !== 'payment.success') {
    if (/failed|cancel|expired/i.test(event) && payment.status === 'pending') {
      await supabase.from('payments').update({ status: 'failed' }).eq('id', payment.id)
      if (payment.coaching_booking_id) {
        await supabase.from('coaching_bookings').update({ status: 'expired', updated_at: new Date().toISOString() })
          .eq('id', payment.coaching_booking_id).eq('status', 'pending_payment')
      }
    }
    return NextResponse.json({ received: true })
  }

  if (payment.status === 'completed') return NextResponse.json({ received: true }) // idempotence

  const paid = Number(payload?.data?.amount)
  if (Number.isFinite(paid) && Math.round(paid) < Math.round(Number(payment.amount))) {
    console.error('[geniuspay-webhook] montant insuffisant', { ibigTransactionId, expected: payment.amount, paid })
    return NextResponse.json({ error: 'Montant incohérent' }, { status: 400 })
  }

  await supabase.from('payments').update({
    status: 'completed',
    metadata: { ...(payment.metadata ?? {}), geniuspay_reference: payload?.data?.reference, geniuspay_event: payload?.data },
  }).eq('id', payment.id)

  // ── Séance de coaching ──
  if (payment.coaching_booking_id) {
    await confirmCoachingBooking(payment.coaching_booking_id)
    return NextResponse.json({ received: true })
  }

  // ── Formation ──
  const meta = (payment.metadata ?? {}) as { enrollment_mode?: string; installments?: number; ref_code?: string }
  await supabase.from('enrollments').upsert({
    user_id: payment.user_id,
    course_id: payment.course_id,
    status: 'active',
    paid_amount: payment.amount,
    paid_currency: payment.currency,
    payment_method: 'mobile_money',
    payment_reference: payment.provider_reference,
    mode: meta.enrollment_mode ?? 'guide',
  }, { onConflict: 'user_id,course_id' })

  await supabase.rpc('increment_enrollment_count', { course_id_arg: payment.course_id })

  if (meta.installments === 3) {
    await supabase.from('payment_installments')
      .update({ status: 'paid', paid_at: new Date().toISOString(), payment_id: payment.id })
      .eq('user_id', payment.user_id).eq('course_id', payment.course_id).eq('installment_number', 1)
  }

  try {
    const [{ data: profile }, { data: course }] = await Promise.all([
      supabase.from('profiles').select('full_name, email, phone').eq('id', payment.user_id).single(),
      supabase.from('courses').select('title, slug').eq('id', payment.course_id).single(),
    ])
    if (profile?.email && course) {
      await sendEmail({ to: profile.email, ...inscriptionEmail({ name: profile.full_name ?? 'Apprenant', courseTitle: course.title, courseSlug: course.slug }) })
    }
    if (course) {
      await supabase.from('notifications').insert({
        user_id: payment.user_id,
        type: 'enrollment',
        title: `Inscription confirmée — ${course.title}`,
        body: 'Votre paiement a été validé. Vous pouvez commencer à apprendre maintenant.',
        link: `/apprendre/${payment.course_id}/intro`,
      })
    }
    if (meta.ref_code && profile && course) {
      await reportSaleToPartners({
        partnerCode: meta.ref_code,
        externalRef: payment.provider_reference,
        amount: payment.amount,
        currency: payment.currency,
        customerName: profile.full_name ?? undefined,
        customerEmail: profile.email ?? undefined,
      })
    }
  } catch (e) { console.error('[geniuspay-webhook] email/referral error:', e) }

  return NextResponse.json({ received: true })
}
