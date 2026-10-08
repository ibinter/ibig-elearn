import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { BANK_COLUMNS, draw, toPublic, type BankQuestion } from '@/lib/quiz'

/**
 * Ouvre (ou reprend) une tentative de quiz : le serveur tire les questions dans la banque,
 * fixe l'ordre et l'échéance ; le navigateur ne reçoit jamais les bonnes réponses.
 */
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const { lessonId, courseId } = await req.json().catch(() => ({}))
  if (!lessonId || !courseId) return NextResponse.json({ error: 'Paramètres manquants' }, { status: 400 })

  const admin = createAdminClient()
  const [{ data: enrollment }, { data: lesson }] = await Promise.all([
    admin.from('enrollments').select('id').eq('user_id', user.id).eq('course_id', courseId).maybeSingle(),
    admin.from('lessons').select('id, course_id, type, quiz_passing_score, quiz_time_limit_min, quiz_max_attempts, quiz_draw_count')
      .eq('id', lessonId).maybeSingle(),
  ])
  if (!enrollment) return NextResponse.json({ error: 'Non inscrit' }, { status: 403 })
  if (!lesson || lesson.course_id !== courseId || lesson.type !== 'quiz') return NextResponse.json({ error: 'Quiz introuvable' }, { status: 404 })

  const { data: bank } = await admin.from('quiz_questions').select(BANK_COLUMNS).eq('lesson_id', lessonId).order('position')
  const questions = (bank ?? []) as BankQuestion[]
  if (!questions.length) return NextResponse.json({ error: 'Ce quiz ne contient pas encore de questions.' }, { status: 404 })

  const { data: attempts } = await admin.from('quiz_attempts')
    .select('id, status, question_ids, deadline_at, started_at, passed')
    .eq('user_id', user.id).eq('lesson_id', lessonId).order('attempted_at', { ascending: false })
  const submitted = (attempts ?? []).filter(a => a.status !== 'in_progress')
  const maxAttempts = lesson.quiz_max_attempts
  const attemptsLeft = maxAttempts ? Math.max(0, maxAttempts - submitted.length) : null
  const passingScore = lesson.quiz_passing_score ?? 70
  const byId = new Map(questions.map(q => [q.id, q]))

  // Tentative en cours non expirée : on la reprend telle quelle (même tirage, même chrono)
  const open = (attempts ?? []).find(a => a.status === 'in_progress')
  if (open && (!open.deadline_at || new Date(open.deadline_at).getTime() > Date.now())) {
    const qs = (open.question_ids ?? []).map((id: string) => byId.get(id)).filter(Boolean) as BankQuestion[]
    if (qs.length) {
      return NextResponse.json({ attemptId: open.id, questions: qs.map(toPublic), deadline: open.deadline_at, attemptsLeft, maxAttempts, passingScore, resumed: true })
    }
  }
  if (open) await admin.from('quiz_attempts').update({ status: 'expired' }).eq('id', open.id)

  if (attemptsLeft === 0) {
    return NextResponse.json({ error: `Nombre maximal de tentatives atteint (${maxAttempts}). Contactez votre formateur.`, attemptsLeft: 0 }, { status: 403 })
  }

  const picked = draw(questions, lesson.quiz_draw_count)
  const now = new Date()
  const deadline = lesson.quiz_time_limit_min ? new Date(now.getTime() + lesson.quiz_time_limit_min * 60_000).toISOString() : null
  const { data: attempt, error } = await admin.from('quiz_attempts').insert({
    user_id: user.id, lesson_id: lessonId, course_id: courseId, status: 'in_progress',
    question_ids: picked.map(q => q.id), started_at: now.toISOString(), deadline_at: deadline,
    answers: {}, score: 0, passed: false,
  }).select('id').single()
  if (error || !attempt) return NextResponse.json({ error: 'Impossible de démarrer le quiz' }, { status: 500 })

  return NextResponse.json({ attemptId: attempt.id, questions: picked.map(toPublic), deadline, attemptsLeft: attemptsLeft == null ? null : attemptsLeft - 1, maxAttempts, passingScore, resumed: false })
}
