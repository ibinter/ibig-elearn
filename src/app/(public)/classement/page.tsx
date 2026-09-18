import { createClient } from '@/lib/supabase/server'
import { Trophy, Flame, Star, Award, TrendingUp, Medal } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Classement — IBIG E-LEARN',
  description: 'Les apprenants les plus actifs de la plateforme IBIG E-LEARN.',
}

export const revalidate = 300

const LEVEL_CONFIG: Record<string, { color: string; bg: string; label: string }> = {
  expert:        { color: 'text-cyan-600',   bg: 'bg-cyan-50',   label: '💎 Expert' },
  avancé:        { color: 'text-purple-600', bg: 'bg-purple-50', label: '🔮 Avancé' },
  intermédiaire: { color: 'text-yellow-600', bg: 'bg-yellow-50', label: '⭐ Intermédiaire' },
  débutant:      { color: 'text-green-600',  bg: 'bg-green-50',  label: '🌱 Débutant' },
}

const RANK_COLORS = ['text-yellow-500', 'text-gray-400', 'text-amber-600']
const RANK_BG    = ['bg-yellow-50 border-yellow-200', 'bg-gray-50 border-gray-200', 'bg-amber-50 border-amber-200']

export default async function ClassementPage() {
  const supabase = await createClient()

  const [{ data: topPoints }, { data: topStreaks }, { data: topCerts }] = await Promise.all([
    supabase.from('profiles')
      .select('id, full_name, avatar_url, country, total_points, level, streak_days')
      .gt('total_points', 0)
      .order('total_points', { ascending: false })
      .limit(20),
    supabase.from('profiles')
      .select('id, full_name, country, streak_days, total_points, level')
      .gt('streak_days', 0)
      .order('streak_days', { ascending: false })
      .limit(10),
    supabase.from('profiles')
      .select('id, full_name, country, level')
      .order('full_name')
      .limit(10),
  ])

  const top3 = (topPoints ?? []).slice(0, 3)
  const rest  = (topPoints ?? []).slice(3)

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 bg-yellow-50 border border-yellow-200 rounded-full px-4 py-1.5 text-sm text-yellow-700 font-semibold mb-4">
          <Trophy className="w-4 h-4" /> Classement des apprenants
        </div>
        <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Les champions IBIG E-LEARN</h1>
        <p className="text-gray-500">Complétez des leçons chaque jour pour grimper au classement</p>
      </div>

      {/* Podium top 3 */}
      {top3.length > 0 && (
        <div className="flex items-end justify-center gap-4 mb-10">
          {[top3[1], top3[0], top3[2]].filter(Boolean).map((p: any, idx) => {
            const realRank = idx === 0 ? 1 : idx === 1 ? 0 : 2
            const heights = ['h-24', 'h-32', 'h-20']
            const medals = ['🥈', '🥇', '🥉']
            const lvl = LEVEL_CONFIG[p.level] ?? LEVEL_CONFIG['débutant']
            return (
              <div key={p.id} className="flex flex-col items-center gap-2 flex-1 max-w-[160px]">
                <div className="relative">
                  <div className="w-16 h-16 rounded-full bg-[#0B3D91] flex items-center justify-center text-white text-2xl font-bold border-4 border-white shadow-lg">
                    {p.avatar_url
                      ? <img src={p.avatar_url} className="w-full h-full object-cover rounded-full" alt="" />
                      : p.full_name?.charAt(0)?.toUpperCase()}
                  </div>
                  <span className="absolute -bottom-1 -right-1 text-xl">{medals[realRank]}</span>
                </div>
                <p className="font-bold text-gray-900 text-sm text-center leading-tight">{p.full_name}</p>
                <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${lvl.bg} ${lvl.color}`}>{lvl.label}</span>
                <p className="text-xs text-gray-500">{p.country}</p>
                <div className={`w-full ${heights[realRank]} rounded-t-xl border-2 ${RANK_BG[realRank]} flex flex-col items-center justify-center`}>
                  <p className={`text-2xl font-extrabold ${RANK_COLORS[realRank]}`}>{(p.total_points ?? 0).toLocaleString()}</p>
                  <p className="text-xs text-gray-500">points</p>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-6">
        {/* Classement général */}
        <div className="md:col-span-2 bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-500" />
            <h2 className="font-bold text-gray-900">Top 20 — Points totaux</h2>
          </div>
          <div className="divide-y divide-gray-50">
            {(topPoints ?? []).map((p: any, i) => {
              const lvl = LEVEL_CONFIG[p.level] ?? LEVEL_CONFIG['débutant']
              return (
                <div key={p.id} className="flex items-center gap-3 px-4 py-3">
                  <span className={`w-7 text-center font-bold text-sm ${i < 3 ? RANK_COLORS[i] : 'text-gray-400'}`}>
                    {i < 3 ? ['🥇','🥈','🥉'][i] : `#${i + 1}`}
                  </span>
                  <div className="w-9 h-9 rounded-full bg-[#0B3D91]/10 flex items-center justify-center text-[#0B3D91] font-bold text-sm flex-shrink-0">
                    {p.avatar_url
                      ? <img src={p.avatar_url} className="w-full h-full object-cover rounded-full" alt="" />
                      : p.full_name?.charAt(0)?.toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 text-sm truncate">{p.full_name}</p>
                    <p className="text-xs text-gray-400">{p.country}</p>
                  </div>
                  <span className={`hidden sm:inline text-xs px-2 py-0.5 rounded-full font-medium ${lvl.bg} ${lvl.color}`}>{lvl.label}</span>
                  <div className="text-right flex-shrink-0">
                    <p className="font-bold text-gray-900 text-sm">{(p.total_points ?? 0).toLocaleString()}</p>
                    <p className="text-xs text-gray-400">pts</p>
                  </div>
                </div>
              )
            })}
            {(!topPoints || topPoints.length === 0) && (
              <div className="py-12 text-center text-gray-400 text-sm">
                Soyez le premier à accumuler des points !
              </div>
            )}
          </div>
        </div>

        {/* Colonne droite */}
        <div className="space-y-5">
          {/* Streaks */}
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex items-center gap-2">
              <Flame className="w-5 h-5 text-orange-500" />
              <h2 className="font-bold text-gray-900 text-sm">Meilleures séries</h2>
            </div>
            <div className="divide-y divide-gray-50">
              {(topStreaks ?? []).map((p: any, i) => (
                <div key={p.id} className="flex items-center gap-3 px-4 py-3">
                  <span className="text-xs font-bold text-gray-400 w-5">#{i + 1}</span>
                  <div className="w-7 h-7 rounded-full bg-orange-50 flex items-center justify-center text-orange-600 font-bold text-xs flex-shrink-0">
                    {p.full_name?.charAt(0)?.toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 text-xs truncate">{p.full_name}</p>
                  </div>
                  <div className="flex items-center gap-1 text-orange-500 font-bold text-sm flex-shrink-0">
                    <Flame className="w-3.5 h-3.5" /> {p.streak_days}j
                  </div>
                </div>
              ))}
              {(!topStreaks || topStreaks.length === 0) && (
                <p className="py-6 text-center text-xs text-gray-400">Aucun streak actif</p>
              )}
            </div>
          </div>

          {/* Comment gagner des points */}
          <div className="bg-gradient-to-br from-[#0B3D91] to-blue-700 rounded-2xl p-5 text-white">
            <div className="flex items-center gap-2 mb-3">
              <Star className="w-5 h-5 text-yellow-300" />
              <h3 className="font-bold text-sm">Comment gagner des points</h3>
            </div>
            <ul className="space-y-2 text-sm">
              {[
                { action: 'Compléter une leçon', pts: '+10 pts' },
                { action: 'Streak quotidien', pts: '+2–14 pts' },
                { action: 'Terminer un cours', pts: '+100 pts' },
                { action: 'Laisser un avis', pts: '+25 pts' },
                { action: 'Parrainer un ami', pts: '+200 pts' },
              ].map(r => (
                <li key={r.action} className="flex justify-between text-blue-100">
                  <span>{r.action}</span>
                  <span className="font-bold text-yellow-300">{r.pts}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
