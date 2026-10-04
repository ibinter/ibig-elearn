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
import LessonQA from '@/components/apprendre/LessonQA'
import MarkdownContent from '@/components/apprendre/MarkdownContent'
import AssignmentSection from '@/components/apprendre/AssignmentSection'
import FinalExamSection from './FinalExamSection'
import AudioPlayer from '@/components/lesson/AudioPlayer'
import CodeSandbox from '@/components/lesson/CodeSandbox'

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

  const enrollmentMode = (enrollment.mode ?? 'autonome') as 'autonome' | 'guide' | 'certifiant'

  const { data: course } = await supabase.from('courses').select('id, title, slug').eq('id', courseId).single()
  if (!course) notFound()

  const { data: modules } = await supabase
    .from('modules')
    .select('*, lessons(id, title, type, video_url, video_duration_seconds, content, position, is_free_preview, audio_url, audio_cover_url, audio_transcript, audio_duration_s, code_language, code_starter, code_solution, code_tests, code_instructions)')
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

  // Gate : vérifier si le module de la leçon courante est débloqué
  if (enrollmentMode !== 'autonome') {
    const currentModuleId = currentLesson.module_id
    const sortedModules = [...(modules ?? [])].sort((a, b) => a.position - b.position)
    const moduleIdx = sortedModules.findIndex(m => m.id === currentModuleId)

    if (moduleIdx > 0) {
      const prevModule = sortedModules[moduleIdx - 1]
      const prevLessons: any[] = (prevModule.lessons ?? []).slice().sort((a: any, b: any) => a.position - b.position)
      const quizLesson = prevLessons.slice().reverse().find((l: any) => l.type === 'quiz')

      let isUnlocked = false
      if (quizLesson) {
        const { data: attempt } = await supabase
          .from('quiz_attempts')
          .select('score')
          .eq('user_id', user.id)
          .eq('lesson_id', quizLesson.id)
          .gte('score', 70)
          .limit(1)
          .single()
        isUnlocked = !!attempt
      } else {
        const allIds = prevLessons.map((l: any) => l.id)
        const { data: doneProgress } = await supabase
          .from('lesson_progress')
          .select('lesson_id')
          .eq('user_id', user.id)
          .eq('is_completed', true)
          .in('lesson_id', allIds)
        isUnlocked = (doneProgress?.length ?? 0) === allIds.length
      }

      if (!isUnlocked) {
        // Rediriger vers la dernière leçon débloquée du module précédent
        const lastPrevLesson = (prevModule.lessons ?? []).slice().sort((a: any, b: any) => a.position - b.position).at(-1)
        if (lastPrevLesson) redirect(`/apprendre/${courseId}/${lastPrevLesson.id}`)
        else redirect(`/apprendre/${courseId}/intro`)
      }
    }
  }

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

  // Examen final si applicable
  let examQuestions: any[] = []
  let examPastAttempts: any[] = []
  let examAttemptsLeft = 0
  let examAvailable = false
  if (currentLesson.type === 'final_exam') {
    const [{ data: eQuestions }, { data: eAttempts }, { data: eLeft }, { data: eAvailable }] = await Promise.all([
      supabase.from('quiz_questions').select('id,question,type,options,position').eq('lesson_id', currentLesson.id).order('position'),
      supabase.from('final_exam_attempts').select('score,passed,submitted_at,attempt_number').eq('user_id', user.id).eq('lesson_id', currentLesson.id).order('attempt_number'),
      supabase.rpc('exam_attempts_left', { p_user_id: user.id, p_lesson_id: currentLesson.id }),
      supabase.rpc('is_final_exam_available', { p_user_id: user.id, p_course_id: courseId, p_lesson_id: currentLesson.id }),
    ])
    examQuestions = eQuestions ?? []
    examPastAttempts = (eAttempts ?? []).filter((a: any) => a.submitted_at !== null)
    examAttemptsLeft = eLeft ?? 0
    examAvailable = eAvailable ?? false
  }

  // Assignment si applicable
  let assignmentData: any = null
  let existingSubmission: any = null
  if (currentLesson.type === 'assignment') {
    const [{ data: assignment }, { data: submission }] = await Promise.all([
      supabase.from('assignments').select('*').eq('lesson_id', currentLesson.id).single(),
      supabase.from('assignment_submissions').select('*').eq('lesson_id', currentLesson.id).eq('user_id', user.id).single(),
    ])
    assignmentData = assignment
    existingSubmission = submission
  }

  // Quiz si applicable
  let quizQuestions = null
  let bestPreviousScore: number | null = null
  let isLastModuleQuiz = false
  if (currentLesson.type === 'quiz') {
    const [{ data: questions }, { data: attempts }] = await Promise.all([
      supabase.from('quiz_questions').select('*').eq('lesson_id', currentLesson.id).order('position'),
      supabase.from('quiz_attempts').select('score').eq('lesson_id', currentLesson.id).eq('user_id', user.id).order('score', { ascending: false }).limit(1),
    ])
    // Vérifier si c'est le dernier quiz du module (pour afficher "module suivant débloqué")
    const currentModule = (modules ?? []).find(m => m.id === currentLesson.module_id)
    if (currentModule) {
      const moduleLessons: any[] = (currentModule.lessons ?? []).slice().sort((a: any, b: any) => b.position - a.position)
      const lastQuiz = moduleLessons.find((l: any) => l.type === 'quiz')
      isLastModuleQuiz = lastQuiz?.id === currentLesson.id
    }
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
          enrollmentMode={enrollmentMode}
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

          {currentLesson.type === 'audio' && currentLesson.audio_url && (
            <div className="max-w-lg mx-auto p-6">
              <AudioPlayer
                audioUrl={currentLesson.audio_url}
                title={currentLesson.title}
                coverUrl={currentLesson.audio_cover_url}
                transcriptText={currentLesson.audio_transcript}
              />
            </div>
          )}

          {currentLesson.type === 'code' && currentLesson.code_language && (
            <CodeSandbox
              lessonId={currentLesson.id}
              courseId={courseId}
              language={currentLesson.code_language}
              starterCode={currentLesson.code_starter ?? ''}
              solutionCode={currentLesson.code_solution}
              tests={currentLesson.code_tests as any ?? []}
              instructions={currentLesson.code_instructions}
            />
          )}

          <div className="max-w-4xl mx-auto p-6">
            <div className="flex items-start justify-between mb-6">
              <h2 className="text-xl font-bold text-white">{currentLesson.title}</h2>
              <div className="flex items-center gap-2 flex-shrink-0">
                <BookmarkButton lessonId={currentLesson.id} courseId={courseId} />
                {currentLesson.type !== 'video' && currentLesson.type !== 'audio' && currentLesson.type !== 'quiz' && currentLesson.type !== 'code' && (
                  <MarkCompleteButton
                    lessonId={currentLesson.id}
                    courseId={courseId}
                    courseTitle={course.title}
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

            {currentLesson.content && currentLesson.type !== 'quiz' && (
              <MarkdownContent
                content={currentLesson.content}
                className="mb-8"
              />
            )}

            {currentLesson.type === 'assignment' && assignmentData && (
              <AssignmentSection
                assignment={assignmentData}
                lessonId={currentLesson.id}
                courseId={courseId}
                userId={user.id}
                existingSubmission={existingSubmission}
              />
            )}

            {currentLesson.type === 'final_exam' && (
              <FinalExamSection
                lessonId={currentLesson.id}
                courseId={courseId}
                questions={examQuestions}
                durationMinutes={currentLesson.exam_duration_minutes ?? 60}
                passingScore={currentLesson.exam_passing_score ?? 80}
                maxAttempts={currentLesson.exam_max_attempts ?? 3}
                attemptsLeft={examAttemptsLeft}
                isAvailable={examAvailable}
                pastAttempts={examPastAttempts}
                courseSlug={course.slug}
              />
            )}

            {currentLesson.type === 'quiz' && quizQuestions && (
              <QuizSection
                questions={quizQuestions}
                lessonId={currentLesson.id}
                courseId={courseId}
                userId={user.id}
                passingScore={currentLesson.quiz_passing_score ?? 70}
                bestPreviousScore={bestPreviousScore}
                nextLesson={nextLesson ? { id: nextLesson.id, title: nextLesson.title } : null}
                isLastModuleQuiz={isLastModuleQuiz}
              />
            )}

            {/* Notes de cours */}
            <div className="mb-8 bg-gray-800 rounded-2xl overflow-hidden">
              <LessonNotes lessonId={currentLesson.id} courseId={courseId} />
              <div className="px-4 pb-3">
                <Link href={`/apprendre/${courseId}/notes`}
                  className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-[#FFA500] transition-colors"
                  target="_blank">
                  <ArrowLeft className="w-3 h-3 rotate-180" />
                  Exporter toutes mes notes en PDF
                </Link>
              </div>
            </div>

            {/* Q&A par leçon */}
            <div className="mb-8 bg-gray-800 rounded-2xl p-6">
              <LessonQA lessonId={currentLesson.id} courseId={courseId} userId={user.id} />
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
