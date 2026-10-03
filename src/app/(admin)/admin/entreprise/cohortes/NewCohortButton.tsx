'use client'

import { useState } from 'react'
import { PlusCircle, Loader2, X } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface Props {
  b2bRequests: { id: string; company: string; contact_name: string }[]
  courses: { id: string; title: string }[]
}

export default function NewCohortButton({ b2bRequests, courses }: Props) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    b2b_request_id: '',
    course_id: '',
    name: '',
    description: '',
    price_per_learner: '',
    currency: 'XOF',
    start_date: '',
    end_date: '',
  })
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/b2b/cohorts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, price_per_learner: form.price_per_learner ? parseFloat(form.price_per_learner) : null }),
      })
      if (!res.ok) {
        const d = await res.json()
        setError(d.error ?? 'Erreur')
      } else {
        const d = await res.json()
        setOpen(false)
        router.push(`/admin/entreprise/cohortes/${d.cohort.id}`)
        router.refresh()
      }
    } catch {
      setError('Erreur réseau')
    }
    setLoading(false)
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 ibig-gradient text-white text-sm font-semibold px-4 py-2 rounded-xl hover:opacity-90 transition-opacity"
      >
        <PlusCircle className="w-4 h-4" /> Nouvelle cohorte
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h2 className="font-bold text-gray-900">Nouvelle cohorte entreprise</h2>
              <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Entreprise (demande B2B gagnée) *</label>
                <select required value={form.b2b_request_id} onChange={e => setForm(f => ({ ...f, b2b_request_id: e.target.value }))}
                  className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#0B3D91]/30">
                  <option value="">Sélectionner</option>
                  {b2bRequests.map(r => <option key={r.id} value={r.id}>{r.company} — {r.contact_name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Formation *</label>
                <select required value={form.course_id} onChange={e => setForm(f => ({ ...f, course_id: e.target.value }))}
                  className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#0B3D91]/30">
                  <option value="">Sélectionner</option>
                  {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nom de la cohorte *</label>
                <input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="Ex: Cohorte Finance – Jan 2025"
                  className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B3D91]/30" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  rows={2} className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B3D91]/30 resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Prix par apprenant</label>
                  <input type="number" min="0" value={form.price_per_learner} onChange={e => setForm(f => ({ ...f, price_per_learner: e.target.value }))}
                    placeholder="50000"
                    className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B3D91]/30" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Devise</label>
                  <select value={form.currency} onChange={e => setForm(f => ({ ...f, currency: e.target.value }))}
                    className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#0B3D91]/30">
                    <option value="XOF">XOF (FCFA)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="USD">USD ($)</option>
                    <option value="MAD">MAD (DH)</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date de début</label>
                  <input type="date" value={form.start_date} onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))}
                    className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B3D91]/30" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date de fin</label>
                  <input type="date" value={form.end_date} onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))}
                    className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B3D91]/30" />
                </div>
              </div>

              {error && <div className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-xl p-3">{error}</div>}

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setOpen(false)}
                  className="flex-1 py-2.5 text-sm border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
                  Annuler
                </button>
                <button type="submit" disabled={loading}
                  className="flex-1 flex items-center justify-center gap-2 ibig-gradient text-white text-sm font-semibold py-2.5 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-60">
                  {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Création...</> : 'Créer la cohorte'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
