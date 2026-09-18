import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function PATCH(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const { data: me } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!me || !['admin', 'coordinateur'].includes(me.role)) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
  }

  const { userId, role } = await request.json()
  const VALID_ROLES = ['apprenant', 'formateur', 'coordinateur', 'admin']
  if (!userId || !VALID_ROLES.includes(role)) {
    return NextResponse.json({ error: 'Données invalides' }, { status: 400 })
  }
  if (role === 'admin' && me.role !== 'admin') {
    return NextResponse.json({ error: 'Seul un admin peut créer un autre admin' }, { status: 403 })
  }

  const { error } = await supabase.from('profiles').update({ role }).eq('id', userId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
