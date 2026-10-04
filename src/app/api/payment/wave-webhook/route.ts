import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendEmail, inscriptionEmail } from '@/lib/email'
import { reportSaleToPartners } from '@/lib/referral'
import crypto from 'crypto'

export async function POST(request: NextRequest) {
  const rawBody = await request.text()

  // Vérifier la signature Wave (HMAC-SHA256)
  const waveSecret = process.env.WAVE_WEBHOOK_SECRET
  if (waveSecret) {
    const signature = request.headers.get('wave-signature') ?? ''
    const expected = crypto
      .createHmac('sha256', waveSecret)
      .update(rawBody)
      .digest('hex')
    if (signature !== expected) {
      return NextResponse.json({ error: 'Signature invalide' }, { status: 401 })
    }
  }

  let event: any
  try {
    event = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ error: 'JSON invalide' }, { status: 400 })
  }

  // Wave envoie type = "checkout.session.completed" quand payé
  if (event.type !== 'checkout.session.completed') {
    return NextResponse.json({ received: true })
  }

  const session = event.data
  const clientRef = session?.client_reference  // notre transactionId

  if (!clientRef) {
    return NextResponse.json({ error: 'client_reference manquant' }, { status: 400 })
  }

  const supabase = await createClient()

  const { data: payment } = await supabase
    .from('payments')
    .select('*')
    .eq('provider_reference', clientRef)
    .single()

  if (!payment) {
    return NextResponse.json({ error: 'Paiement introuvable' }, { status: 404 })
  }

  // Idempotence : déjà traité
  if (payment.status === 'completed') {
    return NextResponse.json({ received: true })
  }

  await supabase.from('payments').update({
    status: 'completed',
    metadata: { ...(payment.metadata as object ?? {}), wave_session: session },
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

  // Emails de confirmation
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
    // Notifier IBIG Partners si code affilié
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
    console.error('[wave-webhook] email/referral error:', e)
  }

  return NextResponse.json({ received: true })
}
