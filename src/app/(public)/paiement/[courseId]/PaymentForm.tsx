'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CreditCard, Phone, ShieldCheck, Loader2 } from 'lucide-react'

interface Props {
  courseId: string
  amount: number
  currency: string
  courseName: string
  userEmail: string
  userPhone: string
  userName: string
}

const MOBILE_MONEY = [
  { id: 'orange_money', label: 'Orange Money', emoji: '🟠' },
  { id: 'mtn_money', label: 'MTN Mobile Money', emoji: '🟡' },
  { id: 'wave', label: 'Wave', emoji: '🔵' },
  { id: 'moov_money', label: 'Moov Money', emoji: '🟢' },
]

export default function PaymentForm({ courseId, amount, currency, courseName, userEmail, userPhone, userName }: Props) {
  const router = useRouter()
  const [method, setMethod] = useState<'mobile' | 'card'>('mobile')
  const [provider, setProvider] = useState('orange_money')
  const [phone, setPhone] = useState(userPhone)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/payment/cinetpay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseId,
          amount,
          currency,
          description: courseName,
          customer_name: userName,
          customer_email: userEmail,
          customer_phone_number: phone,
          payment_method: method === 'card' ? 'CREDIT_CARD' : provider.toUpperCase(),
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Erreur lors de l\'initiation du paiement.')
        setLoading(false)
        return
      }

      if (data.payment_url) {
        window.location.href = data.payment_url
      } else {
        setError('URL de paiement non reçue.')
        setLoading(false)
      }
    } catch {
      setError('Erreur réseau. Veuillez réessayer.')
      setLoading(false)
    }
  }

  const formattedAmount = new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0
  }).format(amount)

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Méthode de paiement */}
      <div>
        <p className="text-sm font-medium text-gray-700 mb-3">Choisir un mode de paiement</p>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setMethod('mobile')}
            className={`flex items-center gap-2 p-3 rounded-lg border-2 text-sm font-medium transition-colors ${
              method === 'mobile' ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'
            }`}
          >
            <Phone className="w-4 h-4" />
            Mobile Money
          </button>
          <button
            type="button"
            onClick={() => setMethod('card')}
            className={`flex items-center gap-2 p-3 rounded-lg border-2 text-sm font-medium transition-colors ${
              method === 'card' ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            Carte bancaire
          </button>
        </div>
      </div>

      {method === 'mobile' && (
        <div>
          <p className="text-sm font-medium text-gray-700 mb-3">Opérateur</p>
          <div className="grid grid-cols-2 gap-2">
            {MOBILE_MONEY.map(op => (
              <button
                key={op.id}
                type="button"
                onClick={() => setProvider(op.id)}
                className={`flex items-center gap-2 p-3 rounded-lg border text-sm transition-colors ${
                  provider === op.id ? 'border-blue-500 bg-blue-50 font-medium' : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <span>{op.emoji}</span>
                {op.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Numéro de téléphone */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {method === 'mobile' ? 'Numéro Mobile Money' : 'Téléphone de contact'}
        </label>
        <input
          type="tel"
          value={phone}
          onChange={e => setPhone(e.target.value)}
          required
          placeholder="+225 07 00 00 00 00"
          className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3">
          {error}
        </div>
      )}

      {/* Sécurité */}
      <div className="flex items-start gap-2 bg-gray-50 rounded-lg p-3">
        <ShieldCheck className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
        <p className="text-xs text-gray-600">
          Paiement sécurisé via <strong>CinetPay</strong>. Vos données sont protégées par un chiffrement SSL.
        </p>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3.5 rounded-xl transition-colors disabled:opacity-60"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Redirection vers le paiement...
          </>
        ) : (
          <>Payer {formattedAmount}</>
        )}
      </button>

      <p className="text-xs text-center text-gray-500">
        En cliquant sur &quot;Payer&quot;, vous acceptez nos{' '}
        <a href="/cgv" className="underline">Conditions générales de vente</a>.
      </p>
    </form>
  )
}
