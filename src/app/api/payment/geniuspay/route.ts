import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { createGeniusPayCheckout } from '@/lib/payment/geniuspay'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  const body = await request.json()
  const { courseId, currency = 'XOF', installments = 1, enrollmentMode = 'guide' } = body

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

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, email, phone, country')
    .eq('id', user.id)
    .single()

  // GeniusPay encaisse en XOF : montant toujours calculé en FCFA (paiement unique ou 1re échéance sur 3)
  void currency
  const totalAmount = course.price_xof
  const amount = installments === 3 ? Math.ceil(totalAmount / 3) : totalAmount

  const cookieStore = await cookies()
  const refCode = cookieStore.get('ibig_ref')?.value ?? null

  // Référence unique IBIG
  const transactionId = `IBIG-GP-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`

  const { data: payment } = await supabase.from('payments').insert({
    user_id: user.id,
    course_id: courseId,
    amount,
    currency: 'XOF',
    method: 'mobile_money',
    provider: 'geniuspay',
    provider_reference: transactionId,
    status: 'pending',
    invoice_number: transactionId,
    metadata: {
      ...(refCode ? { ref_code: refCode } : {}),
      installments,
      total_amount: totalAmount,
      enrollment_mode: enrollmentMode,
    },
  }).select().single()

  if (installments === 3 && payment) {
    const now = new Date()
    await supabase.from('payment_installments').insert([1, 2, 3].map(n => ({
      user_id: user.id,
      course_id: courseId,
      installment_number: n,
      total_amount: totalAmount,
      installment_amount: n === 3 ? totalAmount - (Math.ceil(totalAmount / 3) * 2) : Math.ceil(totalAmount / 3),
      currency: 'XOF',
      due_date: new Date(now.getFullYear(), now.getMonth() + (n - 1), now.getDate()).toISOString(),
      status: 'pending',
      payment_id: n === 1 ? payment.id : null,
    })))
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL

  const gp = await createGeniusPayCheckout({
    amountXof: amount,
    description: `Formation IBIG : ${course.title}`,
    customer: { name: profile?.full_name, email: profile?.email, phone: profile?.phone, country: profile?.country },
    successUrl: `${appUrl}/paiement/confirmation?transaction_id=${transactionId}&course_id=${courseId}`,
    errorUrl: `${appUrl}/paiement/confirmation?transaction_id=${transactionId}&course_id=${courseId}&status=failed`,
    metadata: { ibig_transaction_id: transactionId, payment_id: payment?.id ?? '', user_id: user.id, course_id: courseId },
  })

  if (!gp.ok) {
    await supabase.from('payments').update({ status: 'failed' }).eq('id', payment?.id)
    return NextResponse.json({ error: 'Erreur GeniusPay', detail: gp.error }, { status: 502 })
  }

  // Stocker la référence GeniusPay dans les metadata
  await supabase.from('payments').update({
    metadata: {
      ...(payment?.metadata as object ?? {}),
      geniuspay_reference: gp.reference,
    },
  }).eq('id', payment?.id)

  return NextResponse.json({ paymentUrl: gp.checkoutUrl, transactionId, reference: gp.reference })
}
