'use client'

import { useState, useTransition } from 'react'
import { Plus, Trash2, Save, CheckCircle, AlertCircle, ChevronDown, ChevronUp, Sparkles, Loader2, X } from 'lucide-react'

type QType = 'mcq' | 'true_false' | 'multi' | 'short'

interface Question {
  id?: string
  question: string
  type: QType
  options: string[]
  correct_option: number
  correct_options?: number[] | null
  accepted_answers?: string[] | null
  points?: number
  explanation: string
  position: number
}

export type QuizSettings = { timeLimitMin: number | null; maxAttempts: number | null; drawCount: number | null; showCorrections: boolean }

interface Props {
  lessonId: string
  courseId: string
  initialQuestions: Question[]
  initialPassingScore: number
  initialSettings?: QuizSettings
  isFinalExam?: boolean
  examDurationMinutes?: number
  examMaxAttempts?: number
}

const TYPES: { key: QType; label: string }[] = [
  { key: 'mcq', label: 'Choix unique' },
  { key: 'multi', label: 'Choix multiples' },
  { key: 'true_false', label: 'Vrai / Faux' },
  { key: 'short', label: 'Réponse courte' },
]
const LETTERS = 'ABCDEF'

function newQuestion(position: number): Question {
  return { question: '', type: 'mcq', options: ['', '', '', ''], correct_option: 0, correct_options: [], accepted_answers: [], points: 1, explanation: '', position }
}

const input = 'w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B3D91]/30 focus:border-[#0B3D91]'

