'use client'

import { useState } from 'react'
import { CheckCircle, Circle, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'

const CourseCompletionModal = dynamic(() => import('./CourseCompletionModal'), { ssr: false })

interface Props {
  lessonId: string
  courseId: string
  courseTitle: string
  isCompleted: boolean
}

export default function MarkCompleteButton({ lessonId, courseId, courseTitle, isCompleted: initialCompleted }: Props) {
  const [completed, setCompleted] = useState(initialCompleted)
  const [loading, setLoading] = useState(false)
  const [showCelebration, setShowCelebration] = useState(false)
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
        const data = await res.json()
        setCompleted(true)
        if (data.progressPercent >= 100) {
          setShowCelebration(true)
        } else {
          router.refresh()
        }
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {completed ? (
        <span className="flex items-center gap-1.5 text-green-400 text-sm font-medium">
          <CheckCircle className="w-5 h-5" /> Terminé
        </span>
      ) : (
        <button
          onClick={markComplete}
          disabled={loading}
          className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-2 bg-green-500 whitespace-nowrap hover:bg-green-600 disabled:opacity-60 text-white rounded-xl text-sm font-semibold transition-colors"
        >
          {loading
            ? <Loader2 className="w-4 h-4 animate-spin" />
            : <Circle className="w-4 h-4" />}
          <span className="hidden sm:inline">{loading ? 'Enregistrement…' : 'Marquer comme terminé'}</span>
          <span className="sm:hidden">Terminé ?</span>
        </button>
      )}

      {showCelebration && (
        <CourseCompletionModal
          courseTitle={courseTitle}
          courseId={courseId}
          onClose={() => { setShowCelebration(false); router.refresh() }}
        />
      )}
    </>
  )
}
