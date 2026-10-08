'use client'

import { useState } from 'react'
import { CalendarClock, Check, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

/** Diffusion progressive d'un module : N jours après l'inscription et/ou à partir d'une date. */
export default function ModuleSchedule({ moduleId, days, from }: { moduleId: string; days: number | null; from: string | null }) {
  const [open, setOpen] = useState(false)
  const [d, setD] = useState(days ?? 0)
  const [f, setF] = useState(from ?? '')
  const [state, setState] = useState<'idle' | 'saving' | 'saved'>('idle')
  const active = (days ?? 0) > 0 || !!from

  async function save() {
    setState('saving')
    await createClient().from('modules').update({ unlock_after_days: d > 0 ? d : null, available_from: f || null }).eq('id', moduleId)
    setState('saved')
    setTimeout(() => { setState('idle'); setOpen(false) }, 900)
  }

  return (
    <div className="relative">
      <button type="button" onClick={() => setOpen(o => !o)} title="Diffusion progressive"
        className={`flex items-center gap-1 text-xs px-2 py-1 rounded-lg ${active ? 'bg-amber-100 text-amber-800' : 'text-gray-400 hover:bg-gray-100'}`}>
        <CalendarClock className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">{active ? ((days ?? 0) > 0 ? `J+${days}` : 'Daté') : 'Diffusion'}</span>
      </button>
      {open && (
        <div className="absolute right-0 top-8 z-20 w-72 bg-white rounded-2xl border border-gray-200 shadow-xl p-4 space-y-3 text-sm">
          <p className="font-semibold text-gray-900">Ouverture du module</p>
          <label className="block">
            <span className="text-xs text-gray-600">Jours après l&apos;inscription de l&apos;apprenant</span>
            <input type="number" min={0} max={365} value={d} onChange={e => setD(Math.max(0, Number(e.target.value) || 0))}
              className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2" />
          </label>
          <label className="block">
            <span className="text-xs text-gray-600">Et pas avant le (facultatif)</span>
            <input type="date" value={f} onChange={e => setF(e.target.value)} className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2" />
          </label>
          <p className="text-[11px] text-gray-400">0 jour et aucune date = module disponible immédiatement.</p>
          <button type="button" onClick={save} disabled={state === 'saving'}
            className="w-full flex items-center justify-center gap-2 bg-[#0B3D91] text-white font-semibold py-2 rounded-lg">
            {state === 'saving' ? <Loader2 className="w-4 h-4 animate-spin" /> : state === 'saved' ? <Check className="w-4 h-4" /> : null}
            {state === 'saved' ? 'Enregistré' : 'Enregistrer'}
          </button>
        </div>
      )}
    </div>
  )
}
