import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import BunnyPlayer from '@/components/player/BunnyPlayer'
import QuizPlayer from '@/components/player/QuizPlayer'
import SaraChat from '@/components/sara/SaraChat'
import { CheckCircle, Lock, PlayCircle, ChevronLeft, ChevronRight, BookOpen, List } from 'lucide-react'
import Link from 'next/link'

interface Props {
  params: Promise<{ slug: string; lessonId: string }>
}

export default async function CoursLessonPage({ params }: Props) {
  const { slug, lessonId } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/connexion?next=/cours/${slug}/${lessonId}`)

  // Récupérer le cours
  const { data: course } = await supabase
    .from('courses')
    .select('id, title, slug, instructor_id, is_published')
    .eq('slug', slug)
    .single()

  if (!course) notFound()

  // Vérifier l'inscription
  const { data: enrollment } = await supabase
    .from('enrollments')
    .select('id, progress_percent')
    .eq('user_id', user.id)
    .eq('course_id', course.id)
    .single()

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const isInstructor = course.instructor_id === user.id
  const isAdmin = ['admin', 'coordinateur'].includes(profile?.role ?? '')
  const hasAccess = !!enrollment || isInstructor || isAdmin

  if (!hasAccess) redirect(`/formation/${slug}`)

  // Récupérer toutes les leçons du cours
  const { data: lessons } = await supabase
    .from('lessons')
    .select('id, title, position, video_url, duration_seconds, is_preview, type, quiz_passing_score')
    .eq('course_id', course.id)
    .order('position')

  const lesson = lessons?.find(l => l.id === lessonId)
  if (!lesson) notFound()

  // Progression de cette leçon
  const { data: progress } = await supabase
    .from('lesson_progress')
    .select('is_completed, last_position_seconds')
    .eq('user_id', user.id)
    .eq('lesson_id', lessonId)
    .single()

  // Progression de toutes les leçons
  const lessonIds = lessons?.map(l => l.id) ?? []
  const { data: allProgress } = await supabase
    .from('lesson_progress')
    .select('lesson_id, is_completed')
    .eq('user_id', user.id)
    .in('lesson_id', lessonIds)

  const completedSet = new Set(allProgress?.filter(p => p.is_completed).map(p => p.lesson_id) ?? [])

  // Leçon précédente / suivante
  const currentIdx = lessons?.findIndex(l => l.id === lessonId) ?? 0
  const prevLesson = currentIdx > 0 ? lessons![currentIdx - 1] : null
  const nextLesson = lessons && currentIdx < lessons.length - 1 ? lessons[currentIdx + 1] : null

  // Parser videoUrl — format: "bunny:LIBRARY_ID/GUID"
  let videoGuid: string | null = null
  let videoLibraryId: string | null = null
  if (lesson.video_url?.startsWith('bunny:')) {
    const parts = lesson.video_url.replace('bunny:', '').split('/')
    videoLibraryId = parts[0]
    videoGuid = parts[1]
  }

  // Contenu texte de la leçon
  const { data: lessonDetail } = await supabase
    .from('lessons')
    .select('content, transcript, subtitle_url')
    .eq('id', lessonId)
    .single()

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">
      {/* Topbar */}
      <header className="bg-gray-900 border-b border-gray-800 px-4 py-3 flex items-center gap-4">
        <Link href={`/formation/${slug}`} className="text-gray-400 hover:text-white transition-colors">
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-gray-500 truncate">{course.title}</p>
          <p className="text-sm font-semibold truncate">{lesson.title}</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-400 flex-shrink-0">
          <span>{completedSet.size}/{lessons?.length ?? 0} leçons</span>
          <div className="w-20 h-1.5 bg-gray-700 rounded-full overflow-hidden">
            <div className="h-full bg-[#FFA500] rounded-full"
              style={{ width: `${lessons?.length ? (completedSet.size / lessons.length) * 100 : 0}%` }} />
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar leçons — caché sur mobile */}
        <aside className="hidden lg:flex flex-col w-72 bg-gray-900 border-r border-gray-800 overflow-y-auto">
          <div className="p-4 border-b border-gray-800">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-2">
              <List className="w-4 h-4" /> Sommaire
            </p>
          </div>
          <nav className="flex-1 p-2 space-y-0.5">
            {lessons?.map((l, i) => {
              const done = completedSet.has(l.id)
              const active = l.id === lessonId
              return (
                <Link key={l.id} href={`/cours/${slug}/${l.id}`}
                  className={`flex items-start gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors ${active ? 'bg-[#0B3D91] text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}>
                  <span className="mt-0.5 flex-shrink-0">
                    {done ? <CheckCircle className="w-4 h-4 text-green-400" /> : active ? <PlayCircle className="w-4 h-4 text-white" /> : <div className="w-4 h-4 rounded-full border border-gray-600 flex items-center justify-center text-[10px] text-gray-500">{i + 1}</div>}
                  </span>
                  <span className="flex-1 leading-snug line-clamp-2">{l.title}</span>
                </Link>
              )
            })}
          </nav>
        </aside>

        {/* Contenu principal */}
        <main className="flex-1 overflow-y-auto">
          {/* Contenu : quiz ou vidéo */}
          {(lesson as any).type === 'quiz' ? (
            <QuizPlayer
              lessonId={lessonId}
              courseId={course.id}
              userId={user.id}
              passingScore={(lesson as any).quiz_passing_score ?? 70}
              isCompleted={progress?.is_completed ?? false}
            />
          ) : videoGuid && videoLibraryId ? (
            <BunnyPlayer
              videoGuid={videoGuid}
              libraryId={videoLibraryId}
              lessonId={lessonId}
              courseId={course.id}
              userId={user.id}
              lastPosition={progress?.last_position_seconds ?? 0}
              isCompleted={progress?.is_completed ?? false}
              videoDurationSeconds={lesson.duration_seconds}
            />
          ) : (
            <div className="aspect-video bg-gray-900 flex items-center justify-center">
              <div className="text-center">
                <BookOpen className="w-12 h-12 text-gray-700 mx-auto mb-3" />
                <p className="text-gray-500 text-sm">Leçon sans vidéo</p>
              </div>
            </div>
          )}

          {/* Navigation précédent/suivant */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
            {prevLesson ? (
              <Link href={`/cours/${slug}/${prevLesson.id}`}
                className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors">
                <ChevronLeft className="w-4 h-4" />
                <span className="hidden sm:inline truncate max-w-[200px]">{prevLesson.title}</span>
                <span className="sm:hidden">Précédente</span>
              </Link>
            ) : <div />}
            {nextLesson ? (
              <Link href={`/cours/${slug}/${nextLesson.id}`}
                className="flex items-center gap-2 text-sm bg-[#0B3D91] hover:bg-blue-700 text-white px-4 py-2 rounded-xl transition-colors">
                <span className="hidden sm:inline truncate max-w-[200px]">{nextLesson.title}</span>
                <span className="sm:hidden">Suivante</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            ) : (
              <Link href={`/mes-certificats`}
                className="flex items-center gap-2 text-sm bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl transition-colors">
                <CheckCircle className="w-4 h-4" /> Terminer le cours
              </Link>
            )}
          </div>

          {/* Contenu leçon + SARA */}
          <div className="max-w-4xl mx-auto px-6 py-8 grid lg:grid-cols-3 gap-8">
            {/* Texte / transcript */}
            <div className="lg:col-span-2 space-y-6">
              <h1 className="text-xl font-bold">{lesson.title}</h1>
              {lessonDetail?.content && (
                <div className="prose prose-invert prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: lessonDetail.content }} />
              )}
              {!lessonDetail?.content && (
                <p className="text-gray-500 text-sm">Pas de contenu textuel pour cette leçon.</p>
              )}
            </div>

            {/* SARA Chat */}
            <div className="lg:col-span-1">
              <SaraChat
                courseTitle={course.title}
                lessonTitle={lesson.title}
                lessonContent={lessonDetail?.content ?? ''}
              />
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
