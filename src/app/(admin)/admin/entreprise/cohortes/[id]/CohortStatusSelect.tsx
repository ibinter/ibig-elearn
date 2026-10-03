'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const STATUS_OPTIONS = [
  { value: 'draft',     label: 'Brouillon' },
  { value: 'confirmed', label: 'Confirmé' },
  { value: 'active',    label: 'En cours' },
  { value: 'completed', label: 'Terminé' },
  { value: 'cancelled', label: 'Annulé' },
]

export default function CohortStatusSelect({ cohortId, currentStatus }: { cohortId: string; currentStatus: string }) {
  const [status, setStatus] = useState(currentStatus)
  const router = useRouter()

  async function handleChange(v: string) {
    setStatus(v)
    await fetch(`/api/b2b/cohorts/${cohortId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: v }),
    })
    router.refresh()
  }

  return (
    <select value={status} onChange={e => handleChange(e.target.value)}
      className="border border-gray-200 rounded-lg px-2 py-1 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#0B3D91]/30">
      {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  )
}
