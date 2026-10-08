import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

const between = (v: unknown, min: number, max: number) => { const n = Number(v); return Number.isInteger(n) && n >= min && n <= max ? n : null }

/** Évaluation de satisfaction d'une formation (ouverte dès 80 % de progression). */
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const b = await req.json().catch(() => ({}))
  const courseId = String(b.courseId ?? '')
  const content = between(b.contentRating, 1, 5), instructor = between(b.instructorRating, 1, 5)
  const applicability = between(b.applicability, 1, 5), recommend = between(b.recommendScore, 0, 10)
  if (!courseId || content == null || instructor == null || applicability == null || recommend == null) {
    return NextResponse.json({ error: 'Merci de répondre à toutes les questions.' }, { status: 400 })
  }

  const admin = createAdminClient()
  const { data: enr } = await admin.from('enrollments').select('progress_percent, completed_at').eq('user_id', user.id).eq('course_id', courseId).maybeSingle()
  if (!enr) return NextResponse.json({ error: 'Inscription introuvable' }, { status: 404 })
  if ((enr.progress_percent ?? 0) < 80 && !enr.completed_at) return NextResponse.json({ error: 'L’évaluation s’ouvre à 80 % de progression.' }, { status: 400 })

  const { error } = await admin.from('course_evaluations').upsert({
    user_id: user.id, course_id: courseId, content_rating: content, instructor_rating: instructor,
    applicability, recommend_score: recommend, comment: b.comment ? String(b.comment).trim().slice(0, 2000) || null : null,
  }, { onConflict: 'user_id,course_id' })
  if (error) return NextResponse.json({ error: 'Enregistrement impossible' }, { status: 500 })

  void admin.rpc('award_xp', { p_user_id: user.id, p_event_type: 'evaluation', p_xp: 15, p_ref_id: courseId, p_ref_label: 'Évaluation de formation' })
  return NextResponse.json({ ok: true })
}
