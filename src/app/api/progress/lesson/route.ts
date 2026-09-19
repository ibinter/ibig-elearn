import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { lessonId, courseId } = await req.json()
  if (!lessonId || !courseId) return NextResponse.json({ error: 'Paramètres manquants' }, { status: 400 })

  // Vérifier l'inscription
  const { data: enrollment } = await supabase
    .from('enrollments')
    .select('id')
    .eq('user_id', user.id)
    .eq('course_id', courseId)
    .single()
  if (!enrollment) return NextResponse.json({ error: 'Non inscrit' }, { status: 403 })

  // Upsert progression
  const { error } = await supabase
    .from('lesson_progress')
    .upsert({
      user_id: user.id,
      lesson_id: lessonId,
      course_id: courseId,
      is_completed: true,
      completed_at: new Date().toISOString(),
      watch_time_seconds: 0,
    }, { onConflict: 'user_id,lesson_id' })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Recalculer progression globale du cours
  const [{ count: totalLessons }, { count: completedLessons }] = await Promise.all([
    supabase.from('lessons')
      .select('id', { count: 'exact', head: true })
      .eq('course_id', courseId),
    supabase.from('lesson_progress')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('course_id', courseId)
      .eq('is_completed', true),
  ])

  const progressPercent = totalLessons ? Math.round(((completedLessons ?? 0) / totalLessons) * 100) : 0

  await supabase
    .from('enrollments')
    .update({
      progress_percent: progressPercent,
      last_accessed_at: new Date().toISOString(),
    })
    .eq('user_id', user.id)
    .eq('course_id', courseId)

  // Émettre certificat automatiquement si 100%
  if (progressPercent >= 100) {
    await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/certificates/auto-issue`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user.id, courseId }),
    }).catch(() => {})
  }

  return NextResponse.json({ ok: true, progressPercent })
}
