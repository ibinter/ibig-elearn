import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle, Circle, Play, FileText, HelpCircle, Lock, ArrowLeft, Award, Clock } from 'lucide-react'

interface PageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params
  const supabase = await createClient()
  const { data } = await supabase.from('courses').select('title').eq('slug', slug).single()
  return { title: data ? `Progression — ${data.title}` : 'Progression' }
}

export default async function ProgressionPage({ params }: PageProps) {
  const { slug } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/connexion')

  const { data: course } = await supabase
    .from('courses')
    .select('id, title, slug, thumbnail_url, duration_hours')
    .eq('slug', slug)
    .single()
  if (!course) notFound()

  const { data: enrollment } = await supabase
    .from('enrollments')
    .select('progress_percent, status, enrolled_at, completed_at')
    .eq('user_id', user.id)
    .eq('course_id', course.id)
    .single()
  if (!enrollment) redirect(`/formation/${slug}`)

  const { data: modules } = await supabase
    .from('modules')
    .select('id, title, position, lessons(id, title, type, video_duration_seconds, position)')
    .eq('course_id', course.id)
    .order('position')

  const allLessonIds = (modules ?? []).flatMap((m: any) => (m.lessons ?? []).map((l: any) => l.id))

  const { data: progressRows } = allLessonIds.length
    ? await supabase
        .from('lesson_progress')
        .select('lesson_id, is_completed, completed_at')
        .eq('user_id', user.id)
        .in('lesson_id', allLessonIds)
    : { data: [] }

  const { data: quizAttempts } = await supabase
    .from('quiz_attempts')
    .select('lesson_id, score, passed')
    .eq('user_id', user.id)
    .order('score', { ascending: false })

  const { data: cert } = await supabase
    .from('certificates')
    .select('id')
    .eq('user_id', user.id)
    .eq('course_id', course.id)
    .single()

  const progressMap: Record<string, { is_completed: boolean; completed_at?: string }> = {}
  for (const p of (progressRows ?? [])) {
    progressMap[p.lesson_id] = { is_completed: p.is_completed, completed_at: p.completed_at }
  }

  const bestQuizScore: Record<string, number> = {}
  for (const a of (quizAttempts ?? [])) {
    if (!bestQuizScore[a.lesson_id] || a.score > bestQuizScore[a.lesson_id]) {
      bestQuizScore[a.lesson_id] = a.score
    }
  }

  function typeIcon(type: string) {
    if (type === 'video') return <Play className="w-3.5 h-3.5" />
    if (type === 'quiz') return <HelpCircle className="w-3.5 h-3.5" />
    return <FileText className="w-3.5 h-3.5" />
  }

  function fmtDuration(secs?: number) {
    if (!secs) return null
    const m = Math.floor(secs / 60)
    const s = secs % 60
    return m > 0 ? `${m}min${s > 0 ? ` ${s}s` : ''}` : `${s}s`
  }

  const totalLessons = allLessonIds.length
  const completedLessons = Object.values(progressMap).filter(p => p.is_completed).length

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
      {/* Back */}
      <Link href="/mes-formations" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Mes formations
      </Link>

      {/* Header */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-8">
        <div className="flex items-start gap-4">
          {course.thumbnail_url && (
            <img src={course.thumbnail_url} alt={course.title} className="w-20 h-14 rounded-xl object-cover flex-shrink-0" />
          )}
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-gray-900 mb-2">{course.title}</h1>
            <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
              <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> {course.duration_hours}h de contenu</span>
              <span>{totalLessons} leçons</span>
            </div>
            {/* Barre de progression globale */}
            <div className="flex items-center gap-3">
              <div className="flex-1 bg-gray-100 rounded-full h-3">
                <div
                  className="h-3 rounded-full transition-all"
                  style={{
                    width: `${enrollment.progress_percent}%`,
                    background: enrollment.progress_percent >= 100 ? '#22c55e' : 'linear-gradient(90deg,#0B3D91,#FFA500)',
                  }}
                />
              </div>
              <span className="text-sm font-bold text-gray-900 whitespace-nowrap">{enrollment.progress_percent}%</span>
            </div>
            <p className="text-xs text-gray-400 mt-1">{completedLessons} / {totalLessons} leçons terminées</p>
          </div>
        </div>

        {cert && (
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-xl flex items-center gap-3">
            <Award className="w-5 h-5 text-yellow-600 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-yellow-900">Formation certifiée !</p>
              <p className="text-xs text-yellow-700">Vous avez obtenu votre certificat pour cette formation.</p>
            </div>
            <Link href={`/mes-certificats/${cert.id}/imprimer`} className="text-xs font-semibold text-yellow-700 hover:text-yellow-900 underline">
              Voir
            </Link>
          </div>
        )}
      </div>

      {/* Modules & Leçons */}
      <div className="space-y-4">
        {(modules as any[])?.map((mod, mi) => {
          const lessons = [...(mod.lessons ?? [])].sort((a: any, b: any) => a.position - b.position)
          const modCompleted = lessons.filter((l: any) => progressMap[l.id]?.is_completed).length
          const modPct = lessons.length ? Math.round((modCompleted / lessons.length) * 100) : 0

          return (
            <div key={mod.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              {/* Module header */}
              <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                    modPct === 100 ? 'bg-green-100 text-green-700' : 'bg-blue-50 text-[#0B3D91]'
                  }`}>
                    {modPct === 100 ? '✓' : mi + 1}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">{mod.title}</p>
                    <p className="text-xs text-gray-400">{modCompleted}/{lessons.length} leçons</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <div className="w-20 bg-gray-100 rounded-full h-1.5">
                    <div className="h-1.5 rounded-full bg-[#0B3D91] transition-all" style={{ width: `${modPct}%` }} />
                  </div>
                  <span className="text-xs text-gray-500 w-8 text-right">{modPct}%</span>
                </div>
              </div>

              {/* Leçons */}
              <div className="divide-y divide-gray-50">
                {lessons.map((lesson: any, li: number) => {
                  const prog = progressMap[lesson.id]
                  const done = prog?.is_completed ?? false
                  const qScore = lesson.type === 'quiz' ? bestQuizScore[lesson.id] : undefined

                  return (
                    <Link
                      key={lesson.id}
                      href={`/apprendre/${course.id}/${lesson.id}`}
                      className={`flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50/60 transition-colors group ${done ? '' : 'opacity-90'}`}
                    >
                      {/* Icône statut */}
                      <div className="flex-shrink-0">
                        {done ? (
                          <CheckCircle className="w-5 h-5 text-green-500" />
                        ) : (
                          <Circle className="w-5 h-5 text-gray-300 group-hover:text-gray-400 transition-colors" />
                        )}
                      </div>

                      {/* Type icon */}
                      <div className={`w-6 h-6 rounded flex items-center justify-center flex-shrink-0 ${
                        lesson.type === 'video' ? 'bg-blue-50 text-blue-500' :
                        lesson.type === 'quiz' ? 'bg-orange-50 text-orange-500' :
                        'bg-gray-50 text-gray-400'
                      }`}>
                        {typeIcon(lesson.type)}
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className={`text-sm truncate ${done ? 'text-gray-700' : 'text-gray-600'}`}>
                          <span className="text-gray-400 text-xs mr-1.5">{mi + 1}.{li + 1}</span>
                          {lesson.title}
                        </p>
                      </div>

                      <div className="flex items-center gap-3 flex-shrink-0">
                        {qScore !== undefined && (
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                            qScore >= 70 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
                          }`}>
                            {qScore}%
                          </span>
                        )}
                        {lesson.video_duration_seconds && (
                          <span className="text-xs text-gray-400">{fmtDuration(lesson.video_duration_seconds)}</span>
                        )}
                        {done && prog?.completed_at && (
                          <span className="text-xs text-gray-300">
                            {new Date(prog.completed_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                          </span>
                        )}
                      </div>
                    </Link>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      {enrollment.status === 'completed' && !cert && (
        <div className="mt-6 p-5 bg-gradient-to-r from-[#FFA500]/10 to-[#0B3D91]/10 border border-[#FFA500]/30 rounded-2xl text-center">
          <p className="font-semibold text-gray-900 mb-2">🎉 Formation terminée !</p>
          <Link href={`/apprendre/${course.id}/intro`} className="text-sm text-[#0B3D91] hover:underline">
            Générer mon certificat
          </Link>
        </div>
      )}
    </div>
  )
}
