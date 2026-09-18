import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

async function checkModuleOwner(supabase: any, moduleId: string, userId: string) {
  const { data } = await supabase
    .from('modules')
    .select('course_id, courses!inner(instructor_id)')
    .eq('id', moduleId)
    .single()
  return (data?.courses as any)?.instructor_id === userId
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const { module_id, course_id, title, type, video_url, content, position, is_free_preview } = await req.json()
  if (!module_id || !course_id || !title) return NextResponse.json({ error: 'Champs manquants' }, { status: 400 })
  if (!await checkModuleOwner(supabase, module_id, user.id)) return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })

  const { data, error } = await supabase
    .from('lessons')
    .insert({
      module_id, course_id, title,
      type: type ?? 'video',
      video_url: video_url || null,
      content: content || null,
      position: position ?? 0,
      is_free_preview: is_free_preview ?? false,
    })
    .select('id, title, type, position, is_free_preview')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Mettre à jour total_lessons sur la formation
  await supabase.rpc('update_course_lesson_count', { p_course_id: course_id }).catch(() => null)

  return NextResponse.json(data, { status: 201 })
}

export async function PATCH(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const { id, ...updates } = await req.json()
  if (!id) return NextResponse.json({ error: 'id requis' }, { status: 400 })

  const { data: lesson } = await supabase.from('lessons').select('module_id').eq('id', id).single()
  if (!lesson || !await checkModuleOwner(supabase, lesson.module_id, user.id))
    return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })

  const { error } = await supabase.from('lessons').update(updates).eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

export async function DELETE(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const { id } = await req.json()
  const { data: lesson } = await supabase.from('lessons').select('module_id, course_id').eq('id', id).single()
  if (!lesson || !await checkModuleOwner(supabase, lesson.module_id, user.id))
    return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })

  await supabase.from('lessons').delete().eq('id', id)
  return NextResponse.json({ ok: true })
}
