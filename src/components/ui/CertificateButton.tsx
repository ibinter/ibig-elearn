'use client'

import { useState } from 'react'
import { Award, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function CertificateButton({ courseId }: { courseId: string }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  async function handleClaim() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/certificates/issue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Erreur'); setLoading(false); return }
      router.push(`/mes-certificats/${data.certId}/imprimer`)
    } catch {
      setError('Erreur réseau')
      setLoading(false)
    }
  }

  return (
    <div className="text-center">
      <button onClick={handleClaim} disabled={loading}
        className="inline-flex items-center gap-2 bg-[#FFA500] hover:bg-orange-500 text-black font-bold px-6 py-3 rounded-xl transition-colors disabled:opacity-60">
        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Award className="w-5 h-5" />}
        {loading ? 'Génération...' : 'Obtenir mon certificat'}
      </button>
      {error && <p className="text-red-400 text-xs mt-2">{error}</p>}
    </div>
  )
}
