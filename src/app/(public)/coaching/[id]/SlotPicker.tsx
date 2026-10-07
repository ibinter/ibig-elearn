'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { CalendarX, Loader2 } from 'lucide-react'
import type { Slot } from '@/lib/coaching'

type Props = { offerId: string; isLoggedIn: boolean; isOwn: boolean; priceXof: number }

const dayKey = (iso: string) => new Date(iso).toLocaleDateString('fr-CA') // AAAA-MM-JJ local

export default function SlotPicker({ offerId, isLoggedIn, isOwn, priceXof }: Props) {
  const [slots, setSlots] = useState<Slot[] | null>(null)
  const [day, setDay] = useState<string | null>(null)
  const [selected, setSelected] = useState<string | null>(null)
  const [goal, setGoal] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch(`/api/coaching/creneaux?offer=${offerId}`, { cache: 'no-store' })
      .then(r => r.json()).then(d => {
        const s: Slot[] = d.slots ?? []
        setSlots(s)
        if (s.length) setDay(dayKey(s[0].start))
      }).catch(() => setSlots([]))
  }, [offerId])

  const days = useMemo(() => {
    const map = new Map<string, Slot[]>()
    for (const s of slots ?? []) { const k = dayKey(s.start); map.set(k, [...(map.get(k) ?? []), s]) }
    return [...map.entries()]
  }, [slots])

  const tz = typeof Intl !== 'undefined' ? Intl.DateTimeFormat().resolvedOptions().timeZone : ''

  async function book() {
    if (!selected) return
    setLoading(true)
    setError('')
    const res = await fetch('/api/coaching/reserver', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ offerId, start: selected, goal }),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      setLoading(false)
      setError(data.error ?? 'Réservation impossible.')
      if (res.status === 409) { setSelected(null); fetch(`/api/coaching/creneaux?offer=${offerId}`, { cache: 'no-store' }).then(r => r.json()).then(d => setSlots(d.slots ?? [])) }
      return
    }
    window.location.href = data.paymentUrl ?? data.redirect ?? '/mes-seances'
  }

  if (slots === null) return <div className="py-10 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-[#0B3D91]" /></div>

  if (!slots.length) {
    return (
      <div className="mt-5 text-center py-6">
        <CalendarX className="w-10 h-10 text-gray-300 mx-auto" />
        <p className="mt-2 text-gray-600 text-sm">Aucun créneau disponible pour le moment. Revenez bientôt.</p>
      </div>
    )
  }

  const daySlots = days.find(([k]) => k === day)?.[1] ?? []

  return (
    <div className="mt-5 space-y-5">
      <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-5 px-5 sm:mx-0 sm:px-0 pb-1" role="tablist" aria-label="Jours disponibles">
        {days.map(([k, list]) => {
          const d = new Date(list[0].start)
          const on = k === day
          return (
            <button key={k} role="tab" aria-selected={on} onClick={() => { setDay(k); setSelected(null) }}
              className={`flex-shrink-0 w-[68px] rounded-xl border-2 py-2.5 text-center transition-colors ${on ? 'border-[#0B3D91] bg-[#0B3D91] text-white' : 'border-gray-200 bg-white text-gray-700'}`}>
              <span className="block text-[11px] uppercase font-semibold opacity-80">{d.toLocaleDateString('fr-FR', { weekday: 'short' })}</span>
              <span className="block text-xl font-extrabold leading-tight">{d.getDate()}</span>
              <span className="block text-[11px] opacity-80">{d.toLocaleDateString('fr-FR', { month: 'short' })}</span>
            </button>
          )
        })}
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
        {daySlots.map(s => {
          const on = s.start === selected
          return (
            <button key={s.start} onClick={() => setSelected(s.start)} aria-pressed={on}
              className={`py-3 rounded-xl border text-[15px] font-semibold tabular-nums transition-colors ${on ? 'border-[#0B3D91] bg-[#0B3D91]/8 text-[#0B3D91] ring-2 ring-[#0B3D91]/30' : 'border-gray-200 bg-white text-gray-800 hover:border-gray-300'}`}>
              {new Date(s.start).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
            </button>
          )
        })}
      </div>
      <p className="text-xs text-gray-400">Horaires affichés dans votre fuseau ({tz}).</p>

      {selected && (
        <div className="space-y-3 pt-1">
          <label htmlFor="goal" className="block text-sm font-semibold text-gray-800">Votre objectif pour cette séance <span className="font-normal text-gray-400">(optionnel)</span></label>
          <textarea id="goal" rows={3} value={goal} onChange={e => setGoal(e.target.value)} placeholder="Ex : préparer un entretien, structurer mon business plan…"
            className="w-full rounded-xl border border-gray-200 px-3.5 py-3 text-[15px] focus:outline-none focus:ring-2 focus:ring-[#0B3D91]/30" />
        </div>
      )}

      {error && <p className="text-sm text-red-600" role="alert">{error}</p>}

      {isOwn ? (
        <p className="text-sm text-gray-500 text-center">C&apos;est votre propre offre : gérez-la depuis votre espace formateur.</p>
      ) : !isLoggedIn ? (
        <Link href={`/connexion?redirectTo=/coaching/${offerId}`} className="block text-center w-full py-3.5 rounded-xl ibig-gradient text-white font-bold">
          Se connecter pour réserver
        </Link>
      ) : (
        <button onClick={book} disabled={!selected || loading}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl ibig-gradient text-white font-bold disabled:opacity-50">
          {loading && <Loader2 className="w-5 h-5 animate-spin" />}
          {selected
            ? `${priceXof > 0 ? 'Réserver et payer' : 'Réserver'} — ${new Date(selected).toLocaleString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}`
            : 'Choisissez un créneau'}
        </button>
      )}
    </div>
  )
}
