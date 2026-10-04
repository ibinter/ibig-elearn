import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { BarChart2, Clock, BookOpen, Flame, Award, TrendingUp } from 'lucide-react'

export default async function MesStatsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/connexion')

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, xp_points, xp_level, streak_days, longest_streak')
    .eq('id', user.id)
    .single()

  const { data: xpHistory } = await supabase
    .from('xp_events')
    .select('event_type, xp_gained, ref_label, streak_day, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(20)

  const { data: progress } = await supabase
    .from('lesson_progress')
    .select('watch_time_seconds, is_completed, updated_at, course_id')
    .eq('user_id', user.id)

  const { data: certs } = await supabase.from('certificates').select('id').eq('user_id', user.id)
  const { data: enrollments } = await supabase.from('enrollments').select('id').eq('user_id', user.id)

  const totalWatch = (progress ?? []).reduce((s, r) => s + (r.watch_time_seconds ?? 0), 0)
  const totalHours = Math.floor(totalWatch / 3600)
  const totalMin = Math.floor((totalWatch % 3600) / 60)
  const completedLessons = (progress ?? []).filter(r => r.is_completed).length

  // Activity map par jour
  const activityMap: Record<string, number> = {}
  for (const row of progress ?? []) {
    const day = row.updated_at?.slice(0, 10)
    if (day) activityMap[day] = (activityMap[day] ?? 0) + (row.watch_time_seconds ?? 0)
  }

  // Calendrier GitHub-style — 16 semaines (112 jours) → 7 lignes × 16 colonnes
  const WEEKS = 16
  const today = new Date()
  // Trouver dimanche de la semaine courante ou le lundi selon préférence
  const startOffset = today.getDay() // 0=Sun…6=Sat
  const gridDays: string[] = []
  for (let i = WEEKS * 7 - 1; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    gridDays.push(d.toISOString().slice(0, 10))
  }

  const maxActivity = Math.max(...gridDays.map(d => activityMap[d] ?? 0), 1)

  function cellColor(sec: number) {
    if (sec === 0) return '#f3f4f6'
    const r = sec / maxActivity
    if (r < 0.25) return '#bfdbfe'
    if (r < 0.5) return '#60a5fa'
    if (r < 0.75) return '#3b82f6'
    return '#0B3D91'
  }

  function fmtMin(sec: number) {
    const m = Math.floor(sec / 60)
    if (m < 60) return `${m} min`
    return `${Math.floor(m / 60)}h${String(m % 60).padStart(2, '0')}`
  }

  // Semaines glissantes (12 dernières)
  const weeklyData: { label: string; sec: number }[] = []
  for (let w = 11; w >= 0; w--) {
    const wStart = new Date(today)
    wStart.setDate(today.getDate() - w * 7 - today.getDay())
    let sec = 0
    for (let d = 0; d < 7; d++) {
      const day = new Date(wStart)
      day.setDate(wStart.getDate() + d)
      sec += activityMap[day.toISOString().slice(0, 10)] ?? 0
    }
    weeklyData.push({ label: `S${12 - w}`, sec })
  }
  const maxWeek = Math.max(...weeklyData.map(w => w.sec), 1)

  const IBIG_LEVELS = [
    { name: 'Explorateur', min: 0,     max: 499,   emoji: '🌱', color: 'text-green-600' },
    { name: 'Apprenti',    min: 500,   max: 1499,  emoji: '📚', color: 'text-blue-600' },
    { name: 'Pratiquant',  min: 1500,  max: 3999,  emoji: '⚡', color: 'text-purple-600' },
    { name: 'Expert',      min: 4000,  max: 9999,  emoji: '🏆', color: 'text-orange-600' },
    { name: 'Maître IBIG', min: 10000, max: 99999, emoji: '👑', color: 'text-yellow-600' },
  ]
  const xpPoints = (profile as any)?.xp_points ?? 0
  const xpLevel  = (profile as any)?.xp_level ?? 'Explorateur'
  const longestStreak = (profile as any)?.longest_streak ?? 0
  const currentLvlInfo = IBIG_LEVELS.find(l => l.name === xpLevel) ?? IBIG_LEVELS[0]

  const XP_EVENT_LABELS: Record<string, string> = {
    lesson_completed:   '📖 Leçon terminée',
    quiz_passed:        '✅ Quiz réussi',
    module_completed:   '🎯 Module terminé',
    course_completed:   '🏅 Formation terminée',
    assignment_passed:  '📝 Devoir réussi',
    streak_bonus:       '🔥 Bonus streak',
    daily_streak:       '🔥 Streak journalier',
  }

  const kpis = [
    { icon: Clock, label: 'Temps total', value: totalHours > 0 ? `${totalHours}h ${totalMin}min` : `${totalMin} min`, color: 'text-blue-600', bg: 'bg-blue-50' },
    { icon: BookOpen, label: 'Leçons terminées', value: completedLessons.toString(), color: 'text-green-600', bg: 'bg-green-50' },
    { icon: TrendingUp, label: 'Formations suivies', value: (enrollments?.length ?? 0).toString(), color: 'text-purple-600', bg: 'bg-purple-50' },
    { icon: Award, label: 'Certificats obtenus', value: (certs?.length ?? 0).toString(), color: 'text-yellow-600', bg: 'bg-yellow-50' },
    { icon: Flame, label: 'Streak actuel', value: `${profile?.streak_days ?? 0} jours`, color: 'text-orange-600', bg: 'bg-orange-50' },
    { icon: BarChart2, label: 'XP total', value: xpPoints.toLocaleString('fr'), color: 'text-pink-600', bg: 'bg-pink-50' },
  ]

  const DAYS_FR = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam']

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Mes statistiques</h1>
        <p className="text-gray-500 text-sm">Suivez votre progression et vos habitudes d&apos;apprentissage.</p>
      </div>

      {/* Niveau XP */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-12 h-12 ibig-gradient rounded-xl flex items-center justify-center text-2xl flex-shrink-0">
            {currentLvlInfo.emoji}
          </div>
          <div className="flex-1">
            <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold">Niveau IBIG</p>
            <p className={`text-xl font-bold ${currentLvlInfo.color}`}>{xpLevel}</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-gray-900">{xpPoints.toLocaleString('fr')}</p>
            <p className="text-xs text-gray-400">XP total</p>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {IBIG_LEVELS.map((l, i) => {
            const lvlIdx = IBIG_LEVELS.findIndex(x => x.name === xpLevel)
            const isActive = l.name === xpLevel
            const isDone = i < lvlIdx
            return (
              <div key={l.name} className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl text-xs ${isActive ? 'bg-[#0B3D91] text-white' : isDone ? 'bg-green-50 text-green-700' : 'bg-gray-50 text-gray-400'}`}>
                <span className="text-base">{isDone ? '✅' : l.emoji}</span>
                <span className="font-semibold text-center leading-tight">{l.name}</span>
                {!isDone && !isActive && <span className="text-[9px] opacity-70">{l.min.toLocaleString()} XP</span>}
                {isActive && <span className="text-[9px] opacity-70">ACTUEL</span>}
              </div>
            )
          })}
        </div>
        <div className="flex items-center gap-4 mt-4 text-sm text-gray-600">
          <div className="flex items-center gap-1.5"><Flame className="w-4 h-4 text-orange-500" /> <span>Streak actuel : <strong>{profile?.streak_days ?? 0} jours</strong></span></div>
          <div className="flex items-center gap-1.5"><TrendingUp className="w-4 h-4 text-purple-500" /> <span>Record : <strong>{longestStreak} jours</strong></span></div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {kpis.map(({ icon: Icon, label, value, color, bg }) => (
          <div key={label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <div className={`w-9 h-9 ${bg} rounded-xl flex items-center justify-center mb-3`}>
              <Icon className={`w-4 h-4 ${color}`} />
            </div>
            <p className="text-xs text-gray-500 font-medium">{label}</p>
            <p className="text-xl font-bold text-gray-900 mt-0.5">{value}</p>
          </div>
        ))}
      </div>

      {/* Calendrier contributions style GitHub */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 overflow-x-auto">
        <h2 className="font-bold text-gray-900 mb-4">Calendrier d&apos;activité — 16 semaines</h2>
        <div className="flex gap-1 min-w-max">
          {/* Étiquettes jours */}
          <div className="flex flex-col gap-1 mr-1">
            {DAYS_FR.map(d => (
              <div key={d} className="h-4 text-[9px] text-gray-400 leading-4 w-6">{d}</div>
            ))}
          </div>
          {/* Grille semaines */}
          {Array.from({ length: WEEKS }, (_, col) => (
            <div key={col} className="flex flex-col gap-1">
              {Array.from({ length: 7 }, (_, row) => {
                const idx = col * 7 + row
                const day = gridDays[idx]
                const sec = day ? (activityMap[day] ?? 0) : 0
                return (
                  <div
                    key={row}
                    title={day ? `${day}: ${fmtMin(sec)}` : ''}
                    className="w-4 h-4 rounded-sm cursor-default transition-opacity hover:opacity-70"
                    style={{ backgroundColor: day ? cellColor(sec) : '#f9fafb' }}
                  />
                )
              })}
            </div>
          ))}
        </div>
        <div className="flex gap-2 items-center mt-3 text-xs text-gray-400">
          <span>Moins</span>
          {['#f3f4f6', '#bfdbfe', '#60a5fa', '#3b82f6', '#0B3D91'].map(c => (
            <div key={c} className="w-4 h-4 rounded-sm" style={{ backgroundColor: c }} />
          ))}
          <span>Plus</span>
        </div>
      </div>

      {/* Graphique barres hebdomadaire SVG */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <h2 className="font-bold text-gray-900 mb-4">Temps d&apos;apprentissage par semaine</h2>
        <svg viewBox={`0 0 ${12 * 32} 100`} className="w-full h-28 overflow-visible">
          {weeklyData.map((w, i) => {
            const barH = maxWeek > 0 ? Math.max((w.sec / maxWeek) * 70, w.sec > 0 ? 3 : 0) : 0
            const x = i * 32 + 4
            const y = 74 - barH
            return (
              <g key={i}>
                <rect x={x} y={y} width={24} height={barH} rx={4}
                  fill={w.sec > 0 ? '#3b82f6' : '#e5e7eb'}
                  className="transition-colors"
                />
                <title>{w.label}: {fmtMin(w.sec)}</title>
                <text x={x + 12} y={90} textAnchor="middle" fontSize={8} fill="#9ca3af">{w.label}</text>
              </g>
            )
          })}
        </svg>
      </div>

      {/* Historique XP */}
      {xpHistory && xpHistory.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h2 className="font-bold text-gray-900 mb-4">Historique XP récent</h2>
          <div className="space-y-2">
            {xpHistory.map((ev: any, i: number) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {XP_EVENT_LABELS[ev.event_type] ?? ev.event_type}
                  </p>
                  {ev.ref_label && <p className="text-xs text-gray-400 truncate max-w-xs">{ev.ref_label}</p>}
                </div>
                <div className="text-right flex-shrink-0 ml-4">
                  <p className="text-sm font-bold text-[#FFA500]">+{ev.xp_gained} XP</p>
                  <p className="text-[10px] text-gray-400">{new Date(ev.created_at).toLocaleDateString('fr-FR')}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {completedLessons === 0 && (
        <div className="text-center py-12 text-gray-400">
          <BarChart2 className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>Commencez une formation pour voir vos statistiques apparaître ici.</p>
        </div>
      )}
    </div>
  )
}
