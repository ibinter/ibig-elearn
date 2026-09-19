'use client'

import { useState } from 'react'
import { CheckCircle, Circle, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface Props {
  lessonId: string
  courseId: string
  isCompleted: boolean
}

export default function MarkCompleteButton({ lessonId, courseId, isCompleted: initialCompleted }: Props) {
  const [completed, setCompleted] = useState(initialCompleted)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const markComplete = async () => {
    if (completed || loading) return
    setLoading(true)
    try {
      const res = await fetch('/api/progress/lesson', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lessonId, courseId }),
      })
      if (res.ok) {
        setCompleted(true)
        router.refresh()
      }
    } finally {
      setLoading(false)
    }
  }

  if (completed) {
    return (
      <span className="flex items-center gap-1.5 text-green-400 text-sm font-medium">
        <CheckCircle className="w-5 h-5" /> Terminé
      </span>
    )
  }

  return (
    <button
      onClick={markComplete}
      disabled={loading}
      className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 disabled:opacity-60 text-white rounded-xl text-sm font-semibold transition-colors"
    >
      {loading
        ? <Loader2 className="w-4 h-4 animate-spin" />
        : <Circle className="w-4 h-4" />}
      {loading ? 'Enregistrement…' : 'Marquer comme terminé'}
    </button>
  )
}
