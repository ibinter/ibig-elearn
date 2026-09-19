'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { CheckCircle, XCircle, RotateCcw, Trophy, AlertCircle, ChevronRight } from 'lucide-react'
import CompletionCelebration from '@/components/ui/CompletionCelebration'

interface Question {
  id: string
  question: string
  type: 'mcq' | 'true_false'
  options: string[]
  correct_option: number
  explanation: string | null
  position: number
}

interface Props {
  lessonId: string
  courseId: string
  userId: string
  passingScore: number
  isCompleted: boolean
}

type Phase = 'loading' | 'empty' | 'intro' | 'taking' | 'results'

export default function QuizPlayer({ lessonId, courseId, userId, passingScore, isCompleted: initialCompleted }: Props) {
  const [phase, setPhase] = useState<Phase>('loading')
  const [questions, setQuestions] = useState<Question[]>([])
  const [answers, setAnswers] = useState<Record<string, number>>({})
  const [submitted, setSubmitted] = useState(false)
  const [score, setScore] = useState(0)
  const [isCompleted, setIsCompleted] = useState(initialCompleted)
  const [celebration, setCelebration] = useState<{ courseTitle: string; certificateId?: string } | null>(null)
  const supabase = createClient()

  useEffect(() => {
    fetch(`/api/formateur/quiz?lesson_id=${lessonId}`)
      .then(r => r.json())
      .then((data: Question[]) => {
        setQuestions(data)
        setPhase(data.length === 0 ? 'empty' : 'intro')
      })
      .catch(() => setPhase('empty'))
  }, [lessonId])

  async function handleSubmit() {
    const correct = questions.filter(q => answers[q.id] === q.correct_option).length
    const pct = Math.round((correct / questions.length) * 100)
    setScore(pct)
    setSubmitted(true)
    setPhase('results')

    const passed = pct >= passingScore

    // Enregistrer la progression
    await supabase.from('lesson_progress').upsert({
      user_id: userId,
      lesson_id: lessonId,
      course_id: courseId,
      is_completed: passed,
      quiz_score: pct,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id,lesson_id' })

    if (passed && !isCompleted) {
      setIsCompleted(true)
      // Vérifier si certificat doit être émis
      try {
        const res = await fetch('/api/certificates/auto-issue', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ courseId }),
        })
        const data = await res.json()
        if (data.issued) {
          const { data: course } = await supabase.from('courses').select('title').eq('id', courseId).single()
          setCelebration({ courseTitle: (course as any)?.title ?? '', certificateId: data.certificateId })
        }
      } catch { /* non bloquant */ }
    }
  }

  function retry() {
    setAnswers({})
    setSubmitted(false)
    setScore(0)
    setPhase('taking')
  }

  if (phase === 'loading') {
    return (
      <div className="aspect-video bg-gray-900 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#0B3D91] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (phase === 'empty') {
    return (
      <div className="aspect-video bg-gray-900 flex items-center justify-center">
        <div className="text-center text-gray-500">
          <AlertCircle className="w-10 h-10 mx-auto mb-2" />
          <p className="text-sm">Ce quiz n'a pas encore de questions.</p>
        </div>
      </div>
    )
  }

  if (phase === 'intro') {
    return (
      <div className="aspect-video bg-gray-900 flex items-center justify-center p-8">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 rounded-2xl bg-[#0B3D91]/20 border border-[#0B3D91]/30 flex items-center justify-center mx-auto mb-4">
            <Trophy className="w-8 h-8 text-[#FFA500]" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Quiz</h2>
          <p className="text-gray-400 text-sm mb-1">{questions.length} question{questions.length > 1 ? 's' : ''}</p>
          <p className="text-gray-400 text-sm mb-6">Score de réussite : <span className="text-[#FFA500] font-semibold">{passingScore}%</span></p>
          {isCompleted && (
            <p className="text-green-400 text-sm mb-4 flex items-center justify-center gap-1">
              <CheckCircle className="w-4 h-4" /> Quiz déjà réussi
            </p>
          )}
          <button onClick={() => setPhase('taking')}
            className="ibig-gradient text-white font-semibold px-6 py-3 rounded-xl hover:opacity-90 transition-opacity flex items-center gap-2 mx-auto">
            {isCompleted ? 'Reprendre le quiz' : 'Commencer'} <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    )
  }

  if (phase === 'results') {
    const passed = score >= passingScore
    const correct = questions.filter(q => answers[q.id] === q.correct_option).length
    return (
      <div className="bg-gray-900 text-white overflow-y-auto" style={{ maxHeight: 'calc(100vh - 120px)' }}>
        {/* Score header */}
        <div className={`px-6 py-8 text-center border-b border-gray-800 ${passed ? 'bg-green-900/20' : 'bg-red-900/20'}`}>
          <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 ${passed ? 'bg-green-500/20 border-2 border-green-500' : 'bg-red-500/20 border-2 border-red-500'}`}>
            {passed
              ? <CheckCircle className="w-10 h-10 text-green-400" />
              : <XCircle className="w-10 h-10 text-red-400" />}
          </div>
          <p className={`text-4xl font-black mb-1 ${passed ? 'text-green-400' : 'text-red-400'}`}>{score}%</p>
          <p className="text-gray-300 text-sm">{correct}/{questions.length} bonne{correct > 1 ? 's' : ''} réponse{correct > 1 ? 's' : ''}</p>
          <p className={`mt-2 font-semibold ${passed ? 'text-green-300' : 'text-red-300'}`}>
            {passed ? '🎉 Quiz réussi !' : `Seuil requis : ${passingScore}%`}
          </p>
          {!passed && (
            <button onClick={retry} className="mt-4 flex items-center gap-2 text-sm bg-white/10 hover:bg-white/20 px-4 py-2 rounded-xl transition-colors mx-auto">
              <RotateCcw className="w-4 h-4" /> Recommencer
            </button>
          )}
        </div>

        {/* Correction détaillée */}
        <div className="px-6 py-6 space-y-6">
          <h3 className="font-bold text-gray-300 text-sm uppercase tracking-wider">Correction</h3>
          {questions.map((q, i) => {
            const userAnswer = answers[q.id]
            const isCorrect = userAnswer === q.correct_option
            return (
              <div key={q.id} className={`rounded-xl p-4 border ${isCorrect ? 'border-green-700 bg-green-900/20' : 'border-red-700 bg-red-900/20'}`}>
                <p className="font-medium text-sm mb-3">
                  <span className="text-gray-500 mr-2">{i + 1}.</span>{q.question}
                </p>
                <div className="space-y-1.5">
                  {q.options.map((opt, idx) => (
                    <div key={idx} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm
                      ${idx === q.correct_option ? 'bg-green-800/40 text-green-300' : ''}
                      ${idx === userAnswer && idx !== q.correct_option ? 'bg-red-800/40 text-red-300' : ''}
                      ${idx !== q.correct_option && idx !== userAnswer ? 'text-gray-500' : ''}
                    `}>
                      {idx === q.correct_option
                        ? <CheckCircle className="w-3.5 h-3.5 text-green-400 flex-shrink-0" />
                        : idx === userAnswer
                          ? <XCircle className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
                          : <span className="w-3.5 h-3.5 flex-shrink-0" />}
                      {opt}
                    </div>
                  ))}
                </div>
                {q.explanation && (
                  <p className="mt-3 text-xs text-gray-400 border-t border-gray-700 pt-3">
                    💡 {q.explanation}
                  </p>
                )}
              </div>
            )
          })}
        </div>

        {celebration && (
          <CompletionCelebration
            courseTitle={celebration.courseTitle}
            certificateId={celebration.certificateId}
            courseId={courseId}
            onClose={() => setCelebration(null)}
          />
        )}
      </div>
    )
  }

  // Phase: taking
  return (
    <div className="bg-gray-900 text-white overflow-y-auto" style={{ maxHeight: 'calc(100vh - 120px)' }}>
      <div className="px-6 py-6 max-w-2xl mx-auto space-y-8">
        {/* Progress */}
        <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
          <span>{Object.keys(answers).length}/{questions.length} réponse{Object.keys(answers).length > 1 ? 's' : ''}</span>
          <span>Score requis : {passingScore}%</span>
        </div>
        <div className="h-1 bg-gray-800 rounded-full overflow-hidden mb-6">
          <div className="h-full bg-[#0B3D91] rounded-full transition-all duration-300"
            style={{ width: `${(Object.keys(answers).length / questions.length) * 100}%` }} />
        </div>

        {questions.map((q, i) => (
          <div key={q.id}>
            <p className="font-semibold text-white mb-3">
              <span className="text-[#FFA500] mr-2 text-sm">{i + 1}.</span>{q.question}
            </p>
            <div className="space-y-2">
              {q.options.map((opt, idx) => (
                <button key={idx}
                  onClick={() => setAnswers(a => ({ ...a, [q.id]: idx }))}
                  className={`w-full text-left flex items-center gap-3 px-4 py-3 rounded-xl border text-sm transition-all duration-150
                    ${answers[q.id] === idx
                      ? 'border-[#0B3D91] bg-[#0B3D91]/20 text-white'
                      : 'border-gray-700 text-gray-300 hover:border-gray-500 hover:bg-gray-800'}`}
                >
                  <span className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-colors
                    ${answers[q.id] === idx ? 'border-[#0B3D91] bg-[#0B3D91]' : 'border-gray-600'}`}>
                    {answers[q.id] === idx && <span className="w-2 h-2 rounded-full bg-white" />}
                  </span>
                  {opt}
                </button>
              ))}
            </div>
          </div>
        ))}

        <button
          onClick={handleSubmit}
          disabled={Object.keys(answers).length < questions.length}
          className="w-full ibig-gradient text-white font-bold py-3.5 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed mt-4"
        >
          {Object.keys(answers).length < questions.length
            ? `Répondez à toutes les questions (${questions.length - Object.keys(answers).length} restante${questions.length - Object.keys(answers).length > 1 ? 's' : ''})`
            : 'Soumettre le quiz'}
        </button>
      </div>
    </div>
  )
}
