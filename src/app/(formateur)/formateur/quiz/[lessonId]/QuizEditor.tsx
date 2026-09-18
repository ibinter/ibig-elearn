'use client'

import { useState } from 'react'
import { Plus, Trash2, Save, ChevronDown, ChevronUp, ToggleLeft } from 'lucide-react'

interface Question {
  id?: string
  question: string
  type: 'mcq' | 'true_false'
  options: string[]
  correct_option: number
  explanation: string
  position: number
}

interface Props {
  lessonId: string
  courseId: string
  initialQuestions: Question[]
  initialPassingScore: number
}

export default function QuizEditor({ lessonId, courseId, initialQuestions, initialPassingScore }: Props) {
  const [questions, setQuestions] = useState<Question[]>(initialQuestions.length ? initialQuestions : [])
  const [passingScore, setPassingScore] = useState(initialPassingScore)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const addQuestion = (type: 'mcq' | 'true_false') => {
    setQuestions(prev => [...prev, {
      question: '',
      type,
      options: type === 'mcq' ? ['', '', '', ''] : ['Vrai', 'Faux'],
      correct_option: 0,
      explanation: '',
      position: prev.length,
    }])
  }

  const updateQuestion = (idx: number, updates: Partial<Question>) => {
    setQuestions(prev => prev.map((q, i) => i === idx ? { ...q, ...updates } : q))
  }

  const removeQuestion = (idx: number) => {
    setQuestions(prev => prev.filter((_, i) => i !== idx).map((q, i) => ({ ...q, position: i })))
  }

  const updateOption = (qIdx: number, oIdx: number, value: string) => {
    setQuestions(prev => prev.map((q, i) => {
      if (i !== qIdx) return q
      const options = [...q.options]
      options[oIdx] = value
      return { ...q, options }
    }))
  }

  const addOption = (qIdx: number) => {
    setQuestions(prev => prev.map((q, i) => i === qIdx ? { ...q, options: [...q.options, ''] } : q))
  }

  const removeOption = (qIdx: number, oIdx: number) => {
    setQuestions(prev => prev.map((q, i) => {
      if (i !== qIdx) return q
      const options = q.options.filter((_, j) => j !== oIdx)
      return { ...q, options, correct_option: Math.min(q.correct_option, options.length - 1) }
    }))
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/quiz/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lessonId, courseId, questions, passingScore }),
      })
      if (res.ok) {
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Config score */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-6">
        <div>
          <label className="text-sm font-semibold text-gray-700 block mb-1">Score minimum pour valider (%)</label>
          <input
            type="number" min={0} max={100} value={passingScore}
            onChange={e => setPassingScore(Number(e.target.value))}
            className="w-24 border border-gray-200 rounded-xl px-3 py-2 text-sm font-bold text-center"
          />
        </div>
        <div className="flex-1" />
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#0B3D91] text-white rounded-xl text-sm font-semibold hover:bg-[#0a3480] disabled:opacity-50 transition-colors"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Enregistrement...' : saved ? '✓ Enregistré !' : 'Enregistrer'}
        </button>
      </div>

      {/* Questions */}
      {questions.map((q, qi) => (
        <div key={qi} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center gap-3 px-5 py-3 bg-gray-50 border-b border-gray-100">
            <span className="text-xs font-bold text-gray-500 bg-gray-200 rounded-full w-6 h-6 flex items-center justify-center">{qi + 1}</span>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${q.type === 'true_false' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
              {q.type === 'true_false' ? 'Vrai / Faux' : 'QCM'}
            </span>
            <div className="flex-1" />
            <button onClick={() => removeQuestion(qi)} className="text-red-400 hover:text-red-600 p-1">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
          <div className="p-5 space-y-4">
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase mb-1.5 block">Question</label>
              <textarea
                value={q.question}
                onChange={e => updateQuestion(qi, { question: e.target.value })}
                placeholder="Saisissez votre question..."
                rows={2}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:border-[#0B3D91]"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase mb-2 block">
                Options — cliquez sur le cercle pour marquer la bonne réponse
              </label>
              <div className="space-y-2">
                {q.options.map((opt, oi) => (
                  <div key={oi} className="flex items-center gap-2">
                    <button
                      onClick={() => updateQuestion(qi, { correct_option: oi })}
                      className={`w-6 h-6 rounded-full border-2 flex-shrink-0 transition-colors ${q.correct_option === oi ? 'bg-green-500 border-green-500' : 'border-gray-300 hover:border-green-400'}`}
                    />
                    {q.type === 'mcq' ? (
                      <>
                        <input
                          value={opt}
                          onChange={e => updateOption(qi, oi, e.target.value)}
                          placeholder={`Option ${String.fromCharCode(65 + oi)}`}
                          className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#0B3D91]"
                        />
                        {q.options.length > 2 && (
                          <button onClick={() => removeOption(qi, oi)} className="text-gray-400 hover:text-red-500 p-1">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </>
                    ) : (
                      <span className="text-sm font-medium text-gray-700">{opt}</span>
                    )}
                  </div>
                ))}
              </div>
              {q.type === 'mcq' && q.options.length < 6 && (
                <button onClick={() => addOption(qi)} className="mt-2 text-xs text-[#0B3D91] hover:underline flex items-center gap-1">
                  <Plus className="w-3 h-3" /> Ajouter une option
                </button>
              )}
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase mb-1.5 block">Explication (optionnel)</label>
              <input
                value={q.explanation}
                onChange={e => updateQuestion(qi, { explanation: e.target.value })}
                placeholder="Explication affichée après soumission..."
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#0B3D91]"
              />
            </div>
          </div>
        </div>
      ))}

      {/* Add buttons */}
      <div className="flex gap-3">
        <button
          onClick={() => addQuestion('mcq')}
          className="flex items-center gap-2 px-4 py-2.5 border-2 border-dashed border-[#0B3D91]/30 text-[#0B3D91] rounded-xl text-sm font-medium hover:border-[#0B3D91] hover:bg-[#0B3D91]/5 transition-colors"
        >
          <Plus className="w-4 h-4" /> Ajouter QCM
        </button>
        <button
          onClick={() => addQuestion('true_false')}
          className="flex items-center gap-2 px-4 py-2.5 border-2 border-dashed border-purple-300 text-purple-700 rounded-xl text-sm font-medium hover:border-purple-500 hover:bg-purple-50 transition-colors"
        >
          <ToggleLeft className="w-4 h-4" /> Ajouter Vrai/Faux
        </button>
      </div>
    </div>
  )
}
