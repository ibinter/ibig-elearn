import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const { path_id } = await req.json()
  if (!path_id) return NextResponse.json({ error: 'path_id requis' }, { status: 400 })

  const { data: path } = await supabase.from('learning_paths').select('id').eq('id', path_id).eq('is_published', true).single()
  if (!path) return NextResponse.json({ error: 'Parcours introuvable' }, { status: 404 })

  const { error } = await supabase.from('learning_path_enrollments').upsert(
    { path_id, user_id: user.id },
    { onConflict: 'path_id,user_id' }
  )
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true }, { status: 201 })
}
