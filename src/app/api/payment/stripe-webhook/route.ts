import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import Stripe from 'stripe'
import { sendEmail, inscriptionEmail } from '@/lib/email'
import { reportSaleToPartners } from '@/lib/referral'

export async function POST(request: NextRequest) {
  const stripeKey = process.env.STRIPE_SECRET_KEY
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!stripeKey || !webhookSecret) {
    return NextResponse.json({ error: 'Stripe non configuré' }, { status: 500 })
  }
  const stripe = new Stripe(stripeKey)

  const body = await request.text()
  const sig = request.headers.get('stripe-signature')

  if (!sig) return NextResponse.json({ error: 'Signature manquante' }, { status: 400 })

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret)
  } catch (err: any) {
    console.error('[stripe-webhook] signature error:', err.message)
    return NextResponse.json({ error: 'Signature invalide' }, { status: 400 })
  }

  if (event.type !== 'checkout.session.completed') {
    return NextResponse.json({ received: true })
  }

  const session = event.data.object as Stripe.Checkout.Session
  const { userId, courseId, transactionId, installments, refCode, enrollmentMode } = session.metadata ?? {}

  if (!transactionId || !userId || !courseId) {
    return NextResponse.json({ error: 'Metadata manquante' }, { status: 400 })
  }

  const supabase = await createClient()

  // Mettre à jour le paiement
  await supabase.from('payments').update({
    status: 'completed',
    metadata: { stripe_session_id: session.id, installments: parseInt(installments ?? '1') },
    updated_at: new Date().toISOString(),
  }).eq('provider_reference', transactionId)

  // Créer l'inscription (accès immédiat même pour 3x)
  const { data: enrollment } = await supabase.from('enrollments').upsert({
    user_id: userId,
    course_id: courseId,
    status: 'active',
    paid_amount: session.amount_total ?? 0,
    paid_currency: (session.currency ?? 'EUR').toUpperCase(),
    payment_method: 'card',
    payment_reference: transactionId,
    mode: (enrollmentMode as any) ?? 'guide',
  }, { onConflict: 'user_id,course_id' }).select().single()

  // Marquer l'échéance 1 comme payée si 3x
  if (parseInt(installments ?? '1') === 3 && enrollment) {
    await supabase.from('payment_installments')
      .update({ status: 'paid', paid_at: new Date().toISOString(), enrollment_id: enrollment.data?.id })
      .eq('user_id', userId)
      .eq('course_id', courseId)
      .eq('installment_number', 1)
  }

  await supabase.rpc('increment_enrollment_count', { course_id_arg: courseId })

  try {
    const [{ data: profile }, { data: course }] = await Promise.all([
      supabase.from('profiles').select('full_name, email, phone').eq('id', userId).single(),
      supabase.from('courses').select('title, slug').eq('id', courseId).single(),
    ])

    if (profile?.email && course) {
      const tpl = inscriptionEmail({ name: profile.full_name ?? 'Apprenant', courseTitle: course.title, courseSlug: course.slug })
      await sendEmail({ to: profile.email, ...tpl })
    }
    await supabase.from('notifications').insert({
      user_id: userId,
      type: 'enrollment',
      title: `Inscription confirmée — ${course?.title}`,
      body: parseInt(installments ?? '1') === 3
        ? 'Paiement 1/3 confirmé. Accès immédiat à la formation.'
        : 'Votre paiement a été validé. Vous pouvez commencer à apprendre maintenant.',
      link: `/apprendre/${courseId}/intro`,
    })
    if (refCode) {
      await reportSaleToPartners({
        partnerCode: refCode,
        externalRef: transactionId,
        amount: session.amount_total ?? 0,
        currency: (session.currency ?? 'EUR').toUpperCase(),
        customerName: profile?.full_name ?? undefined,
        customerEmail: profile?.email ?? undefined,
        customerPhone: profile?.phone ?? undefined,
      })
    }
  } catch (e) { console.error('[stripe-webhook] post-payment error:', e) }

  return NextResponse.json({ received: true })
}
