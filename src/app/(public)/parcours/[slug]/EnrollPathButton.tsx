'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Target, Loader2, CheckCircle } from 'lucide-react'

export default function EnrollPathButton({ pathId, pathSlug }: { pathId: string; pathSlug: string }) {
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const router = useRouter()

  async function handleEnroll() {
    setLoading(true)
    const res = await fetch('/api/learning-paths/enroll', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path_id: pathId }),
    })
    setLoading(false)
    if (res.ok) {
      setDone(true)
      router.refresh()
    } else if (res.status === 401) {
      router.push('/connexion?redirect=/parcours/' + pathSlug)
    }
  }

  if (done) {
    return (
      <div className="flex items-center gap-2 text-green-600 font-semibold text-sm">
        <CheckCircle className="w-5 h-5" /> Parcours suivi ! Commencez dès maintenant.
      </div>
    )
  }

  return (
    <button
      onClick={handleEnroll}
      disabled={loading}
      className="flex items-center gap-2 border-2 border-[#0B3D91] text-[#0B3D91] font-semibold px-6 py-3 rounded-xl hover:bg-blue-50 transition-colors disabled:opacity-50 text-sm"
    >
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Target className="w-4 h-4" />}
      {loading ? 'Inscription...' : 'Suivre ce parcours'}
    </button>
  )
}
