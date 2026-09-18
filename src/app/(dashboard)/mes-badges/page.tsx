import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import BadgesList from '@/components/ui/BadgesList'
import { Trophy } from 'lucide-react'

export default async function MesBadgesPage() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: (cs) => cs.forEach(({ name, value, options }) => cookieStore.set(name, value, options)) } }
  )
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/connexion')

  const [{ data: profile }, { data: progress }, { data: certs }, { data: referrals }] = await Promise.all([
    supabase.from('profiles').select('points, streak_days, level').eq('id', user.id).single(),
    supabase.from('lesson_progress').select('is_completed, course_id').eq('user_id', user.id),
    supabase.from('certificates').select('id').eq('user_id', user.id),
    supabase.from('referrals').select('id').eq('referrer_id', user.id).eq('status', 'rewarded'),
  ])

  const completedLessons = (progress ?? []).filter(r => r.is_completed).length
  const completedCourses = new Set(
    (progress ?? []).filter(r => r.is_completed && r.course_id).map(r => r.course_id)
  ).size

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 ibig-gradient rounded-xl flex items-center justify-center">
          <Trophy className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Mes badges</h1>
          <p className="text-sm text-gray-500">Accomplissements et récompenses</p>
        </div>
      </div>

      <BadgesList
        points={profile?.points ?? 0}
        streakDays={profile?.streak_days ?? 0}
        completedLessons={completedLessons}
        completedCourses={completedCourses}
        certificatesCount={certs?.length ?? 0}
        referralsCount={referrals?.length ?? 0}
      />
    </div>
  )
}
