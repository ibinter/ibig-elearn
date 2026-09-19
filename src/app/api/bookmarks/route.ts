import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET : liste les leçons bookmarkées d'un cours
export async function GET(req: NextRequest) {
  const courseId = req.nextUrl.searchParams.get('course_id')
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json([])

  const query = supabase.from('lesson_bookmarks').select('lesson_id, lesson:lessons(id, title, type, position, module:modules(title, position))').eq('user_id', user.id)
  if (courseId) query.eq('course_id', courseId)
  const { data } = await query.order('created_at', { ascending: false })
  return NextResponse.json(data ?? [])
}

// POST : toggle bookmark
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const { lesson_id, course_id } = await req.json()
  if (!lesson_id || !course_id) return NextResponse.json({ error: 'Champs manquants' }, { status: 400 })

  const { data: existing } = await supabase.from('lesson_bookmarks').select('id').eq('user_id', user.id).eq('lesson_id', lesson_id).single()

  if (existing) {
    await supabase.from('lesson_bookmarks').delete().eq('id', existing.id)
    return NextResponse.json({ action: 'removed' })
  } else {
    await supabase.from('lesson_bookmarks').insert({ user_id: user.id, lesson_id, course_id })
    return NextResponse.json({ action: 'added' })
  }
}
