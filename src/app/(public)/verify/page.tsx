'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Shield, Search } from 'lucide-react'
import Link from 'next/link'

export default function VerifyPage() {
  const [code, setCode] = useState('')
  const router = useRouter()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = code.trim().toUpperCase()
    if (trimmed) router.push(`/verify/${trimmed}`)
  }

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md text-center">
        <div className="w-16 h-16 rounded-full ibig-gradient flex items-center justify-center mx-auto mb-5">
          <Shield className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Vérifier un certificat</h1>
        <p className="text-gray-500 text-sm mb-8">
          Entrez le code de vérification figurant sur un certificat IBIG E-LEARN pour confirmer son authenticité.
        </p>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <label className="block text-sm font-medium text-gray-700 text-left mb-2">
            Code de vérification
          </label>
          <input
            type="text"
            value={code}
            onChange={e => setCode(e.target.value)}
            placeholder="Ex: IBIG2026XXXXXXXXXXXXXXXX"
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0B3D91] text-sm font-mono mb-4 uppercase"
            required
          />
          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 ibig-gradient text-white font-semibold py-3 rounded-xl hover:opacity-90 transition-opacity"
          >
            <Search className="w-4 h-4" /> Vérifier le certificat
          </button>
        </form>

        <p className="text-xs text-gray-400 mt-4">
          Vous pouvez aussi accéder directement via :{' '}
          <code className="bg-gray-100 px-1.5 py-0.5 rounded text-gray-600">ibiglearn.com/verify/[code]</code>
        </p>

        <div className="mt-6">
          <Link href="/catalogue" className="text-sm text-[#0B3D91] hover:underline font-medium">
            Explorer les formations certifiantes →
          </Link>
        </div>
      </div>
    </div>
  )
}
