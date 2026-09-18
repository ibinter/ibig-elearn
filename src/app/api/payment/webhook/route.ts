import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendEmail, inscriptionEmail } from '@/lib/email'
import { reportSaleToPartners } from '@/lib/referral'
import { felicitationsFormationEmail } from '@/lib/email-templates'

export async function POST(request: NextRequest) {
  let body: Record<string, string>
  try {
    body = await request.json()
  } catch {
    // CinetPay peut envoyer en form-urlencoded
    const text = await request.text()
    body = Object.fromEntries(new URLSearchParams(text))
  }

  const transactionId = body.cpm_trans_id ?? body.transaction_id
  const result = body.cpm_result ?? body.result
  const errorMsg = body.cpm_error_message ?? body.error_message ?? ''

  if (!transactionId) {
    return NextResponse.json({ error: 'transaction_id manquant' }, { status: 400 })
  }

  const supabase = await createClient()

  const { data: payment } = await supabase
    .from('payments')
    .select('*')
    .eq('provider_reference', transactionId)
    .single()

  if (!payment) {
    return NextResponse.json({ error: 'Paiement introuvable' }, { status: 404 })
  }

  if (result === '00') {
    await supabase.from('payments').update({
      status: 'completed',
      metadata: { cinetpay_response: body },
    }).eq('id', payment.id)

    await supabase.from('enrollments').upsert({
      user_id: payment.user_id,
      course_id: payment.course_id,
      status: 'active',
      paid_amount: payment.amount,
      paid_currency: payment.currency,
      payment_method: payment.method,
      payment_reference: payment.provider_reference,
    }, { onConflict: 'user_id,course_id' })

    await supabase.rpc('increment_enrollment_count', { course_id_arg: payment.course_id })

    // Email de confirmation + notification IBIG PARTNER
    try {
      const { data: profile } = await supabase.from('profiles').select('full_name, email, phone').eq('id', payment.user_id).single()
      const { data: course } = await supabase.from('courses').select('title, slug').eq('id', payment.course_id).single()
      if (profile?.email && course) {
        const tpl = inscriptionEmail({ name: profile.full_name ?? 'Apprenant', courseTitle: course.title, courseSlug: course.slug })
        await sendEmail({ to: profile.email, ...tpl })
      }
      // Notifier IBIG PARTNER si un code affilié est présent
      const refCode = (payment.metadata as any)?.ref_code
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

  } else {
    await supabase.from('payments').update({
      status: 'failed',
      metadata: { error: errorMsg },
    }).eq('id', payment.id)
  }

  return NextResponse.json({ status: 'ok' })
}

// CinetPay envoie parfois en GET pour la return_url
export async function GET(request: NextRequest) {
  return NextResponse.json({ status: 'ok' })
}
