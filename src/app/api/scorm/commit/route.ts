import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { canAccessCourse } from '@/lib/scorm'
import { completeLesson } from '@/lib/progress'

type Cmi = Record<string, string>

/** Durée SCORM → secondes (1.2 : HHHH:MM:SS.SS ; 2004 : ISO 8601 PT1H2M3.5S). */
function seconds(v: string | undefined) {
  if (!v) return 0
  const iso = v.match(/^P(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:([\d.]+)S)?)?$/)
  if (iso) return Math.round((+(iso[1] ?? 0)) * 86400 + (+(iso[2] ?? 0)) * 3600 + (+(iso[3] ?? 0)) * 60 + (+(iso[4] ?? 0)))
  const hms = v.match(/^(\d+):(\d{2}):(\d{2}(?:\.\d+)?)$/)
  return hms ? Math.round(+hms[1] * 3600 + +hms[2] * 60 + +hms[3]) : 0
}

/** Enregistre l'état d'un module SCORM et valide la leçon quand le module le déclare terminé ou réussi. */
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const packageId = String(body.packageId ?? '')
  const lessonId = String(body.lessonId ?? '')
  const cmi: Cmi = body.cmi && typeof body.cmi === 'object' ? body.cmi : {}
  if (JSON.stringify(cmi).length > 256_000) return NextResponse.json({ error: 'Données trop volumineuses' }, { status: 413 })

  const admin = createAdminClient()
  const [{ data: pkg }, { data: lesson }] = await Promise.all([
    admin.from('scorm_packages').select('id, course_id, standard, mastery_score').eq('id', packageId).maybeSingle(),
    admin.from('lessons').select('id, course_id, scorm_package_id').eq('id', lessonId).maybeSingle(),
  ])
  if (!pkg || !lesson || lesson.scorm_package_id !== pkg.id) return NextResponse.json({ error: 'Module introuvable' }, { status: 404 })
  if (!(await canAccessCourse(admin, user.id, pkg.course_id))) return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })

  const is2004 = pkg.standard === 'scorm2004'
  const completion = (is2004 ? cmi['cmi.completion_status'] : cmi['cmi.core.lesson_status']) ?? 'incomplete'
  const success = is2004 ? cmi['cmi.success_status'] : undefined
  const scoreRaw = Number(is2004 ? cmi['cmi.score.raw'] : cmi['cmi.core.score.raw'])
  const scoreScaled = Number(cmi['cmi.score.scaled'])
  let status = success && success !== 'unknown' ? success : completion

  // SCORM 1.2 : un seuil de réussite déclaré dans le manifeste décide entre « passed » et « failed »
  if (!is2004 && pkg.mastery_score != null && Number.isFinite(scoreRaw) && ['completed', 'incomplete'].includes(status)) {
    status = scoreRaw >= Number(pkg.mastery_score) ? 'passed' : (status === 'completed' ? 'failed' : status)
  }
  const done = ['passed', 'completed'].includes(status) && (!is2004 || success !== 'failed')

  const { data: previous } = await admin.from('scorm_attempts').select('total_time_s, completed_at')
    .eq('user_id', user.id).eq('package_id', pkg.id).maybeSingle()
  const sessionTime = seconds(is2004 ? cmi['cmi.session_time'] : cmi['cmi.core.session_time'])
  const now = new Date().toISOString()

  await admin.from('scorm_attempts').upsert({
    user_id: user.id, package_id: pkg.id, lesson_id: lesson.id, cmi, status,
    score_raw: Number.isFinite(scoreRaw) ? scoreRaw : null,
    score_scaled: Number.isFinite(scoreScaled) ? scoreScaled : null,
    total_time_s: (previous?.total_time_s ?? 0) + (body.final ? sessionTime : 0),
    completed_at: previous?.completed_at ?? (done ? now : null),
    updated_at: now,
  }, { onConflict: 'user_id,package_id' })

  let progressPercent: number | null = null
  if (done && !previous?.completed_at) {
    const { data: enrolled } = await admin.from('enrollments').select('id').eq('user_id', user.id).eq('course_id', pkg.course_id).maybeSingle()
    if (enrolled) progressPercent = await completeLesson(admin, user.id, pkg.course_id, lesson.id)
  }
  return NextResponse.json({ ok: true, status, completed: done, progressPercent })
}

/** État de la leçon pour l'apprenant connecté (utilisé par le lecteur xAPI). */
export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ completed: false }, { status: 401 })
  const lessonId = req.nextUrl.searchParams.get('lessonId') ?? ''
  const { data } = await supabase.from('lesson_progress').select('is_completed')
    .eq('user_id', user.id).eq('lesson_id', lessonId).maybeSingle()
  return NextResponse.json({ completed: !!data?.is_completed })
}
