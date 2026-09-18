import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Trophy, Medal, Flame } from 'lucide-react'

const LEVEL_EMOJI: Record<string, string> = {
  débutant: '🌱', intermédiaire: '📈', avancé: '🔥', expert: '⭐', maître: '🏆'
}

export default async function ClassementPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/connexion')

  const { data: top } = await supabase
    .from('profiles')
    .select('id, full_name, points, level, streak_days, country')
    .order('points', { ascending: false })
    .limit(50)

  const myRank = (top ?? []).findIndex(u => u.id === user.id) + 1
  const me = (top ?? []).find(u => u.id === user.id)

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="w-14 h-14 ibig-gradient rounded-2xl flex items-center justify-center mx-auto mb-3">
          <Trophy className="w-7 h-7 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Classement</h1>
        <p className="text-gray-500 text-sm mt-1">Les apprenants les plus actifs de la plateforme</p>
      </div>

      {/* Mon rang */}
      {me && (
        <div className="ibig-gradient rounded-2xl p-4 text-white flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center font-bold text-lg flex-shrink-0">
            #{myRank > 0 ? myRank : '—'}
          </div>
          <div className="flex-1">
            <p className="text-sm text-blue-200">Votre position</p>
            <p className="font-bold">{me.full_name ?? 'Vous'}</p>
          </div>
          <div className="text-right">
            <p className="font-bold text-xl">{(me.points ?? 0).toLocaleString('fr')}</p>
            <p className="text-xs text-blue-200">points</p>
          </div>
        </div>
      )}

      {/* Top 3 podium */}
      {(top ?? []).length >= 3 && (
        <div className="grid grid-cols-3 gap-3">
          {[1, 0, 2].map((i) => {
            const u = top![i]
            if (!u) return null
            const rank = i + 1
            const heights = [28, 36, 24]
            const sizes = ['text-2xl', 'text-3xl', 'text-2xl']
            const colors = ['bg-gray-100', 'ibig-gradient text-white', 'bg-gray-100']
            const isMe = u.id === user.id
            return (
              <div key={u.id} className={`rounded-2xl p-4 text-center ${i === 0 ? colors[1] : colors[0]} ${isMe ? 'ring-2 ring-[#FFA500]' : ''}`}>
                <div className={`${sizes[i === 0 ? 1 : i]} mb-1`}>
                  {rank === 1 ? '🥇' : rank === 2 ? '🥈' : '🥉'}
                </div>
                <div className={`w-8 h-8 rounded-full ${i === 0 ? 'bg-white/20' : 'ibig-gradient'} flex items-center justify-center mx-auto mb-2`}>
                  <span className={`text-sm font-bold ${i === 0 ? 'text-white' : 'text-white'}`}>
                    {(u.full_name ?? '?')[0].toUpperCase()}
                  </span>
                </div>
                <p className={`text-xs font-semibold truncate ${i === 0 ? 'text-white' : 'text-gray-900'}`}>
                  {u.id === user.id ? 'Vous' : (u.full_name?.split(' ')[0] ?? '—')}
                </p>
                <p className={`text-sm font-bold mt-0.5 ${i === 0 ? 'text-white' : 'text-[#0B3D91]'}`}>
                  {(u.points ?? 0).toLocaleString('fr')} pts
                </p>
              </div>
            )
          })}
        </div>
      )}

      {/* Liste complète */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="divide-y divide-gray-50">
          {(top ?? []).map((u, idx) => {
            const rank = idx + 1
            const isMe = u.id === user.id
            return (
              <div key={u.id} className={`flex items-center gap-3 px-4 py-3 ${isMe ? 'bg-blue-50/40' : 'hover:bg-gray-50/40'} transition-colors`}>
                {/* Rang */}
                <div className="w-8 text-center flex-shrink-0">
                  {rank <= 3 ? (
                    <span className="text-lg">{rank === 1 ? '🥇' : rank === 2 ? '🥈' : '🥉'}</span>
                  ) : (
                    <span className="text-sm font-semibold text-gray-400">{rank}</span>
                  )}
                </div>
                {/* Avatar */}
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0 ${isMe ? 'ibig-gradient ring-2 ring-[#FFA500]' : 'bg-gray-200 text-gray-500'}`}>
                  {(u.full_name ?? '?')[0].toUpperCase()}
                </div>
                {/* Nom + niveau */}
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-semibold truncate ${isMe ? 'text-[#0B3D91]' : 'text-gray-900'}`}>
                    {isMe ? 'Vous' : (u.full_name ?? '—')}
                  </p>
                  <p className="text-xs text-gray-400">
                    {LEVEL_EMOJI[u.level ?? 'débutant']} {u.level ?? 'débutant'}
                    {u.country ? ` · ${u.country}` : ''}
                  </p>
                </div>
                {/* Streak */}
                {(u.streak_days ?? 0) > 0 && (
                  <div className="flex items-center gap-1 text-orange-500 flex-shrink-0">
                    <Flame className="w-3.5 h-3.5" />
                    <span className="text-xs font-semibold">{u.streak_days}</span>
                  </div>
                )}
                {/* Points */}
                <div className="text-right flex-shrink-0 w-20">
                  <p className="text-sm font-bold text-gray-900">{(u.points ?? 0).toLocaleString('fr')}</p>
                  <p className="text-xs text-gray-400">points</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Légende points */}
      <div className="bg-gray-50 rounded-2xl p-4 text-xs text-gray-500 text-center">
        <Medal className="w-4 h-4 inline mr-1 text-[#0B3D91]" />
        Les points sont calculés à partir des leçons terminées, des formations complétées, du streak quotidien et des parrainages.
      </div>
    </div>
  )
}
