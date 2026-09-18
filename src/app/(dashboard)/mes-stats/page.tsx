import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { BarChart2, Clock, BookOpen, Flame, Award, TrendingUp } from 'lucide-react'

export default async function MesStatsPage() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: (cs) => cs.forEach(({ name, value, options }) => cookieStore.set(name, value, options)) } }
  )
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/connexion')

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, points, streak_days, level')
    .eq('id', user.id)
    .single()

  const { data: progress } = await supabase
    .from('lesson_progress')
    .select('watch_time_seconds, is_completed, updated_at, course_id')
    .eq('user_id', user.id)

  const { data: certs } = await supabase
    .from('certificates')
    .select('id')
    .eq('user_id', user.id)

  const { data: enrollments } = await supabase
    .from('enrollments')
    .select('id')
    .eq('user_id', user.id)

  const totalWatch = (progress ?? []).reduce((s, r) => s + (r.watch_time_seconds ?? 0), 0)
  const totalHours = Math.floor(totalWatch / 3600)
  const totalMin = Math.floor((totalWatch % 3600) / 60)
  const completedLessons = (progress ?? []).filter(r => r.is_completed).length
  const totalEnrollments = enrollments?.length ?? 0
  const totalCerts = certs?.length ?? 0

  // Activité par jour sur les 30 derniers jours
  const now = new Date()
  const days30 = Array.from({ length: 30 }, (_, i) => {
    const d = new Date(now)
    d.setDate(d.getDate() - (29 - i))
    return d.toISOString().slice(0, 10)
  })

  const activityMap: Record<string, number> = {}
  for (const row of progress ?? []) {
    const day = row.updated_at?.slice(0, 10)
    if (day) activityMap[day] = (activityMap[day] ?? 0) + (row.watch_time_seconds ?? 0)
  }

  const maxActivity = Math.max(...days30.map(d => activityMap[d] ?? 0), 1)

  const levelLabels: Record<string, string> = {
    débutant: 'Débutant', intermédiaire: 'Intermédiaire',
    avancé: 'Avancé', expert: 'Expert', maître: 'Maître',
  }
  const levelColors: Record<string, string> = {
    débutant: 'text-gray-500', intermédiaire: 'text-blue-500',
    avancé: 'text-purple-500', expert: 'text-orange-500', maître: 'text-yellow-500',
  }

  function fmtMin(sec: number) {
    const m = Math.floor(sec / 60)
    if (m < 60) return `${m} min`
    return `${Math.floor(m / 60)}h${String(m % 60).padStart(2, '0')}`
  }

  const kpis = [
    { icon: Clock, label: 'Temps total', value: totalHours > 0 ? `${totalHours}h ${totalMin}min` : `${totalMin} min`, color: 'text-blue-600', bg: 'bg-blue-50' },
    { icon: BookOpen, label: 'Leçons terminées', value: completedLessons.toString(), color: 'text-green-600', bg: 'bg-green-50' },
    { icon: TrendingUp, label: 'Formations suivies', value: totalEnrollments.toString(), color: 'text-purple-600', bg: 'bg-purple-50' },
    { icon: Award, label: 'Certificats obtenus', value: totalCerts.toString(), color: 'text-yellow-600', bg: 'bg-yellow-50' },
    { icon: Flame, label: 'Streak actuel', value: `${profile?.streak_days ?? 0} jours`, color: 'text-orange-600', bg: 'bg-orange-50' },
    { icon: BarChart2, label: 'Points', value: (profile?.points ?? 0).toLocaleString('fr'), color: 'text-pink-600', bg: 'bg-pink-50' },
  ]

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Mes statistiques</h1>
        <p className="text-gray-500 text-sm">Suivez votre progression et vos habitudes d&apos;apprentissage.</p>
      </div>

      {/* Niveau */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
        <div className="w-12 h-12 ibig-gradient rounded-xl flex items-center justify-center text-2xl flex-shrink-0">
          {profile?.level === 'maître' ? '🏆' : profile?.level === 'expert' ? '⭐' : profile?.level === 'avancé' ? '🔥' : profile?.level === 'intermédiaire' ? '📈' : '🌱'}
        </div>
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold">Niveau actuel</p>
          <p className={`text-xl font-bold ${levelColors[profile?.level ?? 'débutant'] ?? 'text-gray-700'}`}>
            {levelLabels[profile?.level ?? 'débutant'] ?? 'Débutant'}
          </p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {kpis.map(({ icon: Icon, label, value, color, bg }) => (
          <div key={label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <div className={`w-9 h-9 ${bg} rounded-xl flex items-center justify-center mb-3`}>
              <Icon className={`w-4.5 h-4.5 ${color}`} />
            </div>
            <p className="text-xs text-gray-500 font-medium">{label}</p>
            <p className="text-xl font-bold text-gray-900 mt-0.5">{value}</p>
          </div>
        ))}
      </div>

      {/* Heatmap activité 30j */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <h2 className="font-bold text-gray-900 mb-4">Activité — 30 derniers jours</h2>
        <div className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(30, minmax(0, 1fr))` }}>
          {days30.map(day => {
            const sec = activityMap[day] ?? 0
            const ratio = sec / maxActivity
            const bg = sec === 0
              ? 'bg-gray-100'
              : ratio < 0.25 ? 'bg-blue-100'
              : ratio < 0.5 ? 'bg-blue-300'
              : ratio < 0.75 ? 'bg-blue-500'
              : 'bg-[#0B3D91]'
            return (
              <div
                key={day}
                title={`${day}: ${fmtMin(sec)}`}
                className={`aspect-square rounded-sm ${bg} cursor-default`}
              />
            )
          })}
        </div>
        <div className="flex gap-2 items-center mt-3 text-xs text-gray-400">
          <span>Moins</span>
          {['bg-gray-100', 'bg-blue-100', 'bg-blue-300', 'bg-blue-500', 'bg-[#0B3D91]'].map(c => (
            <div key={c} className={`w-4 h-4 rounded-sm ${c}`} />
          ))}
          <span>Plus</span>
        </div>
      </div>

      {/* Top cours actifs */}
      {(progress ?? []).length > 0 && (() => {
        const courseTime: Record<string, number> = {}
        for (const r of progress ?? []) {
          if (r.course_id) courseTime[r.course_id] = (courseTime[r.course_id] ?? 0) + (r.watch_time_seconds ?? 0)
        }
        const top = Object.entries(courseTime).sort((a, b) => b[1] - a[1]).slice(0, 3)
        if (top.length === 0) return null
        return (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h2 className="font-bold text-gray-900 mb-4">Formations les plus suivies</h2>
            <div className="space-y-3">
              {top.map(([, sec], i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-lg">{i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'}</span>
                  <div className="flex-1">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-500 text-xs">Formation #{i + 1}</span>
                      <span className="text-gray-700 text-xs font-medium">{fmtMin(sec)}</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full">
                      <div
                        className="h-full ibig-gradient rounded-full"
                        style={{ width: `${(sec / top[0][1]) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      })()}

      {/* Vide */}
      {completedLessons === 0 && (
        <div className="text-center py-12 text-gray-400">
          <BarChart2 className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>Commencez une formation pour voir vos statistiques apparaître ici.</p>
        </div>
      )}
    </div>
  )
}
