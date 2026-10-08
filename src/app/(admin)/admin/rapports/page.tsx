import EvaluationSummary from '@/components/reports/EvaluationSummary'
import { createClient } from '@/lib/supabase/server'
import { BarChart3, TrendingUp, Globe, BookOpen, Users, Award } from 'lucide-react'
import Link from 'next/link'
import PeriodFilter from './PeriodFilter'

const COUNTRY_NAMES: Record<string, string> = {
  CI: "Côte d'Ivoire", SN: 'Sénégal', CM: 'Cameroun', BF: 'Burkina Faso',
  ML: 'Mali', GN: 'Guinée', TG: 'Togo', BJ: 'Bénin', MA: 'Maroc',
  FR: 'France', CA: 'Canada', BE: 'Belgique', NG: 'Nigéria', GH: 'Ghana', CD: 'RD Congo', CG: 'Congo-Brazzaville', TD: 'Tchad',
}

function formatPrice(n: number, currency = 'XOF') {
  return new Intl.NumberFormat('fr-FR').format(Math.round(n)) + ' ' + currency
}

export default async function RapportsPage({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const sp = await searchParams
  const supabase = await createClient()

  // Période par défaut : 90 derniers jours
  const today = new Date()
  const defaultFrom = new Date(today)
  defaultFrom.setDate(defaultFrom.getDate() - 89)

  const dateFrom = sp.from ?? defaultFrom.toISOString().slice(0, 10)
  const dateTo = sp.to ?? today.toISOString().slice(0, 10)
  const dateFromISO = dateFrom + 'T00:00:00'
  const dateToISO = dateTo + 'T23:59:59'

  // Données en parallèle
  const [
    { data: payments },
    { data: enrollments },
    { data: certificates },
    { data: users },
    { data: courseStats },
    { data: instructors },
  ] = await Promise.all([
    supabase.from('payments').select('amount, currency, created_at, course_id, course:courses(title)')
      .eq('status', 'completed').gte('created_at', dateFromISO).lte('created_at', dateToISO),
    supabase.from('enrollments').select('course_id, enrolled_at, progress_percent, course:courses(title)')
      .gte('enrolled_at', dateFromISO).lte('enrolled_at', dateToISO),
    supabase.from('certificates').select('issued_at, course:courses(title)')
      .gte('issued_at', dateFromISO).lte('issued_at', dateToISO),
    supabase.from('profiles').select('country, created_at').gte('created_at', dateFromISO).lte('created_at', dateToISO),
    supabase.from('courses').select('id, title, enrollment_count, price_xof, instructor_id')
      .eq('is_published', true).order('enrollment_count', { ascending: false }),
    supabase.from('profiles').select('id, full_name, email').eq('role', 'formateur'),
  ])

  // KPIs
  const totalRevXOF = payments?.filter(p => p.currency === 'XOF').reduce((s, p) => s + p.amount, 0) ?? 0
  const totalRevEUR = payments?.filter(p => p.currency === 'EUR').reduce((s, p) => s + p.amount, 0) ?? 0
  const totalEnrollments = enrollments?.length ?? 0
  const totalCerts = certificates?.length ?? 0
  const totalNewUsers = users?.length ?? 0
  const avgProgress = enrollments?.length
    ? Math.round(enrollments.reduce((s, e) => s + (e.progress_percent ?? 0), 0) / enrollments.length)
    : 0

  // Revenus par formation
  const revByCourse: Record<string, { title: string; xof: number; eur: number; count: number }> = {}
  payments?.forEach(p => {
    const course = p.course as any
    const id = p.course_id
    if (!id) return
    if (!revByCourse[id]) revByCourse[id] = { title: course?.title ?? id, xof: 0, eur: 0, count: 0 }
    if (p.currency === 'XOF') revByCourse[id].xof += p.amount
    else if (p.currency === 'EUR') revByCourse[id].eur += p.amount
    revByCourse[id].count++
  })
  const topCoursesByRev = Object.values(revByCourse).sort((a, b) => (b.xof + b.eur * 655) - (a.xof + a.eur * 655)).slice(0, 8)
  const maxCourseRev = Math.max(...topCoursesByRev.map(c => c.xof + c.eur * 655), 1)

  // Inscriptions par formation
  const enrollByCourse: Record<string, { title: string; count: number; completed: number }> = {}
  enrollments?.forEach(e => {
    const course = e.course as any
    const id = e.course_id
    if (!id) return
    if (!enrollByCourse[id]) enrollByCourse[id] = { title: course?.title ?? id, count: 0, completed: 0 }
    enrollByCourse[id].count++
    if ((e.progress_percent ?? 0) >= 100) enrollByCourse[id].completed++
  })
  const topCoursesByEnroll = Object.values(enrollByCourse).sort((a, b) => b.count - a.count).slice(0, 8)
  const maxEnroll = Math.max(...topCoursesByEnroll.map(c => c.count), 1)

  // Inscriptions/revenus par pays
  const countryCount: Record<string, number> = {}
  users?.forEach(u => { if (u.country) countryCount[u.country] = (countryCount[u.country] ?? 0) + 1 })
  const topCountries = Object.entries(countryCount).sort((a, b) => b[1] - a[1]).slice(0, 10)
  const maxCountry = Math.max(...topCountries.map(c => c[1]), 1)

  // CA par formateur
  const instructorRevMap: Record<string, { name: string; email: string; xof: number; eur: number; courses: number }> = {}
  instructors?.forEach(inst => {
    instructorRevMap[inst.id] = { name: inst.full_name ?? '', email: inst.email ?? '', xof: 0, eur: 0, courses: 0 }
  })
  courseStats?.forEach(c => {
    const instId = c.instructor_id
    if (!instId || !instructorRevMap[instId]) return
    instructorRevMap[instId].courses++
  })
  payments?.forEach(p => {
    const course = courseStats?.find(c => c.id === p.course_id)
    if (!course?.instructor_id || !instructorRevMap[course.instructor_id]) return
    if (p.currency === 'XOF') instructorRevMap[course.instructor_id].xof += p.amount
    else if (p.currency === 'EUR') instructorRevMap[course.instructor_id].eur += p.amount
  })
  const topInstructors = Object.values(instructorRevMap).sort((a, b) => (b.xof + b.eur * 655) - (a.xof + a.eur * 655)).filter(i => i.xof + i.eur > 0 || i.courses > 0).slice(0, 8)

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-[#0B3D91]" /> Rapports avancés
          </h1>
          <p className="text-gray-500 text-sm mt-1">Analyse de la performance commerciale et pédagogique</p>
        
          <Link href="/admin/rapports/generateur" className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-[#0B3D91]">Générateur de rapports et envois programmés →</Link>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/admin/exports" className="text-sm text-[#0B3D91] hover:underline">← Exports CSV</Link>
          <PeriodFilter currentFrom={dateFrom} currentTo={dateTo} />
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: 'Revenus XOF', value: formatPrice(totalRevXOF), icon: BarChart3, color: 'bg-emerald-50 text-emerald-600' },
          { label: 'Revenus EUR', value: formatPrice(totalRevEUR, 'EUR'), icon: TrendingUp, color: 'bg-blue-50 text-blue-600' },
          { label: 'Inscriptions', value: totalEnrollments, icon: BookOpen, color: 'bg-purple-50 text-purple-600' },
          { label: 'Nouveaux users', value: totalNewUsers, icon: Users, color: 'bg-orange-50 text-orange-600' },
          { label: 'Certificats', value: totalCerts, icon: Award, color: 'bg-yellow-50 text-yellow-600' },
          { label: 'Progression moy.', value: `${avgProgress}%`, icon: Globe, color: 'bg-pink-50 text-pink-600' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${s.color} mb-2`}>
              <s.icon className="w-5 h-5" />
            </div>
            <div className="text-base font-bold text-gray-900 leading-tight">{s.value}</div>
            <div className="text-xs text-gray-400 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenus par formation */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-[#0B3D91]" /> Revenus par formation
          </h2>
          {topCoursesByRev.length === 0
            ? <p className="text-sm text-gray-400 text-center py-6">Aucun paiement sur la période</p>
            : (
            <div className="space-y-3">
              {topCoursesByRev.map(c => {
                const combined = c.xof + c.eur * 655
                const pct = (combined / maxCourseRev) * 100
                return (
                  <div key={c.title}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-gray-700 truncate flex-1 mr-2">{c.title}</span>
                      <span className="text-xs text-gray-500 flex-shrink-0">{formatPrice(c.xof)}{c.eur > 0 ? ` + ${formatPrice(c.eur, 'EUR')}` : ''}</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-[#0B3D91] rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                    <div className="text-xs text-gray-400 mt-0.5">{c.count} vente{c.count > 1 ? 's' : ''}</div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Inscriptions + complétion par formation */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-[#0B3D91]" /> Inscriptions &amp; complétion
          </h2>
          {topCoursesByEnroll.length === 0
            ? <p className="text-sm text-gray-400 text-center py-6">Aucune inscription sur la période</p>
            : (
            <div className="space-y-3">
              {topCoursesByEnroll.map(c => {
                const pct = (c.count / maxEnroll) * 100
                const completionRate = c.count ? Math.round((c.completed / c.count) * 100) : 0
                return (
                  <div key={c.title}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-gray-700 truncate flex-1 mr-2">{c.title}</span>
                      <span className="text-xs text-gray-500">{c.count} inscr. · {completionRate}% fini</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden flex">
                      <div className="h-full bg-[#0B3D91]" style={{ width: `${pct}%` }} />
                    </div>
                    <div className="h-1 bg-gray-50 rounded-full overflow-hidden mt-0.5">
                      <div className="h-full bg-green-400 rounded-full" style={{ width: `${completionRate}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Apprenants par pays */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Globe className="w-4 h-4 text-[#0B3D91]" /> Nouveaux apprenants par pays
          </h2>
          {topCountries.length === 0
            ? <p className="text-sm text-gray-400 text-center py-6">Aucune inscription sur la période</p>
            : (
            <div className="space-y-3">
              {topCountries.map(([cc, count]) => (
                <div key={cc}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-gray-700 font-medium">{COUNTRY_NAMES[cc] ?? cc}</span>
                    <span className="text-xs text-gray-500">{count} utilisateur{count > 1 ? 's' : ''}</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-[#FFA500] rounded-full" style={{ width: `${(count / maxCountry) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* CA par formateur */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Users className="w-4 h-4 text-[#0B3D91]" /> CA par formateur
          </h2>
          {topInstructors.length === 0
            ? <p className="text-sm text-gray-400 text-center py-6">Aucune donnée sur la période</p>
            : (
            <div className="divide-y divide-gray-50">
              {topInstructors.map((inst, i) => {
                const combined = inst.xof + inst.eur * 655
                return (
                  <div key={inst.name + i} className="flex items-center gap-3 py-3">
                    <div className="w-8 h-8 rounded-full bg-[#0B3D91]/10 flex items-center justify-center text-[#0B3D91] font-bold text-sm flex-shrink-0">
                      {(inst.name || '?')[0].toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{inst.name || inst.email}</p>
                      <p className="text-xs text-gray-400">{inst.courses} formation{inst.courses > 1 ? 's' : ''}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-bold text-gray-900">{formatPrice(inst.xof)}</p>
                      {inst.eur > 0 && <p className="text-xs text-gray-500">{formatPrice(inst.eur, 'EUR')}</p>}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
      <EvaluationSummary showCourse />
    </div>
  )
}
