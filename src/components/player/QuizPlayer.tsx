'use client'

import { useState } from 'react'
import { CheckCircle, XCircle, RefreshCw, Trophy, ChevronRight } from 'lucide-react'

interface Question {
  q: string
  options: string[]
  correct: number
  explanation?: string
}

interface Props {
  lessonId: string
  courseId: string
  questions: Question[]
  onComplete?: () => void
}

export default function QuizPlayer({ questions, onComplete }: Props) {
  const [current, setCurrent] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)
  const [answers, setAnswers] = useState<boolean[]>([])
  const [confirmed, setConfirmed] = useState(false)
  const [done, setDone] = useState(false)

  if (!questions || questions.length === 0) {
    return <div className="p-8 text-center text-gray-400 text-sm">Aucune question disponible.</div>
  }

  const q = questions[current]
  const score = answers.filter(Boolean).length

  const confirm = () => {
    if (selected === null) return
    const correct = selected === q.correct
    setConfirmed(true)
    const newAnswers = [...answers, correct]
    if (current + 1 >= questions.length) {
      setTimeout(() => {
        setAnswers(newAnswers)
        setDone(true)
      }, 1000)
    } else {
      setAnswers(newAnswers)
    }
  }

  const next = () => {
    setSelected(null)
    setConfirmed(false)
    setCurrent(c => c + 1)
  }

  const reset = () => {
    setCurrent(0); setSelected(null); setConfirmed(false)
    setAnswers([]); setDone(false)
  }

  const pct = Math.round((score / questions.length) * 100)
  const passed = pct >= 70

  if (done) {
    return (
      <div className="p-8 text-center space-y-5">
        <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto text-4xl ${passed ? 'bg-green-100' : 'bg-red-100'}`}>
          {passed ? '🏆' : '📚'}
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{passed ? 'Félicitations !' : 'Continuez à apprendre !'}</h2>
          <p className="text-gray-500 mt-1 text-sm">
            {score}/{questions.length} bonnes réponses — {pct}%
          </p>
        </div>

        {/* Barre score */}
        <div className="max-w-xs mx-auto">
          <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ${passed ? 'bg-green-500' : 'bg-orange-400'}`}
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="text-xs text-gray-400 mt-1">{passed ? '✅ Quiz réussi (seuil 70%)' : '⚠️ Seuil de réussite : 70%'}</p>
        </div>

        {/* Récap */}
        <div className="grid grid-cols-5 gap-1.5 max-w-xs mx-auto">
          {answers.map((ok, i) => (
            <div key={i} className={`h-2 rounded-full ${ok ? 'bg-green-400' : 'bg-red-400'}`} />
          ))}
        </div>

        <div className="flex justify-center gap-3">
          <button onClick={reset} className="flex items-center gap-2 border border-gray-200 text-gray-700 text-sm font-medium px-4 py-2.5 rounded-xl hover:bg-gray-50">
            <RefreshCw className="w-4 h-4" /> Recommencer
          </button>
          {onComplete && passed && (
            <button onClick={onComplete} className="flex items-center gap-2 ibig-gradient text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:opacity-90">
              <Trophy className="w-4 h-4" /> Leçon suivante
            </button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-5 max-w-2xl mx-auto">
      {/* Progress */}
      <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
        <span>Question {current + 1} / {questions.length}</span>
        <span>{answers.filter(Boolean).length} correctes</span>
      </div>
      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className="h-full ibig-gradient rounded-full transition-all" style={{ width: `${((current) / questions.length) * 100}%` }} />
      </div>

      {/* Question */}
      <div className="bg-gray-50 rounded-2xl p-5">
        <p className="font-semibold text-gray-900 text-base leading-relaxed">{q.q}</p>
      </div>

      {/* Options */}
      <div className="space-y-2.5">
        {q.options.map((opt, i) => {
          let cls = 'border-gray-200 bg-white hover:border-[#0B3D91] hover:bg-blue-50/30 cursor-pointer'
          if (confirmed) {
            if (i === q.correct) cls = 'border-green-400 bg-green-50 cursor-default'
            else if (i === selected && selected !== q.correct) cls = 'border-red-400 bg-red-50 cursor-default'
            else cls = 'border-gray-100 bg-gray-50 text-gray-400 cursor-default'
          } else if (selected === i) {
            cls = 'border-[#0B3D91] bg-blue-50 cursor-pointer'
          }
          return (
            <button
              key={i}
              onClick={() => !confirmed && setSelected(i)}
              className={`w-full flex items-center gap-3 border-2 rounded-xl px-4 py-3.5 text-left transition-all ${cls}`}
            >
              <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 border ${
                confirmed && i === q.correct ? 'bg-green-500 text-white border-green-500'
                : confirmed && i === selected && selected !== q.correct ? 'bg-red-500 text-white border-red-500'
                : selected === i && !confirmed ? 'bg-[#0B3D91] text-white border-[#0B3D91]'
                : 'border-gray-200 text-gray-400'
              }`}>
                {String.fromCharCode(65 + i)}
              </span>
              <span className="text-sm font-medium">{opt}</span>
              {confirmed && i === q.correct && <CheckCircle className="w-4 h-4 text-green-500 ml-auto flex-shrink-0" />}
              {confirmed && i === selected && selected !== q.correct && <XCircle className="w-4 h-4 text-red-500 ml-auto flex-shrink-0" />}
            </button>
          )
        })}
      </div>

      {/* Explication */}
      {confirmed && q.explanation && (
        <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 text-sm text-blue-800">
          💡 {q.explanation}
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-end">
        {!confirmed ? (
          <button onClick={confirm} disabled={selected === null}
            className="flex items-center gap-2 ibig-gradient text-white font-semibold px-5 py-2.5 rounded-xl hover:opacity-90 disabled:opacity-40">
            Valider
          </button>
        ) : current + 1 < questions.length ? (
          <button onClick={next}
            className="flex items-center gap-2 ibig-gradient text-white font-semibold px-5 py-2.5 rounded-xl hover:opacity-90">
            Suivant <ChevronRight className="w-4 h-4" />
          </button>
        ) : null}
      </div>
    </div>
  )
}
