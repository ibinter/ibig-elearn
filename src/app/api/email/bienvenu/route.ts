import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendEmail, bienvenuEmail } from '@/lib/email'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

    const { data: profile } = await supabase.from('profiles').select('full_name, email').eq('id', user.id).single()
    if (!profile) return NextResponse.json({ error: 'Profil introuvable' }, { status: 404 })

    const tpl = bienvenuEmail({ name: profile.full_name ?? 'Apprenant', email: profile.email ?? user.email ?? '' })
    const result = await sendEmail({ to: profile.email ?? user.email ?? '', ...tpl })
    return NextResponse.json(result)
  } catch (e) {
    console.error('[email/bienvenu]', e)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
