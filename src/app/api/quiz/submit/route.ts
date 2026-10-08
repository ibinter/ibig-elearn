import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const { lessonId, courseId, answers, tabSwitchCount, timeUsedSeconds } = await req.json()
  if (!lessonId || !courseId || !answers) {
    return NextResponse.json({ error: 'Paramètres manquants' }, { status: 400 })
  }

  // Vérifier l'inscription
  const { data: enrollment } = await supabase
    .from('enrollments').select('id').eq('user_id', user.id).eq('course_id', courseId).single()
  if (!enrollment) return NextResponse.json({ error: 'Non inscrit' }, { status: 403 })

  // Charger les questions avec les bonnes réponses (serveur seulement)
  const { data: questions } = await supabase
    .from('quiz_questions')
    .select('id, correct_option, position')
    .eq('lesson_id', lessonId)
    .order('position')

  if (!questions || questions.length === 0) {
    return NextResponse.json({ error: 'Aucune question trouvée' }, { status: 404 })
  }

  // Charger les paramètres du quiz
  const { data: lesson } = await supabase
    .from('lessons')
    .select('quiz_passing_score')
    .eq('id', lessonId).single()

  const passingScore = (lesson as any)?.quiz_passing_score ?? 70
  const timeLimitSeconds = questions.length * 90

  // Calculer le score côté serveur
  // answers est un tableau ordonné (index = position question)
  const answersArray: number[] = Array.isArray(answers) ? answers : []
  const sortedQuestions = [...questions].sort((a, b) => a.position - b.position)
  const correct = sortedQuestions.filter((q, i) => answersArray[i] === q.correct_option).length
  const score = questions.length > 0 ? Math.round((correct / questions.length) * 100) : 0
  const passed = score >= passingScore

  // Détection de triche
  const flags: string[] = []
  if ((tabSwitchCount ?? 0) >= 3) flags.push(`${tabSwitchCount} changements d'onglet`)
  if (timeUsedSeconds != null && timeUsedSeconds < questions.length * 5) {
    flags.push(`Temps trop rapide : ${timeUsedSeconds}s pour ${questions.length} questions`)
  }
  const isFlagged = flags.length > 0

  await supabase.from('quiz_attempts').insert({
    user_id: user.id,
    lesson_id: lessonId,
    answers: answersArray,
    score,
    passed,
    tab_switch_count: tabSwitchCount ?? 0,
    is_flagged: isFlagged,
    flag_reason: flags.join(' | ') || null,
  })

  if (passed) {
    await supabase.from('lesson_progress').upsert({
      user_id: user.id,
      lesson_id: lessonId,
      course_id: courseId,
      is_completed: true,
      completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id,lesson_id' })

    void fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/xp/award`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event_type: 'quiz_passed',
        ref_id: lessonId,
        ref_label: `Quiz — ${score}%`,
      }),
    }).catch(() => {})
  }

  return NextResponse.json({ score, passed, passingScore, correct, total: questions.length, isFlagged })
}
