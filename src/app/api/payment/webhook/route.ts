import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { cpm_trans_id, cpm_result, cpm_error_message } = body

  if (!cpm_trans_id) {
    return NextResponse.json({ error: 'transaction_id manquant' }, { status: 400 })
  }

  const supabase = await createClient()

  const { data: payment } = await supabase
    .from('payments')
    .select('*')
    .eq('provider_reference', cpm_trans_id)
    .single()

  if (!payment) {
    return NextResponse.json({ error: 'Paiement introuvable' }, { status: 404 })
  }

  if (cpm_result === '00') {
    // Paiement réussi
    await supabase.from('payments').update({
      status: 'completed',
      metadata: { ...payment.metadata, cinetpay_response: body },
      updated_at: new Date().toISOString(),
    }).eq('id', payment.id)

    // Inscrire l'apprenant
    await supabase.from('enrollments').upsert({
      user_id: payment.user_id,
      course_id: payment.course_id,
      status: 'active',
      paid_amount: payment.amount,
      paid_currency: payment.currency,
      payment_method: payment.method,
      payment_reference: payment.provider_reference,
    }, { onConflict: 'user_id,course_id' })

    // Incrémenter le compteur d'inscrits
    await supabase.rpc('increment_enrollment_count', { course_id_arg: payment.course_id })
  } else {
    await supabase.from('payments').update({
      status: 'failed',
      metadata: { error: cpm_error_message },
      updated_at: new Date().toISOString(),
    }).eq('id', payment.id)
  }

  return NextResponse.json({ status: 'ok' })
}
