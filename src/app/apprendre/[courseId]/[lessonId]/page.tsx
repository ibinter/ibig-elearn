import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import VideoPlayer from './VideoPlayer'
import LessonSidebar from './LessonSidebar'
import QuizSection from './QuizSection'
import Link from 'next/link'
import { ArrowLeft, ArrowRight, CheckCircle, ChevronLeft, ChevronRight } from 'lucide-react'
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
import LessonTabs from './LessonTabs'
import LessonPaywall from './LessonPaywall'
import ScormPlayer from '@/components/apprendre/ScormPlayer'
import { createAdminClient } from '@/lib/supabase/admin'
import { xapiToken } from '@/lib/scorm'
import { headers } from 'next/headers'
import { randomUUID } from 'crypto'

interface PageProps {
  params: Promise<{ courseId: string; lessonId: string }>
}

export default async function ApprendrePage({ params }: PageProps) {
  const { courseId, lessonId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/connexion')

  const { data: enrollment } = await supabase
    .from('enrollments')
    .select('*')
    .eq('user_id', user.id)
    .eq('course_id', courseId)
    .single()

  const { data: course } = await supabase.from('courses').select('id, title, slug, price_xof, is_sequential').eq('id', courseId).single()
  if (!course) notFound()

  // Progression imposée : choisie par l'apprenant (mode guidé / certifiant) ou par le formateur pour tous
  const learnerMode = (enrollment?.mode ?? 'autonome') as 'autonome' | 'guide' | 'certifiant'
  const enrollmentMode = course.is_sequential && learnerMode === 'autonome' ? 'guide' : learnerMode

  const { data: modules } = await supabase
    .from('modules')
    .select('*, lessons(id, title, type, video_url, video_duration_seconds, content, position, is_free_preview, audio_url, audio_cover_url, audio_transcript, audio_duration_s, code_language, code_starter, code_solution, code_tests, code_instructions)')
    .eq('course_id', courseId)
    .order('position')

  let currentLesson = null
  if (lessonId !== 'intro') {
    const { data } = await supabase.from('lessons').select('*').eq('id', lessonId).single()
    currentLesson = data
  } else {
    const firstLesson = modules?.[0]?.lessons?.[0]
    if (firstLesson) return redirect(`/apprendre/${courseId}/${firstLesson.id}`)
  }

  if (!currentLesson) notFound()

  const isLocked = !enrollment && !currentLesson.is_free_preview

  // Diffusion progressive : un module s'ouvre à une date fixe et/ou N jours après l'inscription
  const moduleOpensAt: Record<string, string | null> = {}
  for (const m of modules ?? []) {
    const dates: number[] = []
    if (m.available_from) dates.push(new Date(m.available_from + 'T00:00:00').getTime())
    if (m.unlock_after_days && enrollment?.enrolled_at) dates.push(new Date(enrollment.enrolled_at).getTime() + m.unlock_after_days * 86400_000)
    const opens = dates.length ? Math.max(...dates) : null
    moduleOpensAt[m.id] = opens && opens > Date.now() ? new Date(opens).toISOString() : null
  }
  const opensAt = enrollment ? moduleOpensAt[currentLesson.module_id] : null
  if (opensAt) {
    return (
      <div className="min-h-screen bg-[#1c1d1f] flex items-center justify-center p-6 text-center text-white">
        <div className="max-w-md">
          <p className="text-5xl">🔒</p>
          <h1 className="mt-4 text-xl font-bold">Ce module s&apos;ouvre bientôt</h1>
          <p className="mt-2 text-gray-400">« {currentLesson.title} » sera disponible le {new Date(opensAt).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}. Votre formateur a prévu une progression étape par étape.</p>
          <Link href={`/apprendre/${courseId}`} className="mt-6 inline-block bg-[#FFA500] text-black font-bold px-6 py-3 rounded-xl">Retour au programme</Link>
        </div>
      </div>
    )
  }

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
        const lastPrevLesson = (prevModule.lessons ?? []).slice().sort((a: any, b: any) => a.position - b.position).at(-1)
        if (lastPrevLesson) redirect(`/apprendre/${courseId}/${lastPrevLesson.id}`)
        else redirect(`/apprendre/${courseId}/intro`)
      }
    }
  }

  const { data: progress } = await supabase
    .from('lesson_progress')
    .select('*')
    .eq('user_id', user.id)
    .eq('lesson_id', currentLesson.id)
    .single()

  const allLessons = (modules ?? []).flatMap(m => (m.lessons ?? []).sort((a: any, b: any) => a.position - b.position))
  const currentIdx = allLessons.findIndex((l: any) => l.id === currentLesson.id)
  const prevLesson = currentIdx > 0 ? allLessons[currentIdx - 1] : null
  const nextLesson = currentIdx < allLessons.length - 1 ? allLessons[currentIdx + 1] : null

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

  let quizQuestionCount = 0
  let quizAttemptsUsed = 0
  let bestPreviousScore: number | null = null
  let isLastModuleQuiz = false
  if (currentLesson.type === 'quiz') {
    // Les questions et réponses restent sur le serveur : le quiz est servi par /api/quiz/start
    const [{ count: bankSize }, { data: attempts }] = await Promise.all([
      supabase.from('quiz_questions').select('id', { count: 'exact', head: true }).eq('lesson_id', currentLesson.id),
      supabase.from('quiz_attempts').select('score, status').eq('lesson_id', currentLesson.id).eq('user_id', user.id).order('score', { ascending: false }),
    ])
    const currentModule = (modules ?? []).find(m => m.id === currentLesson.module_id)
    if (currentModule) {
      const moduleLessons: any[] = (currentModule.lessons ?? []).slice().sort((a: any, b: any) => b.position - a.position)
      const lastQuiz = moduleLessons.find((l: any) => l.type === 'quiz')
      isLastModuleQuiz = lastQuiz?.id === currentLesson.id
    }
    const done = (attempts ?? []).filter(a => a.status !== 'in_progress' && a.status !== 'expired')
    quizQuestionCount = currentLesson.quiz_draw_count ? Math.min(currentLesson.quiz_draw_count, bankSize ?? 0) : (bankSize ?? 0)
    quizAttemptsUsed = done.length
    bestPreviousScore = done[0]?.score ?? null
  }

  const progressPct = enrollment?.progress_percent ?? 0

  // Module SCORM / xAPI : paquet, reprise de la tentative et URL de lancement
  let scorm: { packageId: string; standard: 'scorm12' | 'scorm2004' | 'xapi'; launchUrl: string; cmi: Record<string, string>; completed: boolean; learnerName: string } | null = null
  if (currentLesson.type === 'scorm' && currentLesson.scorm_package_id) {
    const admin = createAdminClient()
    const [{ data: pkg }, { data: attempt }, { data: me }, { data: lp }] = await Promise.all([
      admin.from('scorm_packages').select('id, standard, launch_path, activity_id').eq('id', currentLesson.scorm_package_id).single(),
      admin.from('scorm_attempts').select('cmi').eq('user_id', user.id).eq('package_id', currentLesson.scorm_package_id).maybeSingle(),
      admin.from('profiles').select('full_name, email').eq('id', user.id).single(),
      admin.from('lesson_progress').select('is_completed').eq('user_id', user.id).eq('lesson_id', currentLesson.id).maybeSingle(),
    ])
    if (pkg) {
      const [file, query] = pkg.launch_path.split('?')
      let launchUrl = `/scorm-content/${pkg.id}/${file.split('/').map(encodeURIComponent).join('/')}${query ? '?' + query : ''}`
      if (pkg.standard === 'xapi') {
        const h = await headers()
        const origin = `${h.get('x-forwarded-proto') ?? 'https'}://${h.get('host')}`
        const actor = { objectType: 'Agent', name: me?.full_name ?? 'Apprenant', mbox: `mailto:${me?.email ?? user.email}` }
        const qs = new URLSearchParams({
          endpoint: `${origin}/api/xapi/`, auth: `Basic ${xapiToken(user.id, currentLesson.id)}`,
          actor: JSON.stringify(actor), activity_id: pkg.activity_id ?? `${origin}/apprendre/${courseId}/${currentLesson.id}`, registration: randomUUID(),
        })
        launchUrl += (launchUrl.includes('?') ? '&' : '?') + qs.toString()
      }
      scorm = { packageId: pkg.id, standard: pkg.standard, launchUrl, cmi: (attempt?.cmi ?? {}) as Record<string, string>, completed: !!lp?.is_completed, learnerName: me?.full_name ?? '' }
    }
  }
  const lessonTypeLabel: Record<string, string> = {
    video: 'Vidéo', audio: 'Audio', code: 'Code', quiz: 'Quiz',
    final_exam: 'Examen final', assignment: 'Devoir', lesson: 'Cours', scorm: 'Module interactif',
  }

  // Breadcrumb : trouver module de la leçon courante + position
  const currentModule = (modules ?? []).find(m =>
    (m.lessons ?? []).some((l: any) => l.id === currentLesson.id)
  )
  const lessonIndex = currentModule
    ? [...(currentModule.lessons ?? [])].sort((a: any, b: any) => a.position - b.position).findIndex((l: any) => l.id === currentLesson.id) + 1
    : null

  // Temps de lecture estimé (200 mots/min)
  const wordCount = currentLesson.content ? currentLesson.content.split(/\s+/).length : 0
  const readingMinutes = wordCount > 0 ? Math.max(1, Math.round(wordCount / 200)) : null

  const isMedia = ['video', 'audio', 'code'].includes(currentLesson.type)

  return (
    <div className="min-h-screen bg-[#1c1d1f] flex flex-col" style={{ fontFamily: "'Inter', sans-serif" }}>

      {/* ── Header fixe Udemy-style ── */}
      <header className="fixed top-0 left-0 right-0 z-50 h-[calc(3.5rem+env(safe-area-inset-top))] pt-[env(safe-area-inset-top)] bg-[#1c1d1f] border-b border-white/10 flex items-center px-3 sm:px-4 gap-2 sm:gap-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 flex-shrink-0">
          <span className="text-white font-black text-lg tracking-tight">
            <span className="text-[#FFA500]">IBIG</span>
            <span className="hidden sm:inline text-white text-sm font-medium ml-1">E-LEARNING</span>
          </span>
        </Link>

        <div className="hidden sm:block w-px h-5 bg-white/15 flex-shrink-0" />

        <div className="flex-1 md:hidden" />

        {/* Titre cours */}
        <p className="text-gray-300 text-sm font-medium truncate flex-1 min-w-0 hidden md:block">
          {course.title}
        </p>

        {/* Progress bar + % */}
        {enrollment && (
          <div className="hidden sm:flex items-center gap-3 flex-shrink-0">
            <div className="w-32 bg-white/10 rounded-full h-1.5 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${progressPct}%`,
                  background: progressPct >= 100
                    ? '#22c55e'
                    : 'linear-gradient(90deg, #0B3D91, #FFA500)',
                }}
              />
            </div>
            <span className="text-xs font-semibold text-gray-300">{progressPct}%</span>
          </div>
        )}

        {/* Navigation prev/next dans le header */}
        <div className="flex items-center gap-0.5 sm:gap-1 flex-shrink-0">
          {prevLesson ? (
            <Link
              href={`/apprendre/${courseId}/${prevLesson.id}`}
              className="p-2 rounded-md text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
              title="Leçon précédente"
            >
              <ChevronLeft className="w-5 h-5" />
            </Link>
          ) : (
            <span className="p-2 text-gray-700"><ChevronLeft className="w-5 h-5" /></span>
          )}
          {nextLesson ? (
            <Link
              href={`/apprendre/${courseId}/${nextLesson.id}`}
              className="p-2 rounded-md text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
              title="Leçon suivante"
            >
              <ChevronRight className="w-5 h-5" />
            </Link>
          ) : (
            <span className="p-2 text-gray-700"><ChevronRight className="w-5 h-5" /></span>
          )}
        </div>

        {/* Marquer complet */}
        {currentLesson.type !== 'video' && currentLesson.type !== 'audio' && currentLesson.type !== 'quiz' && currentLesson.type !== 'code' && currentLesson.type !== 'scorm' && (
          <div className="flex-shrink-0">
            <MarkCompleteButton
              lessonId={currentLesson.id}
              courseId={courseId}
              courseTitle={course.title}
              isCompleted={progress?.is_completed ?? false}
            />
          </div>
        )}

        {/* Quitter */}
        <Link
          href={`/formation/${course.slug}`}
          className="flex-shrink-0 flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition-colors border border-white/10 rounded-md px-2 sm:px-3 py-1.5"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Quitter</span>
        </Link>
      </header>

      {/* ── Corps principal (sous header fixe) ── */}
      <div className="flex pt-[calc(3.5rem+env(safe-area-inset-top))] min-h-screen items-start">

        {/* ── Sidebar cours — gauche ── */}
        <LessonSidebar
          modules={modules ?? []}
          courseId={courseId}
          currentLessonId={currentLesson.id}
          userId={user.id}
          enrollmentMode={enrollmentMode}
          moduleOpensAt={moduleOpensAt}
        />

        {/* ── Zone de contenu ── */}
        <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">

          {/* Bloc vidéo / audio / code — fond sombre full-width */}
          {currentLesson.type === 'video' && currentLesson.video_url && (
            <div className="bg-black w-full">
              <div className="max-w-5xl mx-auto">
                <VideoPlayer
                  videoUrl={currentLesson.video_url}
                  lessonId={currentLesson.id}
                  courseId={courseId}
                  userId={user.id}
                  lastPosition={progress?.last_position_seconds ?? 0}
                  isCompleted={progress?.is_completed ?? false}
                />
              </div>
            </div>
          )}

          {currentLesson.type === 'audio' && currentLesson.audio_url && (
            <div className="bg-gradient-to-br from-[#0B3D91] to-[#1a56cc] py-12 px-4">
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

          {scorm && (
            <ScormPlayer
              packageId={scorm.packageId}
              lessonId={currentLesson.id}
              standard={scorm.standard}
              launchUrl={scorm.launchUrl}
              initialCmi={scorm.cmi}
              learnerId={user.id}
              learnerName={scorm.learnerName}
              alreadyCompleted={scorm.completed}
            />
          )}

          {/* ── Contenu texte — fond blanc, max-width lisible ── */}
          <div className="bg-white flex-1">
            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-10 py-6 sm:py-8">

              {/* En-tête leçon */}
              <div className="mb-8 pb-6 border-b border-gray-100">
                {/* Breadcrumb */}
                {currentModule && (
                  <p className="text-xs text-gray-400 font-medium mb-3 flex items-center gap-1.5">
                    <span>{currentModule.title}</span>
                    {lessonIndex && (
                      <>
                        <ChevronRight className="w-3 h-3" />
                        <span>Leçon {lessonIndex}</span>
                      </>
                    )}
                  </p>
                )}

                {/* Type + état */}
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-[11px] font-bold uppercase tracking-widest text-[#0B3D91] bg-[#0B3D91]/8 px-3 py-1 rounded-full">
                    {lessonTypeLabel[currentLesson.type] ?? 'Leçon'}
                  </span>
                  {readingMinutes && (
                    <span className="text-[11px] text-gray-400 bg-gray-100 px-3 py-1 rounded-full">
                      ⏱ {readingMinutes} min de lecture
                    </span>
                  )}
                  {progress?.is_completed && (
                    <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
                      <CheckCircle className="w-3 h-3" /> Complétée
                    </span>
                  )}
                </div>

                {/* Titre + marque-page */}
                <div className="flex items-start justify-between gap-4">
                  <h1 className="text-xl sm:text-2xl lg:text-3xl break-words font-bold text-gray-900 leading-tight">
                    {currentLesson.title}
                  </h1>
                  <BookmarkButton lessonId={currentLesson.id} courseId={courseId} />
                </div>
              </div>

              {/* Paywall pour visiteurs non-inscrits */}
              {isLocked ? (
                <LessonPaywall
                  courseSlug={course.slug}
                  courseTitle={course.title}
                  lessonTitle={currentLesson.title}
                  coursePrice={(course as any).price_xof}
                  modulesCount={modules?.length}
                  lessonsCount={modules?.flatMap((m: any) => m.lessons ?? []).length}
                />
              ) : (
                <>
              {/* Contenu Markdown */}
              {currentLesson.content && currentLesson.type !== 'quiz' && (
                <div className="mb-10">
                  <MarkdownContent content={currentLesson.content} />
                </div>
              )}

              {/* Sections spéciales */}
              {currentLesson.type === 'assignment' && assignmentData && (
                <div className="mb-10 bg-amber-50 rounded-2xl border border-amber-200 p-5 sm:p-8">
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
                <div className="mb-10">
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

              {currentLesson.type === 'quiz' && quizQuestionCount > 0 && (
                <div className="mb-10">
                  <QuizSection
                    questionCount={quizQuestionCount}
                    lessonId={currentLesson.id}
                    courseId={courseId}
                    passingScore={currentLesson.quiz_passing_score ?? 70}
                    timeLimitMin={currentLesson.quiz_time_limit_min}
                    maxAttempts={currentLesson.quiz_max_attempts}
                    attemptsUsed={quizAttemptsUsed}
                    bestPreviousScore={bestPreviousScore}
                    nextLesson={nextLesson ? { id: nextLesson.id, title: nextLesson.title } : null}
                    isLastModuleQuiz={isLastModuleQuiz}
                  />
                </div>
              )}

              {/* Félicitations */}
              {(enrollment?.progress_percent ?? 0) >= 100 && (
                <div className="mb-10 p-5 sm:p-8 bg-gradient-to-br from-[#0B3D91] to-[#1a56cc] rounded-2xl shadow-lg text-center">
                  <div className="text-5xl mb-4">🎉</div>
                  <h3 className="text-white text-xl font-bold mb-2">Félicitations !</h3>
                  <p className="text-blue-100 mb-6">Vous avez terminé cette formation avec succès.</p>
                  <CertificateButton courseId={courseId} />
                </div>
              )}

              {/* Tabs : Notes · Q&A · Discussion */}
              <LessonTabs
                lessonId={currentLesson.id}
                courseId={courseId}
                userId={user.id}
              />

              {/* Navigation prev / next */}
              <div className="mt-10 pt-6 border-t border-gray-100 flex items-center justify-between gap-4">
                {prevLesson ? (
                  <Link
                    href={`/apprendre/${courseId}/${prevLesson.id}`}
                    className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-[#0B3D91] transition-colors group"
                  >
                    <div className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center group-hover:border-[#0B3D91] group-hover:bg-[#0B3D91]/5 transition-all">
                      <ArrowLeft className="w-4 h-4" />
                    </div>
                    <span className="hidden sm:block truncate max-w-[180px]">{prevLesson.title}</span>
                  </Link>
                ) : <div />}

                {nextLesson ? (
                  <Link
                    href={`/apprendre/${courseId}/${nextLesson.id}`}
                    className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-[#0B3D91] transition-colors group"
                  >
                    <span className="hidden sm:block truncate max-w-[180px] text-right">{nextLesson.title}</span>
                    <div className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center group-hover:border-[#0B3D91] group-hover:bg-[#0B3D91]/5 transition-all">
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </Link>
                ) : <div />}
              </div>

              <div className="h-16" />
                </>
              )}
            </div>
          </div>
        </div>

      </div>

      <SaraChat
        courseTitle={course.title}
        lessonTitle={currentLesson.title}
        lessonContent={currentLesson.content ?? undefined}
      />
    </div>
  )
}
