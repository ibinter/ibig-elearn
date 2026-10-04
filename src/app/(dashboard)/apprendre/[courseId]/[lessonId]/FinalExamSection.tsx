'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Clock, AlertTriangle, Trophy, XCircle, CheckCircle, RefreshCw, Award, Lock } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

interface Question {
  id: string
  question: string
  type: string
  options: string[]
  position: number
}

interface PastAttempt {
  score: number
  passed: boolean
  submitted_at: string
  attempt_number: number
}

interface Props {
  lessonId: string
  courseId: string
  questions: Question[]
  durationMinutes: number
  passingScore: number
  maxAttempts: number
  attemptsLeft: number
  isAvailable: boolean
  pastAttempts: PastAttempt[]
  courseSlug: string
}

type Phase = 'intro' | 'running' | 'submitted'

export default function FinalExamSection({
  lessonId, courseId, questions, durationMinutes, passingScore,
  maxAttempts, attemptsLeft, isAvailable, pastAttempts, courseSlug,
}: Props) {
  const [phase, setPhase] = useState<Phase>('intro')
  const [answers, setAnswers] = useState<Record<string, number>>({})
  const [timeLeft, setTimeLeft] = useState(durationMinutes * 60)
  const [result, setResult] = useState<{
    score: number; passed: boolean; correct: number; total: number;
    attemptsRemaining: number; attemptNumber: number
  } | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const startedAt = useRef<number>(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const handleSubmit = useCallback(async (auto = false) => {
    if (loading) return
    setLoading(true)
    if (timerRef.current) clearInterval(timerRef.current)

    const timeUsed = Math.round((Date.now() - startedAt.current) / 1000)
    const payload = {
      lessonId,
      courseId,
      answers: Object.entries(answers).map(([question_id, selected_option]) => ({ question_id, selected_option })),
      timeUsedSeconds: timeUsed,
    }

    try {
      const res = await fetch('/api/exam/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Erreur lors de la soumission.'); setLoading(false); return }
      setResult(data)
      setPhase('submitted')
    } catch {
      setError('Erreur réseau.')
    } finally {
      setLoading(false)
    }
  }, [lessonId, courseId, answers, loading])

  // Démarrer le chrono quand phase = running
  useEffect(() => {
    if (phase !== 'running') return
    startedAt.current = Date.now()
    setTimeLeft(durationMinutes * 60)
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timerRef.current!)
          handleSubmit(true)
          return 0
        }
        return t - 1
      })
    }, 1000)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [phase, durationMinutes, handleSubmit])

  const fmtTime = (s: number) => {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
  }

  const answered = Object.keys(answers).length
  const pct = questions.length > 0 ? Math.round((answered / questions.length) * 100) : 0
  const isUrgent = timeLeft <= 300  // 5 min restantes

  // ---- PHASE INTRO ----
  if (phase === 'intro') {
    const bestScore = pastAttempts.length > 0 ? Math.max(...pastAttempts.map(a => a.score)) : null
    const alreadyPassed = pastAttempts.some(a => a.passed)

    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#FFA500] to-orange-600 flex items-center justify-center flex-shrink-0">
            <Trophy className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Examen Final</h2>
            <p className="text-gray-400 text-sm">Validez votre formation et obtenez votre certificat</p>
          </div>
        </div>

        {!isAvailable && (
          <div className="bg-yellow-900/20 border border-yellow-700/40 rounded-2xl p-5 flex items-start gap-3">
            <Lock className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-yellow-300 font-semibold text-sm">Terminez toutes les leçons d'abord</p>
              <p className="text-yellow-500/70 text-xs mt-1">L'examen final est disponible uniquement après avoir complété toutes les leçons de la formation.</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Questions', value: questions.length.toString(), icon: '📝' },
            { label: 'Durée', value: `${durationMinutes} min`, icon: '⏱️' },
            { label: 'Score requis', value: `${passingScore}%`, icon: '🎯' },
            { label: 'Tentatives', value: `${attemptsLeft} / ${maxAttempts}`, icon: '🔄' },
          ].map(s => (
            <div key={s.label} className="bg-gray-800/60 rounded-xl p-3 text-center">
              <p className="text-xl mb-1">{s.icon}</p>
              <p className="text-white font-bold text-lg">{s.value}</p>
              <p className="text-gray-500 text-xs">{s.label}</p>
            </div>
          ))}
        </div>

        {pastAttempts.length > 0 && (
          <div className="bg-gray-800/40 rounded-xl p-4">
            <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-3">Tentatives précédentes</p>
            <div className="space-y-2">
              {pastAttempts.map((a, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">Tentative {a.attempt_number}</span>
                  <span className={cn('font-bold', a.passed ? 'text-green-400' : 'text-red-400')}>
                    {a.score}% {a.passed ? '✅' : '❌'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {alreadyPassed && (
          <div className="bg-green-900/20 border border-green-700/40 rounded-2xl p-4 flex items-center gap-3">
            <Award className="w-6 h-6 text-green-400 flex-shrink-0" />
            <div>
              <p className="text-green-300 font-semibold text-sm">Félicitations ! Vous avez déjà réussi cet examen.</p>
              <Link href={`/mes-certificats`} className="text-green-400 text-xs hover:underline mt-0.5 block">Voir mon certificat →</Link>
            </div>
          </div>
        )}

        <div className="bg-gray-900/60 rounded-xl p-4 text-xs text-gray-400 space-y-1">
          <p>⚠️ <strong className="text-gray-300">Une fois commencé, le chronomètre ne peut pas être mis en pause.</strong></p>
          <p>📱 Assurez-vous d'être dans un endroit calme avec une bonne connexion internet.</p>
          <p>🔒 Ne fermez pas l'onglet — cela soumettra automatiquement vos réponses.</p>
        </div>

        {isAvailable && attemptsLeft > 0 && (
          <button
            onClick={() => { setAnswers({}); setPhase('running') }}
            className="w-full py-4 bg-gradient-to-r from-[#FFA500] to-orange-600 hover:from-orange-500 hover:to-orange-700 text-black font-bold text-base rounded-2xl transition-all shadow-lg"
          >
            {pastAttempts.length === 0 ? 'Commencer l\'examen' : 'Nouvelle tentative'} →
          </button>
        )}
        {attemptsLeft === 0 && !alreadyPassed && (
          <div className="text-center py-4 text-gray-500 text-sm">
            Nombre maximum de tentatives atteint. Contactez votre formateur.
          </div>
        )}
      </div>
    )
  }

  // ---- PHASE RUNNING ----
  if (phase === 'running') {
    return (
      <div className="space-y-4">
        {/* Barre de progression + chrono */}
        <div className={cn(
          'sticky top-0 z-10 rounded-2xl p-4 flex items-center justify-between gap-4 shadow-lg transition-colors',
          isUrgent ? 'bg-red-900/80 border border-red-700' : 'bg-gray-900/90 border border-gray-800'
        )}>
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="flex-1 bg-gray-700 rounded-full h-2 overflow-hidden">
              <div className="h-full bg-[#FFA500] rounded-full transition-all" style={{ width: `${pct}%` }} />
            </div>
            <span className="text-gray-400 text-xs whitespace-nowrap">{answered}/{questions.length}</span>
          </div>
          <div className={cn('flex items-center gap-2 font-mono font-bold text-lg', isUrgent ? 'text-red-400' : 'text-white')}>
            <Clock className={cn('w-5 h-5', isUrgent && 'animate-pulse')} />
            {fmtTime(timeLeft)}
          </div>
        </div>

        {isUrgent && (
          <div className="flex items-center gap-2 bg-red-900/30 border border-red-700/40 rounded-xl px-4 py-2 text-red-400 text-sm">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            Moins de 5 minutes restantes !
          </div>
        )}

        {/* Questions */}
        <div className="space-y-6">
          {questions.map((q, idx) => (
            <div key={q.id} className="bg-gray-800/50 rounded-2xl p-5">
              <p className="text-gray-400 text-xs font-semibold mb-2">Question {idx + 1}/{questions.length}</p>
              <p className="text-white font-medium mb-4 leading-relaxed">{q.question}</p>
              <div className="space-y-2">
                {q.options.map((opt, oi) => (
                  <button
                    key={oi}
                    onClick={() => setAnswers(prev => ({ ...prev, [q.id]: oi }))}
                    className={cn(
                      'w-full text-left px-4 py-3 rounded-xl border-2 text-sm transition-all',
                      answers[q.id] === oi
                        ? 'border-[#FFA500] bg-[#FFA500]/10 text-white font-semibold'
                        : 'border-gray-700 bg-gray-900/40 text-gray-300 hover:border-gray-500'
                    )}
                  >
                    <span className="inline-block w-6 h-6 rounded-full bg-gray-700 text-xs text-center leading-6 mr-3 flex-shrink-0">
                      {String.fromCharCode(65 + oi)}
                    </span>
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        {error && (
          <div className="bg-red-900/30 border border-red-700/40 text-red-400 text-sm rounded-xl p-3">{error}</div>
        )}

        <div className="sticky bottom-4 pt-2">
          <button
            onClick={() => handleSubmit(false)}
            disabled={loading}
            className="w-full py-4 bg-[#0B3D91] hover:bg-[#0a3480] text-white font-bold text-base rounded-2xl transition-colors disabled:opacity-60 shadow-xl"
          >
            {loading ? 'Soumission en cours…' : `Soumettre l'examen (${answered}/${questions.length} répondues)`}
          </button>
          {answered < questions.length && (
            <p className="text-center text-xs text-yellow-400 mt-2">
              {questions.length - answered} question{questions.length - answered > 1 ? 's' : ''} sans réponse — elles compteront comme incorrectes.
            </p>
          )}
        </div>
      </div>
    )
  }

  // ---- PHASE SUBMITTED ----
  if (phase === 'submitted' && result) {
    return (
      <div className="space-y-6">
        {result.passed ? (
          <div className="bg-gradient-to-br from-green-900/40 to-emerald-900/20 border border-green-700/40 rounded-2xl p-6 text-center">
            <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
              <Trophy className="w-10 h-10 text-green-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-1">Félicitations ! 🎉</h2>
            <p className="text-green-400 text-sm mb-4">Vous avez réussi l'examen final</p>
            <div className="inline-flex items-center gap-2 bg-green-900/40 rounded-xl px-6 py-3">
              <CheckCircle className="w-5 h-5 text-green-400" />
              <span className="text-white font-bold text-2xl">{result.score}%</span>
              <span className="text-green-400 text-sm">/ {result.total} bonnes réponses</span>
            </div>
            <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/mes-certificats"
                className="flex items-center justify-center gap-2 bg-[#FFA500] text-black font-bold px-6 py-3 rounded-xl hover:bg-orange-400 transition-colors"
              >
                <Award className="w-5 h-5" /> Voir mon certificat
              </Link>
              <Link
                href={`/formation/${courseSlug}`}
                className="flex items-center justify-center gap-2 bg-gray-800 text-white font-semibold px-6 py-3 rounded-xl hover:bg-gray-700 transition-colors"
              >
                Retour à la formation
              </Link>
            </div>
          </div>
        ) : (
          <div className="bg-red-900/20 border border-red-700/40 rounded-2xl p-6 text-center">
            <div className="w-20 h-20 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
              <XCircle className="w-10 h-10 text-red-400" />
            </div>
            <h2 className="text-xl font-bold text-white mb-1">Examen non validé</h2>
            <p className="text-red-400 text-sm mb-4">Score minimum requis : {passingScore}%</p>
            <div className="inline-flex items-center gap-2 bg-red-900/40 rounded-xl px-6 py-3 mb-4">
              <span className="text-white font-bold text-2xl">{result.score}%</span>
              <span className="text-red-400 text-sm">{result.correct}/{result.total} bonnes réponses</span>
            </div>
            <p className="text-gray-400 text-sm">
              {result.attemptsRemaining > 0
                ? `Il vous reste ${result.attemptsRemaining} tentative${result.attemptsRemaining > 1 ? 's' : ''}.`
                : 'Vous avez épuisé toutes vos tentatives. Contactez votre formateur.'}
            </p>
            {result.attemptsRemaining > 0 && (
              <button
                onClick={() => { setAnswers({}); setResult(null); setPhase('intro') }}
                className="mt-4 flex items-center gap-2 mx-auto bg-gray-800 hover:bg-gray-700 text-white font-semibold px-6 py-3 rounded-xl transition-colors"
              >
                <RefreshCw className="w-4 h-4" /> Réessayer
              </button>
            )}
          </div>
        )}
      </div>
    )
  }

  return null
}
