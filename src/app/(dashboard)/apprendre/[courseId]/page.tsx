import type React from 'react'
import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, BookOpen, CheckCircle, Clock, Lock, PlayCircle, FileText, Headphones, Code2, FileQuestion, ClipboardList, Trophy } from 'lucide-react'

interface PageProps {
  params: Promise<{ courseId: string }>
}

const TYPE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  video: PlayCircle,
  audio: Headphones,
  document: FileText,
  text: BookOpen,
  quiz: FileQuestion,
  assignment: ClipboardList,
  code: Code2,
  final_exam: Trophy,
}

const TYPE_LABELS: Record<string, string> = {
  video: 'Vidéo',
  audio: 'Audio',
  document: 'Document',
  text: 'Lecture',
  quiz: 'Quiz',
  assignment: 'Devoir',
  code: 'Code',
  final_exam: 'Examen final',
}

function formatDuration(seconds: number | null) {
  if (!seconds) return null
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return m > 0 ? `${m}m${s > 0 ? ` ${s}s` : ''}` : `${s}s`
}

export default async function CourseOverviewPage({ params }: PageProps) {
  const { courseId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/connexion')

  const [{ data: enrollment }, { data: course }] = await Promise.all([
    supabase.from('enrollments').select('*').eq('user_id', user.id).eq('course_id', courseId).single(),
    supabase.from('courses').select('id, title, short_description, thumbnail_url, duration_hours, level, slug').eq('id', courseId).single(),
  ])

  if (!course) notFound()
  if (!enrollment) redirect(`/formation/${course.slug}`)

  const { data: modules } = await supabase
    .from('modules')
    .select('id, title, description, position, lessons(id, title, type, position, is_free_preview, video_duration_seconds, audio_duration_s)')
    .eq('course_id', courseId)
    .order('position')

  const allLessons = (modules ?? []).flatMap(m =>
    (m.lessons ?? []).slice().sort((a: any, b: any) => a.position - b.position)
  )
  const allLessonIds = allLessons.map(l => l.id)

  const { data: progressRows } = await supabase
    .from('lesson_progress')
    .select('lesson_id, is_completed')
    .eq('user_id', user.id)
    .in('lesson_id', allLessonIds.length > 0 ? allLessonIds : ['__none__'])

  const completedSet = new Set((progressRows ?? []).filter(p => p.is_completed).map(p => p.lesson_id))
  const completedCount = completedSet.size
  const totalLessons = allLessons.length
  const progressPct = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0

  // Première leçon non complétée pour le bouton CTA
  const resumeLesson = allLessons.find(l => !completedSet.has(l.id)) ?? allLessons[0]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-4">
          <Link href="/dashboard" className="text-gray-500 hover:text-gray-900 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex-1 min-w-0">
            <h1 className="font-semibold text-gray-900 truncate">{course.title}</h1>
          </div>
          {resumeLesson && (
            <Link
              href={`/apprendre/${courseId}/${resumeLesson.id}`}
              className="flex-shrink-0 bg-[#0B3D91] text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-[#092d6b] transition-colors"
            >
              {completedCount === 0 ? 'Commencer' : 'Continuer'}
            </Link>
          )}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        {/* Hero du cours */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="flex flex-col sm:flex-row gap-0">
            {course.thumbnail_url && (
              <div className="sm:w-56 flex-shrink-0">
                <img src={course.thumbnail_url} alt={course.title} className="w-full h-40 sm:h-full object-cover" />
              </div>
            )}
            <div className="p-6 flex-1">
              <h2 className="text-xl font-bold text-gray-900 mb-2">{course.title}</h2>
              {course.short_description && (
                <p className="text-sm text-gray-600 mb-4">{course.short_description}</p>
              )}
              <div className="flex flex-wrap gap-3 text-sm text-gray-500 mb-5">
                {course.duration_hours > 0 && (
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {course.duration_hours}h de contenu
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <BookOpen className="w-4 h-4" />
                  {totalLessons} leçon{totalLessons !== 1 ? 's' : ''}
                </span>
              </div>

              {/* Barre de progression */}
              <div>
                <div className="flex justify-between text-xs font-medium text-gray-600 mb-1.5">
                  <span>{completedCount}/{totalLessons} leçons complétées</span>
                  <span>{progressPct}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-[#0B3D91] h-2 rounded-full transition-all duration-500"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
                {progressPct === 100 && (
                  <p className="text-xs text-green-600 font-semibold mt-1.5 flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5" /> Formation terminée !
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Modules et leçons */}
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-gray-900">Programme de la formation</h3>

          {(modules ?? []).map((module) => {
            const lessons = (module.lessons ?? []).slice().sort((a: any, b: any) => a.position - b.position)
            const moduleCompleted = lessons.filter(l => completedSet.has(l.id)).length

            return (
              <div key={module.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                {/* En-tête module */}
                <div className="px-5 py-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-gray-900">{module.title}</h4>
                    {module.description && (
                      <p className="text-xs text-gray-500 mt-0.5">{module.description}</p>
                    )}
                  </div>
                  <span className="text-xs text-gray-400 font-medium flex-shrink-0 ml-4">
                    {moduleCompleted}/{lessons.length}
                  </span>
                </div>

                {/* Leçons */}
                <ul className="divide-y divide-gray-100">
                  {lessons.map((lesson: any) => {
                    const done = completedSet.has(lesson.id)
                    const Icon = TYPE_ICONS[lesson.type] ?? PlayCircle
                    const duration = lesson.video_duration_seconds ?? lesson.audio_duration_s
                    return (
                      <li key={lesson.id}>
                        <Link
                          href={`/apprendre/${courseId}/${lesson.id}`}
                          className="flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50 transition-colors group"
                        >
                          {/* Statut */}
                          <div className="w-6 h-6 flex-shrink-0 flex items-center justify-center">
                            {done ? (
                              <CheckCircle className="w-5 h-5 text-green-500" />
                            ) : (
                              <div className="w-5 h-5 rounded-full border-2 border-gray-300 group-hover:border-[#0B3D91] transition-colors" />
                            )}
                          </div>

                          {/* Icône type */}
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                            lesson.type === 'final_exam' ? 'bg-amber-100 text-amber-600' :
                            lesson.type === 'quiz' ? 'bg-purple-100 text-purple-600' :
                            lesson.type === 'assignment' ? 'bg-orange-100 text-orange-600' :
                            'bg-blue-100 text-blue-600'
                          }`}>
                            <Icon className="w-4 h-4" />
                          </div>

                          {/* Titre et infos */}
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-medium truncate ${done ? 'text-gray-500' : 'text-gray-900'}`}>
                              {lesson.title}
                            </p>
                            <p className="text-xs text-gray-400 mt-0.5">
                              {TYPE_LABELS[lesson.type] ?? lesson.type}
                              {duration && ` · ${formatDuration(duration)}`}
                            </p>
                          </div>

                          {/* Badge preview */}
                          {lesson.is_free_preview && !done && (
                            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium flex-shrink-0">
                              Aperçu
                            </span>
                          )}
                        </Link>
                      </li>
                    )
                  })}
                </ul>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
