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

  const { courseId, field, value } = await request.json()
  const ALLOWED = ['is_published', 'is_featured']
  if (!courseId || !ALLOWED.includes(field) || typeof value !== 'boolean') {
    return NextResponse.json({ error: 'Données invalides' }, { status: 400 })
  }

  const { error } = await supabase.from('courses').update({ [field]: value }).eq('id', courseId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
