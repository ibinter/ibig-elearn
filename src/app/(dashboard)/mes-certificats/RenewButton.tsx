'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { RefreshCw, Loader2 } from 'lucide-react'

export default function RenewButton({ courseId }: { courseId: string }) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  async function renew() {
    if (!confirm('Lancer la recertification ? Votre progression repart de zéro ; le certificat actuel reste dans votre historique.')) return
    setBusy(true)
    try {
      const res = await fetch('/api/certificates/renouveler', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ courseId }) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      router.push(data.href)
    } catch (e) { alert((e as Error).message); setBusy(false) }
  }
  return (
    <button type="button" onClick={renew} disabled={busy}
      className="flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold bg-[#0B3D91] text-white py-2 rounded-lg hover:bg-blue-800 disabled:opacity-60">
      {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />} Recertification
    </button>
  )
}
