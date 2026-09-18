import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, BarChart2, TrendingDown, Users } from 'lucide-react'

interface PageProps {
  params: Promise<{ courseId: string }>
}

export default async function CourseAnalyticsPage({ params }: PageProps) {
  const { courseId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/connexion')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!['formateur', 'admin', 'coordinateur'].includes(profile?.role ?? '')) redirect('/tableau-de-bord')

  const { data: course } = await supabase
    .from('courses')
    .select('id, title, enrollment_count, instructor_id')
    .eq('id', courseId)
    .single()

  if (!course) notFound()
  if (profile?.role === 'formateur' && course.instructor_id !== user.id) redirect('/formateur')

  // All modules + lessons for this course
  const { data: modules } = await supabase
    .from('modules')
    .select('id, title, position, lessons(id, title, position, type)')
    .eq('course_id', courseId)
    .order('position')

  const allLessons = (modules ?? []).flatMap(m =>
    ((m.lessons ?? []) as any[]).map((l: any) => ({ ...l, module_title: m.title }))
  )

  // Lesson completion counts
  const { data: progressData } = await supabase
    .from('lesson_progress')
    .select('lesson_id')
    .eq('course_id', courseId)
    .eq('is_completed', true)

  const completionByLesson: Record<string, number> = {}
  progressData?.forEach(p => {
    completionByLesson[p.lesson_id] = (completionByLesson[p.lesson_id] ?? 0) + 1
  })

  // Enrollment count for denominator
  const enrolledCount = course.enrollment_count ?? 1

  // Monthly enrollments (6 months)
  const { data: enrollments } = await supabase
    .from('enrollments')
    .select('created_at, progress_percent')
    .eq('course_id', courseId)

  const months6 = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(); d.setMonth(d.getMonth() - (5 - i))
    return { key: d.toISOString().slice(0, 7), label: d.toLocaleDateString('fr-FR', { month: 'short' }) }
  })
  const enrollByMonth = months6.map(m => ({
    ...m,
    count: enrollments?.filter(e => e.created_at.slice(0, 7) === m.key).length ?? 0,
  }))
  const maxEnroll = Math.max(...enrollByMonth.map(e => e.count), 1)

  const completionRate = enrolledCount ? Math.round(
    (enrollments?.filter(e => e.progress_percent >= 100).length ?? 0) / enrolledCount * 100
  ) : 0

  const avgProgress = enrolledCount ? Math.round(
    (enrollments?.reduce((s, e) => s + e.progress_percent, 0) ?? 0) / enrolledCount
  ) : 0

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <Link href="/formateur" className="flex items-center gap-2 text-gray-500 hover:text-gray-700 text-sm mb-4">
          <ArrowLeft className="w-4 h-4" /> Retour
        </Link>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#0B3D91]/10 flex items-center justify-center">
            <BarChart2 className="w-5 h-5 text-[#0B3D91]" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Analytics</h1>
            <p className="text-gray-500 text-sm">{course.title}</p>
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Apprenants inscrits', value: enrolledCount, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Taux de complétion', value: `${completionRate}%`, color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'Progression moyenne', value: `${avgProgress}%`, color: 'text-orange-600', bg: 'bg-orange-50' },
          { label: 'Leçons au total', value: allLessons.length, color: 'text-purple-600', bg: 'bg-purple-50' },
        ].map(k => (
          <div key={k.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <div className={`text-2xl font-bold ${k.color}`}>{k.value}</div>
            <div className="text-xs text-gray-500 mt-0.5">{k.label}</div>
          </div>
        ))}
      </div>

      {/* Inscriptions par mois */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <h2 className="font-bold text-gray-900 mb-4">Inscriptions — 6 derniers mois</h2>
        <div className="flex items-end gap-3 h-24">
          {enrollByMonth.map(m => (
            <div key={m.key} className="flex-1 flex flex-col items-center gap-1.5">
              <span className="text-xs text-gray-500 font-medium">{m.count > 0 ? m.count : ''}</span>
              <div className="w-full rounded-t-lg bg-[#0B3D91]/10 relative overflow-hidden" style={{ height: '64px' }}>
                <div className="absolute bottom-0 left-0 right-0 bg-[#0B3D91] rounded-t-lg"
                  style={{ height: `${(m.count / maxEnroll) * 100}%` }} />
              </div>
              <span className="text-[10px] text-gray-400">{m.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Heatmap taux de complétion par leçon */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
        <div className="p-5 border-b border-gray-100 flex items-center gap-2">
          <TrendingDown className="w-5 h-5 text-[#0B3D91]" />
          <h2 className="font-bold text-gray-900">Taux d&apos;abandon par leçon</h2>
          <span className="text-xs text-gray-400 ml-auto">Vert = fort engagement · Rouge = fort abandon</span>
        </div>
        <div className="p-5 space-y-6">
          {(modules ?? []).map(m => (
            <div key={m.id}>
              <h3 className="text-xs font-bold text-gray-500 uppercase mb-3">{m.title}</h3>
              <div className="space-y-2">
                {((m.lessons ?? []) as any[]).map((l: any) => {
                  const completed = completionByLesson[l.id] ?? 0
                  const pct = enrolledCount > 0 ? Math.round((completed / enrolledCount) * 100) : 0
                  const color = pct >= 70 ? 'bg-green-500' : pct >= 40 ? 'bg-yellow-500' : pct >= 20 ? 'bg-orange-500' : 'bg-red-500'
                  const textColor = pct >= 70 ? 'text-green-700' : pct >= 40 ? 'text-yellow-700' : pct >= 20 ? 'text-orange-700' : 'text-red-700'
                  const bgLight = pct >= 70 ? 'bg-green-50' : pct >= 40 ? 'bg-yellow-50' : pct >= 20 ? 'bg-orange-50' : 'bg-red-50'
                  return (
                    <div key={l.id} className="flex items-center gap-3">
                      <p className="text-sm text-gray-700 flex-1 truncate min-w-0">{l.title}</p>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${bgLight} ${textColor}`}>
                        {pct}%
                      </span>
                      <div className="w-32 h-2 bg-gray-100 rounded-full overflow-hidden flex-shrink-0">
                        <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-xs text-gray-400 w-16 flex-shrink-0 text-right">{completed}/{enrolledCount}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
          {allLessons.length === 0 && (
            <p className="text-center text-sm text-gray-400 py-4">Aucune leçon pour cette formation</p>
          )}
        </div>
      </div>
    </div>
  )
}
