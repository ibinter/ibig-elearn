'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { CheckCircle, XCircle, RotateCcw } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Question {
  id: string
  question: string
  options: string[]
  correct_option: number
  explanation?: string
}

interface Props {
  questions: Question[]
  lessonId: string
  courseId: string
  userId: string
}

export default function QuizSection({ questions, lessonId, courseId, userId }: Props) {
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

    const passed = scorePercent >= 70
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
      {submitted && (
        <div className={cn('rounded-2xl p-5 flex items-center justify-between', score >= 70 ? 'bg-green-900/30 border border-green-700' : 'bg-red-900/30 border border-red-700')}>
          <div>
            {score >= 70 ? (
              <div className="flex items-center gap-2 text-green-400 font-bold text-lg">
                <CheckCircle className="w-6 h-6" /> Quiz réussi ! {score}%
              </div>
            ) : (
              <div className="flex items-center gap-2 text-red-400 font-bold text-lg">
                <XCircle className="w-6 h-6" /> {score}% — Score minimum requis : 70%
              </div>
            )}
            <p className="text-gray-400 text-sm mt-1">
              {questions.filter((q, i) => answers[i] === q.correct_option).length} / {questions.length} bonnes réponses
            </p>
          </div>
          {score < 70 && (
            <button onClick={handleReset} className="flex items-center gap-2 text-sm text-gray-300 hover:text-white border border-gray-600 px-4 py-2 rounded-lg transition-colors">
              <RotateCcw className="w-4 h-4" /> Réessayer
            </button>
          )}
        </div>
      )}

      {questions.map((q, qi) => {
        const userAnswer = answers[qi]
        const isCorrect = userAnswer === q.correct_option
        return (
          <div key={q.id} className="bg-gray-800 rounded-2xl p-5">
            <p className="text-white font-semibold mb-4">
              <span className="text-gray-500 mr-2">Q{qi + 1}.</span>
              {q.question}
            </p>
            <div className="space-y-2.5">
              {q.options.map((option, oi) => {
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
                    className={cn('w-full text-left px-4 py-3 rounded-xl border-2 transition-all text-sm', style)}>
                    <span className="font-mono text-xs mr-2 opacity-60">{String.fromCharCode(65 + oi)}.</span>
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
