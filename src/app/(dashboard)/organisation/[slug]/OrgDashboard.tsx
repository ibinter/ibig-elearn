'use client'

import { useState } from 'react'
import { Users, BookOpen, TrendingUp, Award, Mail, Crown, ChevronRight, Search, Building2, UserPlus } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Props {
  org: any
  userRole: string
  cohorts: any[]
  members: any[]
  stats: { totalMembers: number; activeThisWeek: number; totalSeats: number; usedSeats: number }
}

const ROLE_LABELS: Record<string, string> = {
  owner: '👑 Propriétaire', admin: '🔧 Admin', manager: '📋 Manager', learner: '📚 Apprenant'
}
const ROLE_COLORS: Record<string, string> = {
  owner: 'bg-purple-100 text-purple-700', admin: 'bg-blue-100 text-blue-700',
  manager: 'bg-orange-100 text-orange-700', learner: 'bg-gray-100 text-gray-600',
}

type Tab = 'overview' | 'members' | 'cohorts'

export default function OrgDashboard({ org, userRole, cohorts, members, stats }: Props) {
  const [tab, setTab] = useState<Tab>('overview')
  const [search, setSearch] = useState('')

  const activeMembers = members.filter(m => m.is_active)
  const filteredMembers = activeMembers.filter(m => {
    const p = m.profiles as any
    const q = search.toLowerCase()
    return !q || (p?.full_name ?? '').toLowerCase().includes(q) || (p?.email ?? '').toLowerCase().includes(q)
  })

  return (
    <div className="min-h-screen bg-gray-50">
      {/* En-tête organisation */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-6 py-6">
          <div className="flex items-center gap-4">
            {org.logo_url ? (
              <img src={org.logo_url} alt={org.name} className="w-14 h-14 rounded-xl object-cover border border-gray-200" />
            ) : (
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#0B3D91] to-[#FFA500] flex items-center justify-center">
                <Building2 className="w-7 h-7 text-white" />
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black text-gray-900">{org.name}</h1>
                <span className={cn('text-xs px-2 py-0.5 rounded-full font-semibold capitalize',
                  org.plan === 'enterprise' ? 'bg-purple-100 text-purple-700' :
                  org.plan === 'business' ? 'bg-blue-100 text-blue-700' :
                  'bg-gray-100 text-gray-600'
                )}>
                  {org.plan}
                </span>
              </div>
              <p className="text-sm text-gray-500 mt-0.5">{ROLE_LABELS[userRole]} · {org.country}</p>
            </div>
            <div className="ml-auto flex gap-2">
              <button className="flex items-center gap-2 bg-[#0B3D91] text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-[#0a3480] transition-colors">
                <UserPlus className="w-4 h-4" /> Inviter des membres
              </button>
            </div>
          </div>

          {/* Onglets */}
          <div className="flex gap-0 mt-5 border-b border-gray-200 -mb-px">
            {([
              { id: 'overview', label: 'Vue d\'ensemble', icon: TrendingUp },
              { id: 'members',  label: `Membres (${activeMembers.length})`, icon: Users },
              { id: 'cohorts',  label: `Cohortes (${cohorts.length})`, icon: BookOpen },
            ] as { id: Tab; label: string; icon: any }[]).map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={cn(
                  'flex items-center gap-1.5 px-4 py-3 text-sm font-medium border-b-2 transition-colors',
                  tab === t.id
                    ? 'border-[#0B3D91] text-[#0B3D91]'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                )}
              >
                <t.icon className="w-4 h-4" /> {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">

        {/* VUE D'ENSEMBLE */}
        {tab === 'overview' && (
          <div className="space-y-6">
            {/* KPIs */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: 'Membres actifs', value: stats.totalMembers, icon: Users, color: 'text-blue-600 bg-blue-50' },
                { label: 'Actifs cette semaine', value: stats.activeThisWeek, icon: TrendingUp, color: 'text-green-600 bg-green-50' },
                { label: 'Cohortes', value: cohorts.filter(c => c.is_active).length, icon: BookOpen, color: 'text-orange-600 bg-orange-50' },
                { label: `Sièges (${stats.usedSeats}/${stats.totalSeats})`, value: `${Math.round((stats.usedSeats/stats.totalSeats)*100)}%`, icon: Award, color: 'text-purple-600 bg-purple-50' },
              ].map(kpi => (
                <div key={kpi.label} className="bg-white rounded-xl border border-gray-200 p-5">
                  <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center mb-3', kpi.color)}>
                    <kpi.icon className="w-5 h-5" />
                  </div>
                  <p className="text-2xl font-black text-gray-900">{kpi.value}</p>
                  <p className="text-sm text-gray-500 mt-0.5">{kpi.label}</p>
                </div>
              ))}
            </div>

            {/* Top apprenants */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Crown className="w-5 h-5 text-[#FFA500]" /> Top apprenants cette semaine
              </h2>
              <div className="space-y-3">
                {activeMembers
                  .sort((a, b) => ((b.profiles as any)?.xp_points ?? 0) - ((a.profiles as any)?.xp_points ?? 0))
                  .slice(0, 5)
                  .map((m, i) => {
                    const p = m.profiles as any
                    const initials = (p?.full_name ?? '?').split(' ').map((w: string) => w[0]).join('').slice(0,2).toUpperCase()
                    return (
                      <div key={m.id} className="flex items-center gap-3">
                        <span className="w-6 text-sm font-bold text-gray-400 text-center">{i+1}</span>
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#0B3D91] to-[#FFA500] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                          {p?.avatar_url ? <img src={p.avatar_url} className="w-full h-full rounded-full object-cover" /> : initials}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{p?.full_name ?? 'Membre'}</p>
                          <p className="text-xs text-gray-400">{p?.xp_level}</p>
                        </div>
                        <span className="text-sm font-bold text-[#0B3D91]">{(p?.xp_points ?? 0).toLocaleString('fr-FR')} XP</span>
                      </div>
                    )
                  })}
              </div>
            </div>
          </div>
        )}

        {/* MEMBRES */}
        {tab === 'members' && (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex items-center gap-3">
              <div className="flex-1 relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text" placeholder="Rechercher un membre…" value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#0B3D91]"
                />
              </div>
              <span className="text-sm text-gray-500">{filteredMembers.length} résultat{filteredMembers.length > 1 ? 's' : ''}</span>
            </div>
            <div className="divide-y divide-gray-50">
              {filteredMembers.map(m => {
                const p = m.profiles as any
                const initials = (p?.full_name ?? '?').split(' ').map((w: string) => w[0]).join('').slice(0,2).toUpperCase()
                return (
                  <div key={m.id} className="flex items-center gap-4 px-4 py-3 hover:bg-gray-50 transition-colors">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#0B3D91] to-[#FFA500] flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                      {p?.avatar_url ? <img src={p.avatar_url} className="w-full h-full rounded-full object-cover" alt="" /> : initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 text-sm">{p?.full_name ?? 'Membre'}</p>
                      <p className="text-xs text-gray-400">{p?.email}</p>
                    </div>
                    <span className={cn('text-xs px-2.5 py-1 rounded-full font-medium', ROLE_COLORS[m.role])}>
                      {ROLE_LABELS[m.role]}
                    </span>
                    <div className="text-right">
                      <p className="text-sm font-bold text-gray-700">{(p?.xp_points ?? 0).toLocaleString('fr-FR')} XP</p>
                      <p className="text-xs text-gray-400">{p?.xp_level}</p>
                    </div>
                  </div>
                )
              })}
              {filteredMembers.length === 0 && (
                <div className="text-center py-12 text-gray-400">
                  <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p>Aucun membre trouvé</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* COHORTES */}
        {tab === 'cohorts' && (
          <div className="space-y-4">
            <div className="flex justify-end">
              <button className="flex items-center gap-2 bg-[#0B3D91] text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-[#0a3480] transition-colors">
                <BookOpen className="w-4 h-4" /> Nouvelle cohorte
              </button>
            </div>
            {cohorts.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-200 py-16 text-center text-gray-400">
                <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-30" />
                <p className="font-medium">Aucune cohorte</p>
                <p className="text-sm mt-1">Créez des groupes d'apprenants et assignez-leur des formations.</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {cohorts.map(cohort => {
                  const memberCount = cohort.cohort_members?.[0]?.count ?? 0
                  return (
                    <div key={cohort.id} className="bg-white rounded-xl border border-gray-200 p-5 hover:border-[#0B3D91]/30 transition-colors cursor-pointer">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-bold text-gray-900">{cohort.name}</h3>
                            {!cohort.is_active && (
                              <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded">Archivée</span>
                            )}
                          </div>
                          {cohort.description && <p className="text-sm text-gray-500">{cohort.description}</p>}
                          <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                            <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" />{memberCount} membres</span>
                            <span className="flex items-center gap-1"><BookOpen className="w-3.5 h-3.5" />{cohort.course_ids?.length ?? 0} formations</span>
                            {cohort.start_date && <span>Début : {new Date(cohort.start_date).toLocaleDateString('fr-FR')}</span>}
                          </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-gray-300 flex-shrink-0" />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
