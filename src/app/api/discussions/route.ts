import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { lessonId, courseId, content, parentId } = await req.json()
  if (!lessonId || !courseId || !content?.trim())
    return NextResponse.json({ error: 'Données invalides' }, { status: 400 })

  // Vérifier inscription
  const { data: enrollment } = await supabase
    .from('enrollments').select('id').eq('user_id', user.id).eq('course_id', courseId).single()
  if (!enrollment)
    return NextResponse.json({ error: 'Inscription requise' }, { status: 403 })

  const { data, error } = await supabase.from('discussions').insert({
    lesson_id: lessonId,
    course_id: courseId,
    user_id: user.id,
    content: content.trim(),
    parent_id: parentId ?? null,
  }).select('*, user:profiles(full_name, avatar_url)').single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
