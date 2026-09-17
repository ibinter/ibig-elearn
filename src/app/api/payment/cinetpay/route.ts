import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  const body = await request.json()
  const { courseId, currency = 'XOF' } = body

  if (!courseId) {
    return NextResponse.json({ error: 'courseId requis' }, { status: 400 })
  }

  const { data: course } = await supabase
    .from('courses')
    .select('id, title, price_xof, price_eur, price_usd')
    .eq('id', courseId)
    .single()

  if (!course) {
    return NextResponse.json({ error: 'Formation introuvable' }, { status: 404 })
  }

  const { data: existing } = await supabase
    .from('enrollments')
    .select('id')
    .eq('user_id', user.id)
    .eq('course_id', courseId)
    .single()

  if (existing) {
    return NextResponse.json({ error: 'Déjà inscrit' }, { status: 409 })
  }

  const amounts: Record<string, number> = {
    XOF: course.price_xof,
    EUR: course.price_eur ?? Math.round(course.price_xof / 655),
    USD: course.price_usd ?? Math.round(course.price_xof / 600),
  }
  const amount = amounts[currency] ?? course.price_xof

  // Créer le paiement en attente
  const transactionId = `IBIG-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`
  const { data: payment } = await supabase.from('payments').insert({
    user_id: user.id,
    course_id: courseId,
    amount,
    currency,
    method: 'mobile_money',
    provider: 'cinetpay',
    provider_reference: transactionId,
    status: 'pending',
    invoice_number: transactionId,
  }).select().single()

  // Appel CinetPay
  const appUrl = process.env.NEXT_PUBLIC_APP_URL
  const cinetpayPayload = {
    apikey: process.env.CINETPAY_API_KEY,
    site_id: process.env.CINETPAY_SITE_ID,
    transaction_id: transactionId,
    amount,
    currency,
    description: `Formation : ${course.title}`,
    notify_url: `${appUrl}/api/payment/webhook`,
    return_url: `${appUrl}/paiement/confirmation?ref=${transactionId}`,
    channels: 'ALL',
    lang: 'fr',
    metadata: JSON.stringify({ userId: user.id, courseId, paymentId: payment?.id }),
  }

  const cpResponse = await fetch('https://api-checkout.cinetpay.com/v2/payment', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(cinetpayPayload),
  })

  const cpData = await cpResponse.json()

  if (cpData.code !== '201') {
    await supabase.from('payments').update({ status: 'failed' }).eq('id', payment?.id)
    return NextResponse.json({ error: 'Erreur de paiement', detail: cpData.message }, { status: 502 })
  }

  return NextResponse.json({ paymentUrl: cpData.data?.payment_url, transactionId })
}
