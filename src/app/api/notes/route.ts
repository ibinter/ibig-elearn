import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET : récupère la note d'une leçon
export async function GET(req: NextRequest) {
  const lessonId = req.nextUrl.searchParams.get('lesson_id')
  if (!lessonId) return NextResponse.json({ content: '' })

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ content: '' })

  const { data } = await supabase
    .from('lesson_notes')
    .select('content')
    .eq('user_id', user.id)
    .eq('lesson_id', lessonId)
    .single()

  return NextResponse.json({ content: data?.content ?? '' })
}

// POST : upsert la note d'une leçon
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const { lesson_id, course_id, content } = await req.json()
  if (!lesson_id || !course_id) return NextResponse.json({ error: 'Champs manquants' }, { status: 400 })

  const { error } = await supabase.from('lesson_notes').upsert(
    { user_id: user.id, lesson_id, course_id, content: content ?? '', updated_at: new Date().toISOString() },
    { onConflict: 'user_id,lesson_id' }
  )

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

// DELETE : supprime la note d'une leçon
export async function DELETE(req: NextRequest) {
  const lessonId = req.nextUrl.searchParams.get('lesson_id')
  if (!lessonId) return NextResponse.json({ error: 'lesson_id requis' }, { status: 400 })

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  await supabase.from('lesson_notes').delete().eq('user_id', user.id).eq('lesson_id', lessonId)
  return NextResponse.json({ ok: true })
}

// GET toutes les notes d'un cours
export async function PUT(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json([], { status: 200 })

  const { course_id } = await req.json()
  const { data } = await supabase
    .from('lesson_notes')
    .select('lesson_id, content, updated_at, lesson:lessons(title)')
    .eq('user_id', user.id)
    .eq('course_id', course_id)
    .neq('content', '')
    .order('updated_at', { ascending: false })

  return NextResponse.json(data ?? [])
}
