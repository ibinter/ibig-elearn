import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { issueCertificate } from '@/lib/certificates'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const { lessonId, courseId, answers, timeUsedSeconds, tabSwitchCount, autoSubmitted } = await req.json()
  if (!lessonId || !courseId || !answers) {
    return NextResponse.json({ error: 'Paramètres manquants' }, { status: 400 })
  }

  // Vérifier inscription active
  const { data: enrollment } = await supabase
    .from('enrollments').select('id').eq('user_id', user.id).eq('course_id', courseId).single()
  if (!enrollment) return NextResponse.json({ error: 'Non inscrit' }, { status: 403 })

  // Vérifier tentatives restantes
  const { data: attemptsLeft } = await supabase.rpc('exam_attempts_left', {
    p_user_id: user.id,
    p_lesson_id: lessonId,
  })
  if ((attemptsLeft ?? 0) <= 0) {
    return NextResponse.json({ error: 'Nombre maximum de tentatives atteint' }, { status: 403 })
  }

  // Charger les questions avec les bonnes réponses
  const { data: questions } = await supabase
    .from('quiz_questions')
    .select('id, correct_option, position')
    .eq('lesson_id', lessonId)
    .order('position')

  if (!questions || questions.length === 0) {
    return NextResponse.json({ error: 'Aucune question trouvée' }, { status: 404 })
  }

  // Calculer le score
  const answersMap: Record<string, number> = {}
  for (const a of answers) {
    answersMap[a.question_id] = a.selected_option
  }
  const correct = questions.filter(q => answersMap[q.id] === q.correct_option).length
  const score = Math.round((correct / questions.length) * 100)

  // Charger le passing_score de l'examen
  const { data: lesson } = await supabase
    .from('lessons')
    .select('exam_passing_score, exam_max_attempts, title')
    .eq('id', lessonId).single()

  const passingScore = lesson?.exam_passing_score ?? 80
  const timeLimitSeconds = ((lesson as any)?.exam_duration_minutes ?? 60) * 60

  // Détection de triche
  const flags: string[] = []
  if ((tabSwitchCount ?? 0) >= 3) flags.push(`${tabSwitchCount} changements d'onglet`)
  if (autoSubmitted) flags.push('Soumission automatique (timer ou onglet)')
  if (timeUsedSeconds != null && timeUsedSeconds < questions.length * 5) {
    flags.push(`Temps trop rapide : ${timeUsedSeconds}s pour ${questions.length} questions`)
  }
  if (timeUsedSeconds != null && timeUsedSeconds > timeLimitSeconds + 60) {
    flags.push(`Temps dépassé côté client : ${timeUsedSeconds}s (limite ${timeLimitSeconds}s)`)
  }
  const isFlagged = flags.length > 0

  const passed = score >= passingScore

  // Numéro de la tentative
  const { count: prevAttempts } = await supabase
    .from('final_exam_attempts')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id).eq('lesson_id', lessonId)

  const attemptNumber = (prevAttempts ?? 0) + 1

  // Enregistrer la tentative
  await supabase.from('final_exam_attempts').insert({
    user_id: user.id,
    course_id: courseId,
    lesson_id: lessonId,
    answers,
    score,
    passed,
    time_used_seconds: timeUsedSeconds ?? null,
    submitted_at: new Date().toISOString(),
    attempt_number: attemptNumber,
    tab_switch_count: tabSwitchCount ?? 0,
    is_flagged: isFlagged,
    flag_reason: flags.join(' | ') || null,
  })

  if (passed) {
    // Marquer la leçon examen comme complétée
    await supabase.from('lesson_progress').upsert({
      user_id: user.id,
      lesson_id: lessonId,
      course_id: courseId,
      is_completed: true,
      completed_at: new Date().toISOString(),
    }, { onConflict: 'user_id,lesson_id' })

    // XP examen final = 150 XP
    void supabase.rpc('award_xp', {
      p_user_id:    user.id,
      p_event_type: 'course_completed',
      p_xp:         150,
      p_ref_id:     courseId,
      p_ref_label:  `Examen final — ${score}%`,
    })

    // Déclencher émission du certificat
    await issueCertificate(createAdminClient(), user.id, courseId).catch(() => {})
  }

  const attemptsRemaining = Math.max(0, (lesson?.exam_max_attempts ?? 3) - attemptNumber)

  return NextResponse.json({
    score,
    passed,
    passingScore,
    correct,
    total: questions.length,
    attemptNumber,
    attemptsRemaining,
  })
}
