'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Save, Loader2 } from 'lucide-react'

const STATUSES = [
  { value: 'new',           label: 'Nouveau' },
  { value: 'contacted',     label: 'Contacté' },
  { value: 'proposal_sent', label: 'Devis envoyé' },
  { value: 'won',           label: 'Gagné ✓' },
  { value: 'lost',          label: 'Perdu' },
]

interface Props {
  requestId: string
  currentStatus: string
  currentNotes: string | null
}

export default function B2BStatusActions({ requestId, currentStatus, currentNotes }: Props) {
  const [status, setStatus] = useState(currentStatus)
  const [notes, setNotes] = useState(currentNotes ?? '')
  const [saving, setSaving] = useState(false)
  const router = useRouter()

  async function save() {
    setSaving(true)
    await fetch('/api/b2b/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: requestId, status, notes }),
    })
    setSaving(false)
    router.refresh()
  }

  return (
    <div className="flex flex-wrap items-end gap-3 pt-3 border-t border-gray-100">
      <div>
        <label className="block text-xs text-gray-500 mb-1">Statut</label>
        <select
          value={status}
          onChange={e => setStatus(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B3D91]/30 bg-white"
        >
          {STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
      </div>
      <div className="flex-1 min-w-48">
        <label className="block text-xs text-gray-500 mb-1">Notes internes</label>
        <input
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="Ajouter une note..."
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B3D91]/30"
        />
      </div>
      <button
        onClick={save}
        disabled={saving}
        className="flex items-center gap-1.5 ibig-gradient text-white text-sm font-semibold px-4 py-2 rounded-lg disabled:opacity-50 hover:opacity-90"
      >
        {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
        Sauvegarder
      </button>
    </div>
  )
}
