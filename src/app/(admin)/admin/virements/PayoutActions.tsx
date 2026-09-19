'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle, XCircle, Loader2 } from 'lucide-react'

export default function PayoutActions({ requestId }: { requestId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState<'paid' | 'rejected' | null>(null)
  const [showReject, setShowReject] = useState(false)
  const [note, setNote] = useState('')

  async function update(status: 'paid' | 'rejected') {
    setLoading(status)
    await fetch('/api/admin/virements', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requestId, status, note }),
    })
    router.refresh()
    setLoading(null)
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2">
        <button onClick={() => update('paid')} disabled={!!loading}
          className="flex items-center gap-1.5 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-60 transition-colors">
          {loading === 'paid' ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
          Marquer payé
        </button>
        {!showReject ? (
          <button onClick={() => setShowReject(true)} disabled={!!loading}
            className="flex items-center gap-1.5 border border-red-200 text-red-600 hover:bg-red-50 px-4 py-2 rounded-lg text-sm font-medium transition-colors">
            <XCircle className="w-4 h-4" /> Refuser
          </button>
        ) : (
          <div className="flex gap-2">
            <input type="text" value={note} onChange={e => setNote(e.target.value)} placeholder="Motif..."
              className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 w-40" />
            <button onClick={() => update('rejected')} disabled={!note.trim() || !!loading}
              className="bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-lg text-sm font-medium disabled:opacity-60 transition-colors">
              {loading === 'rejected' ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirmer'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
