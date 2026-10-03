'use client'

import { useState } from 'react'
import { Users, Plus, Trash2, Loader2, Upload, CheckCircle, Clock, UserX } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface Member {
  id: string
  email: string
  full_name: string | null
  status: string
  user_id: string | null
}

const STATUS_ICONS: Record<string, React.ReactNode> = {
  invited:  <Clock className="w-3.5 h-3.5 text-yellow-500" />,
  enrolled: <CheckCircle className="w-3.5 h-3.5 text-green-500" />,
  completed: <CheckCircle className="w-3.5 h-3.5 text-purple-500" />,
  cancelled: <UserX className="w-3.5 h-3.5 text-red-400" />,
}

export default function MembersManager({ cohortId, members }: { cohortId: string; members: Member[] }) {
  const [emailsText, setEmailsText] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ added: number; skipped: number } | null>(null)
  const [error, setError] = useState('')
  const router = useRouter()

  async function handleAddMembers(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    setResult(null)

    const lines = emailsText.split(/[\n,;]+/).map(l => l.trim()).filter(Boolean)
    const parsed = lines.map(line => {
      const parts = line.split(/\s+|,/)
      const emailPart = parts.find(p => p.includes('@'))
      const namePart = parts.filter(p => !p.includes('@')).join(' ').trim()
      return { email: emailPart ?? line, full_name: namePart || undefined }
    }).filter(m => m.email.includes('@'))

    if (!parsed.length) {
      setError('Aucune adresse email valide trouvée.')
      setLoading(false)
      return
    }

    try {
      const res = await fetch(`/api/b2b/cohorts/${cohortId}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ members: parsed }),
      })
      const d = await res.json()
      if (!res.ok) { setError(d.error ?? 'Erreur'); setLoading(false); return }
      setResult({ added: d.added, skipped: d.skipped })
      setEmailsText('')
      router.refresh()
    } catch {
      setError('Erreur réseau')
    }
    setLoading(false)
  }

  async function handleRemove(memberId: string) {
    await fetch(`/api/b2b/cohorts/${cohortId}/members`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ memberId }),
    })
    router.refresh()
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <h2 className="font-semibold text-gray-900 flex items-center gap-2">
          <Users className="w-4 h-4 text-[#0B3D91]" /> Apprenants ({members.length})
        </h2>
      </div>

      {/* Ajout en masse */}
      <div className="p-5 border-b border-gray-100 bg-gray-50">
        <form onSubmit={handleAddMembers} className="space-y-3">
          <label className="block text-sm font-medium text-gray-700">
            Ajouter des apprenants (emails séparés par retour ligne, virgule ou point-virgule)
          </label>
          <textarea
            value={emailsText}
            onChange={e => setEmailsText(e.target.value)}
            rows={4}
            placeholder={`jean.dupont@entreprise.com\nmarie.martin@entreprise.com, Responsable RH\nkouadio.yao@entreprise.com`}
            className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#0B3D91]/30 resize-none"
          />
          {error && <div className="text-red-600 text-sm">{error}</div>}
          {result && (
            <div className="text-green-700 text-sm bg-green-50 rounded-lg p-2">
              {result.added} ajouté(s), {result.skipped} ignoré(s) (déjà présents)
            </div>
          )}
          <button type="submit" disabled={loading || !emailsText.trim()}
            className="flex items-center gap-2 ibig-gradient text-white text-sm font-semibold px-4 py-2 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-60">
            {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Ajout...</> : <><Plus className="w-4 h-4" /> Ajouter et inviter par email</>}
          </button>
        </form>
      </div>

      {/* Liste membres */}
      {members.length === 0 ? (
        <div className="p-8 text-center text-gray-400 text-sm">
          <Users className="w-10 h-10 mx-auto mb-2 text-gray-200" />
          Aucun apprenant dans cette cohorte.
        </div>
      ) : (
        <div className="divide-y divide-gray-50">
          {members.map(m => (
            <div key={m.id} className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition-colors">
              <div className="w-8 h-8 rounded-full bg-[#0B3D91]/10 flex items-center justify-center flex-shrink-0 text-[#0B3D91] font-bold text-sm">
                {(m.full_name ?? m.email)[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{m.full_name ?? '—'}</p>
                <p className="text-xs text-gray-500 truncate">{m.email}</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="flex items-center gap-1 text-xs text-gray-500">
                  {STATUS_ICONS[m.status]}
                  {m.status === 'invited' ? 'Invité' : m.status === 'enrolled' ? 'Inscrit' : m.status === 'completed' ? 'Terminé' : 'Annulé'}
                </span>
                {m.user_id && <span className="text-[10px] px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded-full">Compte</span>}
                <button onClick={() => handleRemove(m.id)} className="text-gray-300 hover:text-red-400 transition-colors ml-1">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
