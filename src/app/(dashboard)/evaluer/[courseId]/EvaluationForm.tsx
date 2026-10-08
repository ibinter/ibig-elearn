'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Star, Loader2, CheckCircle2 } from 'lucide-react'

type Initial = { contentRating: number; instructorRating: number; applicability: number; recommendScore: number | null; comment: string }

function Stars({ value, onChange, label }: { value: number; onChange: (v: number) => void; label: string }) {
  return (
    <div>
      <p className="text-sm font-semibold text-gray-800">{label}</p>
      <div className="mt-2 flex gap-1.5" role="radiogroup" aria-label={label}>
        {[1, 2, 3, 4, 5].map(n => (
          <button key={n} type="button" role="radio" aria-checked={value === n} aria-label={`${n} sur 5`} onClick={() => onChange(n)}
            className="p-1 rounded-lg hover:bg-amber-50">
            <Star className={`w-8 h-8 ${n <= value ? 'text-[#FFA500] fill-[#FFA500]' : 'text-gray-300'}`} />
          </button>
        ))}
      </div>
    </div>
  )
}

export default function EvaluationForm({ courseId, initial }: { courseId: string; initial: Initial | null }) {
  const router = useRouter()
  const [f, setF] = useState<Initial>(initial ?? { contentRating: 0, instructorRating: 0, applicability: 0, recommendScore: null, comment: '' })
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')
  const complete = f.contentRating && f.instructorRating && f.applicability && f.recommendScore != null

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true); setError('')
    try {
      const res = await fetch('/api/evaluations', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ courseId, ...f }) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setDone(true)
      setTimeout(() => router.push('/mes-formations'), 1500)
    } catch (err) { setError((err as Error).message || 'Erreur') } finally { setBusy(false) }
  }

  if (done) {
    return (
      <div className="text-center py-10">
        <CheckCircle2 className="w-14 h-14 text-emerald-500 mx-auto" />
        <p className="mt-3 text-lg font-bold text-gray-900">Merci pour votre évaluation !</p>
        <p className="text-sm text-gray-500">Elle aide les formateurs à améliorer leurs contenus. +15 XP</p>
      </div>
    )
  }

  return (
    <form onSubmit={submit} className="space-y-6">
      <Stars label="Qualité du contenu" value={f.contentRating} onChange={v => setF(p => ({ ...p, contentRating: v }))} />
      <Stars label="Clarté du formateur" value={f.instructorRating} onChange={v => setF(p => ({ ...p, instructorRating: v }))} />
      <Stars label="Utilité pour votre travail" value={f.applicability} onChange={v => setF(p => ({ ...p, applicability: v }))} />
      <div>
        <p className="text-sm font-semibold text-gray-800">Recommanderiez-vous cette formation à un collègue ?</p>
        <div className="mt-2 grid grid-cols-11 gap-1">
          {Array.from({ length: 11 }, (_, n) => (
            <button key={n} type="button" onClick={() => setF(p => ({ ...p, recommendScore: n }))}
              className={`h-10 rounded-lg text-sm font-bold border ${f.recommendScore === n ? 'bg-[#0B3D91] text-white border-[#0B3D91]' : 'border-gray-200 text-gray-600 hover:border-[#0B3D91]'}`}>{n}</button>
          ))}
        </div>
        <div className="mt-1 flex justify-between text-[11px] text-gray-400"><span>Pas du tout</span><span>Certainement</span></div>
      </div>
      <label className="block">
        <span className="text-sm font-semibold text-gray-800">Un commentaire pour le formateur ? (facultatif)</span>
        <textarea value={f.comment} onChange={e => setF(p => ({ ...p, comment: e.target.value }))} rows={3} maxLength={2000}
          className="mt-2 w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B3D91]/30" placeholder="Ce qui vous a été le plus utile, ce qui pourrait être amélioré…" />
      </label>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button disabled={!complete || busy} className="w-full flex items-center justify-center gap-2 bg-[#FFA500] text-black font-bold py-3.5 rounded-xl disabled:opacity-40">
        {busy && <Loader2 className="w-4 h-4 animate-spin" />} Envoyer mon évaluation
      </button>
    </form>
  )
}
