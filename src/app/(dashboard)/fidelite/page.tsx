import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Trophy, Star, Gift, Zap, Share2, BookOpen, Award } from 'lucide-react'

const REWARDS = [
  { points: 500, label: 'Accès 1 cours gratuit', icon: BookOpen, color: 'from-blue-500 to-blue-700' },
  { points: 1000, label: 'Réduction 20% sur votre prochain achat', icon: Star, color: 'from-yellow-400 to-orange-500' },
  { points: 2000, label: 'Coaching individuel 30 min', icon: Award, color: 'from-purple-500 to-purple-700' },
  { points: 5000, label: 'Accès Premium 1 mois offert', icon: Trophy, color: 'from-emerald-500 to-teal-600' },
]

const POINT_RULES = [
  { icon: BookOpen, label: 'Compléter une formation', points: 100, color: 'text-blue-600 bg-blue-50' },
  { icon: Star, label: 'Laisser un avis', points: 25, color: 'text-yellow-600 bg-yellow-50' },
  { icon: Zap, label: 'Compléter en moins de 7 jours', points: 50, color: 'text-orange-600 bg-orange-50' },
  { icon: Share2, label: 'Parrainer un ami', points: 200, color: 'text-green-600 bg-green-50' },
]

function getLevelInfo(pts: number) {
  if (pts >= 5000) return { name: 'Diamant', color: 'text-cyan-600', bg: 'bg-cyan-50', nextPts: null, progress: 100 }
  if (pts >= 2000) return { name: 'Or', color: 'text-yellow-600', bg: 'bg-yellow-50', nextPts: 5000, progress: ((pts - 2000) / 3000) * 100 }
  if (pts >= 500) return { name: 'Argent', color: 'text-gray-500', bg: 'bg-gray-100', nextPts: 2000, progress: ((pts - 500) / 1500) * 100 }
  return { name: 'Bronze', color: 'text-orange-600', bg: 'bg-orange-50', nextPts: 500, progress: (pts / 500) * 100 }
}

export default async function FidelitePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/connexion')

  const [{ data: profile }, { data: history }] = await Promise.all([
    supabase.from('profiles').select('full_name, loyalty_points_total').eq('id', user.id).single(),
    supabase.from('loyalty_points').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(20),
  ])

  const totalPoints = profile?.loyalty_points_total ?? 0
  const level = getLevelInfo(totalPoints)

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Programme de fidélité</h1>
        <p className="text-gray-500 text-sm mt-1">Gagnez des points, débloquez des récompenses</p>
      </div>

      {/* Score + niveau */}
      <div className="ibig-gradient rounded-2xl p-6 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4" />
        <div className="relative z-10">
          <div className="flex items-end gap-3 mb-4">
            <span className="text-5xl font-bold">{totalPoints.toLocaleString('fr-FR')}</span>
            <span className="text-white/70 pb-1.5">points</span>
          </div>
          <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full ${level.bg} ${level.color} text-sm font-bold mb-4`}>
            <Trophy className="w-4 h-4" /> Niveau {level.name}
          </div>
          {level.nextPts && (
            <div>
              <div className="flex justify-between text-sm text-white/80 mb-1.5">
                <span>Progression vers le niveau suivant</span>
                <span>{totalPoints.toLocaleString('fr-FR')} / {level.nextPts.toLocaleString('fr-FR')} pts</span>
              </div>
              <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                <div className="h-full bg-white rounded-full transition-all" style={{ width: `${Math.min(level.progress, 100)}%` }} />
              </div>
            </div>
          )}
          {!level.nextPts && <p className="text-white/80 text-sm">Vous avez atteint le niveau maximum ! 🎉</p>}
        </div>
      </div>

      {/* Comment gagner des points */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <h2 className="font-bold text-gray-900 mb-4">Comment gagner des points</h2>
        <div className="grid grid-cols-2 gap-3">
          {POINT_RULES.map(r => (
            <div key={r.label} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${r.color}`}>
                <r.icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-700">{r.label}</p>
                <p className="text-sm font-bold text-[#0B3D91]">+{r.points} pts</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Récompenses */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <h2 className="font-bold text-gray-900 mb-4">Récompenses à débloquer</h2>
        <div className="space-y-3">
          {REWARDS.map(r => {
            const unlocked = totalPoints >= r.points
            return (
              <div key={r.points} className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${unlocked ? 'border-[#0B3D91]/20 bg-[#0B3D91]/5' : 'border-gray-100 bg-gray-50 opacity-60'}`}>
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${r.color} flex items-center justify-center flex-shrink-0`}>
                  <r.icon className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900 text-sm">{r.label}</p>
                  <p className="text-xs text-gray-500">{r.points.toLocaleString('fr-FR')} points requis</p>
                </div>
                {unlocked ? (
                  <button className="px-4 py-1.5 bg-[#0B3D91] text-white text-xs font-semibold rounded-lg hover:bg-[#0a3480] transition-colors">
                    Réclamer
                  </button>
                ) : (
                  <span className="text-xs text-gray-400 font-medium">{(r.points - totalPoints).toLocaleString('fr-FR')} pts manquants</span>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Historique */}
      {history && history.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="p-5 border-b border-gray-100">
            <h2 className="font-bold text-gray-900">Historique des points</h2>
          </div>
          <div className="divide-y divide-gray-50">
            {history.map(h => (
              <div key={h.id} className="flex items-center justify-between px-5 py-3.5">
                <div>
                  <p className="text-sm font-medium text-gray-800">{h.reason}</p>
                  <p className="text-xs text-gray-400">{new Date(h.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                </div>
                <span className="font-bold text-green-600 text-sm">+{h.points}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
