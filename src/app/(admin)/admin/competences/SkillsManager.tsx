'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Trash2, Loader2 } from 'lucide-react'

type Skill = { id: string; name: string; category: string | null; courses: number; learners: number }

async function post(body: unknown) {
  const res = await fetch('/api/admin/competences', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
  const d = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(d.error ?? 'Erreur')
}

export default function SkillsManager({ skills }: { skills: Skill[] }) {
  const router = useRouter()
  const [name, setName] = useState('')
  const [category, setCategory] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const categories = [...new Set(skills.map(s => s.category).filter(Boolean))] as string[]

  async function add(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true); setError('')
    try { await post({ name, category }); setName(''); router.refresh() } catch (err) { setError((err as Error).message) } finally { setBusy(false) }
  }

  return (
    <div className="space-y-4">
      <form onSubmit={add} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-col sm:flex-row gap-2">
        <input required value={name} onChange={e => setName(e.target.value)} placeholder="Nouvelle compétence (ex. Gestion de stock)" className="flex-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm" />
        <input list="skill-categories" value={category} onChange={e => setCategory(e.target.value)} placeholder="Catégorie" className="sm:w-48 border border-gray-200 rounded-xl px-3 py-2.5 text-sm" />
        <datalist id="skill-categories">{categories.map(c => <option key={c} value={c} />)}</datalist>
        <button disabled={busy} className="flex items-center justify-center gap-2 bg-[#0B3D91] text-white font-semibold text-sm px-4 py-2.5 rounded-xl">
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Ajouter
        </button>
      </form>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-xs text-gray-500 text-left">
            <tr><th className="px-4 py-2.5">Compétence</th><th className="px-4 py-2.5 hidden sm:table-cell">Catégorie</th><th className="px-4 py-2.5">Formations</th><th className="px-4 py-2.5">Apprenants</th><th /></tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {skills.map(s => (
              <tr key={s.id}>
                <td className="px-4 py-2.5 font-medium text-gray-900">{s.name}</td>
                <td className="px-4 py-2.5 text-gray-500 hidden sm:table-cell">{s.category ?? '—'}</td>
                <td className="px-4 py-2.5">{s.courses}</td>
                <td className="px-4 py-2.5">{s.learners}</td>
                <td className="px-4 py-2.5 text-right">
                  <button type="button" aria-label="Supprimer" className="p-1.5 text-gray-300 hover:text-red-500"
                    onClick={async () => { if (confirm(`Supprimer « ${s.name} » ? Elle sera retirée des formations.`)) { await post({ action: 'delete', id: s.id }); router.refresh() } }}>
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
