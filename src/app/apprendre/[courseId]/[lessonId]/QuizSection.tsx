'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { CheckCircle, XCircle, RotateCcw, Trophy, Clock, ArrowRight, Unlock, AlertTriangle, Loader2, Play } from 'lucide-react'
import { cn } from '@/lib/utils'

type QType = 'mcq' | 'true_false' | 'multi' | 'short'
type Q = { id: string; question: string; type: QType; options: string[]; points: number }
type Answer = number | number[] | string
type Correction = { id: string; correct_option: number | null; correct_options: number[] | null; accepted_answers: string[] | null; explanation: string | null }
type Result = { score: number; passed: boolean; passingScore: number; points: number; maxPoints: number; late: boolean; results: { id: string; correct: boolean }[]; corrections: Correction[] | null }

interface Props {
  lessonId: string
  courseId: string
  questionCount: number
  passingScore?: number
  timeLimitMin?: number | null
  maxAttempts?: number | null
  attemptsUsed?: number
  bestPreviousScore?: number | null
  nextLesson?: { id: string; title: string } | null
  isLastModuleQuiz?: boolean
}

const TAB_SWITCH_LIMIT = 3
const TYPE_HINT: Record<QType, string> = { mcq: 'Une seule réponse', true_false: 'Vrai / Faux', multi: 'Plusieurs réponses possibles', short: 'Réponse à saisir' }

