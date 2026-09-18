import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { BookOpen, Award, TrendingUp, ArrowRight, Play, Flame, Star, Zap, Target, Trophy, ChevronRight } from 'lucide-react'
import { formatDate } from '@/lib/utils'

export default async function TableauDeBordPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase
    .from('profiles')
    .select('*, total_points, streak_days, level')
    .eq('id', user!.id)
    .single()

  const { data: enrollments } = await supabase
    .from('enrollments')
    .select('*, course:courses(id, title, slug, thumbnail_url, duration_hours, total_lessons)')
    .eq('user_id', user!.id)
    .order('last_accessed_at', { ascending: false, nullsFirst: false })
    .limit(8)

  const { data: certificates } = await supabase
    .from('certificates')
    .select('*, course:courses(title)')
    .eq('user_id', user!.id)
    .order('issued_at', { ascending: false })
    .limit(3)

  // Prochaine leçon suggérée (formation la plus récente avec progrès > 0 et < 100)
  const inProgress = enrollments?.filter(e => (e.progress_percent ?? 0) > 0 && (e.progress_percent ?? 0) < 100)
    .sort((a, b) => (b.progress_percent ?? 0) - (a.progress_percent ?? 0))
  const nextCourse = inProgress?.[0] ?? enrollments?.find(e => (e.progress_percent ?? 0) === 0)

  // Prochaine leçon à reprendre
  let nextLesson: { id: string; title: string } | null = null
  if (nextCourse) {
    const { data: lesson } = await supabase
      .from('lesson_progress')
      .select('lesson:lessons(id, title)')
      .eq('user_id', user!.id)
      .eq('is_completed', false)
      .order('created_at', { ascending: true })
      .limit(1)
      .single()
    if (lesson?.lesson) nextLesson = lesson.lesson as any
  }

  const stats = {
    total: enrollments?.length ?? 0,
    completed: enrollments?.filter(e => (e.progress_percent ?? 0) >= 100).length ?? 0,
    inProgress: enrollments?.filter(e => (e.progress_percent ?? 0) > 0 && (e.progress_percent ?? 0) < 100).length ?? 0,
    certs: certificates?.length ?? 0,
  }

  const totalPoints = (profile as any)?.total_points ?? 0
  const streakDays = (profile as any)?.streak_days ?? 0
  const level = (profile as any)?.level ?? 'débutant'

  // Calcul niveau suivant
  const levels = ['débutant', 'intermédiaire', 'avancé', 'expert', 'maître']
  const lvlIdx = levels.indexOf(level)
  const nextLevel = levels[Math.min(lvlIdx + 1, levels.length - 1)]
  const pointsPerLevel = 500
  const progressToNext = Math.min(100, ((totalPoints % pointsPerLevel) / pointsPerLevel) * 100)

  const levelColors: Record<string, string> = {
    'débutant': 'from-green-400 to-emerald-500',
    'intermédiaire': 'from-blue-400 to-[#0B3D91]',
    'avancé': 'from-purple-500 to-violet-600',
    'expert': 'from-orange-400 to-[#FFA500]',
    'maître': 'from-yellow-400 to-amber-500',
  }
  const levelGrad = levelColors[level] ?? levelColors['débutant']

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Bienvenue + streak */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bonjour, {profile?.full_name?.split(' ')[0]} 👋</h1>
          <p className="text-gray-500 text-sm mt-0.5">Continuez votre parcours de formation</p>
        </div>
        {streakDays > 0 && (
          <div className="flex items-center gap-2 bg-orange-50 border border-orange-100 px-4 py-2.5 rounded-2xl">
            <Flame className="w-5 h-5 text-[#FFA500]" />
            <span className="font-bold text-orange-700">{streakDays} jour{streakDays > 1 ? 's' : ''} d'affilée !</span>
          </div>
        )}
      </div>

      {/* Carte gamification */}
      <div className={`bg-gradient-to-r ${levelGrad} rounded-2xl p-5 text-white`}>
        <div className="flex flex-wrap items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
              <Trophy className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-xs text-white/70 uppercase tracking-wider">Niveau</p>
              <p className="font-bold text-lg capitalize">{level}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-xs text-white/70 uppercase tracking-wider">Points</p>
              <p className="font-bold text-lg">{totalPoints.toLocaleString()}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
              <Flame className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-xs text-white/70 uppercase tracking-wider">Streak</p>
              <p className="font-bold text-lg">{streakDays}j</p>
            </div>
          </div>
          <div className="flex-1 min-w-[160px]">
            <div className="flex items-center justify-between text-xs text-white/70 mb-1.5">
              <span>Vers {nextLevel}</span>
              <span>{Math.round(progressToNext)}%</span>
            </div>
            <div className="h-2 bg-white/20 rounded-full overflow-hidden">
              <div className="h-full bg-white rounded-full transition-all" style={{ width: `${progressToNext}%` }} />
            </div>
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Formations', value: stats.total, sub: 'inscrites', icon: BookOpen, color: 'text-[#0B3D91] bg-blue-50', href: '/mes-formations' },
          { label: 'En cours', value: stats.inProgress, sub: 'actives', icon: TrendingUp, color: 'text-orange-600 bg-orange-50', href: '/mes-formations' },
          { label: 'Terminées', value: stats.completed, sub: 'complétées', icon: Target, color: 'text-green-600 bg-green-50', href: '/mes-formations' },
          { label: 'Certificats', value: stats.certs, sub: 'obtenus', icon: Award, color: 'text-purple-600 bg-purple-50', href: '/mes-certificats' },
        ].map(s => (
          <Link key={s.label} href={s.href}
            className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md hover:border-[#0B3D91]/20 transition-all group">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${s.color} mb-3`}>
              <s.icon className="w-5 h-5" />
            </div>
            <div className="text-2xl font-bold text-gray-900">{s.value}</div>
            <div className="text-xs text-gray-500">{s.label} <span className="text-gray-400">{s.sub}</span></div>
          </Link>
        ))}
      </div>

      {/* Prochaine leçon suggérée */}
      {nextCourse && (
        <div className="bg-gradient-to-r from-[#0B3D91] to-blue-700 rounded-2xl p-5 text-white flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-white/20 overflow-hidden flex-shrink-0">
            {(nextCourse.course as any)?.thumbnail_url
              ? <img src={(nextCourse.course as any).thumbnail_url} alt="" className="w-full h-full object-cover" />
              : <div className="w-full h-full flex items-center justify-center"><BookOpen className="w-7 h-7 text-white/50" /></div>}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-blue-300 mb-0.5">Reprendre là où vous en étiez</p>
            <p className="font-bold truncate">{(nextCourse.course as any)?.title}</p>
            <div className="flex items-center gap-3 mt-2">
              <div className="flex-1 max-w-[160px] h-1.5 bg-white/20 rounded-full overflow-hidden">
                <div className="h-full bg-[#FFA500] rounded-full" style={{ width: `${nextCourse.progress_percent ?? 0}%` }} />
              </div>
              <span className="text-xs text-blue-200">{nextCourse.progress_percent ?? 0}% complété</span>
            </div>
          </div>
          <Link href={`/apprendre/${(nextCourse.course as any)?.id}/intro`}
            className="flex items-center gap-2 bg-[#FFA500] text-black font-bold text-sm px-5 py-2.5 rounded-xl hover:bg-orange-400 transition-colors whitespace-nowrap flex-shrink-0">
            <Play className="w-4 h-4" /> Continuer
          </Link>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Liste formations */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="p-5 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-bold text-gray-900">Mes formations</h2>
            <Link href="/mes-formations" className="text-sm text-[#0B3D91] hover:underline flex items-center gap-1">
              Voir tout <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="divide-y divide-gray-50">
            {enrollments && enrollments.length > 0 ? enrollments.slice(0, 5).map((e: any) => {
              const pct = e.progress_percent ?? 0
              const isComplete = pct >= 100
              return (
                <div key={e.id} className="p-4 flex items-center gap-4 hover:bg-gray-50/50 transition-colors">
                  <div className="w-14 h-14 rounded-xl bg-gray-100 overflow-hidden flex-shrink-0 relative">
                    {e.course?.thumbnail_url
                      ? <img src={e.course.thumbnail_url} alt="" className="w-full h-full object-cover" />
                      : <div className="w-full h-full ibig-gradient flex items-center justify-center"><BookOpen className="w-6 h-6 text-white/60" /></div>}
                    {isComplete && (
                      <div className="absolute inset-0 bg-green-500/80 flex items-center justify-center">
                        <Award className="w-6 h-6 text-white" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 text-sm truncate">{e.course?.title}</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <div className="flex-1 bg-gray-100 rounded-full h-1.5 overflow-hidden">
                        <div className={`h-1.5 rounded-full transition-all ${isComplete ? 'bg-green-500' : 'bg-[#0B3D91]'}`}
                          style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-xs text-gray-500 whitespace-nowrap font-medium">{pct}%</span>
                    </div>
                  </div>
                  <Link href={`/apprendre/${e.course?.id}/intro`}
                    className={`flex items-center gap-1 text-xs font-semibold px-3 py-2 rounded-lg flex-shrink-0 transition-colors ${
                      isComplete ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'ibig-gradient text-white hover:opacity-90'
                    }`}>
                    {isComplete ? <><Award className="w-3 h-3" /> Revoir</> : <><Play className="w-3 h-3" /> Reprendre</>}
                  </Link>
                </div>
              )
            }) : (
              <div className="p-8 text-center">
                <BookOpen className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-500 text-sm mb-3">Aucune formation en cours</p>
                <Link href="/catalogue" className="text-[#0B3D91] font-semibold text-sm hover:underline">Explorer le catalogue →</Link>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar droite */}
        <div className="space-y-4">
          {/* Certificats */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-bold text-gray-900 text-sm">Certificats</h2>
              <Link href="/mes-certificats" className="text-xs text-[#0B3D91] hover:underline">Voir tout</Link>
            </div>
            <div className="p-4 space-y-2.5">
              {certificates && certificates.length > 0 ? certificates.map((c: any) => (
                <Link key={c.id} href={`/mes-certificats/${c.id}/imprimer`}
                  className="flex items-center gap-3 p-2.5 rounded-xl bg-gradient-to-r from-[#0B3D91]/5 to-[#FFA500]/5 border border-[#0B3D91]/10 hover:border-[#0B3D91]/30 transition-colors group">
                  <div className="w-9 h-9 rounded-full bg-[#FFA500]/10 flex items-center justify-center flex-shrink-0">
                    <Award className="w-4 h-4 text-[#FFA500]" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-gray-900 truncate">{c.course?.title}</p>
                    <p className="text-xs text-gray-400">{formatDate(c.issued_at)}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-[#0B3D91] transition-colors" />
                </Link>
              )) : (
                <div className="text-center py-4">
                  <Award className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                  <p className="text-xs text-gray-400">Terminez une formation pour obtenir votre premier certificat</p>
                </div>
              )}
            </div>
          </div>

          {/* Badges niveau */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <h3 className="font-bold text-gray-900 text-sm mb-3 flex items-center gap-2"><Star className="w-4 h-4 text-[#FFA500]" /> Progression</h3>
            <div className="space-y-2">
              {levels.map((l, i) => (
                <div key={l} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs ${l === level ? 'bg-[#0B3D91] text-white font-semibold' : i < lvlIdx ? 'bg-green-50 text-green-700' : 'bg-gray-50 text-gray-400'}`}>
                  <span>{i < lvlIdx ? '✅' : l === level ? '⭐' : '🔒'}</span>
                  <span className="capitalize">{l}</span>
                  {l === level && <span className="ml-auto text-blue-200 text-[10px]">ACTUEL</span>}
                </div>
              ))}
            </div>
          </div>

          {/* CTA catalogue */}
          <div className="ibig-gradient rounded-2xl p-4 text-white">
            <h3 className="font-bold text-sm mb-1">Découvrir de nouvelles formations</h3>
            <p className="text-blue-200 text-xs mb-3">+{200} formations disponibles</p>
            <Link href="/catalogue" className="flex items-center gap-1 text-sm font-semibold text-[#FFA500] hover:text-orange-300 transition-colors">
              Explorer <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
