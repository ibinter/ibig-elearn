import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import VideoPlayer from './VideoPlayer'
import LessonSidebar from './LessonSidebar'
import QuizSection from './QuizSection'
import Link from 'next/link'
import { ArrowLeft, CheckCircle } from 'lucide-react'
import CertificateButton from '@/components/ui/CertificateButton'
import SaraChat from '@/components/sara/SaraChat'
import DiscussionPanel from '@/components/forum/DiscussionPanel'
import LessonNotes from '@/components/apprendre/LessonNotes'
import BookmarkButton from '@/components/apprendre/BookmarkButton'
import MarkCompleteButton from '@/components/apprendre/MarkCompleteButton'
import LessonNavigation from '@/components/apprendre/LessonNavigation'

interface PageProps {
  params: Promise<{ courseId: string; lessonId: string }>
}

export default async function ApprendrePage({ params }: PageProps) {
  const { courseId, lessonId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/connexion')

  // Vérifier l'inscription
  const { data: enrollment } = await supabase
    .from('enrollments')
    .select('*')
    .eq('user_id', user.id)
    .eq('course_id', courseId)
    .single()

  if (!enrollment) redirect(`/formation/${courseId}`)

  const { data: course } = await supabase.from('courses').select('id, title, slug').eq('id', courseId).single()
  if (!course) notFound()

  const { data: modules } = await supabase
    .from('modules')
    .select('*, lessons(id, title, type, video_url, video_duration_seconds, content, position, is_free_preview)')
    .eq('course_id', courseId)
    .order('position')

  // Leçon courante
  let currentLesson = null
  if (lessonId !== 'intro') {
    const { data } = await supabase.from('lessons').select('*').eq('id', lessonId).single()
    currentLesson = data
  } else {
    // Première leçon
    const firstLesson = modules?.[0]?.lessons?.[0]
    if (firstLesson) return redirect(`/apprendre/${courseId}/${firstLesson.id}`)
  }

  if (!currentLesson) notFound()

  // Progression de la leçon
  const { data: progress } = await supabase
    .from('lesson_progress')
    .select('*')
    .eq('user_id', user.id)
    .eq('lesson_id', currentLesson.id)
    .single()

  // Liste plate de toutes les leçons pour navigation prev/next
  const allLessons = (modules ?? []).flatMap(m => (m.lessons ?? []).sort((a: any, b: any) => a.position - b.position))
  const currentIdx = allLessons.findIndex((l: any) => l.id === currentLesson.id)
  const prevLesson = currentIdx > 0 ? allLessons[currentIdx - 1] : null
  const nextLesson = currentIdx < allLessons.length - 1 ? allLessons[currentIdx + 1] : null

  // Quiz si applicable
  let quizQuestions = null
  let bestPreviousScore: number | null = null
  if (currentLesson.type === 'quiz') {
    const [{ data: questions }, { data: attempts }] = await Promise.all([
      supabase.from('quiz_questions').select('*').eq('lesson_id', currentLesson.id).order('position'),
      supabase.from('quiz_attempts').select('score').eq('lesson_id', currentLesson.id).eq('user_id', user.id).order('score', { ascending: false }).limit(1),
    ])
    quizQuestions = questions
    bestPreviousScore = attempts?.[0]?.score ?? null
  }

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      {/* Top bar */}
      <header className="bg-gray-900 border-b border-gray-800 px-4 py-3 flex items-center gap-4">
        <Link href={`/formation/${course.slug}`} className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm">
          <ArrowLeft className="w-4 h-4" /> Retour
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-white font-semibold text-sm truncate">{course.title}</h1>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <span>{enrollment.progress_percent}% terminé</span>
          <div className="w-24 bg-gray-700 rounded-full h-1.5">
            <div className="h-1.5 rounded-full bg-[#FFA500]" style={{ width: `${enrollment.progress_percent}%` }} />
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar leçons */}
        <LessonSidebar
          modules={modules ?? []}
          courseId={courseId}
          currentLessonId={currentLesson.id}
          userId={user.id}
        />

        {/* Contenu principal */}
        <main className="flex-1 overflow-y-auto">
          {currentLesson.type === 'video' && currentLesson.video_url && (
            <VideoPlayer
              videoUrl={currentLesson.video_url}
              lessonId={currentLesson.id}
              courseId={courseId}
              userId={user.id}
              lastPosition={progress?.last_position_seconds ?? 0}
              isCompleted={progress?.is_completed ?? false}
            />
          )}

          <div className="max-w-4xl mx-auto p-6">
            <div className="flex items-start justify-between mb-6">
              <h2 className="text-xl font-bold text-white">{currentLesson.title}</h2>
              <div className="flex items-center gap-2 flex-shrink-0">
                <BookmarkButton lessonId={currentLesson.id} courseId={courseId} />
                {currentLesson.type !== 'video' && currentLesson.type !== 'quiz' && (
                  <MarkCompleteButton
                    lessonId={currentLesson.id}
                    courseId={courseId}
                    isCompleted={progress?.is_completed ?? false}
                  />
                )}
                {currentLesson.type === 'video' && progress?.is_completed && (
                  <span className="flex items-center gap-1.5 text-green-400 text-sm font-medium">
                    <CheckCircle className="w-5 h-5" /> Terminé
                  </span>
                )}
              </div>
            </div>

            {currentLesson.content && (
              <div className="prose prose-invert prose-sm max-w-none mb-8">
                <div dangerouslySetInnerHTML={{ __html: currentLesson.content }} />
              </div>
            )}

            {currentLesson.type === 'quiz' && quizQuestions && (
              <QuizSection
                questions={quizQuestions}
                lessonId={currentLesson.id}
                courseId={courseId}
                userId={user.id}
                passingScore={currentLesson.quiz_passing_score ?? 70}
                bestPreviousScore={bestPreviousScore}
              />
            )}

            {/* Notes de cours */}
            <div className="mb-8 bg-gray-800 rounded-2xl overflow-hidden">
              <LessonNotes lessonId={currentLesson.id} courseId={courseId} />
            </div>

            {/* Forum de discussion */}
            <DiscussionPanel
              lessonId={currentLesson.id}
              courseId={courseId}
              currentUserId={user.id}
            />

            {/* Navigation leçon suivante / précédente */}
            <LessonNavigation
              courseId={courseId}
              prevLesson={prevLesson ? { id: prevLesson.id, title: prevLesson.title } : null}
              nextLesson={nextLesson ? { id: nextLesson.id, title: nextLesson.title } : null}
            />

            {enrollment.progress_percent >= 100 && (
              <div className="mt-8 p-6 bg-gradient-to-r from-[#FFA500]/10 to-[#0B3D91]/10 border border-[#FFA500]/30 rounded-2xl">
                <p className="text-white text-center font-semibold mb-4">🎉 Félicitations ! Vous avez terminé cette formation.</p>
                <CertificateButton courseId={courseId} />
              </div>
            )}
          </div>
        </main>
      </div>
      <SaraChat
        courseTitle={course.title}
        lessonTitle={currentLesson.title}
        lessonContent={currentLesson.content ?? undefined}
      />
    </div>
  )
}