export default function QuizSection({ lessonId, courseId, questionCount, passingScore = 70, timeLimitMin, maxAttempts, attemptsUsed = 0, bestPreviousScore, nextLesson, isLastModuleQuiz }: Props) {
  const router = useRouter()
  const [attemptId, setAttemptId] = useState<string | null>(null)
  const [questions, setQuestions] = useState<Q[]>([])
  const [deadline, setDeadline] = useState<number | null>(null)
  const [attemptsLeft, setAttemptsLeft] = useState<number | null>(maxAttempts ? Math.max(0, maxAttempts - attemptsUsed) : null)
  const [answers, setAnswers] = useState<Record<string, Answer>>({})
  const [result, setResult] = useState<Result | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [now, setNow] = useState(Date.now())
  const [tabSwitches, setTabSwitches] = useState(0)
  const submitting = useRef(false)

  const start = async () => {
    setLoading(true); setError(''); setResult(null); setAnswers({}); setTabSwitches(0)
    try {
      const res = await fetch('/api/quiz/start', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ lessonId, courseId }) })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Erreur'); if (data.attemptsLeft === 0) setAttemptsLeft(0); return }
      setAttemptId(data.attemptId); setQuestions(data.questions)
      setDeadline(data.deadline ? new Date(data.deadline).getTime() : null)
      setAttemptsLeft(data.attemptsLeft)
    } catch { setError('Erreur réseau.') } finally { setLoading(false) }
  }

  const submit = useCallback(async () => {
    if (!attemptId || submitting.current) return
    submitting.current = true
    setLoading(true)
    try {
      const res = await fetch('/api/quiz/submit', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ attemptId, answers, tabSwitchCount: tabSwitches }) })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Erreur'); return }
      setResult(data)
      setAttemptId(null)
      if (data.passed) router.refresh()
    } catch { setError('Erreur réseau.') } finally { setLoading(false); submitting.current = false }
  }, [attemptId, answers, tabSwitches, router])

  // Chronomètre (échéance fixée par le serveur) et soumission automatique
  const running = !!attemptId && !result
  useEffect(() => {
    if (!running || !deadline) return
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [running, deadline])
  const timeLeft = deadline ? Math.max(0, Math.round((deadline - now) / 1000)) : null
  useEffect(() => { if (running && timeLeft === 0) void submit() }, [running, timeLeft, submit])

  // Anti-triche : changements d'onglet
  useEffect(() => {
    if (!running) return
    const onVis = () => { if (document.hidden) setTabSwitches(n => n + 1) }
    document.addEventListener('visibilitychange', onVis)
    return () => document.removeEventListener('visibilitychange', onVis)
  }, [running])
  useEffect(() => { if (running && tabSwitches >= TAB_SWITCH_LIMIT) void submit() }, [running, tabSwitches, submit])

  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
  const answered = (q: Q) => {
    const a = answers[q.id]
    return q.type === 'multi' ? Array.isArray(a) && a.length > 0 : q.type === 'short' ? typeof a === 'string' && a.trim() !== '' : typeof a === 'number'
  }
  const answeredCount = questions.filter(answered).length
  const corr = (id: string) => result?.corrections?.find(c => c.id === id)
  const ok = (id: string) => result?.results.find(r => r.id === id)?.correct

  // ── Écran d'accueil ──
  if (!attemptId && !result) {
    return (
      <div className="bg-gray-800 rounded-2xl p-6 text-center space-y-4">
        <h3 className="text-white font-bold text-lg">Quiz — {questionCount} question{questionCount > 1 ? 's' : ''}</h3>
        <div className="flex flex-wrap justify-center gap-2 text-sm">
          <span className="bg-gray-700 text-gray-200 px-3 py-1.5 rounded-lg">Réussite : <strong className="text-[#FFA500]">{passingScore} %</strong></span>
          {timeLimitMin && <span className="bg-gray-700 text-gray-200 px-3 py-1.5 rounded-lg flex items-center gap-1.5"><Clock className="w-4 h-4" /> {timeLimitMin} min</span>}
          {attemptsLeft != null && <span className="bg-gray-700 text-gray-200 px-3 py-1.5 rounded-lg">Tentatives restantes : <strong>{attemptsLeft}</strong></span>}
          {bestPreviousScore != null && <span className="bg-gray-700 text-gray-200 px-3 py-1.5 rounded-lg flex items-center gap-1.5"><Trophy className="w-4 h-4 text-[#FFA500]" /> Meilleur : {bestPreviousScore} %</span>}
        </div>
        {error && <p className="text-red-300 text-sm">{error}</p>}
        <button onClick={start} disabled={loading || attemptsLeft === 0}
          className="inline-flex items-center gap-2 bg-[#FFA500] text-black font-bold px-6 py-3 rounded-xl hover:bg-orange-500 disabled:opacity-40">
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5" />} {attemptsLeft === 0 ? 'Plus de tentative disponible' : 'Commencer le quiz'}
        </button>
        <p className="text-xs text-gray-500">Les questions sont tirées au hasard pour chaque tentative. Restez sur cet onglet pendant le quiz.</p>
      </div>
    )
  }

  return (
    <div className="space-y-5" onCopy={e => e.preventDefault()} onContextMenu={e => e.preventDefault()}>
      {running && tabSwitches > 0 && (
        <div className="rounded-xl p-3 flex items-center gap-2 border bg-yellow-900/30 border-yellow-600 text-yellow-300 text-sm">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" /> Changement d&apos;onglet détecté ({tabSwitches}/{TAB_SWITCH_LIMIT}) — soumission automatique à {TAB_SWITCH_LIMIT}.
        </div>
      )}

      <div className="flex items-center justify-between gap-3 flex-wrap">
        <p className="text-gray-300 text-sm">{running ? `${answeredCount}/${questions.length} réponses` : 'Correction'}</p>
        {running && timeLeft != null && (
          <span className={cn('flex items-center gap-2 text-sm font-bold px-3 py-2 rounded-xl', timeLeft < 60 ? 'bg-red-900/40 text-red-400 animate-pulse' : 'bg-gray-800 text-gray-300')}>
            <Clock className="w-4 h-4" /> {fmt(timeLeft)}
          </span>
        )}
      </div>

      {error && <div className="p-3 bg-red-900/30 border border-red-700 rounded-xl text-red-300 text-sm">{error}</div>}

      {result && (
        <div className={cn('rounded-2xl p-5 border', result.passed ? 'bg-green-900/40 border-green-600' : 'bg-red-900/30 border-red-700')}>
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className={cn('flex items-center gap-2 font-bold text-lg', result.passed ? 'text-green-400' : 'text-red-400')}>
              {result.passed ? <CheckCircle className="w-6 h-6" /> : <XCircle className="w-6 h-6" />}
              {result.score} % {result.passed ? '— Quiz réussi !' : `— minimum requis : ${result.passingScore} %`}
            </div>
            {!result.passed && attemptsLeft !== 0 && (
              <button onClick={start} className="flex items-center gap-2 text-sm text-gray-200 border border-gray-500 px-4 py-2 rounded-lg hover:text-white">
                <RotateCcw className="w-4 h-4" /> Nouvelle tentative{attemptsLeft != null ? ` (${attemptsLeft} restante${attemptsLeft > 1 ? 's' : ''})` : ''}
              </button>
            )}
          </div>
          <p className="mt-1 text-xs text-gray-400">{result.points} / {result.maxPoints} points{result.late ? ' · soumis après la fin du temps imparti' : ''}</p>
          {result.passed && isLastModuleQuiz && <p className="mt-3 flex items-center gap-2 text-sm text-emerald-300"><Unlock className="w-4 h-4" /> Module suivant débloqué !</p>}
          {result.passed && nextLesson && (
            <Link href={`/apprendre/${courseId}/${nextLesson.id}`} className="mt-3 flex items-center justify-between rounded-xl bg-[#0B3D91]/40 px-4 py-3 hover:bg-[#0B3D91]/60">
              <span><span className="block text-xs text-gray-400">Leçon suivante</span><span className="text-white font-semibold">{nextLesson.title}</span></span>
              <ArrowRight className="w-5 h-5 text-[#FFA500]" />
            </Link>
          )}
        </div>
      )}

      {questions.map((q, qi) => {
        const c = corr(q.id)
        const a = answers[q.id]
        const isOk = ok(q.id)
        return (
          <div key={q.id} className={cn('bg-gray-800 rounded-2xl p-5 select-none border-2', result ? (isOk ? 'border-green-700/60' : 'border-red-800/60') : 'border-transparent')}>
            <p className="text-white font-semibold mb-1">
              <span className="text-gray-500 mr-2">Q{qi + 1}.</span>{q.question}
            </p>
            <p className="text-[11px] text-gray-500 mb-3">{TYPE_HINT[q.type]}{q.points > 1 ? ` · ${q.points} points` : ''}</p>

            {q.type === 'short' ? (
              <>
                <input value={typeof a === 'string' ? a : ''} disabled={!!result}
                  onChange={e => setAnswers(p => ({ ...p, [q.id]: e.target.value }))}
                  className="w-full bg-gray-900 border-2 border-gray-700 focus:border-[#0B3D91] rounded-xl px-4 py-3 text-white text-sm outline-none" placeholder="Votre réponse…" />
                {c?.accepted_answers && !isOk && <p className="mt-2 text-sm text-green-300">Réponse attendue : {c.accepted_answers.join(' / ')}</p>}
              </>
            ) : (
              <div className={cn('gap-2.5', q.type === 'true_false' ? 'flex' : 'space-y-2.5')}>
                {q.options.map((option, oi) => {
                  const selected = q.type === 'multi' ? Array.isArray(a) && a.includes(oi) : a === oi
                  const right = c ? (q.type === 'multi' ? c.correct_options?.includes(oi) : c.correct_option === oi) : false
                  let style = 'border-gray-700 text-gray-300 hover:border-gray-500 hover:bg-gray-700'
                  if (result && c) style = right ? 'border-green-500 bg-green-900/30 text-green-300' : selected ? 'border-red-500 bg-red-900/30 text-red-300' : 'border-gray-700 text-gray-500'
                  else if (result) style = selected ? 'border-gray-500 text-gray-300' : 'border-gray-700 text-gray-500'
                  else if (selected) style = 'border-[#0B3D91] bg-[#0B3D91]/20 text-white'
                  return (
                    <button key={oi} disabled={!!result}
                      onClick={() => setAnswers(p => {
                        if (q.type !== 'multi') return { ...p, [q.id]: oi }
                        const cur = Array.isArray(p[q.id]) ? (p[q.id] as number[]) : []
                        return { ...p, [q.id]: cur.includes(oi) ? cur.filter(x => x !== oi) : [...cur, oi] }
                      })}
                      className={cn('text-left px-4 py-3 rounded-xl border-2 transition-all text-sm flex items-center gap-2', q.type === 'true_false' ? 'flex-1 justify-center' : 'w-full', style)}>
                      {q.type === 'multi' && <span className={cn('w-4 h-4 rounded border flex-shrink-0', selected ? 'bg-current' : '')} />}
                      {q.type === 'mcq' && <span className="font-mono text-xs opacity-60">{String.fromCharCode(65 + oi)}.</span>}
                      {option}
                    </button>
                  )
                })}
              </div>
            )}
            {c?.explanation && <div className="mt-3 p-3 bg-blue-900/20 border border-blue-700/50 rounded-lg text-sm text-blue-300">💡 {c.explanation}</div>}
          </div>
        )
      })}

      {running && (
        <button onClick={submit} disabled={loading || answeredCount === 0}
          className="w-full py-3.5 bg-[#FFA500] text-black font-bold rounded-xl hover:bg-orange-500 transition-colors disabled:opacity-40">
          {loading ? 'Correction…' : answeredCount < questions.length ? `Soumettre (${answeredCount}/${questions.length} réponses)` : 'Soumettre mes réponses'}
        </button>
      )}
    </div>
  )
}
