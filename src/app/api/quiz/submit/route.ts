import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { BANK_COLUMNS, correction, grade, type Answer, type BankQuestion } from '@/lib/quiz'
import { completeLesson } from '@/lib/progress'

const GRACE_MS = 30_000

/** Corrige une tentative côté serveur (questions tirées au démarrage, réponses indexées par identifiant). */
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const attemptId = String(body.attemptId ?? '')
  const answers: Record<string, Answer> = body.answers && typeof body.answers === 'object' && !Array.isArray(body.answers) ? body.answers : {}
  const tabSwitchCount = Number(body.tabSwitchCount) || 0

  const admin = createAdminClient()
  const { data: attempt } = await admin.from('quiz_attempts')
    .select('id, user_id, lesson_id, course_id, status, question_ids, started_at, deadline_at')
    .eq('id', attemptId).maybeSingle()
  if (!attempt || attempt.user_id !== user.id) return NextResponse.json({ error: 'Tentative introuvable' }, { status: 404 })
  if (attempt.status !== 'in_progress') return NextResponse.json({ error: 'Cette tentative est déjà terminée.' }, { status: 409 })

  const [{ data: bank }, { data: lesson }] = await Promise.all([
    admin.from('quiz_questions').select(BANK_COLUMNS).in('id', attempt.question_ids ?? []),
    admin.from('lessons').select('quiz_passing_score, quiz_show_corrections').eq('id', attempt.lesson_id).single(),
  ])
  const byId = new Map(((bank ?? []) as BankQuestion[]).map(q => [q.id, q]))
  const questions = (attempt.question_ids ?? []).map((id: string) => byId.get(id)).filter(Boolean) as BankQuestion[]

  const now = Date.now()
  const late = attempt.deadline_at && now > new Date(attempt.deadline_at).getTime() + GRACE_MS
  const timeUsed = attempt.started_at ? Math.round((now - new Date(attempt.started_at).getTime()) / 1000) : null
  const result = grade(questions, answers)
  const passingScore = lesson?.quiz_passing_score ?? 70
  const passed = !late && result.score >= passingScore

  const flags: string[] = []
  if (tabSwitchCount >= 3) flags.push(`${tabSwitchCount} changements d'onglet`)
  if (timeUsed != null && timeUsed < questions.length * 5) flags.push(`Temps trop rapide : ${timeUsed}s pour ${questions.length} questions`)
  if (late) flags.push('Soumis après la fin du temps imparti')

  await admin.from('quiz_attempts').update({
    status: 'submitted', submitted_at: new Date(now).toISOString(), answers,
    score: result.score, passed, points: result.points, max_points: result.max,
    tab_switch_count: tabSwitchCount, is_flagged: flags.length > 0, flag_reason: flags.join(' | ') || null,
  }).eq('id', attempt.id)

  let progressPercent: number | null = null
  if (passed && attempt.course_id) {
    progressPercent = await completeLesson(admin, user.id, attempt.course_id, attempt.lesson_id).catch(() => null)
    void admin.rpc('award_xp', { p_user_id: user.id, p_event_type: 'quiz_passed', p_xp: 20, p_ref_id: attempt.lesson_id, p_ref_label: `Quiz — ${result.score}%` })
  }

  return NextResponse.json({
    score: result.score, passed, passingScore, points: result.points, maxPoints: result.max, late: !!late,
    results: result.detail,
    corrections: lesson?.quiz_show_corrections === false ? null : questions.map(correction),
    progressPercent,
  })
}
