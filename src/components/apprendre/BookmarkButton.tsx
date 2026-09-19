'use client'

import { useState, useEffect } from 'react'
import { Bookmark } from 'lucide-react'

interface Props {
  lessonId: string
  courseId: string
}

export default function BookmarkButton({ lessonId, courseId }: Props) {
  const [bookmarked, setBookmarked] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setBookmarked(false)
    setLoading(true)
    fetch(`/api/bookmarks?course_id=${courseId}`)
      .then(r => r.json())
      .then((data: any[]) => {
        setBookmarked(data.some(b => b.lesson_id === lessonId))
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [lessonId, courseId])

  const toggle = async () => {
    setLoading(true)
    const res = await fetch('/api/bookmarks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lesson_id: lessonId, course_id: courseId }),
    })
    if (res.ok) {
      const data = await res.json()
      setBookmarked(data.action === 'added')
    }
    setLoading(false)
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      title={bookmarked ? 'Retirer le marque-page' : 'Ajouter un marque-page'}
      className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border transition-all disabled:opacity-50 ${
        bookmarked
          ? 'bg-[#0B3D91] border-[#0B3D91] text-white'
          : 'border-gray-200 text-gray-500 hover:border-[#0B3D91] hover:text-[#0B3D91]'
      }`}
    >
      <Bookmark className={`w-3.5 h-3.5 ${bookmarked ? 'fill-current' : ''}`} />
      {bookmarked ? 'Marqué' : 'Marque-page'}
    </button>
  )
}