export default function QuizEditor({ lessonId, initialQuestions, initialPassingScore, initialSettings, isFinalExam, examDurationMinutes, examMaxAttempts }: Props) {
  const [questions, setQuestions] = useState<Question[]>(
    initialQuestions.length ? initialQuestions.map(q => ({ ...q, explanation: q.explanation ?? '', points: q.points ?? 1, correct_options: q.correct_options ?? [], accepted_answers: q.accepted_answers ?? [] })) : [newQuestion(0)]
  )
  const [passingScore, setPassingScore] = useState(initialPassingScore)
  const [settings, setSettings] = useState<QuizSettings>(initialSettings ?? { timeLimitMin: null, maxAttempts: null, drawCount: null, showCorrections: true })
  const [duration, setDuration] = useState(examDurationMinutes ?? 60)
  const [maxAttempts, setMaxAttempts] = useState(examMaxAttempts ?? 3)
  const [expanded, setExpanded] = useState<number>(0)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()
  const [generating, setGenerating] = useState(false)
  const [genCount, setGenCount] = useState(5)

  async function generateWithSara() {
    setGenerating(true)
    setError('')
    try {
      const res = await fetch('/api/sara/generate-quiz', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ lessonId, count: genCount }) })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Erreur de génération'); return }
      const generated = (data.questions as Question[]).map((q, i) => ({ ...newQuestion(questions.length + i), ...q, position: questions.length + i }))
      setQuestions(prev => [...prev.filter(q => q.question.trim() !== ''), ...generated])
      setExpanded(questions.filter(q => q.question.trim() !== '').length)
    } catch { setError('Erreur réseau lors de la génération.') } finally { setGenerating(false) }
  }

  const update = (idx: number, patch: Partial<Question>) => setQuestions(q => q.map((item, i) => i === idx ? { ...item, ...patch } : item))

  function setType(idx: number, type: QType) {
    const cur = questions[idx]
    const keepOptions = (type === 'mcq' || type === 'multi') && (cur.type === 'mcq' || cur.type === 'multi')
    update(idx, {
      type,
      options: type === 'true_false' ? ['Vrai', 'Faux'] : type === 'short' ? [] : keepOptions ? cur.options : ['', '', '', ''],
      correct_option: 0, correct_options: [], accepted_answers: cur.accepted_answers ?? [],
    })
  }

  function move(idx: number, dir: -1 | 1) {
    const j = idx + dir
    if (j < 0 || j >= questions.length) return
    setQuestions(q => { const a = [...q]; [a[idx], a[j]] = [a[j], a[idx]]; return a.map((x, i) => ({ ...x, position: i })) })
    setExpanded(j)
  }

  function handleSave() {
    setError(''); setSaved(false)
    startTransition(async () => {
      try {
        const res = await fetch('/api/formateur/quiz', {
          method: 'PUT', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ lessonId, passingScore, questions, isFinalExam, examDurationMinutes: duration, examMaxAttempts: maxAttempts, ...settings }),
        })
        const d = await res.json().catch(() => ({}))
        if (!res.ok) { setError(d.error ?? 'Erreur de sauvegarde'); return }
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
      } catch { setError('Erreur réseau.') }
    })
  }

  const totalPoints = questions.reduce((s, q) => s + (q.points ?? 1), 0)
  const drawn = settings.drawCount && settings.drawCount < questions.length ? settings.drawCount : questions.length

  return (
    <div className="space-y-5">
      {/* ── Réglages ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Score minimum de réussite</label>
          <div className="flex items-center gap-4">
            <input type="range" min={10} max={100} step={5} value={passingScore} onChange={e => setPassingScore(Number(e.target.value))} className="flex-1 accent-[#0B3D91]" />
            <span className="w-16 text-center font-bold text-[#0B3D91] text-lg">{passingScore}%</span>
          </div>
        </div>

        {isFinalExam ? (
          <div className="border-t border-gray-100 pt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Durée (minutes)</label>
              <div className="flex items-center gap-3">
                <input type="range" min={15} max={180} step={15} value={duration} onChange={e => setDuration(Number(e.target.value))} className="flex-1 accent-[#FFA500]" />
                <span className="w-16 text-center font-bold text-[#FFA500]">{duration} min</span>
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Tentatives max</label>
              <div className="flex items-center gap-3">
                <input type="range" min={1} max={5} step={1} value={maxAttempts} onChange={e => setMaxAttempts(Number(e.target.value))} className="flex-1 accent-[#FFA500]" />
                <span className="w-10 text-center font-bold text-[#FFA500]">{maxAttempts}</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="border-t border-gray-100 pt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <label className="text-sm">
              <span className="block font-semibold text-gray-700 mb-1">Chronomètre</span>
              <select className={input} value={settings.timeLimitMin ?? ''} onChange={e => setSettings(s => ({ ...s, timeLimitMin: e.target.value ? Number(e.target.value) : null }))}>
                <option value="">Sans limite de temps</option>
                {[5, 10, 15, 20, 30, 45, 60, 90].map(m => <option key={m} value={m}>{m} minutes</option>)}
              </select>
            </label>
            <label className="text-sm">
              <span className="block font-semibold text-gray-700 mb-1">Tentatives</span>
              <select className={input} value={settings.maxAttempts ?? ''} onChange={e => setSettings(s => ({ ...s, maxAttempts: e.target.value ? Number(e.target.value) : null }))}>
                <option value="">Illimitées</option>
                {[1, 2, 3, 5, 10].map(n => <option key={n} value={n}>{n} tentative{n > 1 ? 's' : ''}</option>)}
              </select>
            </label>
            <label className="text-sm">
              <span className="block font-semibold text-gray-700 mb-1">Tirage aléatoire</span>
              <select className={input} value={settings.drawCount ?? ''} onChange={e => setSettings(s => ({ ...s, drawCount: e.target.value ? Number(e.target.value) : null }))}>
                <option value="">Toutes les questions</option>
                {[5, 10, 15, 20, 25, 30, 40, 50].filter(n => n < questions.length).map(n => <option key={n} value={n}>{n} questions tirées au hasard</option>)}
              </select>
            </label>
            <label className="sm:col-span-3 flex items-center gap-2.5 text-sm text-gray-700">
              <input type="checkbox" checked={settings.showCorrections} onChange={e => setSettings(s => ({ ...s, showCorrections: e.target.checked }))} className="w-4 h-4 accent-[#0B3D91]" />
              Afficher la correction détaillée (bonnes réponses et explications) après chaque tentative
            </label>
          </div>
        )}
        <div className="bg-[#0B3D91]/5 rounded-xl px-4 py-2 text-xs text-[#0B3D91]">
          Banque : {questions.length} question{questions.length > 1 ? 's' : ''} ({totalPoints} points) · chaque tentative : {drawn} question{drawn > 1 ? 's' : ''}
          {!isFinalExam && settings.timeLimitMin ? ` · ${settings.timeLimitMin} min` : ''}{!isFinalExam && settings.maxAttempts ? ` · ${settings.maxAttempts} tentative(s)` : ''}
        </div>
      </div>

      {/* ── Questions ── */}
      {questions.map((q, idx) => (
        <div key={idx} className={`bg-white rounded-2xl border shadow-sm overflow-hidden ${expanded === idx ? 'border-[#0B3D91]/30' : 'border-gray-100'}`}>
          <div className="w-full flex items-center gap-3 px-5 py-4">
            <button type="button" onClick={() => setExpanded(expanded === idx ? -1 : idx)} className="flex-1 min-w-0 flex items-center gap-3 text-left">
              <span className="w-7 h-7 rounded-full bg-[#0B3D91]/10 text-[#0B3D91] text-xs font-bold flex items-center justify-center flex-shrink-0">{idx + 1}</span>
              <span className="flex-1 text-sm font-medium text-gray-700 truncate">{q.question || <span className="text-gray-400 italic">Nouvelle question</span>}</span>
              <span className="text-[10px] font-semibold text-gray-400 uppercase hidden sm:inline">{TYPES.find(t => t.key === q.type)?.label}</span>
            </button>
            <div className="flex items-center gap-1 flex-shrink-0">
              <button type="button" onClick={() => move(idx, -1)} disabled={idx === 0} className="p-1 rounded hover:bg-gray-100 text-gray-400 disabled:opacity-30" aria-label="Monter"><ChevronUp className="w-3.5 h-3.5" /></button>
              <button type="button" onClick={() => move(idx, 1)} disabled={idx === questions.length - 1} className="p-1 rounded hover:bg-gray-100 text-gray-400 disabled:opacity-30" aria-label="Descendre"><ChevronDown className="w-3.5 h-3.5" /></button>
              <button type="button" onClick={() => { setQuestions(list => list.filter((_, i) => i !== idx).map((x, i) => ({ ...x, position: i }))); setExpanded(-1) }}
                className="p-1 rounded hover:bg-red-50 text-gray-400 hover:text-red-500 ml-1" aria-label="Supprimer"><Trash2 className="w-3.5 h-3.5" /></button>
            </div>
          </div>

          {expanded === idx && (
            <div className="px-5 pb-5 border-t border-gray-50 space-y-4 pt-4">
              <div className="flex flex-wrap items-center gap-2">
                {TYPES.map(t => (
                  <button key={t.key} type="button" onClick={() => setType(idx, t.key)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${q.type === t.key ? 'bg-[#0B3D91] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>{t.label}</button>
                ))}
                <label className="ml-auto flex items-center gap-1.5 text-xs text-gray-600">
                  Points <input type="number" min={1} max={100} value={q.points ?? 1} onChange={e => update(idx, { points: Math.max(1, Number(e.target.value) || 1) })} className="w-16 border border-gray-200 rounded-lg px-2 py-1 text-sm" />
                </label>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Énoncé de la question *</label>
                <textarea value={q.question} onChange={e => update(idx, { question: e.target.value })} rows={2} placeholder="Entrez la question..." className={`${input} resize-none`} />
              </div>

              {q.type === 'short' ? (
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Réponses acceptées * (une par ligne)</label>
                  <textarea value={(q.accepted_answers ?? []).join('\n')} rows={3}
                    onChange={e => update(idx, { accepted_answers: e.target.value.split('\n') })}
                    placeholder={'SYSCOHADA\nSystème comptable OHADA'} className={`${input} resize-none`} />
                  <p className="text-xs text-gray-400 mt-1">La correction ignore les majuscules, les accents et la ponctuation.</p>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-2">
                    {q.type === 'multi' ? 'Options — cochez toutes les bonnes réponses *' : 'Options — cliquez sur la bonne réponse *'}
                  </label>
                  <div className="space-y-2">
                    {q.options.map((opt, oIdx) => {
                      const right = q.type === 'multi' ? (q.correct_options ?? []).includes(oIdx) : q.correct_option === oIdx
                      return (
                        <div key={oIdx} className="flex items-center gap-2">
                          <button type="button"
                            onClick={() => q.type === 'multi'
                              ? update(idx, { correct_options: right ? (q.correct_options ?? []).filter(x => x !== oIdx) : [...(q.correct_options ?? []), oIdx] })
                              : update(idx, { correct_option: oIdx })}
                            className={`w-7 h-7 ${q.type === 'multi' ? 'rounded-md' : 'rounded-full'} border-2 flex items-center justify-center flex-shrink-0 text-xs font-bold ${right ? 'border-green-500 bg-green-500 text-white' : 'border-gray-300 text-gray-500 hover:border-green-400'}`}>
                            {right && q.type === 'multi' ? '✓' : LETTERS[oIdx]}
                          </button>
                          <input type="text" value={opt} disabled={q.type === 'true_false'}
                            onChange={e => update(idx, { options: q.options.map((o, i) => i === oIdx ? e.target.value : o) })}
                            placeholder={`Option ${LETTERS[oIdx]}`}
                            className={`flex-1 border rounded-xl px-3 py-2 text-sm focus:outline-none ${right ? 'border-green-400 bg-green-50' : 'border-gray-200 focus:border-[#0B3D91]'}`} />
                          {q.type !== 'true_false' && q.options.length > 2 && (
                            <button type="button" aria-label="Retirer l'option" className="p-1 text-gray-300 hover:text-red-500"
                              onClick={() => update(idx, {
                                options: q.options.filter((_, i) => i !== oIdx),
                                correct_option: q.correct_option === oIdx ? 0 : q.correct_option > oIdx ? q.correct_option - 1 : q.correct_option,
                                correct_options: (q.correct_options ?? []).filter(x => x !== oIdx).map(x => (x > oIdx ? x - 1 : x)),
                              })}><X className="w-4 h-4" /></button>
                          )}
                        </div>
                      )
                    })}
                  </div>
                  {q.type !== 'true_false' && q.options.length < 6 && (
                    <button type="button" onClick={() => update(idx, { options: [...q.options, ''] })} className="mt-2 text-xs font-semibold text-[#0B3D91] flex items-center gap-1"><Plus className="w-3.5 h-3.5" /> Ajouter une option</button>
                  )}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Explication (affichée avec la correction)</label>
                <textarea value={q.explanation} onChange={e => update(idx, { explanation: e.target.value })} rows={2} placeholder="Expliquez pourquoi cette réponse est correcte..." className={`${input} resize-none`} />
              </div>
            </div>
          )}
        </div>
      ))}

      <button type="button" onClick={() => { setQuestions(q => [...q, newQuestion(q.length)]); setExpanded(questions.length) }}
        className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-gray-200 hover:border-[#0B3D91] text-gray-400 hover:text-[#0B3D91] rounded-2xl py-4 text-sm font-medium">
        <Plus className="w-4 h-4" /> Ajouter une question à la banque
      </button>

      {/* ── SARA ── */}
      <div className="bg-gradient-to-r from-[#0B3D91]/5 to-[#FFA500]/5 border border-[#0B3D91]/15 rounded-2xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-4 h-4 text-[#0B3D91]" />
          <h3 className="text-sm font-bold text-gray-800">Générer avec SARA</h3>
          <span className="text-xs bg-[#FFA500]/20 text-[#FFA500] px-2 py-0.5 rounded-full font-semibold">IA</span>
        </div>
        <p className="text-xs text-gray-500 mb-3">SARA analyse le contenu de la leçon et propose des questions. Vous pourrez les modifier ensuite.</p>
        <div className="flex items-center gap-3">
          <select value={genCount} onChange={e => setGenCount(Number(e.target.value))} className="border border-gray-200 rounded-lg px-2 py-1.5 text-xs">
            {[3, 5, 8, 10].map(n => <option key={n} value={n}>{n} questions</option>)}
          </select>
          <button type="button" onClick={generateWithSara} disabled={generating}
            className="flex items-center gap-1.5 bg-[#0B3D91] text-white text-xs font-semibold px-4 py-2 rounded-xl disabled:opacity-60">
            {generating ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Génération…</> : <><Sparkles className="w-3.5 h-3.5" /> Générer</>}
          </button>
        </div>
      </div>

      {error && <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl p-3"><AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}</div>}

      <div className="flex items-center justify-between pt-2">
        <p className="text-xs text-gray-400">{questions.length} question{questions.length > 1 ? 's' : ''} · {totalPoints} points</p>
        <button type="button" onClick={handleSave} disabled={isPending}
          className="flex items-center gap-2 ibig-gradient text-white font-semibold px-6 py-3 rounded-xl hover:opacity-90 disabled:opacity-60">
          {isPending ? <><Loader2 className="w-4 h-4 animate-spin" /> Sauvegarde…</> : saved ? <><CheckCircle className="w-4 h-4" /> Sauvegardé !</> : <><Save className="w-4 h-4" /> Sauvegarder le quiz</>}
        </button>
      </div>
    </div>
  )
}
