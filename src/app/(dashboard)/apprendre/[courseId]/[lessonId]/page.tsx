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

  const enrollmentMode = (enrollment?.mode ?? 'autonome') as 'autonome' | 'guide' | 'certifiant'

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

  // Si pas inscrit : seulement les leçons free_preview sont accessibles
  if (!enrollment && !currentLesson.is_free_preview) {
    redirect(`/formation/${courseId}`)
  }

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

  const progressPct = enrollment?.progress_percent ?? 0
  const lessonTypeLabel: Record<string, string> = {
    video: 'Vidéo', audio: 'Audio', code: 'Code', quiz: 'Quiz',
    final_exam: 'Examen final', assignment: 'Devoir', lesson: 'Cours',
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Top bar — blanc élégant */}
      <header className="bg-white border-b border-gray-200 shadow-sm px-4 py-0 flex items-center gap-4 h-14 flex-shrink-0 z-20">
        <Link
          href={`/formation/${course.slug}`}
          className="flex items-center gap-1.5 text-gray-500 hover:text-[#0B3D91] transition-colors text-sm font-medium flex-shrink-0"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Retour</span>
        </Link>

        <div className="w-px h-6 bg-gray-200 flex-shrink-0" />

        <div className="flex-1 min-w-0">
          <p className="text-xs text-gray-400 truncate leading-none mb-0.5">{course.title}</p>
          <p className="text-sm font-semibold text-gray-800 truncate leading-none">{currentLesson.title}</p>
        </div>

        {enrollment && (
          <div className="flex items-center gap-3 flex-shrink-0">
            <div className="hidden sm:flex flex-col items-end gap-1">
              <span className="text-xs font-semibold text-[#0B3D91]">{progressPct}% terminé</span>
              <div className="w-28 bg-gray-200 rounded-full h-1.5 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#0B3D91] to-[#FFA500] transition-all duration-700"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>
            {progress?.is_completed && (
              <span className="flex items-center gap-1 text-emerald-600 text-xs font-semibold bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                <CheckCircle className="w-3.5 h-3.5" /> Terminé
              </span>
            )}
          </div>
        )}
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
        <main className="flex-1 overflow-y-auto bg-gray-50">

          {/* Bloc média (vidéo / audio / code) — fond sombre uniquement pour ces éléments */}
          {currentLesson.type === 'video' && currentLesson.video_url && (
            <div className="bg-gray-900">
              <VideoPlayer
                videoUrl={currentLesson.video_url}
                lessonId={currentLesson.id}
                courseId={courseId}
                userId={user.id}
                lastPosition={progress?.last_position_seconds ?? 0}
                isCompleted={progress?.is_completed ?? false}
              />
            </div>
          )}

          {currentLesson.type === 'audio' && currentLesson.audio_url && (
            <div className="bg-gradient-to-br from-[#0B3D91] to-[#1a56cc] py-10 px-4">
              <div className="max-w-lg mx-auto">
                <AudioPlayer
                  audioUrl={currentLesson.audio_url}
                  title={currentLesson.title}
                  coverUrl={currentLesson.audio_cover_url}
                  transcriptText={currentLesson.audio_transcript}
                />
              </div>
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

          {/* Zone de contenu — fond blanc, max-width lisible */}
          <div className="max-w-3xl mx-auto px-6 py-8">

            {/* En-tête de la leçon */}
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-[#0B3D91] bg-[#0B3D91]/10 px-3 py-1 rounded-full">
                  {lessonTypeLabel[currentLesson.type] ?? 'Leçon'}
                </span>
                {progress?.is_completed && (
                  <span className="text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" /> Complétée
                  </span>
                )}
              </div>
              <div className="flex items-start justify-between gap-4">
                <h1 className="text-2xl font-bold text-gray-900 leading-tight">{currentLesson.title}</h1>
                <div className="flex items-center gap-2 flex-shrink-0 pt-0.5">
                  <BookmarkButton lessonId={currentLesson.id} courseId={courseId} />
                  {currentLesson.type !== 'video' && currentLesson.type !== 'audio' && currentLesson.type !== 'quiz' && currentLesson.type !== 'code' && (
                    <MarkCompleteButton
                      lessonId={currentLesson.id}
                      courseId={courseId}
                      courseTitle={course.title}
                      isCompleted={progress?.is_completed ?? false}
                    />
                  )}
                </div>
              </div>
            </div>

            {/* Contenu Markdown */}
            {currentLesson.content && currentLesson.type !== 'quiz' && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 mb-8">
                <MarkdownContent content={currentLesson.content} />
              </div>
            )}

            {/* Sections spéciales */}
            {currentLesson.type === 'assignment' && assignmentData && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 mb-8">
                <AssignmentSection
                  assignment={assignmentData}
                  lessonId={currentLesson.id}
                  courseId={courseId}
                  userId={user.id}
                  existingSubmission={existingSubmission}
                />
              </div>
            )}

            {currentLesson.type === 'final_exam' && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 mb-8">
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
              </div>
            )}

            {currentLesson.type === 'quiz' && quizQuestions && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 mb-8">
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
              </div>
            )}

            {/* Notes de cours */}
            <div className="mb-6 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-6 pt-5 pb-1 border-b border-gray-100 flex items-center gap-2">
                <span className="text-base font-semibold text-gray-800">📝 Mes notes</span>
              </div>
              <LessonNotes lessonId={currentLesson.id} courseId={courseId} />
              <div className="px-6 pb-4">
                <Link
                  href={`/apprendre/${courseId}/notes`}
                  className="inline-flex items-center gap-1.5 text-xs text-[#0B3D91] hover:text-[#FFA500] transition-colors font-medium"
                  target="_blank"
                >
                  <ArrowLeft className="w-3 h-3 rotate-180" />
                  Exporter toutes mes notes en PDF
                </Link>
              </div>
            </div>

            {/* Q&A par leçon */}
            <div className="mb-6 bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <LessonQA lessonId={currentLesson.id} courseId={courseId} userId={user.id} />
            </div>

            {/* Forum de discussion */}
            <div className="mb-6 bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <DiscussionPanel
                lessonId={currentLesson.id}
                courseId={courseId}
                currentUserId={user.id}
              />
            </div>

            {/* Navigation leçon suivante / précédente */}
            <LessonNavigation
              courseId={courseId}
              prevLesson={prevLesson ? { id: prevLesson.id, title: prevLesson.title } : null}
              nextLesson={nextLesson ? { id: nextLesson.id, title: nextLesson.title } : null}
            />

            {/* Félicitations formation terminée */}
            {(enrollment?.progress_percent ?? 0) >= 100 && (
              <div className="mt-8 p-8 bg-gradient-to-br from-[#0B3D91] to-[#1a56cc] rounded-2xl shadow-lg text-center">
                <div className="text-5xl mb-4">🎉</div>
                <h3 className="text-white text-xl font-bold mb-2">Félicitations !</h3>
                <p className="text-blue-100 mb-6">Vous avez terminé cette formation avec succès.</p>
                <CertificateButton courseId={courseId} />
              </div>
            )}

            <div className="h-12" />
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
