'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { CheckCircle, XCircle, RotateCcw, Trophy, Clock, ArrowRight, Unlock, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Question {
  id: string
  question: string
  type: 'mcq' | 'true_false'
  options: string[]
  correct_option: number
  explanation?: string
}

interface Props {
  questions: Question[]
  lessonId: string
  courseId: string
  userId: string
  passingScore?: number
  bestPreviousScore?: number | null
  nextLesson?: { id: string; title: string } | null
  isLastModuleQuiz?: boolean
}

function shuffle<T>(arr: T[], seed: string): T[] {
  const copy = [...arr]
  let hash = 0
  for (let i = 0; i < seed.length; i++) hash = ((hash << 5) - hash + seed.charCodeAt(i)) | 0
  for (let i = copy.length - 1; i > 0; i--) {
    hash = ((hash * 1664525) + 1013904223) | 0
    const j = Math.abs(hash) % (i + 1)
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

const TAB_SWITCH_LIMIT = 3

export default function QuizSection({ questions, lessonId, courseId, userId, passingScore = 70, bestPreviousScore, nextLesson, isLastModuleQuiz }: Props) {
  // Mélanger les questions une seule fois au montage
  const seed = useRef(`${userId}-${lessonId}-${Date.now()}`)
  const [shuffledQuestions] = useState(() => shuffle(questions, seed.current))

  const [answers, setAnswers] = useState<Record<number, number>>({})
  const [submitted, setSubmitted] = useState(false)
  const [score, setScore] = useState(0)
  const [passed, setPassed] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Anti-triche : détection changement d'onglet
  const [tabSwitches, setTabSwitches] = useState(0)
  const [showTabWarning, setShowTabWarning] = useState(false)
  const startedAt = useRef(Date.now())

  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden && !submitted) {
        setTabSwitches(prev => {
          const next = prev + 1
          setShowTabWarning(true)
          return next
        })
      }
    }
    document.addEventListener('visibilitychange', handleVisibility)
    return () => document.removeEventListener('visibilitychange', handleVisibility)
  }, [submitted])

  // Timer — 90 secondes par question
  const timeLimit = shuffledQuestions.length * 90
  const [timeLeft, setTimeLeft] = useState(timeLimit)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const handleSubmitInternal = useCallback(async (currentAnswers?: Record<number, number>, forcedTabSwitches?: number) => {
    if (loading || submitted) return
    setLoading(true)
    if (timerRef.current) clearInterval(timerRef.current)

    const ans = currentAnswers ?? answers
    const answersArray = shuffledQuestions.map((_, i) => ans[i] ?? -1)
    const timeUsed = Math.round((Date.now() - startedAt.current) / 1000)
    const switchCount = forcedTabSwitches ?? tabSwitches

    try {
      const res = await fetch('/api/quiz/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lessonId,
          courseId,
          answers: answersArray,
          tabSwitchCount: switchCount,
          timeUsedSeconds: timeUsed,
        }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Erreur'); setLoading(false); return }
      setScore(data.score)
      setPassed(data.passed)
      setSubmitted(true)
    } catch {
      setError('Erreur réseau.')
    } finally {
      setLoading(false)
    }
  }, [answers, shuffledQuestions, lessonId, courseId, tabSwitches, loading, submitted])

  useEffect(() => {
    if (submitted) { if (timerRef.current) clearInterval(timerRef.current); return }
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current!)
          handleSubmitInternal()
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [submitted, handleSubmitInternal])

  // Auto-soumission si trop de changements d'onglet
  useEffect(() => {
    if (tabSwitches >= TAB_SWITCH_LIMIT && !submitted) {
      handleSubmitInternal(answers, tabSwitches)
    }
  }, [tabSwitches]) // eslint-disable-line react-hooks/exhaustive-deps

  const fmtTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
  const timerUrgent = timeLeft < 30 && !submitted

  const handleSelect = (questionIndex: number, optionIndex: number) => {
    if (submitted) return
    setAnswers(prev => ({ ...prev, [questionIndex]: optionIndex }))
  }

  const handleReset = () => {
    setAnswers({})
    setSubmitted(false)
    setScore(0)
    setPassed(false)
    setTabSwitches(0)
    setShowTabWarning(false)
    setTimeLeft(timeLimit)
    startedAt.current = Date.now()
  }

  const allAnswered = Object.keys(answers).length === shuffledQuestions.length

  return (
    <div className="space-y-6" onCopy={e => e.preventDefault()} onContextMenu={e => e.preventDefault()}>
      {/* Avertissement changement d'onglet */}
      {showTabWarning && !submitted && (
        <div className={cn(
          'rounded-xl p-4 flex items-start gap-3 border',
          tabSwitches >= TAB_SWITCH_LIMIT
            ? 'bg-red-900/40 border-red-600 text-red-300'
            : 'bg-yellow-900/30 border-yellow-600 text-yellow-300'
        )}>
          <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div>
            {tabSwitches >= TAB_SWITCH_LIMIT ? (
              <p className="font-semibold">Soumission automatique — Trop de changements d&apos;onglet détectés ({tabSwitches})</p>
            ) : (
              <>
                <p className="font-semibold">Attention — Changement d&apos;onglet détecté ({tabSwitches}/{TAB_SWITCH_LIMIT})</p>
                <p className="text-xs mt-0.5 opacity-80">Le quiz sera soumis automatiquement à {TAB_SWITCH_LIMIT} changements.</p>
              </>
            )}
          </div>
          <button onClick={() => setShowTabWarning(false)} className="ml-auto text-xs opacity-60 hover:opacity-100">✕</button>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h3 className="text-white font-bold text-lg">Quiz — {shuffledQuestions.length} question{shuffledQuestions.length > 1 ? 's' : ''}</h3>
          <p className="text-gray-400 text-sm">Score minimum pour valider : <span className="text-[#FFA500] font-semibold">{passingScore}%</span></p>
        </div>
        <div className="flex items-center gap-3">
          {!submitted && (
            <div className={cn(
              'flex items-center gap-2 text-sm font-bold px-3 py-2 rounded-xl transition-colors',
              timerUrgent ? 'bg-red-900/40 text-red-400 animate-pulse' : 'bg-gray-800 text-gray-300'
            )}>
              <Clock className="w-4 h-4" />
              {fmtTime(timeLeft)}
            </div>
          )}
          {bestPreviousScore != null && !submitted && (
            <div className="flex items-center gap-2 text-sm text-gray-400 bg-gray-800 rounded-xl px-3 py-2">
              <Trophy className="w-4 h-4 text-[#FFA500]" />
              Meilleur : <span className={cn('font-bold', bestPreviousScore >= passingScore ? 'text-green-400' : 'text-red-400')}>{bestPreviousScore}%</span>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-900/30 border border-red-700 rounded-xl text-red-300 text-sm">{error}</div>
      )}

      {submitted && passed && (
        <div className="rounded-2xl overflow-hidden">
          <div className="bg-gradient-to-r from-green-900/50 to-emerald-900/50 border border-green-600 p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-400" />
              </div>
              <div>
                <div className="text-green-400 font-bold text-lg">Quiz réussi ! {score}%</div>
              </div>
            </div>
            {isLastModuleQuiz && (
              <div className="mt-3 flex items-center gap-2 text-sm text-emerald-300 bg-emerald-900/30 rounded-lg px-3 py-2 border border-emerald-700/50">
                <Unlock className="w-4 h-4" />
                <span className="font-semibold">Module suivant débloqué !</span>
              </div>
            )}
          </div>
          {nextLesson && (
            <Link
              href={`/apprendre/${courseId}/${nextLesson.id}`}
              className="flex items-center justify-between px-5 py-4 bg-[#0B3D91]/30 border-x border-b border-[#0B3D91]/50 hover:bg-[#0B3D91]/50 transition-colors group"
            >
              <div>
                <p className="text-xs text-gray-400">Leçon suivante</p>
                <p className="text-white font-semibold">{nextLesson.title}</p>
              </div>
              <ArrowRight className="w-5 h-5 text-[#FFA500] group-hover:translate-x-1 transition-transform" />
            </Link>
          )}
        </div>
      )}

      {submitted && !passed && (
        <div className="rounded-2xl p-5 bg-red-900/30 border border-red-700 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-red-400 font-bold text-lg">
              <XCircle className="w-6 h-6" /> {score}% — Score minimum requis : {passingScore}%
            </div>
          </div>
          <button onClick={handleReset} className="flex items-center gap-2 text-sm text-gray-300 hover:text-white border border-gray-600 px-4 py-2 rounded-lg transition-colors">
            <RotateCcw className="w-4 h-4" /> Réessayer
          </button>
        </div>
      )}

      {shuffledQuestions.map((q, qi) => {
        const userAnswer = answers[qi]
        const opts = q.type === 'true_false' ? ['Vrai', 'Faux'] : (q.options ?? [])
        return (
          <div key={q.id} className="bg-gray-800 rounded-2xl p-5 select-none">
            <p className="text-white font-semibold mb-4">
              <span className="text-gray-500 mr-2">Q{qi + 1}.</span>
              {q.question}
              {q.type === 'true_false' && <span className="ml-2 text-[10px] text-gray-500 font-normal border border-gray-600 rounded px-1.5 py-0.5">Vrai / Faux</span>}
            </p>
            <div className={cn('gap-2.5', q.type === 'true_false' ? 'flex' : 'space-y-2.5')}>
              {opts.map((option, oi) => {
                let style = 'border-gray-700 text-gray-300 hover:border-gray-500 hover:bg-gray-700'
                if (submitted) {
                  if (oi === q.correct_option) style = 'border-green-500 bg-green-900/30 text-green-300'
                  else if (oi === userAnswer && oi !== q.correct_option) style = 'border-red-500 bg-red-900/30 text-red-300'
                  else style = 'border-gray-700 text-gray-500'
                } else if (userAnswer === oi) {
                  style = 'border-[#0B3D91] bg-[#0B3D91]/20 text-white'
                }
                return (
                  <button key={oi} onClick={() => handleSelect(qi, oi)}
                    className={cn('text-left px-4 py-3 rounded-xl border-2 transition-all text-sm', q.type === 'true_false' ? 'flex-1' : 'w-full', style)}>
                    {q.type !== 'true_false' && <span className="font-mono text-xs mr-2 opacity-60">{String.fromCharCode(65 + oi)}.</span>}
                    {option}
                  </button>
                )
              })}
            </div>
            {submitted && q.explanation && (
              <div className="mt-3 p-3 bg-blue-900/20 border border-blue-700/50 rounded-lg text-sm text-blue-300">
                💡 {q.explanation}
              </div>
            )}
          </div>
        )
      })}

      {!submitted && (
        <button
          onClick={() => handleSubmitInternal()}
          disabled={!allAnswered || loading}
          className="w-full py-3.5 bg-[#FFA500] text-black font-bold rounded-xl hover:bg-orange-500 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {loading ? 'Envoi...' : allAnswered ? 'Soumettre mes réponses' : `Répondre à toutes les questions (${Object.keys(answers).length}/${shuffledQuestions.length})`}
        </button>
      )}
    </div>
  )
}
