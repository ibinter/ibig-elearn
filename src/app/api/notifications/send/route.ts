import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!profile || !['admin', 'coordinateur', 'formateur'].includes(profile.role ?? '')) {
    return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
  }

  const { user_id, type, title, body, link } = await req.json()
  if (!user_id || !type || !title) {
    return NextResponse.json({ error: 'Champs requis : user_id, type, title' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('notifications')
    .insert({ user_id, type, title, body: body ?? null, link: link ?? null })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, notification: data }, { status: 201 })
}
