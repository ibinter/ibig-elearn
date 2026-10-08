import type { SupabaseClient } from '@supabase/supabase-js'
import { issueCertificate } from '@/lib/certificates'

/**
 * Marque une leçon comme terminée, recalcule la progression de l'inscription,
 * attribue les XP et déclenche le certificat à 100 %.
 * Partagé par le bouton « Terminer », le lecteur SCORM et le LRS xAPI.
 */
export async function completeLesson(supabase: SupabaseClient, userId: string, courseId: string, lessonId: string) {
  const { data: lesson } = await supabase.from('lessons').select('title, course_id').eq('id', lessonId).single()
  if (!lesson || lesson.course_id !== courseId) throw new Error('Leçon introuvable')

  const { error } = await supabase.from('lesson_progress').upsert({
    user_id: userId, lesson_id: lessonId, course_id: courseId,
    is_completed: true, completed_at: new Date().toISOString(),
  }, { onConflict: 'user_id,lesson_id' })
  if (error) throw new Error(error.message)

  const [{ count: totalLessons }, { count: completedLessons }] = await Promise.all([
    supabase.from('lessons').select('id', { count: 'exact', head: true }).eq('course_id', courseId),
    supabase.from('lesson_progress').select('id', { count: 'exact', head: true })
      .eq('user_id', userId).eq('course_id', courseId).eq('is_completed', true),
  ])
  const progressPercent = totalLessons ? Math.min(100, Math.round(((completedLessons ?? 0) / totalLessons) * 100)) : 0

  await supabase.from('enrollments')
    .update({ progress_percent: progressPercent, ...(progressPercent >= 100 ? { completed_at: new Date().toISOString() } : {}) })
    .eq('user_id', userId).eq('course_id', courseId)

  void supabase.rpc('award_xp', { p_user_id: userId, p_event_type: 'lesson_completed', p_xp: 10, p_ref_id: lessonId, p_ref_label: lesson?.title ?? null })

  if (progressPercent >= 100) {
    void supabase.rpc('award_xp', { p_user_id: userId, p_event_type: 'course_completed', p_xp: 100, p_ref_id: courseId, p_ref_label: null })
    await issueCertificate(supabase, userId, courseId).catch(() => {})
  }
  return progressPercent
}
