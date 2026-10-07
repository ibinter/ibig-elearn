import { createClient } from '@/lib/supabase/server'
import { Award } from 'lucide-react'
import BadgesManager from './BadgesManager'

export default async function BadgesPage() {
  const supabase = await createClient()

  const [{ data: badges }, { data: users }, { data: userBadges }] = await Promise.all([
    supabase.from('badges').select('*').order('created_at'),
    supabase.from('profiles').select('id, full_name, email, avatar_url').order('full_name'),
    supabase.from('user_badges').select('id, user_id, badge_id, earned_at'),
  ])

  const totalAwarded = userBadges?.length ?? 0
  const usersWithBadge = new Set(userBadges?.map(ub => ub.user_id)).size

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Award className="w-6 h-6 text-[#0B3D91]" /> Badges de compétences
        </h1>
        <p className="text-gray-500 text-sm mt-1">Créez et attribuez des badges pour récompenser les apprenants</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <div className="text-2xl font-bold text-[#0B3D91]">{badges?.length ?? 0}</div>
          <div className="text-xs text-gray-500 mt-1">Badges créés</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <div className="text-2xl font-bold text-green-600">{totalAwarded}</div>
          <div className="text-xs text-gray-500 mt-1">Attributions totales</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <div className="text-2xl font-bold text-[#FFA500]">{usersWithBadge}</div>
          <div className="text-xs text-gray-500 mt-1">Apprenants récompensés</div>
        </div>
      </div>

      <BadgesManager
        badges={badges ?? []}
        users={users ?? []}
        userBadges={userBadges ?? []}
      />
    </div>
  )
}
