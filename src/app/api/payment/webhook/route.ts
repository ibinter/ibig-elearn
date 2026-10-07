import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendEmail, inscriptionEmail } from '@/lib/email'
import { reportSaleToPartners } from '@/lib/referral'
import { checkCinetPayTransaction } from '@/lib/payment/cinetpay'
import { confirmCoachingBooking } from '@/lib/coaching-server'

/**
 * Notification CinetPay.
 * Sécurité : le corps de la notification n'est qu'un signal. Le statut et le montant sont
 * revérifiés auprès de l'API CinetPay avant toute validation (sinon n'importe qui pourrait
 * appeler cette route avec cpm_result=00 et obtenir l'accès sans payer).
 */
export async function POST(request: NextRequest) {
  let body: Record<string, string>
  const raw = await request.text()
  try { body = JSON.parse(raw) } catch { body = Object.fromEntries(new URLSearchParams(raw)) }

  const transactionId = body.cpm_trans_id ?? body.transaction_id
  if (!transactionId) return NextResponse.json({ error: 'transaction_id manquant' }, { status: 400 })

  const supabase = createAdminClient()
  const { data: payment } = await supabase.from('payments').select('*').eq('provider_reference', transactionId).single()
  if (!payment) return NextResponse.json({ error: 'Paiement introuvable' }, { status: 404 })

  // Idempotence : notification déjà traitée
  if (payment.status === 'completed') return NextResponse.json({ status: 'ok' })

  const check = await checkCinetPayTransaction(transactionId)
  const amountOk = check.amount != null && Math.round(check.amount) >= Math.round(Number(payment.amount))
  const currencyOk = !check.currency || check.currency.toUpperCase() === String(payment.currency).toUpperCase()

  if (!check.accepted || !amountOk || !currencyOk) {
    // Paiement refusé / en cours / montant incohérent : on ne valide rien
    if (check.accepted && (!amountOk || !currencyOk)) {
      console.error('[webhook] montant/devise incohérents', { transactionId, expected: payment.amount, got: check.amount })
    }
    const definitiveFailure = (check.raw as { data?: { status?: string } } | null)?.data?.status === 'REFUSED'
    if (definitiveFailure) {
      await supabase.from('payments').update({
        status: 'failed', metadata: { ...(payment.metadata ?? {}), error: body.cpm_error_message ?? 'REFUSED' },
      }).eq('id', payment.id)
      if (payment.coaching_booking_id) {
        await supabase.from('coaching_bookings').update({ status: 'expired', updated_at: new Date().toISOString() })
          .eq('id', payment.coaching_booking_id).eq('status', 'pending_payment')
      }
    }
    return NextResponse.json({ status: 'ok' })
  }

  await supabase.from('payments').update({
    status: 'completed',
    metadata: { ...(payment.metadata ?? {}), cinetpay_check: check.raw },
  }).eq('id', payment.id)

  // ── Séance de coaching ──
  if (payment.coaching_booking_id) {
    await confirmCoachingBooking(payment.coaching_booking_id)
    return NextResponse.json({ status: 'ok' })
  }

  // ── Formation ──
  await supabase.from('enrollments').upsert({
    user_id: payment.user_id,
    course_id: payment.course_id,
    status: 'active',
    paid_amount: payment.amount,
    paid_currency: payment.currency,
    payment_method: payment.method,
    payment_reference: payment.provider_reference,
    mode: (payment.metadata as { enrollment_mode?: string } | null)?.enrollment_mode ?? 'guide',
  }, { onConflict: 'user_id,course_id' })

  if ((payment.metadata as { installments?: number } | null)?.installments === 3) {
    await supabase.from('payment_installments')
      .update({ status: 'paid', paid_at: new Date().toISOString() })
      .eq('user_id', payment.user_id).eq('course_id', payment.course_id).eq('installment_number', 1)
  }

  await supabase.rpc('increment_enrollment_count', { course_id_arg: payment.course_id })

  try {
    const { data: profile } = await supabase.from('profiles').select('full_name, email, phone').eq('id', payment.user_id).single()
    const { data: course } = await supabase.from('courses').select('title, slug').eq('id', payment.course_id).single()
    if (profile?.email && course) {
      const tpl = inscriptionEmail({ name: profile.full_name ?? 'Apprenant', courseTitle: course.title, courseSlug: course.slug })
      await sendEmail({ to: profile.email, ...tpl })
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
    const refCode = (payment.metadata as { ref_code?: string } | null)?.ref_code
    if (refCode) {
      await reportSaleToPartners({
        partnerCode: refCode,
        externalRef: payment.provider_reference,
        amount: payment.amount,
        currency: payment.currency,
        customerName: profile?.full_name ?? undefined,
        customerEmail: profile?.email ?? undefined,
        customerPhone: profile?.phone ?? undefined,
      })
    }
  } catch (e) { console.error('[webhook] email/referral error:', e) }

  return NextResponse.json({ status: 'ok' })
}

// CinetPay envoie parfois en GET pour la return_url
export async function GET() {
  return NextResponse.json({ status: 'ok' })
}
