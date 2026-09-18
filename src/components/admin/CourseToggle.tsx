'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'

interface Props {
  courseId: string
  field: 'is_published' | 'is_featured'
  value: boolean
  labels: [string, string] // [false label, true label]
  colors: [string, string] // [false class, true class]
}

export default function CourseToggle({ courseId, field, value, labels, colors }: Props) {
  const [current, setCurrent] = useState(value)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function toggle() {
    setLoading(true)
    const res = await fetch('/api/admin/courses/toggle', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ courseId, field, value: !current }),
    })
    setLoading(false)
    if (res.ok) { setCurrent(!current); router.refresh() }
  }

  return (
    <button onClick={toggle} disabled={loading}
      className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium transition-colors ${current ? colors[1] : colors[0]}`}>
      {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
      {current ? labels[1] : labels[0]}
    </button>
  )
}
