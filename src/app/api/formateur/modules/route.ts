import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

async function checkOwner(supabase: any, courseId: string, userId: string) {
  const { data } = await supabase.from('courses').select('instructor_id').eq('id', courseId).single()
  return data?.instructor_id === userId
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const { course_id, title, position } = await req.json()
  if (!course_id || !title) return NextResponse.json({ error: 'Champs manquants' }, { status: 400 })
  if (!await checkOwner(supabase, course_id, user.id)) return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })

  const { data, error } = await supabase
    .from('modules')
    .insert({ course_id, title, position: position ?? 0 })
    .select('id, title, position')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}

export async function PATCH(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const { id, title, position } = await req.json()
  if (!id) return NextResponse.json({ error: 'id requis' }, { status: 400 })

  const { data: mod } = await supabase.from('modules').select('course_id').eq('id', id).single()
  if (!mod || !await checkOwner(supabase, mod.course_id, user.id))
    return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })

  const updates: any = {}
  if (title !== undefined) updates.title = title
  if (position !== undefined) updates.position = position

  const { error } = await supabase.from('modules').update(updates).eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

export async function DELETE(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const { id } = await req.json()
  const { data: mod } = await supabase.from('modules').select('course_id').eq('id', id).single()
  if (!mod || !await checkOwner(supabase, mod.course_id, user.id))
    return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })

  await supabase.from('modules').delete().eq('id', id)
  return NextResponse.json({ ok: true })
}
