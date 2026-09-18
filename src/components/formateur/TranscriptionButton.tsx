'use client'

import { useState } from 'react'
import { FileText, Loader2, CheckCircle, AlertCircle } from 'lucide-react'

interface Props {
  lessonId: string
  status: 'none' | 'pending' | 'done' | 'error'
  hasTranscript: boolean
}

export default function TranscriptionButton({ lessonId, status: initialStatus, hasTranscript }: Props) {
  const [status, setStatus] = useState(initialStatus)
  const [loading, setLoading] = useState(false)

  const handleGenerate = async () => {
    setLoading(true)
    setStatus('pending')
    try {
      const res = await fetch('/api/transcriptions/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lessonId }),
      })
      const data = await res.json()
      setStatus(res.ok ? 'done' : 'error')
    } catch {
      setStatus('error')
    } finally {
      setLoading(false)
    }
  }

  if (status === 'done' || hasTranscript) {
    return (
      <div className="flex items-center gap-2 text-green-600 text-sm font-medium">
        <CheckCircle className="w-4 h-4" />
        Transcription générée
      </div>
    )
  }

  if (status === 'error') {
    return (
      <button onClick={handleGenerate} disabled={loading}
        className="flex items-center gap-2 text-red-600 text-sm hover:text-red-700 transition-colors">
        <AlertCircle className="w-4 h-4" />
        Erreur — Réessayer
      </button>
    )
  }

  return (
    <button
      onClick={handleGenerate}
      disabled={loading || status === 'pending'}
      className="flex items-center gap-2 px-3 py-1.5 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition-colors"
    >
      {loading || status === 'pending' ? (
        <><Loader2 className="w-4 h-4 animate-spin" /> Transcription en cours...</>
      ) : (
        <><FileText className="w-4 h-4" /> Générer sous-titres</>
      )}
    </button>
  )
}
