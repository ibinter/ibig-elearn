import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle, Circle, Lock, Play, Award, ChevronLeft, Clock } from 'lucide-react'

interface PageProps {
  params: Promise<{ slug: string }>
}

export default async function CourseProgressionPage({ params }: PageProps) {
  const { slug } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: course } = await supabase
    .from('courses')
    .select('id, title, slug, thumbnail_url, duration_hours, total_lessons, instructor:profiles(full_name)')
    .eq('slug', slug)
    .single()

  if (!course) notFound()

  const { data: enrollment } = await supabase
    .from('enrollments')
    .select('progress_percent, status, completed_at, enrolled_at')
    .eq('user_id', user!.id)
    .eq('course_id', course.id)
    .single()

  if (!enrollment) notFound()

  const { data: modules } = await supabase
    .from('modules')
    .select('id, title, order_index, lessons(id, title, order_index, duration_minutes, video_url)')
    .eq('course_id', course.id)
    .order('order_index')

  const { data: completedLessons } = await supabase
    .from('lesson_progress')
    .select('lesson_id, completed_at, watch_time_seconds')
    .eq('user_id', user!.id)
    .eq('course_id', course.id)
    .eq('is_completed', true)

  const completedIds = new Set(completedLessons?.map(l => l.lesson_id))
  const completedMap = new Map(completedLessons?.map(l => [l.lesson_id, l]))

  const { data: certificate } = await supabase
    .from('certificates')
    .select('id, certificate_number, issued_at')
    .eq('user_id', user!.id)
    .eq('course_id', course.id)
    .single()

  const pct = enrollment.progress_percent ?? 0
  const isComplete = pct >= 100

  let cumulativeLessons = 0

  return (
    <div className="max-w-3xl space-y-6">
      {/* Header */}
      <div>
        <Link href="/mes-formations" className="flex items-center gap-1 text-sm text-gray-500 hover:text-[#0B3D91] mb-4 transition-colors">
          <ChevronLeft className="w-4 h-4" /> Mes formations
        </Link>
        <div className="flex gap-4 items-start">
          {course.thumbnail_url && (
            <img src={course.thumbnail_url} alt={course.title} className="w-20 h-14 rounded-xl object-cover flex-shrink-0" />
          )}
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-gray-900 leading-tight">{course.title}</h1>
            <p className="text-sm text-gray-500 mt-0.5">{(course.instructor as any)?.full_name} · {course.duration_hours}h · {course.total_lessons} leçons</p>
          </div>
        </div>
      </div>

      {/* Progression globale */}
      <div className={`rounded-2xl p-5 ${isComplete ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white' : 'bg-gradient-to-r from-[#0B3D91] to-blue-700 text-white'}`}>
        <div className="flex items-center justify-between mb-3">
          <p className="font-bold text-lg">{pct}% complété</p>
          {isComplete && <span className="text-xs bg-white/20 px-3 py-1 rounded-full font-semibold">✅ Terminé</span>}
        </div>
        <div className="h-2.5 bg-white/20 rounded-full overflow-hidden mb-3">
          <div className="h-full bg-white rounded-full transition-all" style={{ width: `${pct}%` }} />
        </div>
        <p className="text-sm text-white/70">
          {completedIds.size} leçon{completedIds.size > 1 ? 's' : ''} sur {course.total_lessons} terminée{completedIds.size > 1 ? 's' : ''}
        </p>
      </div>

      {/* Certificat */}
      {certificate && (
        <div className="bg-gradient-to-r from-[#FFA500]/10 to-yellow-50 border border-[#FFA500]/30 rounded-2xl p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-[#FFA500]/20 flex items-center justify-center flex-shrink-0">
            <Award className="w-6 h-6 text-[#FFA500]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-gray-900 text-sm">Certificat obtenu !</p>
            <p className="text-xs text-gray-500 font-mono mt-0.5">{certificate.certificate_number}</p>
          </div>
          <Link href={`/mes-certificats/${certificate.id}/imprimer`}
            className="flex-shrink-0 text-xs font-semibold text-[#FFA500] bg-white border border-[#FFA500]/30 px-3 py-2 rounded-lg hover:bg-[#FFA500] hover:text-white transition-colors">
            Voir le certificat
          </Link>
        </div>
      )}

      {/* Modules + leçons */}
      <div className="space-y-4">
        {modules?.map((mod: any) => {
          const lessons = [...(mod.lessons ?? [])].sort((a: any, b: any) => a.order_index - b.order_index)
          const modCompleted = lessons.filter((l: any) => completedIds.has(l.id)).length
          cumulativeLessons += lessons.length

          return (
            <div key={mod.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-5 py-4 bg-gray-50/60 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <h2 className="font-bold text-gray-900 text-sm">{mod.title}</h2>
                  <p className="text-xs text-gray-400 mt-0.5">{modCompleted}/{lessons.length} leçons</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-20 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                    <div className="h-full bg-[#0B3D91] rounded-full" style={{ width: `${lessons.length ? (modCompleted / lessons.length) * 100 : 0}%` }} />
                  </div>
                  <span className="text-xs text-gray-400 font-medium">{lessons.length ? Math.round((modCompleted / lessons.length) * 100) : 0}%</span>
                </div>
              </div>
              <div className="divide-y divide-gray-50">
                {lessons.map((lesson: any, idx: number) => {
                  const done = completedIds.has(lesson.id)
                  const lessonData = completedMap.get(lesson.id)
                  const isFirst = idx === 0 || lessons.slice(0, idx).some((l: any) => completedIds.has(l.id)) || idx === 0

                  return (
                    <Link
                      key={lesson.id}
                      href={`/apprendre/${course.id}/${lesson.id}`}
                      className="flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50/60 transition-colors group"
                    >
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${done ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                        {done ? <CheckCircle className="w-4 h-4" /> : <Circle className="w-4 h-4" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium truncate ${done ? 'text-green-700' : 'text-gray-700 group-hover:text-[#0B3D91]'}`}>
                          {lesson.title}
                        </p>
                        {done && lessonData && (
                          <p className="text-xs text-gray-400 mt-0.5">
                            Terminée · {Math.round((lessonData.watch_time_seconds ?? 0) / 60)} min regardées
                          </p>
                        )}
                      </div>
                      {lesson.duration_minutes && (
                        <span className="flex items-center gap-1 text-xs text-gray-400 flex-shrink-0">
                          <Clock className="w-3 h-3" />{lesson.duration_minutes}min
                        </span>
                      )}
                      {!done && (
                        <Play className="w-4 h-4 text-gray-300 group-hover:text-[#0B3D91] flex-shrink-0 transition-colors" />
                      )}
                    </Link>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      {/* CTA si pas encore commencé */}
      {pct === 0 && (
        <div className="text-center py-4">
          <Link href={`/apprendre/${course.id}/intro`}
            className="inline-flex items-center gap-2 ibig-gradient text-white font-bold px-8 py-3.5 rounded-xl hover:opacity-90 transition-opacity">
            <Play className="w-5 h-5" /> Commencer la formation
          </Link>
        </div>
      )}
    </div>
  )
}
