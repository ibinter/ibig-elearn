'use client'

import { useState } from 'react'
import { Loader2, CheckCircle } from 'lucide-react'

interface Props {
  points: number
  userPoints: number
}

export default function ClaimButton({ points, userPoints }: Props) {
  const [state, setState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [msg, setMsg] = useState('')
  const unlocked = userPoints >= points

  if (!unlocked) {
    return (
      <span className="text-xs text-gray-400 font-medium whitespace-nowrap">
        {(points - userPoints).toLocaleString('fr-FR')} pts manquants
      </span>
    )
  }

  const claim = async () => {
    setState('loading')
    setMsg('')
    try {
      const res = await fetch('/api/loyalty/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ points }),
      })
      const data = await res.json()
      if (!res.ok) {
        setMsg(data.error ?? 'Erreur')
        setState('error')
      } else {
        setMsg('Réclamé ! Notre équipe vous contacte sous 48h.')
        setState('success')
      }
    } catch {
      setMsg('Erreur réseau')
      setState('error')
    }
  }

  if (state === 'success') {
    return (
      <div className="flex flex-col items-end gap-0.5">
        <div className="flex items-center gap-1 text-green-600">
          <CheckCircle className="w-4 h-4" />
          <span className="text-xs font-semibold">Réclamé !</span>
        </div>
        <p className="text-[10px] text-gray-400 max-w-[160px] text-right leading-tight">{msg}</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        onClick={claim}
        disabled={state === 'loading'}
        className="px-4 py-1.5 bg-[#0B3D91] text-white text-xs font-semibold rounded-lg hover:bg-[#0a3480] disabled:opacity-60 transition-colors flex items-center gap-1.5"
      >
        {state === 'loading' && <Loader2 className="w-3 h-3 animate-spin" />}
        Réclamer
      </button>
      {state === 'error' && <p className="text-[10px] text-red-500 max-w-[140px] text-right">{msg}</p>}
    </div>
  )
}
