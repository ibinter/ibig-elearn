import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!['admin', 'coordinateur'].includes(profile?.role ?? ''))
    return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })

  const { subject, html, roles } = await req.json()
  if (!subject?.trim() || !html?.trim())
    return NextResponse.json({ error: 'Sujet et contenu requis' }, { status: 400 })

  // Fetch target emails
  let query = supabase.from('profiles').select('email').not('email', 'is', null)
  if (roles?.length) query = query.in('role', roles)

  const { data: recipients, error: fetchErr } = await query
  if (fetchErr) return NextResponse.json({ error: fetchErr.message }, { status: 500 })

  const emails = (recipients ?? []).map((r: any) => r.email).filter(Boolean)
  if (!emails.length) return NextResponse.json({ error: 'Aucun destinataire trouvé' }, { status: 400 })

  // Resend bulk (max 100 per batch)
  const BATCH = 50
  let sent = 0
  for (let i = 0; i < emails.length; i += BATCH) {
    const batch = emails.slice(i, i + BATCH)
    await resend.emails.send({
      from: 'IBIG E-LEARN <no-reply@ibig-elearn.com>',
      to: batch,
      subject,
      html,
    })
    sent += batch.length
  }

  return NextResponse.json({ sent })
}
