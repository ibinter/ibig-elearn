'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Trash2, Loader2, Tag, Percent, Hash } from 'lucide-react'

interface Coupon {
  id: string
  code: string
  discount_type: 'percent' | 'fixed'
  discount_value: number
  max_uses: number | null
  used_count: number
  expires_at: string | null
  is_active: boolean
  course_id: string | null
  course: { title: string } | null
}

interface Course { id: string; title: string }

export default function CouponManager({ coupons, courses }: { coupons: Coupon[]; courses: Course[] }) {
  const router = useRouter()
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    code: '', discount_type: 'percent' as 'percent' | 'fixed',
    discount_value: '', max_uses: '', expires_at: '', course_id: '',
  })

  function generateCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    const code = Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
    setForm(f => ({ ...f, code }))
  }

  async function create(e: React.FormEvent) {
    e.preventDefault()
    if (!form.code.trim() || !form.discount_value) { setError('Code et remise requis'); return }
    setLoading(true)
    setError('')
    const res = await fetch('/api/formateur/coupons', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code: form.code.toUpperCase().trim(),
        discount_type: form.discount_type,
        discount_value: parseFloat(form.discount_value),
        max_uses: form.max_uses ? parseInt(form.max_uses) : null,
        expires_at: form.expires_at || null,
        course_id: form.course_id || null,
      }),
    })
    if (!res.ok) { const d = await res.json(); setError(d.error || 'Erreur'); }
    else { setShowForm(false); setForm({ code: '', discount_type: 'percent', discount_value: '', max_uses: '', expires_at: '', course_id: '' }); router.refresh() }
    setLoading(false)
  }

  async function deleteCoupon(id: string) {
    if (!confirm('Supprimer ce coupon ?')) return
    setDeleting(id)
    await fetch(`/api/formateur/coupons?id=${id}`, { method: 'DELETE' })
    router.refresh()
    setDeleting(null)
  }

  return (
    <div className="space-y-6">
      {/* Bouton créer */}
      {!showForm && (
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-[#0B3D91] hover:bg-blue-800 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors">
          <Plus className="w-4 h-4" /> Créer un code promo
        </button>
      )}

      {/* Formulaire */}
      {showForm && (
        <form onSubmit={create} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4 max-w-lg">
          <h2 className="font-bold text-gray-900">Nouveau code promo</h2>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Code</label>
            <div className="flex gap-2">
              <input value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))}
                placeholder="EX: PROMO20" required
                className="flex-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm font-mono uppercase focus:outline-none focus:ring-2 focus:ring-[#0B3D91]" />
              <button type="button" onClick={generateCode}
                className="px-3 py-2 border border-gray-200 rounded-xl text-sm text-gray-500 hover:border-[#0B3D91] hover:text-[#0B3D91] transition-colors">
                Auto
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <div className="flex gap-2">
                <button type="button" onClick={() => setForm(f => ({ ...f, discount_type: 'percent' }))}
                  className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-xl border text-sm ${form.discount_type === 'percent' ? 'border-[#0B3D91] bg-blue-50 text-[#0B3D91]' : 'border-gray-200'}`}>
                  <Percent className="w-3.5 h-3.5" /> %
                </button>
                <button type="button" onClick={() => setForm(f => ({ ...f, discount_type: 'fixed' }))}
                  className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-xl border text-sm ${form.discount_type === 'fixed' ? 'border-[#0B3D91] bg-blue-50 text-[#0B3D91]' : 'border-gray-200'}`}>
                  <Hash className="w-3.5 h-3.5" /> Fixe
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Valeur {form.discount_type === 'percent' ? '(%)' : '(XOF)'}</label>
              <input type="number" value={form.discount_value} onChange={e => setForm(f => ({ ...f, discount_value: e.target.value }))}
                placeholder={form.discount_type === 'percent' ? '20' : '5000'} required min={1} max={form.discount_type === 'percent' ? 100 : undefined}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B3D91]" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Max utilisations</label>
              <input type="number" value={form.max_uses} onChange={e => setForm(f => ({ ...f, max_uses: e.target.value }))}
                placeholder="Illimité" min={1}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B3D91]" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Expire le</label>
              <input type="date" value={form.expires_at} onChange={e => setForm(f => ({ ...f, expires_at: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B3D91]" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Formation (optionnel)</label>
            <select value={form.course_id} onChange={e => setForm(f => ({ ...f, course_id: e.target.value }))}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B3D91]">
              <option value="">Toutes mes formations</option>
              {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
            </select>
          </div>

          {error && <p className="text-sm text-red-600 bg-red-50 rounded-xl px-4 py-3">{error}</p>}

          <div className="flex gap-2">
            <button type="submit" disabled={loading}
              className="flex items-center gap-2 bg-[#0B3D91] text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-800 transition-colors disabled:opacity-60">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Créer
            </button>
            <button type="button" onClick={() => setShowForm(false)}
              className="px-5 py-2.5 rounded-xl text-sm font-medium border border-gray-200 hover:border-gray-300 transition-colors">
              Annuler
            </button>
          </div>
        </form>
      )}

      {/* Liste */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {!coupons.length ? (
          <div className="p-12 text-center">
            <Tag className="w-12 h-12 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-500">Aucun code promo créé</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Code</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Remise</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase hidden md:table-cell">Formation</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Utilisations</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase hidden lg:table-cell">Expiration</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {coupons.map(c => (
                <tr key={c.id} className={`hover:bg-gray-50 ${!c.is_active ? 'opacity-50' : ''}`}>
                  <td className="px-5 py-4">
                    <span className="font-mono font-bold text-sm bg-gray-100 px-2 py-1 rounded">{c.code}</span>
                  </td>
                  <td className="px-4 py-4 text-sm font-semibold text-[#0B3D91]">
                    {c.discount_type === 'percent' ? `${c.discount_value}%` : `${c.discount_value.toLocaleString('fr-FR')} XOF`}
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-600 hidden md:table-cell">{c.course?.title ?? 'Toutes'}</td>
                  <td className="px-4 py-4 text-sm text-center text-gray-600">{c.used_count} / {c.max_uses ?? '∞'}</td>
                  <td className="px-4 py-4 text-sm text-gray-400 hidden lg:table-cell">{c.expires_at ? new Date(c.expires_at).toLocaleDateString('fr-FR') : '—'}</td>
                  <td className="px-4 py-4">
                    <button onClick={() => deleteCoupon(c.id)} disabled={deleting === c.id}
                      className="text-gray-400 hover:text-red-500 transition-colors">
                      {deleting === c.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
