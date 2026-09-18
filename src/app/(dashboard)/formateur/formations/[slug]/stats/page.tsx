import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Users, Award, TrendingUp, Clock, BarChart2 } from 'lucide-react'

export default async function FormationStatsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/connexion')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!['formateur', 'admin', 'coordinateur'].includes(profile?.role ?? '')) redirect('/tableau-de-bord')

  const { data: course } = await supabase
    .from('courses')
    .select('id, title, total_lessons, price_xof, is_published')
    .eq('slug', slug)
    .single()

  if (!course) notFound()

  const [
    { data: enrollments },
    { data: progress },
    { data: certs },
    { data: recentEnrolls },
  ] = await Promise.all([
    supabase.from('enrollments').select('id, progress_percent, is_completed, enrolled_at').eq('course_id', course.id),
    supabase.from('lesson_progress').select('watch_time_seconds, is_completed, updated_at').eq('course_id', course.id),
    supabase.from('certificates').select('id, issued_at').eq('course_id', course.id),
    supabase.from('enrollments')
      .select('enrolled_at, progress_percent, user:profiles(full_name, country)')
      .eq('course_id', course.id)
      .order('enrolled_at', { ascending: false })
      .limit(10),
  ])

  const totalEnrolls = enrollments?.length ?? 0
  const completed = (enrollments ?? []).filter(e => e.is_completed).length
  const completionRate = totalEnrolls > 0 ? Math.round((completed / totalEnrolls) * 100) : 0
  const totalWatchSec = (progress ?? []).reduce((s, r) => s + (r.watch_time_seconds ?? 0), 0)
  const totalHours = Math.floor(totalWatchSec / 3600)

  // Revenus estimés
  const revenue = totalEnrolls * (course.price_xof ?? 0)

  // Activité 30 derniers jours
  const now = new Date()
  const days30 = Array.from({ length: 30 }, (_, i) => {
    const d = new Date(now); d.setDate(d.getDate() - (29 - i))
    return d.toISOString().slice(0, 10)
  })
  const enrollByDay: Record<string, number> = {}
  for (const e of enrollments ?? []) {
    const d = e.enrolled_at?.slice(0, 10)
    if (d) enrollByDay[d] = (enrollByDay[d] ?? 0) + 1
  }
  const maxEnroll = Math.max(...days30.map(d => enrollByDay[d] ?? 0), 1)

  function fmtDate(s: string) {
    return new Date(s).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
  }

  const kpis = [
    { label: 'Inscrits', value: totalEnrolls, icon: Users, color: 'text-blue-600 bg-blue-50' },
    { label: 'Taux de complétion', value: `${completionRate}%`, icon: TrendingUp, color: 'text-green-600 bg-green-50' },
    { label: 'Certificats', value: certs?.length ?? 0, icon: Award, color: 'text-yellow-600 bg-yellow-50' },
    { label: 'Heures visionnées', value: `${totalHours}h`, icon: Clock, color: 'text-purple-600 bg-purple-50' },
  ]

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      <div className="flex items-center gap-3">
        <Link href="/formateur" className="text-gray-400 hover:text-gray-700">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold text-gray-900 truncate">{course.title}</h1>
          <p className="text-sm text-gray-500">Statistiques de la formation</p>
        </div>
        <Link href={`/formateur/formations/${slug}/editer`}
          className="text-sm text-[#0B3D91] border border-[#0B3D91] px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-colors">
          Éditer
        </Link>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color} mb-3`}>
              <Icon className="w-5 h-5" />
            </div>
            <div className="text-2xl font-bold text-gray-900">{typeof value === 'number' ? value.toLocaleString('fr') : value}</div>
            <div className="text-xs text-gray-500 mt-0.5">{label}</div>
          </div>
        ))}
      </div>

      {/* Revenu */}
      {course.price_xof > 0 && (
        <div className="ibig-gradient rounded-2xl p-5 text-white flex items-center gap-5">
          <div className="text-4xl">💰</div>
          <div>
            <p className="text-blue-200 text-sm">Revenu estimé</p>
            <p className="text-3xl font-bold">{revenue.toLocaleString('fr')} XOF</p>
            <p className="text-blue-200 text-xs mt-0.5">{totalEnrolls} inscrits × {course.price_xof.toLocaleString('fr')} XOF</p>
          </div>
        </div>
      )}

      {/* Heatmap inscriptions 30j */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
          <BarChart2 className="w-4 h-4 text-[#0B3D91]" /> Inscriptions — 30 derniers jours
        </h2>
        <div className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(30, minmax(0, 1fr))` }}>
          {days30.map(day => {
            const n = enrollByDay[day] ?? 0
            const ratio = n / maxEnroll
            const bg = n === 0 ? 'bg-gray-100'
              : ratio < 0.25 ? 'bg-blue-100'
              : ratio < 0.5 ? 'bg-blue-300'
              : ratio < 0.75 ? 'bg-blue-500'
              : 'bg-[#0B3D91]'
            return (
              <div key={day} title={`${day}: ${n} inscription${n > 1 ? 's' : ''}`}
                className={`aspect-square rounded-sm ${bg} cursor-default`} />
            )
          })}
        </div>
        <p className="text-xs text-gray-400 mt-2 text-center">
          {totalEnrolls} inscriptions au total depuis la création
        </p>
      </div>

      {/* Derniers inscrits */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-50">
          <h2 className="font-bold text-gray-900">Derniers apprenants</h2>
        </div>
        <div className="divide-y divide-gray-50">
          {(recentEnrolls ?? []).length === 0 ? (
            <div className="py-8 text-center text-gray-400 text-sm">Aucun apprenant inscrit</div>
          ) : (recentEnrolls ?? []).map((e: any, i) => (
            <div key={i} className="flex items-center gap-3 px-5 py-3">
              <div className="w-8 h-8 rounded-full ibig-gradient flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                {(e.user?.full_name ?? '?')[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{e.user?.full_name ?? '—'}</p>
                <p className="text-xs text-gray-400">{e.user?.country ?? '—'}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <div className="text-xs font-semibold text-gray-700">{e.progress_percent ?? 0}%</div>
                <div className="w-14 h-1.5 bg-gray-100 rounded-full mt-1">
                  <div className="h-full ibig-gradient rounded-full" style={{ width: `${e.progress_percent ?? 0}%` }} />
                </div>
              </div>
              <div className="text-xs text-gray-400 flex-shrink-0 w-20 text-right">
                {fmtDate(e.enrolled_at)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
