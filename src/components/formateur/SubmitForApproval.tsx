'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Send, Clock, CheckCircle, XCircle, Loader2 } from 'lucide-react'

interface Props {
  courseId: string
  approvalStatus: string | null
  isPublished: boolean
}

export default function SubmitForApproval({ courseId, approvalStatus, isPublished }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function submit() {
    setLoading(true)
    await fetch('/api/formateur/soumettre', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ courseId }),
    })
    router.refresh()
    setLoading(false)
  }

  if (isPublished) {
    return (
      <span className="flex items-center gap-1.5 text-xs font-semibold text-green-700 bg-green-50 border border-green-200 px-3 py-1.5 rounded-lg">
        <CheckCircle className="w-3.5 h-3.5" /> Publiée
      </span>
    )
  }

  if (approvalStatus === 'pending') {
    return (
      <span className="flex items-center gap-1.5 text-xs font-semibold text-yellow-700 bg-yellow-50 border border-yellow-200 px-3 py-1.5 rounded-lg">
        <Clock className="w-3.5 h-3.5" /> En attente de validation
      </span>
    )
  }

  if (approvalStatus === 'rejected') {
    return (
      <button onClick={submit} disabled={loading}
        className="flex items-center gap-1.5 text-sm font-medium text-red-700 bg-red-50 border border-red-200 px-3 py-1.5 rounded-lg hover:bg-red-100 transition-colors">
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
        Refusée — Soumettre à nouveau
      </button>
    )
  }

  return (
    <button onClick={submit} disabled={loading}
      className="flex items-center gap-1.5 text-sm font-semibold bg-[#FFA500] hover:bg-yellow-500 text-black px-3 py-1.5 rounded-lg transition-colors disabled:opacity-60">
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
      Soumettre pour validation
    </button>
  )
}
