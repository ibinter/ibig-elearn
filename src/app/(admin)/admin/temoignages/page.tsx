'use client'

import { useState, useEffect } from 'react'
import { Star, Plus, Trash2, Eye, EyeOff, Save, X } from 'lucide-react'

interface Testimonial {
  id: string
  author_name: string
  author_role: string
  author_country: string
  content: string
  rating: number
  initials: string
  color: string
  is_published: boolean
  position: number
}

const COLORS = ['bg-blue-600', 'bg-green-600', 'bg-orange-600', 'bg-purple-600', 'bg-red-600', 'bg-teal-600']
const empty = (): Omit<Testimonial, 'id'> => ({
  author_name: '', author_role: '', author_country: '', content: '',
  rating: 5, initials: '', color: 'bg-blue-600', is_published: false, position: 0,
})

export default function TemoignagesPage() {
  const [list, setList] = useState<Testimonial[]>([])
  const [editing, setEditing] = useState<Partial<Testimonial> | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const res = await fetch('/api/admin/testimonials')
    setList(await res.json())
    setLoading(false)
  }

  async function save() {
    if (!editing) return
    setSaving(true); setError('')
    try {
      const method = editing.id ? 'PATCH' : 'POST'
      const res = await fetch('/api/admin/testimonials', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editing),
      })
      if (!res.ok) throw new Error((await res.json()).error)
      await load()
      setEditing(null)
    } catch (e: any) { setError(e.message) }
    finally { setSaving(false) }
  }

  async function togglePublish(t: Testimonial) {
    await fetch('/api/admin/testimonials', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: t.id, is_published: !t.is_published }),
    })
    await load()
  }

  async function remove(id: string) {
    if (!confirm('Supprimer ce témoignage ?')) return
    await fetch('/api/admin/testimonials', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    await load()
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Témoignages</h1>
          <p className="text-sm text-gray-500 mt-0.5">Gestion des avis affichés sur la homepage</p>
        </div>
        <button
          onClick={() => setEditing(empty())}
          className="flex items-center gap-2 px-4 py-2 bg-[#0B3D91] text-white rounded-xl text-sm font-semibold hover:bg-[#0a2f70] transition-colors"
        >
          <Plus className="w-4 h-4" /> Ajouter
        </button>
      </div>

      {/* Formulaire */}
      {editing && (
        <div className="bg-white rounded-2xl border border-[#0B3D91]/20 shadow-md p-5 space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-bold text-gray-900">{editing.id ? 'Modifier' : 'Nouveau témoignage'}</h2>
            <button onClick={() => setEditing(null)}><X className="w-4 h-4 text-gray-400 hover:text-gray-700" /></button>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <input value={editing.author_name ?? ''} onChange={e => setEditing({ ...editing, author_name: e.target.value })}
              placeholder="Nom *" className="px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B3D91]/30" />
            <input value={editing.author_role ?? ''} onChange={e => setEditing({ ...editing, author_role: e.target.value })}
              placeholder="Rôle / Poste *" className="px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B3D91]/30" />
            <input value={editing.author_country ?? ''} onChange={e => setEditing({ ...editing, author_country: e.target.value })}
              placeholder="Pays" className="px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B3D91]/30" />
            <input value={editing.initials ?? ''} onChange={e => setEditing({ ...editing, initials: e.target.value })}
              placeholder="Initiales (ex: KA)" maxLength={3}
              className="px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B3D91]/30" />
          </div>
          <textarea value={editing.content ?? ''} onChange={e => setEditing({ ...editing, content: e.target.value })}
            rows={3} placeholder="Contenu du témoignage *"
            className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B3D91]/30 resize-none" />
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-1">
              {[1,2,3,4,5].map(n => (
                <button key={n} onClick={() => setEditing({ ...editing, rating: n })}>
                  <Star className={`w-5 h-5 ${(editing.rating ?? 5) >= n ? 'text-[#FFA500] fill-[#FFA500]' : 'text-gray-300'}`} />
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              {COLORS.map(c => (
                <button key={c} onClick={() => setEditing({ ...editing, color: c })}
                  className={`w-6 h-6 rounded-full ${c} ${editing.color === c ? 'ring-2 ring-offset-2 ring-[#0B3D91]' : ''}`} />
              ))}
            </div>
            <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
              <input type="checkbox" checked={editing.is_published ?? false}
                onChange={e => setEditing({ ...editing, is_published: e.target.checked })}
                className="rounded" />
              Publié
            </label>
            <input type="number" value={editing.position ?? 0} onChange={e => setEditing({ ...editing, position: +e.target.value })}
              className="w-20 px-2 py-1.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B3D91]/30"
              placeholder="Ordre" />
          </div>
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <div className="flex gap-2">
            <button onClick={save} disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-[#0B3D91] text-white rounded-xl text-sm font-semibold hover:bg-[#0a2f70] disabled:opacity-60 transition-colors">
              <Save className="w-4 h-4" /> {saving ? 'Enregistrement…' : 'Enregistrer'}
            </button>
            <button onClick={() => setEditing(null)}
              className="px-4 py-2 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition-colors">
              Annuler
            </button>
          </div>
        </div>
      )}

      {/* Liste */}
      {loading ? (
        <div className="text-center py-12 text-gray-400 text-sm">Chargement…</div>
      ) : list.length === 0 ? (
        <div className="text-center py-12 text-gray-400 text-sm">Aucun témoignage. Cliquez sur "Ajouter" pour en créer un.</div>
      ) : (
        <div className="space-y-3">
          {list.map(t => (
            <div key={t.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex gap-4">
              <div className={`w-10 h-10 rounded-full ${t.color} flex items-center justify-center text-white text-sm font-bold flex-shrink-0`}>
                {t.initials || t.author_name.slice(0, 2).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="font-semibold text-gray-900 text-sm">{t.author_name}</p>
                  <span className="text-gray-400 text-xs">—</span>
                  <p className="text-gray-500 text-xs">{t.author_role}{t.author_country ? `, ${t.author_country}` : ''}</p>
                  <span className={`ml-auto text-xs px-2 py-0.5 rounded-full font-medium ${t.is_published ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {t.is_published ? 'Publié' : 'Brouillon'}
                  </span>
                </div>
                <div className="flex gap-0.5 mb-1">
                  {Array.from({ length: t.rating }).map((_, i) => (
                    <Star key={i} className="w-3 h-3 text-[#FFA500] fill-[#FFA500]" />
                  ))}
                </div>
                <p className="text-gray-600 text-sm line-clamp-2 italic">"{t.content}"</p>
              </div>
              <div className="flex flex-col gap-1 flex-shrink-0">
                <button onClick={() => setEditing(t)} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors" title="Modifier">
                  <Save className="w-3.5 h-3.5 text-gray-500" />
                </button>
                <button onClick={() => togglePublish(t)} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors" title={t.is_published ? 'Masquer' : 'Publier'}>
                  {t.is_published ? <EyeOff className="w-3.5 h-3.5 text-gray-500" /> : <Eye className="w-3.5 h-3.5 text-gray-500" />}
                </button>
                <button onClick={() => remove(t.id)} className="p-1.5 rounded-lg hover:bg-red-50 transition-colors" title="Supprimer">
                  <Trash2 className="w-3.5 h-3.5 text-red-400" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
