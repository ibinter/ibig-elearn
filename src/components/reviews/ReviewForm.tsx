'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, CheckCircle } from 'lucide-react'
import StarRating from './StarRating'

interface Props {
  courseId: string
  existingReview?: { rating: number; comment: string }
}

export default function ReviewForm({ courseId, existingReview }: Props) {
  const [rating, setRating] = useState(existingReview?.rating ?? 0)
  const [comment, setComment] = useState(existingReview?.comment ?? '')
  const [state, setState] = useState<'idle' | 'saving' | 'done' | 'error'>('idle')
  const router = useRouter()

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!rating) return
    setState('saving')
    const res = await fetch('/api/reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ courseId, rating, comment }),
    })
    if (res.ok) {
      setState('done')
      setTimeout(() => { setState('idle'); router.refresh() }, 2000)
    } else {
      setState('error')
      setTimeout(() => setState('idle'), 3000)
    }
  }

  if (state === 'done') return (
    <div className="flex items-center gap-2 text-green-600 font-medium text-sm">
      <CheckCircle className="w-5 h-5" /> Avis publié ! Merci pour votre retour.
    </div>
  )

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <p className="text-sm font-medium text-gray-700 mb-2">Votre note</p>
        <StarRating value={rating} onChange={setRating} size="lg" />
        {!rating && <p className="text-xs text-gray-400 mt-1">Cliquez pour noter</p>}
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Votre avis <span className="text-gray-400 font-normal">(optionnel)</span></label>
        <textarea
          value={comment}
          onChange={e => setComment(e.target.value)}
          rows={3}
          maxLength={1000}
          placeholder="Partagez votre expérience avec cette formation…"
          className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B3D91]/30 resize-none"
        />
      </div>
      {state === 'error' && <p className="text-sm text-red-500">Une erreur est survenue. Réessayez.</p>}
      <button
        type="submit"
        disabled={!rating || state === 'saving'}
        className="ibig-gradient text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:opacity-90 disabled:opacity-50 flex items-center gap-2"
      >
        {state === 'saving' && <Loader2 className="w-4 h-4 animate-spin" />}
        {existingReview ? 'Mettre à jour mon avis' : 'Publier mon avis'}
      </button>
    </form>
  )
}
