'use client'
import { useState } from 'react'
import { Plus, Loader2 } from 'lucide-react'

export default function CouponForm() {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setMsg('')
    const fd = new FormData(e.currentTarget)
    const body = {
      code: (fd.get('code') as string).toUpperCase(),
      discount_type: fd.get('discount_type'),
      discount_value: Number(fd.get('discount_value')),
      max_uses: fd.get('max_uses') ? Number(fd.get('max_uses')) : null,
      min_amount: fd.get('min_amount') ? Number(fd.get('min_amount')) : null,
      max_discount_amount: fd.get('max_discount_amount') ? Number(fd.get('max_discount_amount')) : null,
      expires_at: fd.get('expires_at') || null,
      one_per_user: fd.get('one_per_user') === 'on',
      description: fd.get('description') || null,
    }
    const res = await fetch('/api/coupons/create', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    const data = await res.json()
    setLoading(false)
    if (res.ok) { setMsg('Coupon créé !'); setOpen(false); window.location.reload() }
    else setMsg(data.error ?? 'Erreur')
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-bold text-gray-900">Créer un coupon</h2>
        <button onClick={() => setOpen(!open)}
          className="flex items-center gap-2 bg-[#0B3D91] text-white text-sm font-medium px-4 py-2 rounded-xl hover:bg-blue-800 transition-colors">
          <Plus className="w-4 h-4" /> {open ? 'Annuler' : 'Nouveau coupon'}
        </button>
      </div>
      {open && (
        <form onSubmit={handleSubmit} className="grid sm:grid-cols-2 gap-4 mt-4">
          <div>
            <label className="text-xs font-medium text-gray-700">Code *</label>
            <input name="code" required placeholder="EX: IBIG20" className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm uppercase focus:outline-none focus:ring-2 focus:ring-[#0B3D91]" />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-700">Type de réduction *</label>
            <select name="discount_type" required className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B3D91] bg-white">
              <option value="percent">Pourcentage (%)</option>
              <option value="fixed">Montant fixe (FCFA)</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-700">Valeur *</label>
            <input name="discount_value" type="number" min="1" required placeholder="20" className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B3D91]" />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-700">Nb max utilisations</label>
            <input name="max_uses" type="number" min="1" placeholder="Illimité" className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B3D91]" />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-700">Montant min (FCFA)</label>
            <input name="min_amount" type="number" min="0" placeholder="Optionnel" className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B3D91]" />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-700">Réduction max (FCFA)</label>
            <input name="max_discount_amount" type="number" min="0" placeholder="Pour les coupons %" className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B3D91]" />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-700">Date d'expiration</label>
            <input name="expires_at" type="date" className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B3D91]" />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-700">Description</label>
            <input name="description" placeholder="Campagne rentrée 2025..." className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B3D91]" />
          </div>
          <div className="sm:col-span-2 flex items-center gap-2">
            <input type="checkbox" name="one_per_user" id="one_per_user" className="w-4 h-4 text-[#0B3D91]" />
            <label htmlFor="one_per_user" className="text-sm text-gray-700">Un seul usage par utilisateur</label>
          </div>
          {msg && <p className="sm:col-span-2 text-sm text-red-500">{msg}</p>}
          <div className="sm:col-span-2">
            <button type="submit" disabled={loading}
              className="w-full py-2.5 bg-[#0B3D91] text-white font-semibold rounded-xl hover:bg-blue-800 disabled:opacity-50 flex items-center justify-center gap-2">
              {loading && <Loader2 className="w-4 h-4 animate-spin" />} Créer le coupon
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
