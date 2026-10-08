import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

async function checkLessonOwner(supabase: any, lessonId: string, userId: string) {
  const { data } = await supabase
    .from('lessons')
    .select('course_id, courses!inner(instructor_id)')
    .eq('id', lessonId)
    .single()
  return (data?.courses as any)?.instructor_id === userId
}

// GET : liste les questions d'une leçon
export async function GET(req: NextRequest) {
  const lessonId = req.nextUrl.searchParams.get('lesson_id')
  if (!lessonId) return NextResponse.json([], { status: 200 })
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  // Les bonnes réponses ne sont renvoyées qu'au formateur propriétaire
  if (!user || !(await checkLessonOwner(supabase, lessonId, user.id))) return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
  const { data } = await createAdminClient()
    .from('quiz_questions')
    .select('*')
    .eq('lesson_id', lessonId)
    .order('position')
  return NextResponse.json(data ?? [])
}

// POST : créer une question
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const { lesson_id, question, options, correct_option, explanation, position } = await req.json()
  if (!lesson_id || !question || !options) return NextResponse.json({ error: 'Champs manquants' }, { status: 400 })
  if (!await checkLessonOwner(supabase, lesson_id, user.id)) return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })

  const { data, error } = await supabase
    .from('quiz_questions')
    .insert({ lesson_id, question, options, correct_option: correct_option ?? 0, explanation: explanation || null, position: position ?? 0 })
    .select('*')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}

// PATCH : modifier une question
export async function PATCH(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const { id, ...updates } = await req.json()
  if (!id) return NextResponse.json({ error: 'id requis' }, { status: 400 })

  const { data: q } = await supabase.from('quiz_questions').select('lesson_id').eq('id', id).single()
  if (!q || !await checkLessonOwner(supabase, q.lesson_id, user.id))
    return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })

  const { error } = await supabase.from('quiz_questions').update(updates).eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

// PUT : sauvegarde complète du quiz (remplace toutes les questions de la banque)
export async function PUT(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const { lessonId, passingScore, questions, isFinalExam, examDurationMinutes, examMaxAttempts } = body
  if (!lessonId || !Array.isArray(questions)) return NextResponse.json({ error: 'Données manquantes' }, { status: 400 })
  if (!await checkLessonOwner(supabase, lessonId, user.id)) return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })

  // Validation des questions selon leur type
  const TYPES = ['mcq', 'true_false', 'multi', 'short']
  const clean: Record<string, unknown>[] = []
  for (const [i, q] of (questions as any[]).entries()) {
    const n = i + 1
    const type = TYPES.includes(q.type) ? q.type : 'mcq'
    const question = String(q.question ?? '').trim()
    if (!question) return NextResponse.json({ error: `Question ${n} : énoncé vide.` }, { status: 400 })
    const options = type === 'true_false' ? ['Vrai', 'Faux'] : type === 'short' ? [] : (q.options ?? []).map((o: unknown) => String(o ?? '').trim())
    if ((type === 'mcq' || type === 'multi') && (options.length < 2 || options.some((o: string) => !o))) {
      return NextResponse.json({ error: `Question ${n} : au moins 2 options, toutes remplies.` }, { status: 400 })
    }
    const correctOptions = type === 'multi' ? [...new Set<number>((q.correct_options ?? []).map(Number))].filter((x: number) => x >= 0 && x < options.length) : null
    if (type === 'multi' && !correctOptions!.length) return NextResponse.json({ error: `Question ${n} : cochez au moins une bonne réponse.` }, { status: 400 })
    const accepted = type === 'short' ? (q.accepted_answers ?? []).map((x: unknown) => String(x ?? '').trim()).filter(Boolean) : null
    if (type === 'short' && !accepted!.length) return NextResponse.json({ error: `Question ${n} : indiquez au moins une réponse acceptée.` }, { status: 400 })
    const correctOption = type === 'mcq' || type === 'true_false' ? Number(q.correct_option ?? 0) : null
    clean.push({
      type, question, options, correct_option: correctOption, correct_options: correctOptions, accepted_answers: accepted,
      points: Math.min(100, Math.max(1, Number(q.points) || 1)), explanation: String(q.explanation ?? '').trim() || null,
    })
  }

  const admin = createAdminClient()
  const { data: lesson } = await admin.from('lessons').select('course_id').eq('id', lessonId).single()

  // Réglages : score, chronomètre, tentatives, tirage aléatoire, affichage de la correction
  const opt = (v: unknown, min: number, max: number) => { const x = Number(v); return Number.isFinite(x) && x >= min ? Math.min(max, Math.round(x)) : null }
  const lessonPatch: Record<string, unknown> = {
    quiz_passing_score: passingScore,
    quiz_time_limit_min: opt(body.timeLimitMin, 1, 300),
    quiz_max_attempts: opt(body.maxAttempts, 1, 50),
    quiz_draw_count: opt(body.drawCount, 1, 1000),
    quiz_show_corrections: body.showCorrections !== false,
  }
  if (isFinalExam) {
    lessonPatch.exam_passing_score = passingScore
    if (examDurationMinutes) lessonPatch.exam_duration_minutes = examDurationMinutes
    if (examMaxAttempts) lessonPatch.exam_max_attempts = examMaxAttempts
  }
  await admin.from('lessons').update(lessonPatch).eq('id', lessonId)

  await admin.from('quiz_questions').delete().eq('lesson_id', lessonId)
  if (clean.length > 0) {
    const { error } = await admin.from('quiz_questions').insert(clean.map((q, i) => ({ ...q, lesson_id: lessonId, course_id: lesson?.course_id ?? null, position: i })))
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ ok: true, count: clean.length })
}

// DELETE : supprimer une question
export async function DELETE(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const { id } = await req.json()
  const { data: q } = await supabase.from('quiz_questions').select('lesson_id').eq('id', id).single()
  if (!q || !await checkLessonOwner(supabase, q.lesson_id, user.id))
    return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })

  await supabase.from('quiz_questions').delete().eq('id', id)
  return NextResponse.json({ ok: true })
}
