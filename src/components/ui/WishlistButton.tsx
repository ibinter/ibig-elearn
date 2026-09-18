'use client'

import { useState, useEffect } from 'react'
import { Heart } from 'lucide-react'

export default function WishlistButton({ courseId, className = '' }: { courseId: string; className?: string }) {
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/wishlist')
      .then(r => r.json())
      .then((ids: string[]) => { setSaved(ids.includes(courseId)); setLoading(false) })
      .catch(() => setLoading(false))
  }, [courseId])

  const toggle = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setLoading(true)
    const res = await fetch('/api/wishlist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ course_id: courseId }),
    })
    if (res.ok) {
      const data = await res.json()
      setSaved(data.action === 'added')
    }
    setLoading(false)
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      title={saved ? 'Retirer des favoris' : 'Ajouter aux favoris'}
      className={`flex items-center justify-center w-9 h-9 rounded-full transition-all disabled:opacity-50 ${
        saved ? 'bg-red-500 text-white shadow-md' : 'bg-white/90 text-gray-400 hover:text-red-500 hover:bg-white shadow'
      } ${className}`}
    >
      <Heart className={`w-4 h-4 ${saved ? 'fill-current' : ''}`} />
    </button>
  )
}
