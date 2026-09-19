'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle, XCircle, Loader2 } from 'lucide-react'

export default function ApprovalActions({ courseId }: { courseId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState<'approve' | 'reject' | null>(null)
  const [note, setNote] = useState('')
  const [showRejectForm, setShowRejectForm] = useState(false)

  async function approve() {
    setLoading('approve')
    await fetch('/api/admin/approbation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ courseId, action: 'approve', note }),
    })
    router.refresh()
    setLoading(null)
  }

  async function reject() {
    if (!note.trim()) return
    setLoading('reject')
    await fetch('/api/admin/approbation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ courseId, action: 'reject', note }),
    })
    router.refresh()
    setLoading(null)
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        onClick={approve}
        disabled={!!loading}
        className="flex items-center gap-1.5 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-60"
      >
        {loading === 'approve' ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
        Approuver
      </button>

      {!showRejectForm ? (
        <button
          onClick={() => setShowRejectForm(true)}
          disabled={!!loading}
          className="flex items-center gap-1.5 border border-red-200 text-red-600 hover:bg-red-50 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          <XCircle className="w-4 h-4" /> Refuser
        </button>
      ) : (
        <div className="flex items-center gap-2 w-full mt-2">
          <input
            type="text"
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="Motif du refus..."
            className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
          />
          <button
            onClick={reject}
            disabled={!note.trim() || !!loading}
            className="flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-60"
          >
            {loading === 'reject' ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
            Confirmer
          </button>
          <button onClick={() => { setShowRejectForm(false); setNote('') }} className="text-sm text-gray-400 hover:text-gray-600 px-2">Annuler</button>
        </div>
      )}
    </div>
  )
}
