import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import {
  BookOpen, Users, Star, Wallet, Plus, Eye, BarChart2, Bell, Video, HeartHandshake,
  CalendarClock, ChevronRight, Clock, AlertCircle, CheckCircle2, FileEdit, ArrowRight, Percent,
} from 'lucide-react'
import { formatDate } from '@/lib/utils'

type Course = {
  id: string; title: string; slug: string; thumbnail_url: string | null; is_published: boolean
  approval_status: string | null; enrollment_count: number | null; rating_average: number | null
  rating_count: number | null; updated_at: string
}
type Earning = { instructor_amount_xof: number; created_at: string; course_id: string | null; coaching_booking_id: string | null }

const STATUS: Record<string, { label: string; cls: string }> = {
  published: { label: 'En ligne', cls: 'bg-emerald-50 text-emerald-700' },
  pending: { label: 'En validation', cls: 'bg-amber-50 text-amber-700' },
  rejected: { label: 'À corriger', cls: 'bg-red-50 text-red-700' },
  draft: { label: 'Brouillon', cls: 'bg-gray-100 text-gray-600' },
}
const courseStatus = (c: Course) =>
  c.is_published ? 'published' : c.approval_status === 'pending' ? 'pending' : c.approval_status === 'rejected' ? 'rejected' : 'draft'

const xof = (n: number) => `${Math.round(n).toLocaleString('fr-FR')} FCFA`

