import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { completeLesson } from '@/lib/progress'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { lessonId, courseId } = await req.json()
  if (!lessonId || !courseId) return NextResponse.json({ error: 'Paramètres manquants' }, { status: 400 })

  // Vérifier l'inscription
  const { data: enrollment } = await supabase
    .from('enrollments').select('id').eq('user_id', user.id).eq('course_id', courseId).single()
  if (!enrollment) return NextResponse.json({ error: 'Non inscrit' }, { status: 403 })

  try {
    const progressPercent = await completeLesson(createAdminClient(), user.id, courseId, lessonId)
    return NextResponse.json({ ok: true, progressPercent })
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}
