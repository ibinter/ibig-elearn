'use client'

import { useState } from 'react'
import { Plus, Trash2, Award, Users, X, Check, Loader2, Search } from 'lucide-react'

interface Badge {
  id: string; name: string; description: string; icon: string; color: string
  criteria_type: string; is_active: boolean; created_at: string
}
interface UserProfile { id: string; full_name: string; email: string }
interface UserBadge { id: string; user_id: string; badge_id: string; earned_at: string }

const CRITERIA_LABELS: Record<string, string> = {
  course_completion: 'Complétion de formation',
  quiz_score: 'Score au quiz',
  enrollment_count: 'Nombre de formations',
  manual: 'Attribution manuelle',
}

const ICONS = ['🏆','🎓','⭐','💯','🥇','🥈','🥉','🌍','🚀','💪','📚','🎯','🔥','💡','🌟']
const COLORS = ['#0B3D91','#059669','#FFA500','#7C3AED','#DC2626','#0891B2','#D97706','#9333EA']

export default function BadgesManager({ badges: initial, users, userBadges: initialUB }: {
  badges: Badge[]; users: UserProfile[]; userBadges: UserBadge[]
}) {
  const [badges, setBadges] = useState(initial)
  const [userBadges, setUserBadges] = useState(initialUB)
  const [tab, setTab] = useState<'badges'|'attribution'>('badges')
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [searchUser, setSearchUser] = useState('')
  const [selectedBadge, setSelectedBadge] = useState('')
  const [form, setForm] = useState({ name: '', description: '', icon: '🏆', color: '#0B3D91', criteria_type: 'manual' })

  async function createBadge() {
    if (!form.name) return
    setLoading(true)
    const res = await fetch('/api/admin/badges', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
    const d = await res.json()
    if (d.badge) { setBadges(b => [...b, d.badge]); setShowForm(false); setForm({ name: '', description: '', icon: '🏆', color: '#0B3D91', criteria_type: 'manual' }) }
    setLoading(false)
  }

  async function deleteBadge(id: string) {
    if (!confirm('Supprimer ce badge ?')) return
    await fetch(`/api/admin/badges/${id}`, { method: 'DELETE' })
    setBadges(b => b.filter(x => x.id !== id))
    setUserBadges(ub => ub.filter(x => x.badge_id !== id))
  }

  async function awardBadge(userId: string, badgeId: string) {
    const exists = userBadges.find(ub => ub.user_id === userId && ub.badge_id === badgeId)
    if (exists) {
      await fetch(`/api/admin/badges/award?user_id=${userId}&badge_id=${badgeId}`, { method: 'DELETE' })
      setUserBadges(ub => ub.filter(x => !(x.user_id === userId && x.badge_id === badgeId)))
    } else {
      const res = await fetch('/api/admin/badges/award', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ user_id: userId, badge_id: badgeId }) })
      if (res.ok) setUserBadges(ub => [...ub, { id: crypto.randomUUID(), user_id: userId, badge_id: badgeId, earned_at: new Date().toISOString() }])
    }
  }

  const filteredUsers = users.filter(u =>
    !searchUser || u.full_name?.toLowerCase().includes(searchUser.toLowerCase()) || u.email?.toLowerCase().includes(searchUser.toLowerCase())
  )

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
        {(['badges', 'attribution'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === t ? 'bg-white text-[#0B3D91] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            {t === 'badges' ? '🏅 Bibliothèque' : '👤 Attribution'}
          </button>
        ))}
      </div>

      {tab === 'badges' && (
        <div className="space-y-4">
          <button onClick={() => setShowForm(true)}
            className="flex items-center gap-2 ibig-gradient text-white text-sm font-semibold px-4 py-2 rounded-xl hover:opacity-90">
            <Plus className="w-4 h-4" /> Nouveau badge
          </button>

          {showForm && (
            <div className="bg-white rounded-2xl border border-gray-200 p-5">
              <h3 className="font-semibold text-gray-900 mb-4">Créer un badge</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nom *</label>
                  <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B3D91]/30" placeholder="Ex: Expert certifié" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type de critère</label>
                  <select value={form.criteria_type} onChange={e => setForm(f => ({ ...f, criteria_type: e.target.value }))}
                    className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#0B3D91]/30">
                    {Object.entries(CRITERIA_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                    className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B3D91]/30" placeholder="Description du badge" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Icône</label>
                  <div className="flex flex-wrap gap-1">
                    {ICONS.map(icon => (
                      <button key={icon} onClick={() => setForm(f => ({ ...f, icon }))}
                        className={`w-9 h-9 rounded-lg text-xl flex items-center justify-center transition-colors ${form.icon === icon ? 'bg-[#0B3D91]/10 ring-2 ring-[#0B3D91]' : 'hover:bg-gray-100'}`}>
                        {icon}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Couleur</label>
                  <div className="flex flex-wrap gap-2">
                    {COLORS.map(c => (
                      <button key={c} onClick={() => setForm(f => ({ ...f, color: c }))}
                        className={`w-8 h-8 rounded-full transition-transform ${form.color === c ? 'scale-125 ring-2 ring-offset-2 ring-gray-400' : ''}`}
                        style={{ background: c }} />
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <button onClick={createBadge} disabled={!form.name || loading}
                  className="flex items-center gap-2 ibig-gradient text-white text-sm font-semibold px-4 py-2 rounded-xl disabled:opacity-60">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} Créer
                </button>
                <button onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 border border-gray-200 rounded-xl">Annuler</button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {badges.map(b => {
              const count = userBadges.filter(ub => ub.badge_id === b.id).length
              return (
                <div key={b.id} className="bg-white rounded-2xl border border-gray-200 p-4 flex items-start gap-3">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0" style={{ background: b.color + '20' }}>
                    {b.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 text-sm">{b.name}</h3>
                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{b.description}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs text-gray-400">{CRITERIA_LABELS[b.criteria_type]}</span>
                      <span className="text-xs font-medium text-[#0B3D91]">· {count} attribué{count > 1 ? 's' : ''}</span>
                    </div>
                  </div>
                  <button onClick={() => deleteBadge(b.id)} className="text-gray-300 hover:text-red-500 transition-colors flex-shrink-0">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {tab === 'attribution' && (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input value={searchUser} onChange={e => setSearchUser(e.target.value)}
                placeholder="Rechercher un apprenant..." className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0B3D91]/30" />
            </div>
            <select value={selectedBadge} onChange={e => setSelectedBadge(e.target.value)}
              className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#0B3D91]/30 min-w-[200px]">
              <option value="">Tous les badges</option>
              {badges.map(b => <option key={b.id} value={b.id}>{b.icon} {b.name}</option>)}
            </select>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 text-left">
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Apprenant</th>
                  {badges.filter(b => !selectedBadge || b.id === selectedBadge).map(b => (
                    <th key={b.id} className="px-3 py-3 text-xs font-semibold text-gray-500 text-center whitespace-nowrap">
                      {b.icon} {b.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredUsers.slice(0, 50).map(u => (
                  <tr key={u.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-gray-900">{u.full_name || '—'}</p>
                      <p className="text-xs text-gray-400">{u.email}</p>
                    </td>
                    {badges.filter(b => !selectedBadge || b.id === selectedBadge).map(b => {
                      const has = !!userBadges.find(ub => ub.user_id === u.id && ub.badge_id === b.id)
                      return (
                        <td key={b.id} className="px-3 py-3 text-center">
                          <button onClick={() => awardBadge(u.id, b.id)}
                            className={`w-8 h-8 mx-auto rounded-full flex items-center justify-center transition-all ${has ? 'text-2xl' : 'border-2 border-dashed border-gray-200 hover:border-[#0B3D91] text-gray-300 hover:text-[#0B3D91]'}`}
                            title={has ? 'Retirer le badge' : 'Attribuer le badge'}>
                            {has ? b.icon : <Plus className="w-4 h-4" />}
                          </button>
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
