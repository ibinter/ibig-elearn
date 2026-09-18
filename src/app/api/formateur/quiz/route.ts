import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

async function checkLessonOwner(supabase: any, lessonId: string, userId: string) {
  const { data } = await supabase
    .from('lessons')
    .select('course_id, courses!inner(instructor_id)')
    .eq('id', lessonId)
    .single()
  return (data?.courses as any)?.instructor_id === userId
}

// GET : liste les questions d'une leçon
export async function GET(req: NextRequest) {
  const lessonId = req.nextUrl.searchParams.get('lesson_id')
  if (!lessonId) return NextResponse.json([], { status: 200 })
  const supabase = await createClient()
  const { data } = await supabase
    .from('quiz_questions')
    .select('*')
    .eq('lesson_id', lessonId)
    .order('position')
  return NextResponse.json(data ?? [])
}

// POST : créer une question
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const { lesson_id, question, options, correct_option, explanation, position } = await req.json()
  if (!lesson_id || !question || !options) return NextResponse.json({ error: 'Champs manquants' }, { status: 400 })
  if (!await checkLessonOwner(supabase, lesson_id, user.id)) return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })

  const { data, error } = await supabase
    .from('quiz_questions')
    .insert({ lesson_id, question, options, correct_option: correct_option ?? 0, explanation: explanation || null, position: position ?? 0 })
    .select('*')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}

// PATCH : modifier une question
export async function PATCH(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const { id, ...updates } = await req.json()
  if (!id) return NextResponse.json({ error: 'id requis' }, { status: 400 })

  const { data: q } = await supabase.from('quiz_questions').select('lesson_id').eq('id', id).single()
  if (!q || !await checkLessonOwner(supabase, q.lesson_id, user.id))
    return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })

  const { error } = await supabase.from('quiz_questions').update(updates).eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

// DELETE : supprimer une question
export async function DELETE(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const { id } = await req.json()
  const { data: q } = await supabase.from('quiz_questions').select('lesson_id').eq('id', id).single()
  if (!q || !await checkLessonOwner(supabase, q.lesson_id, user.id))
    return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })

  await supabase.from('quiz_questions').delete().eq('id', id)
  return NextResponse.json({ ok: true })
}
