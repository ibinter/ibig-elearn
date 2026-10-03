'use client'

import { useState, useTransition } from 'react'
import { Plus, Trash2, GripVertical, Save, CheckCircle, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react'

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

function newQuestion(position: number): Question {
  return { question: '', type: 'mcq', options: ['', '', '', ''], correct_option: 0, explanation: '', position }
}

export default function QuizEditor({ lessonId, courseId, initialQuestions, initialPassingScore }: Props) {
  const [questions, setQuestions] = useState<Question[]>(
    initialQuestions.length ? initialQuestions : [newQuestion(0)]
  )
  const [passingScore, setPassingScore] = useState(initialPassingScore)
  const [expanded, setExpanded] = useState<number>(0)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()

  function addQuestion() {
    const next = newQuestion(questions.length)
    setQuestions(q => [...q, next])
    setExpanded(questions.length)
  }

  function removeQuestion(idx: number) {
    setQuestions(q => q.filter((_, i) => i !== idx).map((q, i) => ({ ...q, position: i })))
    setExpanded(prev => prev >= idx ? Math.max(0, prev - 1) : prev)
  }

  function updateQuestion(idx: number, patch: Partial<Question>) {
    setQuestions(q => q.map((item, i) => i === idx ? { ...item, ...patch } : item))
  }

  function updateOption(qIdx: number, oIdx: number, val: string) {
    setQuestions(q => q.map((item, i) => {
      if (i !== qIdx) return item
      const opts = [...item.options]
      opts[oIdx] = val
      return { ...item, options: opts }
    }))
  }

  function setType(idx: number, type: 'mcq' | 'true_false') {
    const opts = type === 'true_false' ? ['Vrai', 'Faux'] : ['', '', '', '']
    updateQuestion(idx, { type, options: opts, correct_option: 0 })
  }

  function moveUp(idx: number) {
    if (idx === 0) return
    setQuestions(q => {
      const arr = [...q]
      ;[arr[idx - 1], arr[idx]] = [arr[idx], arr[idx - 1]]
      return arr.map((q, i) => ({ ...q, position: i }))
    })
    setExpanded(idx - 1)
  }

  function moveDown(idx: number) {
    if (idx === questions.length - 1) return
    setQuestions(q => {
      const arr = [...q]
      ;[arr[idx], arr[idx + 1]] = [arr[idx + 1], arr[idx]]
      return arr.map((q, i) => ({ ...q, position: i }))
    })
    setExpanded(idx + 1)
  }

  async function handleSave() {
    setError('')
    setSaved(false)

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i]
      if (!q.question.trim()) { setError(`Question ${i + 1} : énoncé vide.`); setExpanded(i); return }
      if (q.options.some(o => !o.trim())) { setError(`Question ${i + 1} : toutes les options doivent être remplies.`); setExpanded(i); return }
    }

    startTransition(async () => {
      try {
        const res = await fetch('/api/formateur/quiz', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ lessonId, passingScore, questions }),
        })
        if (!res.ok) { const d = await res.json(); setError(d.error ?? 'Erreur de sauvegarde'); return }
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
      } catch { setError('Erreur réseau.') }
    })
  }

  const OPTION_LABELS = ['A', 'B', 'C', 'D']

  return (
    <div className="space-y-5">
      {/* Score de réussite */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <label className="block text-sm font-semibold text-gray-700 mb-2">Score minimum de réussite</label>
        <div className="flex items-center gap-4">
          <input
            type="range" min={10} max={100} step={5} value={passingScore}
            onChange={e => setPassingScore(Number(e.target.value))}
            className="flex-1 accent-[#0B3D91]"
          />
          <span className="w-16 text-center font-bold text-[#0B3D91] text-lg">{passingScore}%</span>
        </div>
        <p className="text-xs text-gray-400 mt-1">Les apprenants doivent obtenir au moins {passingScore}% pour valider ce quiz.</p>
      </div>

      {/* Questions */}
      {questions.map((q, idx) => (
        <div key={idx} className={`bg-white rounded-2xl border shadow-sm overflow-hidden transition-all ${expanded === idx ? 'border-[#0B3D91]/30' : 'border-gray-100'}`}>
          {/* Header question */}
          <button
            type="button"
            onClick={() => setExpanded(expanded === idx ? -1 : idx)}
            className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-gray-50 transition-colors"
          >
            <span className="w-7 h-7 rounded-full bg-[#0B3D91]/10 text-[#0B3D91] text-xs font-bold flex items-center justify-center flex-shrink-0">
              {idx + 1}
            </span>
            <span className="flex-1 text-sm font-medium text-gray-700 truncate">
              {q.question || <span className="text-gray-400 italic">Nouvelle question</span>}
            </span>
            <div className="flex items-center gap-1 flex-shrink-0">
              <button type="button" onClick={e => { e.stopPropagation(); moveUp(idx) }} disabled={idx === 0}
                className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 disabled:opacity-30 transition-colors">
                <ChevronUp className="w-3.5 h-3.5" />
              </button>
              <button type="button" onClick={e => { e.stopPropagation(); moveDown(idx) }} disabled={idx === questions.length - 1}
                className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 disabled:opacity-30 transition-colors">
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
              <button type="button" onClick={e => { e.stopPropagation(); removeQuestion(idx) }}
                className="p-1 rounded hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors ml-1">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
              {expanded === idx ? <ChevronUp className="w-4 h-4 text-gray-400 ml-1" /> : <ChevronDown className="w-4 h-4 text-gray-400 ml-1" />}
            </div>
          </button>

          {/* Corps question */}
          {expanded === idx && (
            <div className="px-5 pb-5 border-t border-gray-50 space-y-4 pt-4">
              {/* Type */}
              <div className="flex gap-2">
                <button type="button" onClick={() => setType(idx, 'mcq')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${q.type === 'mcq' ? 'bg-[#0B3D91] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                  Choix multiple
                </button>
                <button type="button" onClick={() => setType(idx, 'true_false')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${q.type === 'true_false' ? 'bg-[#0B3D91] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                  Vrai / Faux
                </button>
              </div>

              {/* Énoncé */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Énoncé de la question *</label>
                <textarea
                  value={q.question}
                  onChange={e => updateQuestion(idx, { question: e.target.value })}
                  rows={2}
                  placeholder="Entrez la question..."
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B3D91]/30 focus:border-[#0B3D91] resize-none"
                />
              </div>

              {/* Options */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-2">Options (cliquez sur la bonne réponse) *</label>
                <div className="space-y-2">
                  {q.options.map((opt, oIdx) => (
                    <div key={oIdx} className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => updateQuestion(idx, { correct_option: oIdx })}
                        className={`w-7 h-7 rounded-full border-2 flex items-center justify-center flex-shrink-0 text-xs font-bold transition-all ${
                          q.correct_option === oIdx
                            ? 'border-green-500 bg-green-500 text-white'
                            : 'border-gray-300 text-gray-500 hover:border-green-400'
                        }`}
                      >
                        {OPTION_LABELS[oIdx]}
                      </button>
                      <input
                        type="text"
                        value={opt}
                        onChange={e => updateOption(idx, oIdx, e.target.value)}
                        placeholder={`Option ${OPTION_LABELS[oIdx]}`}
                        className={`flex-1 border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 transition-all ${
                          q.correct_option === oIdx
                            ? 'border-green-400 bg-green-50 focus:ring-green-200'
                            : 'border-gray-200 focus:ring-[#0B3D91]/20 focus:border-[#0B3D91]'
                        }`}
                      />
                      {q.correct_option === oIdx && (
                        <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                      )}
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-400 mt-1.5">La lettre verte = bonne réponse</p>
              </div>

              {/* Explication */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Explication (affichée après réponse)</label>
                <textarea
                  value={q.explanation}
                  onChange={e => updateQuestion(idx, { explanation: e.target.value })}
                  rows={2}
                  placeholder="Expliquez pourquoi cette réponse est correcte..."
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B3D91]/30 focus:border-[#0B3D91] resize-none"
                />
              </div>
            </div>
          )}
        </div>
      ))}

      {/* Ajouter question */}
      <button
        type="button"
        onClick={addQuestion}
        className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-gray-200 hover:border-[#0B3D91] text-gray-400 hover:text-[#0B3D91] rounded-2xl py-4 text-sm font-medium transition-all"
      >
        <Plus className="w-4 h-4" /> Ajouter une question
      </button>

      {/* Erreur */}
      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl p-3">
          <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
        </div>
      )}

      {/* Bouton sauvegarder */}
      <div className="flex items-center justify-between pt-2">
        <p className="text-xs text-gray-400">{questions.length} question{questions.length > 1 ? 's' : ''}</p>
        <button
          type="button"
          onClick={handleSave}
          disabled={isPending}
          className="flex items-center gap-2 ibig-gradient text-white font-semibold px-6 py-3 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-60"
        >
          {isPending ? (
            <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Sauvegarde...</>
          ) : saved ? (
            <><CheckCircle className="w-4 h-4" /> Sauvegardé !</>
          ) : (
            <><Save className="w-4 h-4" /> Sauvegarder le quiz</>
          )}
        </button>
      </div>
    </div>
  )
}
