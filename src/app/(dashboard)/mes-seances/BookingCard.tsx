'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Clock, Loader2, Video } from 'lucide-react'
import { BOOKING_STATUS, CANCEL_LIMIT_HOURS } from '@/lib/coaching'

export type BookingView = {
  id: string
  status: string
  starts_at: string
  ends_at: string
  meeting_url: string | null
  price_xof: number
  learner_goal: string | null
  coach_notes: string | null
  role: 'coach' | 'learner'
  offer: { title: string; duration_min: number; format: string } | null
  coach: { full_name: string } | null
  learner: { full_name: string } | null
}

export default function BookingCard({ b }: { b: BookingView }) {
  const router = useRouter()
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [notes, setNotes] = useState(b.coach_notes ?? '')

  const start = new Date(b.starts_at)
  const minutesToStart = (start.getTime() - Date.now()) / 60000
  const isLive = b.status === 'confirmed' && minutesToStart <= 15 && Date.now() < new Date(b.ends_at).getTime()
  const canCancel = ['confirmed', 'pending_payment'].includes(b.status) && minutesToStart > 0 &&
    (b.role === 'coach' || minutesToStart >= CANCEL_LIMIT_HOURS * 60)
  const canComplete = b.role === 'coach' && b.status === 'confirmed' && minutesToStart <= 0
  const st = BOOKING_STATUS[b.status] ?? BOOKING_STATUS.confirmed
  const other = b.role === 'coach' ? b.learner?.full_name : b.coach?.full_name

  async function act(action: 'cancel' | 'complete' | 'notes') {
    if (action === 'cancel' && !confirm('Annuler cette séance ?')) return
    setBusy(action)
    setError('')
    const res = await fetch('/api/coaching/seance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bookingId: b.id, action, notes }),
    })
    const data = await res.json().catch(() => ({}))
    setBusy(null)
    if (!res.ok) { setError(data.error ?? 'Erreur'); return }
    router.refresh()
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-5">
      <div className="flex items-start gap-3.5">
        <div className="w-14 flex-shrink-0 text-center rounded-xl bg-[#0B3D91]/5 py-2">
          <p className="text-[11px] font-semibold uppercase text-[#0B3D91]">{start.toLocaleDateString('fr-FR', { month: 'short' })}</p>
          <p className="text-xl font-extrabold text-[#0B3D91] leading-tight">{start.getDate()}</p>
          <p className="text-[11px] text-gray-500">{start.toLocaleDateString('fr-FR', { weekday: 'short' })}</p>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${st.cls}`}>{st.label}</span>
            <span className="text-[11px] font-semibold text-gray-400 uppercase">{b.role === 'coach' ? 'Vous coachez' : 'Votre séance'}</span>
          </div>
          <p className="mt-1 font-bold text-gray-900 leading-snug">{b.offer?.title ?? 'Séance de coaching'}</p>
          <p className="text-sm text-gray-500 flex flex-wrap items-center gap-x-3 gap-y-0.5">
            <span className="inline-flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{start.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })} · {b.offer?.duration_min} min</span>
            {other && <span data-no-translate>avec {other}</span>}
          </p>
        </div>
      </div>

      {b.learner_goal && (
        <p className="mt-3 text-sm text-gray-600 bg-gray-50 rounded-xl px-3 py-2"><span className="font-semibold">Objectif : </span>{b.learner_goal}</p>
      )}

      {b.status === 'pending_payment' && (
        <p className="mt-3 text-sm text-amber-700">Paiement en cours de confirmation. Le créneau est réservé pendant 20 minutes.</p>
      )}

      {b.role === 'coach' && ['confirmed', 'completed'].includes(b.status) && (
        <details className="mt-3 rounded-xl border border-gray-100">
          <summary className="px-3 py-2.5 text-sm font-semibold text-gray-700 cursor-pointer">Vos notes de séance</summary>
          <div className="p-3 pt-0 space-y-2">
            <textarea rows={3} value={notes} onChange={e => setNotes(e.target.value)} className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm" />
            <button onClick={() => act('notes')} disabled={busy !== null} className="px-3 py-2 rounded-lg bg-gray-100 text-sm font-semibold text-gray-700">
              {busy === 'notes' ? 'Enregistrement…' : 'Enregistrer'}
            </button>
          </div>
        </details>
      )}

      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

      {(b.meeting_url || canCancel || canComplete) && b.status !== 'cancelled' && (
        <div className="mt-4 flex flex-wrap gap-2">
          {b.meeting_url && b.status === 'confirmed' && (
            <a href={b.meeting_url} target="_blank" rel="noopener noreferrer"
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold ${isLive ? 'bg-emerald-600 text-white animate-pulse' : 'ibig-gradient text-white'}`}>
              <Video className="w-4 h-4" /> {isLive ? 'Rejoindre maintenant' : 'Lien de la visio'}
            </a>
          )}
          {canComplete && (
            <button onClick={() => act('complete')} disabled={busy !== null} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700">
              {busy === 'complete' && <Loader2 className="w-4 h-4 animate-spin" />} Marquer comme réalisée
            </button>
          )}
          {canCancel && (
            <button onClick={() => act('cancel')} disabled={busy !== null} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-red-200 text-sm font-semibold text-red-600">
              {busy === 'cancel' && <Loader2 className="w-4 h-4 animate-spin" />} Annuler
            </button>
          )}
        </div>
      )}
    </div>
  )
}
