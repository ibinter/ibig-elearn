'use client'
import { useState } from 'react'
import { Tag, ToggleLeft, ToggleRight, Trash2 } from 'lucide-react'

interface Coupon {
  id: string; code: string; discount_type: string; discount_value: number
  max_uses: number | null; used_count: number; is_active: boolean
  expires_at: string | null; description: string | null; course: { title: string } | null
}

export default function CouponList({ coupons }: { coupons: Coupon[] }) {
  const [list, setList] = useState(coupons)

  async function toggle(id: string, active: boolean) {
    await fetch('/api/coupons/toggle', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, is_active: !active }) })
    setList(l => l.map(c => c.id === id ? { ...c, is_active: !active } : c))
  }

  const isExpired = (c: Coupon) => c.expires_at && new Date(c.expires_at) < new Date()
  const isExhausted = (c: Coupon) => c.max_uses !== null && c.used_count >= c.max_uses

  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
      <div className="p-5 border-b border-gray-100">
        <h2 className="font-bold text-gray-900">Tous les coupons ({list.length})</h2>
      </div>
      {list.length === 0 ? (
        <div className="p-8 text-center text-gray-400">Aucun coupon créé.</div>
      ) : (
        <div className="divide-y divide-gray-50">
          {list.map(c => (
            <div key={c.id} className="p-4 flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono font-bold text-[#0B3D91] bg-[#0B3D91]/10 px-2 py-0.5 rounded text-sm">{c.code}</span>
                  <span className="text-sm font-semibold text-gray-900">
                    {c.discount_type === 'percent' ? `-${c.discount_value}%` : `-${c.discount_value.toLocaleString()} FCFA`}
                  </span>
                  {isExpired(c) && <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">Expiré</span>}
                  {isExhausted(c) && <span className="text-xs bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full">Épuisé</span>}
                  {!c.is_active && !isExpired(c) && !isExhausted(c) && <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">Inactif</span>}
                </div>
                <p className="text-xs text-gray-400 mt-0.5">
                  {c.used_count} utilisation{c.used_count > 1 ? 's' : ''}{c.max_uses ? ` / ${c.max_uses}` : ' (illimité)'}
                  {c.expires_at ? ` · Expire le ${new Date(c.expires_at).toLocaleDateString('fr-FR')}` : ''}
                  {c.description ? ` · ${c.description}` : ''}
                </p>
              </div>
              <button onClick={() => toggle(c.id, c.is_active)} title={c.is_active ? 'Désactiver' : 'Activer'}
                className="text-gray-400 hover:text-[#0B3D91] transition-colors">
                {c.is_active ? <ToggleRight className="w-6 h-6 text-green-500" /> : <ToggleLeft className="w-6 h-6" />}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
