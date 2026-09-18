'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { CheckCircle, XCircle, RotateCcw, Trophy, Clock } from 'lucide-react'
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
}

export default function QuizSection({ questions, lessonId, courseId, userId, passingScore = 70, bestPreviousScore }: Props) {
  const [answers, setAnswers] = useState<Record<number, number>>({})
  const [submitted, setSubmitted] = useState(false)
  const [score, setScore] = useState(0)
  const supabase = createClient()

  const handleSelect = (questionIndex: number, optionIndex: number) => {
    if (submitted) return
    setAnswers(prev => ({ ...prev, [questionIndex]: optionIndex }))
  }

  const handleSubmit = async () => {
    const correctCount = questions.filter((q, i) => answers[i] === q.correct_option).length
    const scorePercent = Math.round((correctCount / questions.length) * 100)
    setScore(scorePercent)
    setSubmitted(true)

    const passed = scorePercent >= passingScore
    await supabase.from('quiz_attempts').insert({
      user_id: userId,
      lesson_id: lessonId,
      answers: Object.values(answers),
      score: scorePercent,
      passed,
    })

    if (passed) {
      await supabase.from('lesson_progress').upsert({
        user_id: userId,
        lesson_id: lessonId,
        course_id: courseId,
        is_completed: true,
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id,lesson_id' })
    }
  }

  const handleReset = () => {
    setAnswers({})
    setSubmitted(false)
    setScore(0)
  }

  const allAnswered = Object.keys(answers).length === questions.length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-white font-bold text-lg">Quiz — {questions.length} question{questions.length > 1 ? 's' : ''}</h3>
          <p className="text-gray-400 text-sm">Score minimum pour valider : <span className="text-[#FFA500] font-semibold">{passingScore}%</span></p>
        </div>
        {bestPreviousScore != null && !submitted && (
          <div className="flex items-center gap-2 text-sm text-gray-400 bg-gray-800 rounded-xl px-3 py-2">
            <Trophy className="w-4 h-4 text-[#FFA500]" />
            Meilleur score : <span className={cn('font-bold', bestPreviousScore >= passingScore ? 'text-green-400' : 'text-red-400')}>{bestPreviousScore}%</span>
          </div>
        )}
      </div>

      {submitted && (
        <div className={cn('rounded-2xl p-5 flex items-center justify-between', score >= passingScore ? 'bg-green-900/30 border border-green-700' : 'bg-red-900/30 border border-red-700')}>
          <div>
            {score >= passingScore ? (
              <div className="flex items-center gap-2 text-green-400 font-bold text-lg">
                <CheckCircle className="w-6 h-6" /> Quiz réussi ! {score}%
              </div>
            ) : (
              <div className="flex items-center gap-2 text-red-400 font-bold text-lg">
                <XCircle className="w-6 h-6" /> {score}% — Score minimum requis : {passingScore}%
              </div>
            )}
            <p className="text-gray-400 text-sm mt-1">
              {questions.filter((q, i) => answers[i] === q.correct_option).length} / {questions.length} bonnes réponses
            </p>
          </div>
          {score < passingScore && (
            <button onClick={handleReset} className="flex items-center gap-2 text-sm text-gray-300 hover:text-white border border-gray-600 px-4 py-2 rounded-lg transition-colors">
              <RotateCcw className="w-4 h-4" /> Réessayer
            </button>
          )}
        </div>
      )}

      {questions.map((q, qi) => {
        const userAnswer = answers[qi]
        const isCorrect = userAnswer === q.correct_option
        const opts = q.type === 'true_false' ? ['Vrai', 'Faux'] : (q.options ?? [])
        return (
          <div key={q.id} className="bg-gray-800 rounded-2xl p-5">
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
                  else if (oi === userAnswer && !isCorrect) style = 'border-red-500 bg-red-900/30 text-red-300'
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
          onClick={handleSubmit}
          disabled={!allAnswered}
          className="w-full py-3.5 bg-[#FFA500] text-black font-bold rounded-xl hover:bg-orange-500 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {allAnswered ? 'Soumettre mes réponses' : `Répondre à toutes les questions (${Object.keys(answers).length}/${questions.length})`}
        </button>
      )}
    </div>
  )
}
