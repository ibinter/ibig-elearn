import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import Stripe from 'stripe'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  const stripeKey = process.env.STRIPE_SECRET_KEY
  if (!stripeKey) return NextResponse.json({ error: 'Stripe non configuré' }, { status: 500 })
  const stripe = new Stripe(stripeKey)

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const body = await request.json()
  const { courseId, currency = 'EUR', installments = 1, enrollmentMode = 'guide' } = body

  if (!courseId) return NextResponse.json({ error: 'courseId requis' }, { status: 400 })

  const { data: course } = await supabase
    .from('courses')
    .select('id, title, price_xof, price_eur, price_usd, slug')
    .eq('id', courseId)
    .single()
  if (!course) return NextResponse.json({ error: 'Formation introuvable' }, { status: 404 })

  const { data: existing } = await supabase
    .from('enrollments')
    .select('id')
    .eq('user_id', user.id)
    .eq('course_id', courseId)
    .single()
  if (existing) return NextResponse.json({ error: 'Déjà inscrit' }, { status: 409 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, email')
    .eq('id', user.id)
    .single()

  // Montant total en centimes
  const totalAmounts: Record<string, number> = {
    EUR: Math.round((course.price_eur ?? course.price_xof / 655) * 100),
    USD: Math.round((course.price_usd ?? course.price_xof / 600) * 100),
  }
  const totalCents = totalAmounts[currency] ?? totalAmounts['EUR']
  const chargeCents = installments === 3 ? Math.ceil(totalCents / 3) : totalCents

  const cookieStore = await cookies()
  const refCode = cookieStore.get('ibig_ref')?.value ?? null

  const transactionId = `IBIG-STRIPE-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`
  const appUrl = process.env.NEXT_PUBLIC_APP_URL

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    currency: currency.toLowerCase(),
    customer_email: profile?.email ?? user.email,
    line_items: [{
      price_data: {
        currency: currency.toLowerCase(),
        unit_amount: chargeCents,
        product_data: {
          name: installments === 3
            ? `${course.title} — 1ère mensualité (3x)`
            : course.title,
          description: installments === 3
            ? `Paiement 1/3 — accès immédiat complet. Les 2 versements suivants seront prélevés automatiquement.`
            : `Formation IBIG E-LEARNING — accès à vie`,
        },
      },
      quantity: 1,
    }],
    success_url: `${appUrl}/paiement/confirmation?transaction_id=${transactionId}&course_id=${courseId}`,
    cancel_url: `${appUrl}/paiement/${courseId}?cancelled=1`,
    metadata: {
      userId: user.id,
      courseId,
      transactionId,
      installments: installments.toString(),
      refCode: refCode ?? '',
      enrollmentMode,
    },
    payment_intent_data: {
      metadata: {
        transactionId,
        userId: user.id,
        courseId,
      },
    },
  })

  // Enregistrer le paiement pending
  const { data: payment } = await supabase.from('payments').insert({
    user_id: user.id,
    course_id: courseId,
    amount: chargeCents,
    currency,
    method: 'card',
    provider: 'stripe',
    provider_reference: transactionId,
    status: 'pending',
    invoice_number: transactionId,
    metadata: {
      stripe_session_id: session.id,
      installments,
      total_cents: totalCents,
      ref_code: refCode ?? null,
    },
  }).select().single()

  // Si 3x : créer les 3 échéances
  if (installments === 3 && payment) {
    const now = new Date()
    const installmentRows = [1, 2, 3].map(n => ({
      user_id: user.id,
      course_id: courseId,
      installment_number: n,
      total_amount: totalCents,
      installment_amount: n === 3 ? totalCents - (Math.ceil(totalCents / 3) * 2) : Math.ceil(totalCents / 3),
      currency,
      due_date: new Date(now.getFullYear(), now.getMonth() + (n - 1), now.getDate()).toISOString(),
      status: n === 1 ? 'pending' : 'pending',
      payment_id: n === 1 ? payment.id : null,
    }))
    await supabase.from('payment_installments').insert(installmentRows)
  }

  return NextResponse.json({ checkoutUrl: session.url, transactionId })
}
