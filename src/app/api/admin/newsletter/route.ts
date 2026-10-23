import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { sendEmail } from '@/lib/email'

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

  // Un envoi par destinataire : les adresses ne sont jamais visibles des autres abonnés
  let sent = 0
  for (const email of emails) {
    const { ok } = await sendEmail({ to: email, subject, html })
    if (ok) sent++
  }

  return NextResponse.json({ sent })
}
