import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const body = await request.json()
  const { courseId, currency = 'XOF', enrollmentMode = 'guide' } = body

  if (!courseId) return NextResponse.json({ error: 'courseId requis' }, { status: 400 })

  const { data: course } = await supabase
    .from('courses')
    .select('id, title, price_xof, slug')
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

  const cookieStore = await cookies()
  const refCode = cookieStore.get('ibig_ref')?.value ?? null

  const transactionId = `IBIG-WAVE-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`
  const appUrl = process.env.NEXT_PUBLIC_APP_URL!

  // Créer le paiement en attente
  const { data: payment } = await supabase.from('payments').insert({
    user_id: user.id,
    course_id: courseId,
    amount: course.price_xof,
    currency: 'XOF',
    method: 'mobile_money',
    provider: 'wave',
    provider_reference: transactionId,
    status: 'pending',
    invoice_number: transactionId,
    metadata: {
      ...(refCode ? { ref_code: refCode } : {}),
      enrollment_mode: enrollmentMode,
      total_amount: course.price_xof,
    },
  }).select().single()

  if (!payment) return NextResponse.json({ error: 'Erreur création paiement' }, { status: 500 })

  // Appel Wave Checkout API
  const waveRes = await fetch('https://api.wave.com/v1/checkout/sessions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.WAVE_API_KEY}`,
    },
    body: JSON.stringify({
      amount: course.price_xof.toString(),
      currency: 'XOF',
      error_url:  `${appUrl}/paiement/${courseId}?error=wave`,
      success_url:`${appUrl}/paiement/confirmation?transaction_id=${transactionId}&course_id=${courseId}`,
      client_reference: transactionId,
    }),
  })

  if (!waveRes.ok) {
    const err = await waveRes.text()
    console.error('[wave] API error:', err)
    await supabase.from('payments').update({ status: 'failed' }).eq('id', payment.id)
    return NextResponse.json({ error: 'Erreur Wave', detail: err }, { status: 502 })
  }

  const waveData = await waveRes.json()

  // Stocker le wave_id pour le webhook
  await supabase.from('payments').update({
    metadata: {
      ...(payment.metadata as object ?? {}),
      wave_id: waveData.id,
    }
  }).eq('id', payment.id)

  return NextResponse.json({ paymentUrl: waveData.wave_launch_url, transactionId })
}
