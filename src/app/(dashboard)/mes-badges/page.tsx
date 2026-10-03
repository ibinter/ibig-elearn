import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Award } from 'lucide-react'

export default async function MesBadgesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/connexion')

  const [{ data: userBadges }, { data: allBadges }] = await Promise.all([
    supabase.from('user_badges').select('*, badge:badges(*)').eq('user_id', user.id).order('earned_at', { ascending: false }),
    supabase.from('badges').select('*').eq('is_active', true).order('created_at'),
  ])

  const earnedIds = new Set(userBadges?.map(ub => (ub.badge as any)?.id))
  const locked = allBadges?.filter(b => !earnedIds.has(b.id)) ?? []

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Award className="w-6 h-6 text-[#0B3D91]" /> Mes badges
        </h1>
        <p className="text-gray-500 text-sm mt-1">Vos récompenses et accomplissements</p>
      </div>

      {userBadges?.length === 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center">
          <div className="text-5xl mb-3">🏅</div>
          <p className="font-medium text-gray-600">Pas encore de badge</p>
          <p className="text-sm text-gray-400 mt-1">Complétez des formations pour débloquer vos premiers badges !</p>
        </div>
      )}

      {!!userBadges?.length && (
        <div>
          <h2 className="text-sm font-bold text-gray-500 uppercase mb-3">Obtenus ({userBadges.length})</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {userBadges.map(ub => {
              const b = ub.badge as any
              return (
                <div key={ub.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 text-center hover:shadow-md transition-shadow">
                  <div className="w-16 h-16 rounded-2xl mx-auto mb-3 flex items-center justify-center text-3xl" style={{ background: b.color + '20' }}>
                    {b.icon}
                  </div>
                  <h3 className="font-bold text-gray-900 text-sm">{b.name}</h3>
                  <p className="text-xs text-gray-500 mt-1">{b.description}</p>
                  <p className="text-[11px] text-gray-400 mt-2">
                    Obtenu le {new Date(ub.earned_at).toLocaleDateString('fr-FR')}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {locked.length > 0 && (
        <div>
          <h2 className="text-sm font-bold text-gray-500 uppercase mb-3">À débloquer ({locked.length})</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {locked.map(b => (
              <div key={b.id} className="bg-gray-50 rounded-2xl border border-gray-100 p-5 text-center opacity-60">
                <div className="w-16 h-16 rounded-2xl mx-auto mb-3 flex items-center justify-center text-3xl grayscale" style={{ background: '#f3f4f6' }}>
                  {b.icon}
                </div>
                <h3 className="font-bold text-gray-600 text-sm">{b.name}</h3>
                <p className="text-xs text-gray-400 mt-1">{b.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
