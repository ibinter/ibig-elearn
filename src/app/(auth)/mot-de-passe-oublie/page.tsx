'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Loader2, Mail } from 'lucide-react'

export default function MotDePasseOubliePage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reinitialiser-mot-de-passe`,
    })
    setSent(true)
    setLoading(false)
  }

  if (sent) return (
    <div className="w-full max-w-md">
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 text-center">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Mail className="w-8 h-8 text-[#0B3D91]" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Email envoyé !</h2>
        <p className="text-gray-500 text-sm mb-6">Vérifiez votre boîte mail et cliquez sur le lien pour réinitialiser votre mot de passe.</p>
        <Link href="/connexion" className="text-[#0B3D91] font-semibold hover:underline text-sm">← Retour à la connexion</Link>
      </div>
    </div>
  )

  return (
    <div className="w-full max-w-md">
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Mot de passe oublié</h1>
        <p className="text-gray-500 text-sm mb-6">Entrez votre email, nous vous enverrons un lien de réinitialisation.</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="votre@email.com"
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0B3D91] text-sm" />
          <button type="submit" disabled={loading}
            className="w-full flex items-center justify-center gap-2 ibig-gradient text-white font-semibold py-3.5 rounded-xl hover:opacity-90 disabled:opacity-60">
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Mail className="w-5 h-5" />}
            {loading ? 'Envoi...' : 'Envoyer le lien'}
          </button>
        </form>
        <p className="text-center text-sm text-gray-500 mt-4">
          <Link href="/connexion" className="text-[#0B3D91] hover:underline">← Retour</Link>
        </p>
      </div>
    </div>
  )
}
