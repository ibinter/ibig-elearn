'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Send } from 'lucide-react'

const METHODS = [
  { id: 'orange_money', label: 'Orange Money' },
  { id: 'mtn_money', label: 'MTN Mobile Money' },
  { id: 'wave', label: 'Wave' },
  { id: 'bank_transfer', label: 'Virement bancaire' },
]

export default function PayoutRequestForm({ balance }: { balance: number }) {
  const router = useRouter()
  const [amount, setAmount] = useState('')
  const [method, setMethod] = useState('orange_money')
  const [phone, setPhone] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    const amt = parseInt(amount)
    if (!amt || amt < 1000) { setError('Montant minimum : 1 000 XOF'); return }
    if (amt > balance) { setError('Montant supérieur à votre solde disponible'); return }
    setLoading(true)
    setError('')
    const res = await fetch('/api/formateur/virement', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: amt, method, phone, notes }),
    })
    if (!res.ok) {
      const d = await res.json()
      setError(d.error || 'Erreur lors de la demande')
    } else {
      setSuccess(true)
      router.refresh()
    }
    setLoading(false)
  }

  if (success) {
    return (
      <div className="text-center py-6">
        <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3">
          <Send className="w-6 h-6 text-green-600" />
        </div>
        <p className="font-semibold text-gray-900">Demande envoyée !</p>
        <p className="text-sm text-gray-500 mt-1">L&apos;admin traitera votre virement sous 2-3 jours ouvrés.</p>
      </div>
    )
  }

  return (
    <form onSubmit={submit} className="space-y-4 max-w-lg">
      <div className="bg-blue-50 rounded-xl p-4 text-sm">
        Solde disponible : <strong className="text-[#0B3D91]">{balance.toLocaleString('fr-FR')} XOF</strong>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Montant (XOF)</label>
        <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="Ex: 25000" min={1000} max={balance}
          className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B3D91]" />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Méthode de virement</label>
        <div className="grid grid-cols-2 gap-2">
          {METHODS.map(m => (
            <button key={m.id} type="button" onClick={() => setMethod(m.id)}
              className={`p-3 rounded-xl border text-sm text-left transition-all ${method === m.id ? 'border-[#0B3D91] bg-blue-50 font-medium text-[#0B3D91]' : 'border-gray-200 hover:border-gray-300'}`}>
              {m.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Numéro / IBAN</label>
        <input type="text" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+225 07 00 00 00" required
          className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B3D91]" />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Note (optionnel)</label>
        <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} placeholder="Informations complémentaires..."
          className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B3D91] resize-none" />
      </div>

      {error && <p className="text-sm text-red-600 bg-red-50 rounded-xl px-4 py-3">{error}</p>}

      <button type="submit" disabled={loading}
        className="flex items-center gap-2 bg-[#0B3D91] hover:bg-blue-800 text-white px-6 py-2.5 rounded-xl text-sm font-semibold transition-colors disabled:opacity-60">
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        Soumettre la demande
      </button>
    </form>
  )
}