export default async function FormateurDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/connexion')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, full_name, is_partner, partner_share_pct, payout_balance_xof')
    .eq('id', user.id).single()
  if (!['formateur', 'admin', 'coordinateur'].includes(profile?.role ?? '')) redirect('/tableau-de-bord')

  const nowIso = new Date().toISOString()
  const [{ data: coursesRaw }, { data: earningsRaw }, { data: bookings }, { data: pendingPayouts }] = await Promise.all([
    supabase.from('courses')
      .select('id, title, slug, thumbnail_url, is_published, approval_status, enrollment_count, rating_average, rating_count, updated_at')
      .eq('instructor_id', user.id)
      .order('updated_at', { ascending: false }),
    supabase.from('instructor_earnings')
      .select('instructor_amount_xof, created_at, course_id, coaching_booking_id')
      .eq('instructor_id', user.id)
      .eq('status', 'credited'),
    supabase.from('coaching_bookings')
      .select('id, starts_at, offer:coaching_offers(title), learner:profiles!coaching_bookings_learner_id_fkey(full_name)')
      .eq('coach_id', user.id)
      .eq('status', 'confirmed')
      .gt('starts_at', nowIso)
      .order('starts_at')
      .limit(4),
    supabase.from('payout_requests').select('amount').eq('instructor_id', user.id).eq('status', 'pending'),
  ])

  const courses = (coursesRaw ?? []) as Course[]
  const earnings = (earningsRaw ?? []) as Earning[]
  const courseIds = courses.map(c => c.id)

  const [{ data: recentReviews }, { data: recentEnrollments }, { data: lives }] = courseIds.length
    ? await Promise.all([
        supabase.from('reviews').select('rating, comment, created_at, course:courses(title), user:profiles(full_name)')
          .in('course_id', courseIds).eq('is_published', true).order('created_at', { ascending: false }).limit(4),
        supabase.from('enrollments').select('enrolled_at, progress_percent, course:courses(title), user:profiles(full_name, country)')
          .in('course_id', courseIds).order('enrolled_at', { ascending: false }).limit(6),
        supabase.from('live_sessions').select('id, title, scheduled_at')
          .in('course_id', courseIds).in('status', ['scheduled', 'live']).gt('scheduled_at', nowIso).order('scheduled_at').limit(3),
      ])
    : [{ data: [] }, { data: [] }, { data: [] }]

  // ── Indicateurs ──
  const share = Number(profile?.partner_share_pct ?? 50)
  const balance = profile?.payout_balance_xof ?? 0
  const pendingPayout = (pendingPayouts ?? []).reduce((s, p) => s + (p.amount ?? 0), 0)
  const totalEarned = earnings.reduce((s, e) => s + e.instructor_amount_xof, 0)
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
  const earnedThisMonth = earnings.filter(e => e.created_at >= monthStart).reduce((s, e) => s + e.instructor_amount_xof, 0)
  const totalStudents = courses.reduce((s, c) => s + (c.enrollment_count ?? 0), 0)
  const rated = courses.filter(c => (c.rating_count ?? 0) > 0)
  const ratingCount = rated.reduce((s, c) => s + (c.rating_count ?? 0), 0)
  const avgRating = ratingCount ? rated.reduce((s, c) => s + (c.rating_average ?? 0) * (c.rating_count ?? 0), 0) / ratingCount : 0
  const byStatus = courses.reduce<Record<string, number>>((acc, c) => { const k = courseStatus(c); acc[k] = (acc[k] ?? 0) + 1; return acc }, {})

  // Revenus nets des 6 derniers mois
  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1)
    return { key: `${d.getFullYear()}-${d.getMonth()}`, label: d.toLocaleDateString('fr-FR', { month: 'short' }) }
  })
  const perMonth = new Map<string, number>()
  for (const e of earnings) {
    const d = new Date(e.created_at)
    const k = `${d.getFullYear()}-${d.getMonth()}`
    perMonth.set(k, (perMonth.get(k) ?? 0) + e.instructor_amount_xof)
  }
  const chart = months.map(m => ({ ...m, total: perMonth.get(m.key) ?? 0 }))
  const maxMonth = Math.max(...chart.map(m => m.total), 1)

  // Revenus par formation
  const perCourse = new Map<string, number>()
  for (const e of earnings) if (e.course_id) perCourse.set(e.course_id, (perCourse.get(e.course_id) ?? 0) + e.instructor_amount_xof)
  const coachingEarned = earnings.filter(e => e.coaching_booking_id).reduce((s, e) => s + e.instructor_amount_xof, 0)

  // Agenda
  const agenda = [
    ...((bookings ?? []) as unknown as { id: string; starts_at: string; offer: { title: string } | null; learner: { full_name: string } | null }[])
      .map(b => ({ id: b.id, kind: 'coaching' as const, title: b.offer?.title ?? 'Séance de coaching', at: b.starts_at, who: b.learner?.full_name, href: '/formateur/coaching' })),
    ...((lives ?? []) as { id: string; title: string; scheduled_at: string }[])
      .map(l => ({ id: l.id, kind: 'live' as const, title: l.title, at: l.scheduled_at, who: null as string | null | undefined, href: '/formateur/sessions-live' })),
  ].sort((a, b) => a.at.localeCompare(b.at)).slice(0, 4)

  const firstName = profile?.full_name?.split(' ')[0] ?? ''
  const isNew = courses.length === 0

  return (
    <div className="max-w-6xl mx-auto space-y-5 sm:space-y-6">
      {/* ── En-tête ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-[22px] sm:text-2xl font-bold text-gray-900 truncate">Bonjour {firstName} 👋</h1>
          <p className="text-gray-500 text-sm flex items-center gap-1.5">
            Espace formateur
            {profile?.is_partner && <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-[#FFA500]/10 text-orange-700 px-2 py-0.5 rounded-full"><Percent className="w-3 h-3" /> Partenaire · {share} %</span>}
          </p>
        </div>
        <div className="grid grid-cols-2 sm:flex gap-2">
          <Link href={`/formateur/${user.id}`} target="_blank"
            className="flex items-center justify-center gap-2 border border-gray-200 bg-white text-gray-700 text-sm font-medium px-3 py-2.5 rounded-xl hover:bg-gray-50">
            <Eye className="w-4 h-4" /> Profil public
          </Link>
          <Link href="/formateur/formations/nouvelle"
            className="flex items-center justify-center gap-2 bg-[#0B3D91] text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-blue-800">
            <Plus className="w-4 h-4" /> Nouvelle formation
          </Link>
        </div>
      </div>

      {/* ── Solde (carte principale) ── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0B3D91] via-[#0d47a8] to-[#1a56cc] text-white p-5 sm:p-6">
        <div className="absolute -right-10 -top-10 w-44 h-44 rounded-full bg-white/10" aria-hidden="true" />
        <div className="relative grid grid-cols-1 sm:grid-cols-3 gap-5 sm:items-center">
          <div className="sm:col-span-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#FFA500]">Solde disponible</p>
            <p className="mt-1 text-3xl sm:text-4xl font-extrabold">{xof(balance)}</p>
            <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm text-blue-100">
              <span>Ce mois-ci : <strong className="text-white">{xof(earnedThisMonth)}</strong></span>
              <span>Total gagné : <strong className="text-white">{xof(totalEarned)}</strong></span>
              {pendingPayout > 0 && <span>Virement en cours : <strong className="text-white">{xof(pendingPayout)}</strong></span>}
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Link href="/formateur/virements" className="flex items-center justify-center gap-2 bg-[#FFA500] text-black font-bold px-5 py-3 rounded-2xl hover:bg-orange-400">
              <Wallet className="w-5 h-5" /> Demander un virement
            </Link>
            <Link href="/formateur/revenus" className="text-center text-sm text-blue-100 hover:text-white">Détail des revenus →</Link>
          </div>
        </div>
        <p className="relative mt-4 text-[11px] text-blue-200">Vous percevez {share} % du montant de chaque vente confirmée (formations et coaching), crédités automatiquement.</p>
      </div>

      {/* ── Compteurs ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        {[
          { label: 'Formations', value: courses.length, sub: `${byStatus.published ?? 0} en ligne`, icon: BookOpen, color: 'text-[#0B3D91] bg-blue-50', href: '/formateur/formations' },
          { label: 'Apprenants', value: totalStudents.toLocaleString('fr-FR'), sub: 'inscrits au total', icon: Users, color: 'text-purple-600 bg-purple-50', href: '/formateur/apprenants' },
          { label: 'Note moyenne', value: avgRating ? avgRating.toFixed(1) : '—', sub: `${ratingCount} avis`, icon: Star, color: 'text-[#FFA500] bg-orange-50', href: '/formateur/statistiques' },
          { label: 'Coaching', value: xof(coachingEarned), sub: 'revenus des séances', icon: HeartHandshake, color: 'text-rose-600 bg-rose-50', href: '/formateur/coaching' },
        ].map(s => (
          <Link key={s.label} href={s.href} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-5 hover:shadow-md transition-shadow">
            <span className={`w-10 h-10 rounded-xl flex items-center justify-center ${s.color}`}><s.icon className="w-5 h-5" /></span>
            <p className="mt-3 text-lg sm:text-2xl font-extrabold text-gray-900 leading-tight truncate">{s.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{s.label} · {s.sub}</p>
          </Link>
        ))}
      </div>

      {/* ── Alertes formations ── */}
      {((byStatus.rejected ?? 0) > 0 || (byStatus.pending ?? 0) > 0) && (
        <div className="space-y-2">
          {(byStatus.rejected ?? 0) > 0 && (
            <Link href="/formateur/formations" className="flex items-center gap-3 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-800">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span className="flex-1">{byStatus.rejected} formation{byStatus.rejected > 1 ? 's' : ''} à corriger suite à la relecture d&apos;IBIG EDUFORM</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          )}
          {(byStatus.pending ?? 0) > 0 && (
            <div className="flex items-center gap-3 rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              <Clock className="w-5 h-5 flex-shrink-0" />
              <span>{byStatus.pending} formation{byStatus.pending > 1 ? 's' : ''} en cours de validation par IBIG EDUFORM</span>
            </div>
          )}
        </div>
      )}

      {/* ── Premiers pas ── */}
      {isNew && (
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5 sm:p-7">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#FFA500]">Premiers pas</p>
          <h2 className="mt-1 text-xl font-bold text-gray-900">Publiez votre première formation</h2>
          <ol className="mt-4 space-y-3">
            {[
              { icon: FileEdit, text: 'Créez la formation : titre, description, prix et visuel' },
              { icon: BookOpen, text: 'Ajoutez vos modules, leçons vidéo et quiz' },
              { icon: CheckCircle2, text: 'Soumettez-la : IBIG EDUFORM la valide puis la met en ligne' },
              { icon: Wallet, text: `Percevez ${share} % de chaque vente sur votre solde` },
            ].map((s, i) => (
              <li key={s.text} className="flex items-center gap-3">
                <span className="w-9 h-9 rounded-xl bg-[#0B3D91]/8 text-[#0B3D91] flex items-center justify-center flex-shrink-0"><s.icon className="w-[18px] h-[18px]" /></span>
                <span className="text-[15px] text-gray-700"><strong>{i + 1}.</strong> {s.text}</span>
              </li>
            ))}
          </ol>
          <div className="mt-5 flex flex-col sm:flex-row gap-2">
            <Link href="/formateur/formations/nouvelle" className="flex items-center justify-center gap-2 bg-[#0B3D91] text-white font-bold px-6 py-3.5 rounded-2xl">
              <Plus className="w-4 h-4" /> Créer ma première formation
            </Link>
            <Link href="/formateur/coaching" className="flex items-center justify-center gap-2 border border-gray-200 text-gray-700 font-semibold px-6 py-3.5 rounded-2xl">
              <HeartHandshake className="w-4 h-4" /> Proposer du coaching
            </Link>
          </div>
        </div>
      )}

      {/* ── À venir ── */}
      {agenda.length > 0 && (
        <section className="bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="px-4 sm:px-5 py-3.5 border-b border-gray-100 flex items-center gap-2">
            <CalendarClock className="w-5 h-5 text-[#0B3D91]" />
            <h2 className="font-bold text-gray-900">À venir</h2>
          </div>
          <ul className="divide-y divide-gray-50">
            {agenda.map(a => {
              const d = new Date(a.at)
              return (
                <li key={`${a.kind}-${a.id}`}>
                  <Link href={a.href} className="flex items-center gap-3.5 px-4 sm:px-5 py-3.5 hover:bg-gray-50/70">
                    <span className="w-12 text-center flex-shrink-0">
                      <span className="block text-[11px] font-semibold uppercase text-[#0B3D91]">{d.toLocaleDateString('fr-FR', { weekday: 'short' })}</span>
                      <span className="block text-lg font-extrabold text-gray-900 leading-tight">{d.getDate()}</span>
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-semibold text-gray-900 text-sm truncate">{a.title}</span>
                      <span className="block text-xs text-gray-500">
                        {d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })} · {a.kind === 'coaching' ? 'Séance de coaching' : 'Session live'}
                        {a.who ? <span data-no-translate> · {a.who}</span> : null}
                      </span>
                    </span>
                    {a.kind === 'coaching' ? <HeartHandshake className="w-5 h-5 text-rose-500 flex-shrink-0" /> : <Video className="w-5 h-5 text-[#0B3D91] flex-shrink-0" />}
                  </Link>
                </li>
              )
            })}
          </ul>
        </section>
      )}

      {!isNew && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-6">
          {/* ── Revenus nets ── */}
          <section className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-bold text-gray-900 flex items-center gap-2"><BarChart2 className="w-5 h-5 text-[#0B3D91]" /> Vos revenus nets</h2>
              <span className="text-xs text-gray-400">6 derniers mois</span>
            </div>
            <div className="flex items-end gap-2 sm:gap-3 h-36">
              {chart.map(m => (
                <div key={m.key} className="flex-1 flex flex-col items-center gap-1.5">
                  <span className="text-[11px] text-gray-500 h-4">{m.total > 0 ? `${Math.round(m.total / 1000)}k` : ''}</span>
                  <div className="w-full rounded-t-lg bg-[#0B3D91]/8 relative overflow-hidden" style={{ height: '100px' }}>
                    <div className="absolute bottom-0 w-full bg-gradient-to-t from-[#0B3D91] to-[#1a6cc4] rounded-t-lg" style={{ height: `${m.total ? Math.max(4, (m.total / maxMonth) * 100) : 0}%` }} />
                  </div>
                  <span className="text-[11px] text-gray-400">{m.label}</span>
                </div>
              ))}
            </div>
            {totalEarned === 0 && <p className="text-sm text-gray-400 text-center mt-4">Vos premiers revenus apparaîtront ici dès la première vente.</p>}
          </section>

          {/* ── Avis récents ── */}
          <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-6">
            <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2"><Star className="w-5 h-5 text-[#FFA500]" /> Avis récents</h2>
            {(recentReviews ?? []).length === 0 ? (
              <p className="text-sm text-gray-400">Aucun avis pour l&apos;instant.</p>
            ) : (
              <div className="space-y-3.5">
                {(recentReviews as unknown as { rating: number; comment: string | null; course: { title: string } | null; user: { full_name: string } | null }[]).map((r, i) => (
                  <div key={i} className="pb-3.5 border-b border-gray-50 last:border-0 last:pb-0">
                    <div className="flex items-center gap-0.5 mb-1">
                      {[1, 2, 3, 4, 5].map(s => <Star key={s} className={`w-3.5 h-3.5 ${s <= r.rating ? 'text-[#FFA500] fill-[#FFA500]' : 'text-gray-200 fill-gray-200'}`} />)}
                      <span className="text-xs text-gray-400 ml-1.5 truncate" data-no-translate>{r.user?.full_name}</span>
                    </div>
                    <p className="text-xs font-medium text-[#0B3D91] truncate">{r.course?.title}</p>
                    {r.comment && <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{r.comment}</p>}
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      )}

      {/* ── Mes formations ── */}
      {!isNew && (
        <section className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-4 sm:px-5 py-3.5 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-bold text-gray-900">Mes formations</h2>
            <Link href="/formateur/formations" className="text-sm text-[#0B3D91] font-semibold flex items-center gap-1">Tout gérer <ArrowRight className="w-4 h-4" /></Link>
          </div>
          <ul className="divide-y divide-gray-50">
            {courses.slice(0, 6).map(c => {
              const st = STATUS[courseStatus(c)]
              return (
                <li key={c.id} className="px-4 sm:px-5 py-3.5 flex items-center gap-3.5">
                  <span className="w-16 h-12 rounded-xl bg-gray-100 overflow-hidden flex-shrink-0">
                    {c.thumbnail_url
                      ? <img src={c.thumbnail_url} alt="" className="w-full h-full object-cover" />
                      : <span className="w-full h-full ibig-gradient flex items-center justify-center"><BookOpen className="w-5 h-5 text-white/50" /></span>}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-gray-900 text-sm leading-snug line-clamp-1">{c.title}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">
                      <span className={`font-semibold px-2 py-0.5 rounded-full ${st.cls}`}>{st.label}</span>
                      <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> {c.enrollment_count ?? 0}</span>
                      {(c.rating_count ?? 0) > 0 && <span className="flex items-center gap-1"><Star className="w-3.5 h-3.5 text-[#FFA500] fill-[#FFA500]" /> {c.rating_average?.toFixed(1)}</span>}
                      {(perCourse.get(c.id) ?? 0) > 0 && <span className="font-semibold text-emerald-700">{xof(perCourse.get(c.id) ?? 0)}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <Link href={`/formateur/analytics/${c.id}`} title="Statistiques" className="hidden sm:flex w-9 h-9 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50"><BarChart2 className="w-4 h-4" /></Link>
                    <Link href={`/formateur/formations/${c.id}/lecons`} className="text-xs bg-[#0B3D91] text-white font-semibold px-3 py-2 rounded-lg hover:bg-blue-800">Gérer</Link>
                  </div>
                </li>
              )
            })}
          </ul>
        </section>
      )}

      {/* ── Derniers inscrits ── */}
      {(recentEnrollments ?? []).length > 0 && (
        <section className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-4 sm:px-5 py-3.5 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-bold text-gray-900">Derniers inscrits</h2>
            <Link href="/formateur/apprenants" className="text-sm text-[#0B3D91] font-semibold flex items-center gap-1">Tous <ArrowRight className="w-4 h-4" /></Link>
          </div>
          <ul className="divide-y divide-gray-50">
            {(recentEnrollments as unknown as { enrolled_at: string; progress_percent: number | null; course: { title: string } | null; user: { full_name: string; country: string | null } | null }[]).map((e, i) => (
              <li key={i} className="px-4 sm:px-5 py-3 flex items-center gap-3">
                <span className="w-9 h-9 rounded-full bg-[#0B3D91]/10 flex items-center justify-center text-[#0B3D91] font-bold text-sm flex-shrink-0">
                  {e.user?.full_name?.charAt(0)?.toUpperCase() ?? '?'}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-gray-900 text-sm truncate" data-no-translate>{e.user?.full_name}</p>
                  <p className="text-xs text-gray-400 truncate">{e.course?.title} · {formatDate(e.enrolled_at)}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <div className="w-14 sm:w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-[#0B3D91] rounded-full" style={{ width: `${e.progress_percent ?? 0}%` }} />
                  </div>
                  <span className="text-xs text-gray-500 w-8 text-right">{e.progress_percent ?? 0}%</span>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* ── Raccourcis ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {[
          { href: '/formateur/notifier', icon: Bell, label: 'Notifier mes apprenants' },
          { href: '/formateur/sessions-live', icon: Video, label: 'Sessions live' },
          { href: '/formateur/coaching', icon: HeartHandshake, label: 'Mon coaching' },
          { href: '/formateur/statistiques', icon: BarChart2, label: 'Statistiques' },
        ].map(s => (
          <Link key={s.href} href={s.href} className="flex items-center gap-2.5 bg-white rounded-2xl border border-gray-100 shadow-sm px-3.5 py-3 text-sm font-medium text-gray-700 hover:shadow-md transition-shadow">
            <s.icon className="w-[18px] h-[18px] text-[#0B3D91] flex-shrink-0" /> <span className="leading-tight">{s.label}</span>
          </Link>
        ))}
      </div>
    </div>
  )
}
