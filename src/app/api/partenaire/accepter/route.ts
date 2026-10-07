import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { notifyStaff } from '@/lib/notify'

/** Acceptation (signature électronique) de la convention de partenariat. */
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const { agreementId, signatureName, accept } = await req.json().catch(() => ({}))
  if (accept !== true) return NextResponse.json({ error: 'Vous devez accepter la convention.' }, { status: 400 })
  if (typeof signatureName !== 'string' || signatureName.trim().length < 3) {
    return NextResponse.json({ error: 'Saisissez votre nom complet pour signer.' }, { status: 400 })
  }

  const ip = (req.headers.get('x-forwarded-for') ?? '').split(',')[0].trim() || null
  const { error } = await supabase.rpc('accept_partner_agreement', {
    p_agreement_id: agreementId,
    p_signature_name: signatureName.trim().slice(0, 120),
    p_ip: ip,
    p_user_agent: req.headers.get('user-agent')?.slice(0, 300) ?? null,
  })
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  await notifyStaff({
    title: 'Convention de partenariat signée',
    body: `${signatureName.trim()} est désormais formateur partenaire IBIG EDUFORM.`,
    link: '/admin/partenaires',
  })
  return NextResponse.json({ ok: true })
}
