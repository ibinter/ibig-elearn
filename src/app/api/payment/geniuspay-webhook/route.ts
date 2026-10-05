import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendEmail, inscriptionEmail } from '@/lib/email'
import { reportSaleToPartners } from '@/lib/referral'
import crypto from 'crypto'

export async function POST(request: NextRequest) {
  const rawBody = await request.text()

  // Vérification signature GeniusPay : HMAC-SHA256(timestamp + "." + json_payload, secret)
  const webhookSecret = process.env.GENIUSPAY_WEBHOOK_SECRET
  if (webhookSecret) {
    const signature = request.headers.get('x-webhook-signature') ?? ''
    const timestamp = request.headers.get('x-webhook-timestamp') ?? ''
    const expected = crypto
      .createHmac('sha256', webhookSecret)
      .update(`${timestamp}.${rawBody}`)
      .digest('hex')
    if (signature !== expected) {
      return NextResponse.json({ error: 'Signature invalide' }, { status: 401 })
    }
    // Protection anti-replay (5 minutes)
    if (Math.abs(Date.now() / 1000 - parseInt(timestamp)) > 300) {
      return NextResponse.json({ error: 'Timestamp expiré' }, { status: 400 })
    }
  }

  const event = request.headers.get('x-webhook-event') ?? ''

  let payload: any
  try {
    payload = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ error: 'JSON invalide' }, { status: 400 })
  }

  // On ne traite que les paiements réussis
  if (event !== 'payment.success') {
    return NextResponse.json({ received: true })
  }

  // La référence IBIG est stockée dans metadata.ibig_transaction_id
  const ibigTransactionId = payload?.data?.metadata?.ibig_transaction_id
  const gpReference = payload?.data?.reference

  if (!ibigTransactionId) {
    return NextResponse.json({ error: 'ibig_transaction_id manquant dans metadata' }, { status: 400 })
  }

  const supabase = await createClient()

  const { data: payment } = await supabase
    .from('payments')
    .select('*')
    .eq('provider_reference', ibigTransactionId)
    .single()

  if (!payment) {
    return NextResponse.json({ error: 'Paiement introuvable' }, { status: 404 })
  }

  // Idempotence
  if (payment.status === 'completed') {
    return NextResponse.json({ received: true })
  }

  await supabase.from('payments').update({
    status: 'completed',
    metadata: {
      ...(payment.metadata as object ?? {}),
      geniuspay_reference: gpReference,
      geniuspay_event: payload?.data,
    },
  }).eq('id', payment.id)

  const enrollmentMode = (payment.metadata as any)?.enrollment_mode ?? 'guide'

  await supabase.from('enrollments').upsert({
    user_id: payment.user_id,
    course_id: payment.course_id,
    status: 'active',
    paid_amount: payment.amount,
    paid_currency: payment.currency,
    payment_method: 'mobile_money',
    payment_reference: payment.provider_reference,
    mode: enrollmentMode,
  }, { onConflict: 'user_id,course_id' })

  await supabase.rpc('increment_enrollment_count', { course_id_arg: payment.course_id })

  // Si paiement 3x : marquer la première échéance comme payée
  const installments = (payment.metadata as any)?.installments
  if (installments === 3) {
    await supabase.from('payment_installments')
      .update({ status: 'paid', paid_at: new Date().toISOString(), payment_id: payment.id })
      .eq('user_id', payment.user_id)
      .eq('course_id', payment.course_id)
      .eq('installment_number', 1)
  }

  // Email de confirmation + affiliation
  try {
    const [{ data: profile }, { data: course }] = await Promise.all([
      supabase.from('profiles').select('full_name, email, phone').eq('id', payment.user_id).single(),
      supabase.from('courses').select('title, slug').eq('id', payment.course_id).single(),
    ])
    if (profile?.email && course) {
      const emailContent = inscriptionEmail({
        name: profile.full_name ?? 'Apprenant',
        courseTitle: course.title,
        courseSlug: course.slug,
      })
      await sendEmail({ to: profile.email, ...emailContent })
    }
    const refCode = (payment.metadata as any)?.ref_code
    if (refCode && profile && course) {
      await reportSaleToPartners({
        partnerCode: refCode,
        externalRef: payment.id ?? payment.course_id,
        amount: payment.amount,
        currency: payment.currency,
        customerName: profile.full_name ?? undefined,
        customerEmail: profile.email ?? undefined,
      })
    }
  } catch (e) {
    console.error('[geniuspay-webhook] email/referral error:', e)
  }

  return NextResponse.json({ received: true })
}
