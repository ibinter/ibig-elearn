'use client'

import { useState } from 'react'
import { Loader2, ShieldCheck, Smartphone, CreditCard, ExternalLink } from 'lucide-react'

interface Props {
  courseId: string
  amount: number
  currency: string
  courseName: string
  userEmail: string
  userPhone: string
  userName: string
}

const CURRENCIES = [
  { value: 'XOF', label: 'Francs CFA (XOF)', flag: '🌍' },
  { value: 'EUR', label: 'Euro (EUR)', flag: '🇪🇺' },
  { value: 'USD', label: 'Dollar US (USD)', flag: '🇺🇸' },
]

export default function PaymentForm({ courseId, amount, currency: defaultCurrency, courseName, userEmail, userPhone, userName }: Props) {
  const [currency, setCurrency] = useState(defaultCurrency || 'XOF')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handlePay = async () => {
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/payment/cinetpay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId, currency }),
      })
      const data = await res.json()
      if (!res.ok || !data.paymentUrl) {
        setError(data.error ?? 'Une erreur est survenue. Veuillez réessayer.')
        return
      }
      window.location.href = data.paymentUrl
    } catch {
      setError('Erreur réseau. Vérifiez votre connexion et réessayez.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Infos utilisateur */}
      <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-500">Nom</span>
          <span className="font-medium text-gray-900">{userName || '—'}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Email</span>
          <span className="font-medium text-gray-900">{userEmail}</span>
        </div>
        {userPhone && (
          <div className="flex justify-between">
            <span className="text-gray-500">Téléphone</span>
            <span className="font-medium text-gray-900">{userPhone}</span>
          </div>
        )}
      </div>

      {/* Sélection devise */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">Devise de paiement</label>
        <div className="grid grid-cols-3 gap-2">
          {CURRENCIES.map(c => (
            <button
              key={c.value}
              type="button"
              onClick={() => setCurrency(c.value)}
              className={`flex flex-col items-center p-3 rounded-xl border-2 text-xs font-medium transition-all ${
                currency === c.value
                  ? 'border-[#0B3D91] bg-blue-50 text-[#0B3D91]'
                  : 'border-gray-200 text-gray-600 hover:border-gray-300'
              }`}
            >
              <span className="text-xl mb-1">{c.flag}</span>
              {c.value}
            </button>
          ))}
        </div>
        <p className="text-xs text-gray-400 mt-2">
          La conversion est effectuée automatiquement par CinetPay.
        </p>
      </div>

      {/* Méthodes acceptées */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">Modes de paiement acceptés</label>
        <div className="flex flex-wrap gap-2">
          {['Orange Money', 'MTN Mobile', 'Wave', 'Moov Money', 'Carte Visa/MC'].map(m => (
            <span key={m} className="flex items-center gap-1.5 bg-gray-100 text-gray-700 text-xs px-3 py-1.5 rounded-full">
              <Smartphone className="w-3 h-3" />
              {m}
            </span>
          ))}
        </div>
      </div>

      {/* Erreur */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl p-3">
          {error}
        </div>
      )}

      {/* Bouton paiement */}
      <button
        onClick={handlePay}
        disabled={loading}
        className="w-full flex items-center justify-center gap-3 py-4 bg-[#0B3D91] hover:bg-[#0a3480] text-white font-bold rounded-xl text-base transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {loading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Redirection vers CinetPay…
          </>
        ) : (
          <>
            <CreditCard className="w-5 h-5" />
            Payer maintenant
            <ExternalLink className="w-4 h-4 opacity-70" />
          </>
        )}
      </button>

      {/* Garanties */}
      <div className="flex items-start gap-2 text-xs text-gray-400 bg-gray-50 rounded-xl p-3">
        <ShieldCheck className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
        <span>Paiement 100% sécurisé via CinetPay. Garantie satisfait ou remboursé 7 jours. Aucune donnée bancaire stockée sur nos serveurs.</span>
      </div>
    </div>
  )
}
