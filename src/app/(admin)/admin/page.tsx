import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import {
  Users, BookOpen, Award, TrendingUp, Activity, ArrowRight, MapPin, BarChart3, Download,
  ClipboardCheck, UserPlus, Wallet, Building2, Clock, HeartHandshake, Inbox, CheckCircle2,
} from 'lucide-react'
import { formatPrice, formatDate } from '@/lib/utils'
import RealtimeActivityFeed from '@/components/admin/RealtimeActivityFeed'

// Même barème que la fonction SQL public.to_xof
const RATE: Record<string, number> = { XOF: 1, XAF: 1, EUR: 655.957, USD: 600 }
const toXof = (amount: number, currency: string | null) => Math.round(amount * (RATE[(currency ?? 'XOF').toUpperCase()] ?? 1))
const fcfa = (n: number) => `${Math.round(n).toLocaleString('fr-FR')} FCFA`

const COUNTRY: Record<string, string> = {
  CI: "Côte d'Ivoire", SN: 'Sénégal', CM: 'Cameroun', BF: 'Burkina Faso', ML: 'Mali', GN: 'Guinée', TG: 'Togo',
  BJ: 'Bénin', NE: 'Niger', GA: 'Gabon', CD: 'RD Congo', CG: 'Congo-Brazzaville', TD: 'Tchad', MA: 'Maroc',
  FR: 'France', BE: 'Belgique',
}
const ROLE: Record<string, { label: string; cls: string }> = {
  admin: { label: 'Admin', cls: 'bg-red-50 text-red-700' },
  coordinateur: { label: 'Coordinateur', cls: 'bg-purple-50 text-purple-700' },
  formateur: { label: 'Formateur', cls: 'bg-blue-50 text-blue-700' },
  entreprise: { label: 'Entreprise', cls: 'bg-amber-50 text-amber-700' },
}

export default async function AdminPage() {
  const supabase = await createClient()
  const now = new Date()
  const since12m = new Date(now.getFullYear(), now.getMonth() - 11, 1).toISOString()
  const since30d = new Date(now.getTime() - 30 * 86400_000).toISOString()
  const stalePending = new Date(now.getTime() - 3600_000).toISOString()
  const head = { count: 'exact' as const, head: true }

  const [
    { count: totalUsers }, { count: newUsers30 }, { count: totalCourses }, { count: totalEnrollments }, { count: totalCerts },
    { count: pendingCourses }, { count: pendingApplications }, { count: newB2b }, { count: stalePayments }, { count: upcomingCoaching },
    { data: payoutQueue }, { data: payments }, { data: earnings }, { data: partnerBalances },
    { data: recentUsers }, { data: topCourses }, { data: countryRows }, { data: usersCreated }, { data: enrollmentsDates },
  ] = await Promise.all([
    supabase.from('profiles').select('*', head),
    supabase.from('profiles').select('*', head).gte('created_at', since30d),
    supabase.from('courses').select('*', head).eq('is_published', true),
    supabase.from('enrollments').select('*', head),
    supabase.from('certificates').select('*', head),
    supabase.from('courses').select('*', head).eq('approval_status', 'pending'),
    supabase.from('instructor_applications').select('*', head).eq('status', 'submitted'),
    supabase.from('b2b_requests').select('*', head).eq('status', 'new'),
    supabase.from('payments').select('*', head).eq('status', 'pending').lt('created_at', stalePending),
    supabase.from('coaching_bookings').select('*', head).eq('status', 'confirmed').gt('starts_at', now.toISOString()),
    supabase.from('payout_requests').select('amount').eq('status', 'pending'),
    supabase.from('payments')
      .select('id, amount, currency, created_at, user:profiles(full_name), course:courses(title)')
      .eq('status', 'completed').gte('created_at', since12m).order('created_at', { ascending: false }),
    supabase.from('instructor_earnings').select('instructor_amount_xof, created_at').eq('status', 'credited').gte('created_at', since12m),
    supabase.from('profiles').select('payout_balance_xof').gt('payout_balance_xof', 0),
    supabase.from('profiles').select('id, full_name, country, created_at, role').order('created_at', { ascending: false }).limit(6),
    supabase.from('courses').select('id, title, slug, enrollment_count, is_featured').eq('is_published', true).order('enrollment_count', { ascending: false }).limit(5),
    supabase.from('profiles').select('country').not('country', 'is', null),
    supabase.from('profiles').select('created_at').gte('created_at', since12m),
    supabase.from('enrollments').select('enrolled_at').gte('enrolled_at', since12m),
  ])

  type Pay = { id: string; amount: number; currency: string; created_at: string; user: { full_name: string } | null; course: { title: string } | null }
  const pays = (payments ?? []) as unknown as Pay[]

  // ── Chiffre d'affaires (converti en FCFA) ──
  const monthKey = (iso: string) => iso.slice(0, 7)
  const thisMonth = monthKey(now.toISOString())
  const gross12 = pays.reduce((s, p) => s + toXof(p.amount, p.currency), 0)
  const grossMonth = pays.filter(p => monthKey(p.created_at) === thisMonth).reduce((s, p) => s + toXof(p.amount, p.currency), 0)
  const gross30 = pays.filter(p => p.created_at >= since30d).reduce((s, p) => s + toXof(p.amount, p.currency), 0)
  const instructorMonth = (earnings ?? []).filter(e => monthKey(e.created_at) === thisMonth).reduce((s, e) => s + e.instructor_amount_xof, 0)
  const ibigMonth = grossMonth - instructorMonth
  const owedToPartners = (partnerBalances ?? []).reduce((s, p) => s + (p.payout_balance_xof ?? 0), 0)
  const payoutPending = (payoutQueue ?? []).reduce((s, p) => s + (p.amount ?? 0), 0)

  const months = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - 11 + i, 1)
    return { key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`, label: d.toLocaleDateString('fr-FR', { month: 'short' }) }
  })
  const revByMonth = months.map(m => {
    const list = pays.filter(p => monthKey(p.created_at) === m.key)
    return { ...m, total: list.reduce((s, p) => s + toXof(p.amount, p.currency), 0), count: list.length }
  })
  const maxRev = Math.max(...revByMonth.map(m => m.total), 1)

  const growth = months.map(m => ({
    ...m,
    users: (usersCreated ?? []).filter(u => monthKey(u.created_at) === m.key).length,
    enrollments: (enrollmentsDates ?? []).filter(e => e.enrolled_at && monthKey(e.enrolled_at) === m.key).length,
  }))
  const maxGrowth = Math.max(...growth.map(m => Math.max(m.users, m.enrollments)), 1)

  const countryCount: Record<string, number> = {}
  for (const u of countryRows ?? []) if (u.country) countryCount[u.country] = (countryCount[u.country] ?? 0) + 1
  const topCountries = Object.entries(countryCount).sort((a, b) => b[1] - a[1]).slice(0, 8)
  const maxCountry = Math.max(...topCountries.map(c => c[1]), 1)

  const completionRate = totalEnrollments ? Math.round(((totalCerts ?? 0) / totalEnrollments) * 100) : 0

  // ── À traiter ──
  const inbox = [
    { n: pendingCourses ?? 0, label: 'Formations à valider', href: '/admin/approbations', icon: ClipboardCheck, cls: 'text-[#0B3D91] bg-blue-50' },
    { n: pendingApplications ?? 0, label: 'Candidatures partenaires', href: '/admin/partenaires', icon: UserPlus, cls: 'text-purple-600 bg-purple-50' },
    { n: (payoutQueue ?? []).length, label: 'Virements à effectuer', sub: payoutPending ? fcfa(payoutPending) : undefined, href: '/admin/virements', icon: Wallet, cls: 'text-emerald-600 bg-emerald-50' },
    { n: newB2b ?? 0, label: 'Demandes entreprise', href: '/admin/entreprise', icon: Building2, cls: 'text-amber-600 bg-amber-50' },
    { n: stalePayments ?? 0, label: 'Paiements bloqués (> 1 h)', href: '/admin/paiements', icon: Clock, cls: 'text-red-600 bg-red-50' },
  ]
  const todo = inbox.filter(i => i.n > 0)

  const activities = [
    ...pays.slice(0, 5).map(p => ({
      id: p.id, type: 'payment' as const, time: p.created_at, amount: p.amount,
      label: `Paiement de ${formatPrice(p.amount, p.currency)}${p.user?.full_name ? ` — ${p.user.full_name}` : ''}`,
    })),
    ...((recentUsers ?? []) as { id: string; full_name: string | null; created_at: string }[]).slice(0, 5).map(u => ({
      id: u.id, type: 'user' as const, time: u.created_at, label: `${u.full_name ?? 'Nouvel utilisateur'} vient de s'inscrire`,
    })),
  ].sort((a, b) => b.time.localeCompare(a.time)).slice(0, 10)

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* ── En-tête ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-[22px] sm:text-2xl font-bold text-gray-900">Tableau de bord</h1>
          <p className="text-gray-500 text-sm">Vue d&apos;ensemble d&apos;IBIG E-LEARNING · {now.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
        </div>
        <div className="grid grid-cols-2 sm:flex gap-2">
          <Link href="/admin/rapports" className="flex items-center justify-center gap-1.5 border border-gray-200 bg-white text-gray-700 text-sm font-medium px-3 py-2 rounded-xl hover:bg-gray-50">
            <BarChart3 className="w-4 h-4" /> Rapports
          </Link>
          <Link href="/admin/exports" className="flex items-center justify-center gap-1.5 border border-gray-200 bg-white text-gray-700 text-sm font-medium px-3 py-2 rounded-xl hover:bg-gray-50">
            <Download className="w-4 h-4" /> Exports
          </Link>
        </div>
      </div>

      {/* ── À traiter ── */}
      <section className="bg-white rounded-2xl border border-gray-100 shadow-sm">
        <div className="px-4 sm:px-5 py-3.5 border-b border-gray-100 flex items-center gap-2">
          <Inbox className="w-5 h-5 text-[#0B3D91]" />
          <h2 className="font-bold text-gray-900">À traiter</h2>
          {todo.length > 0 && <span className="ml-1 text-xs font-bold bg-[#FFA500] text-black rounded-full px-2 py-0.5">{todo.reduce((s, i) => s + i.n, 0)}</span>}
        </div>
        {todo.length === 0 ? (
          <p className="px-5 py-5 text-sm text-gray-500 flex items-center gap-2"><CheckCircle2 className="w-5 h-5 text-emerald-500" /> Rien en attente, tout est à jour.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 p-3">
            {todo.map(i => (
              <Link key={i.href} href={i.href} className="flex items-center gap-3 rounded-xl border border-gray-100 px-3.5 py-3 hover:bg-gray-50 transition-colors">
                <span className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${i.cls}`}><i.icon className="w-5 h-5" /></span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-gray-900">{i.label}</span>
                  {i.sub && <span className="block text-xs text-gray-500">{i.sub}</span>}
                </span>
                <span className="text-xl font-extrabold text-gray-900">{i.n}</span>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* ── Chiffre d'affaires ── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0B1E4B] via-[#0B3D91] to-[#1a56cc] text-white p-5 sm:p-6">
        <div className="absolute -right-12 -top-12 w-48 h-48 rounded-full bg-white/10" aria-hidden="true" />
        <div className="relative grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <div className="col-span-2 lg:col-span-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#FFA500]">Ventes du mois</p>
            <p className="mt-1 text-3xl font-extrabold">{fcfa(grossMonth)}</p>
            <p className="text-xs text-blue-200 mt-0.5">30 derniers jours : {fcfa(gross30)}</p>
          </div>
          <div>
            <p className="text-xs text-blue-200">Part IBIG du mois</p>
            <p className="mt-1 text-lg sm:text-xl font-bold">{fcfa(ibigMonth)}</p>
          </div>
          <div>
            <p className="text-xs text-blue-200">Dû aux partenaires</p>
            <p className="mt-1 text-lg sm:text-xl font-bold">{fcfa(owedToPartners)}</p>
          </div>
          <div className="col-span-2 lg:col-span-1">
            <p className="text-xs text-blue-200">Ventes sur 12 mois</p>
            <p className="mt-1 text-lg sm:text-xl font-bold">{fcfa(gross12)}</p>
          </div>
        </div>
      </div>

      {/* ── Compteurs ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-2.5 sm:gap-4">
        {[
          { label: 'Utilisateurs', value: (totalUsers ?? 0).toLocaleString('fr-FR'), sub: `+${newUsers30 ?? 0} en 30 j`, icon: Users, color: 'bg-blue-50 text-blue-600', href: '/admin/utilisateurs' },
          { label: 'Formations en ligne', value: totalCourses ?? 0, icon: BookOpen, color: 'bg-purple-50 text-purple-600', href: '/admin/formations' },
          { label: 'Inscriptions', value: (totalEnrollments ?? 0).toLocaleString('fr-FR'), icon: TrendingUp, color: 'bg-green-50 text-green-600', href: '/admin/inscriptions' },
          { label: 'Certificats', value: totalCerts ?? 0, icon: Award, color: 'bg-yellow-50 text-yellow-600', href: '/admin/certificats' },
          { label: 'Taux de complétion', value: `${completionRate} %`, icon: Activity, color: 'bg-orange-50 text-orange-600', href: '/admin/rapports' },
          { label: 'Coaching à venir', value: upcomingCoaching ?? 0, icon: HeartHandshake, color: 'bg-rose-50 text-rose-600', href: '/admin/coaching' },
        ].map(s => (
          <Link key={s.label} href={s.href} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 hover:shadow-md transition-shadow">
            <span className={`w-9 h-9 rounded-lg flex items-center justify-center ${s.color}`}><s.icon className="w-5 h-5" /></span>
            <p className="mt-3 text-xl sm:text-2xl font-extrabold text-gray-900 leading-none">{s.value}</p>
            <p className="text-xs text-gray-500 mt-1">{s.label}{s.sub ? <span className="text-emerald-600 font-semibold"> · {s.sub}</span> : null}</p>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6">
        {/* ── Ventes 12 mois ── */}
        <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="font-bold text-gray-900">Ventes — 12 mois</h2>
              <p className="text-xs text-gray-400 mt-0.5">Toutes devises converties en FCFA</p>
            </div>
            <BarChart3 className="w-5 h-5 text-gray-300" />
          </div>
          <div className="flex items-end gap-1 sm:gap-1.5 h-40">
            {revByMonth.map(m => (
              <div key={m.key} className="flex-1 flex flex-col items-center gap-1" title={`${m.label} : ${fcfa(m.total)} · ${m.count} paiement${m.count > 1 ? 's' : ''}`}>
                <div className="w-full rounded-t-md bg-gray-100 relative overflow-hidden" style={{ height: '120px' }}>
                  <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-[#0B3D91] to-[#1a5fd4] rounded-t-md" style={{ height: `${m.total ? Math.max(3, (m.total / maxRev) * 100) : 0}%` }} />
                </div>
                <span className="text-[9px] sm:text-[10px] text-gray-400">{m.label}</span>
              </div>
            ))}
          </div>
          {gross12 === 0 && <p className="text-sm text-gray-400 text-center mt-3">Aucune vente confirmée sur la période.</p>}
        </section>

        {/* ── Croissance ── */}
        <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-6">
          <div className="flex items-start justify-between mb-5 gap-3">
            <div>
              <h2 className="font-bold text-gray-900">Croissance — 12 mois</h2>
              <p className="text-xs text-gray-400 mt-0.5">Nouveaux comptes et inscriptions</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-1 sm:gap-3 text-[11px] text-gray-500">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#0B3D91]" /> Comptes</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#FFA500]" /> Inscriptions</span>
            </div>
          </div>
          <div className="flex items-end gap-1 sm:gap-1.5 h-40">
            {growth.map(m => (
              <div key={m.key} className="flex-1 flex flex-col items-center gap-1" title={`${m.label} : ${m.users} comptes, ${m.enrollments} inscriptions`}>
                <div className="w-full flex items-end gap-px" style={{ height: '120px' }}>
                  <div className="flex-1 bg-[#0B3D91] rounded-t" style={{ height: `${m.users ? Math.max(3, (m.users / maxGrowth) * 100) : 0}%` }} />
                  <div className="flex-1 bg-[#FFA500] rounded-t" style={{ height: `${m.enrollments ? Math.max(3, (m.enrollments / maxGrowth) * 100) : 0}%` }} />
                </div>
                <span className="text-[9px] sm:text-[10px] text-gray-400">{m.label}</span>
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-6">
        {/* ── Pays ── */}
        <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-5">
          <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2"><MapPin className="w-5 h-5 text-[#0B3D91]" /> Utilisateurs par pays</h2>
          <div className="space-y-3">
            {topCountries.length === 0 && <p className="text-sm text-gray-400 text-center py-4">Aucune donnée</p>}
            {topCountries.map(([cc, count]) => (
              <div key={cc}>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="font-medium text-gray-700">{COUNTRY[cc] ?? cc}</span>
                  <span className="text-gray-500 text-xs">{count}</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-[#0B3D91] rounded-full" style={{ width: `${(count / maxCountry) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Top formations ── */}
        <section className="bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="px-4 sm:px-5 py-3.5 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-bold text-gray-900">Top formations</h2>
            <Link href="/admin/formations" className="text-xs text-[#0B3D91] font-semibold flex items-center gap-1">Voir tout <ArrowRight className="w-3 h-3" /></Link>
          </div>
          <ul className="divide-y divide-gray-50">
            {((topCourses ?? []) as { id: string; title: string; enrollment_count: number | null; is_featured: boolean }[]).map((c, i) => (
              <li key={c.id} className="flex items-center gap-3 px-4 sm:px-5 py-3">
                <span className={`text-xs font-bold w-5 flex-shrink-0 ${i === 0 ? 'text-[#FFA500]' : 'text-gray-400'}`}>#{i + 1}</span>
                <span className="flex-1 min-w-0">
                  <span className="block text-sm font-medium text-gray-900 leading-snug line-clamp-2">{c.title}</span>
                  <span className="block text-xs text-gray-400">{c.enrollment_count ?? 0} inscrits{c.is_featured ? ' · ⭐ À la une' : ''}</span>
                </span>
              </li>
            ))}
            {!topCourses?.length && <li className="p-6 text-center text-sm text-gray-400">Aucune donnée</li>}
          </ul>
        </section>

        {/* ── Nouveaux utilisateurs ── */}
        <section className="bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="px-4 sm:px-5 py-3.5 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-bold text-gray-900">Nouveaux comptes</h2>
            <Link href="/admin/utilisateurs" className="text-xs text-[#0B3D91] font-semibold flex items-center gap-1">Voir tout <ArrowRight className="w-3 h-3" /></Link>
          </div>
          <ul className="divide-y divide-gray-50">
            {((recentUsers ?? []) as { id: string; full_name: string | null; country: string | null; created_at: string; role: string }[]).map(u => {
              const r = ROLE[u.role] ?? { label: 'Apprenant', cls: 'bg-gray-100 text-gray-600' }
              return (
                <li key={u.id} className="px-4 sm:px-5 py-3 flex items-center gap-3">
                  <span className="w-9 h-9 rounded-full bg-[#0B3D91] text-white flex items-center justify-center font-bold text-sm flex-shrink-0">{u.full_name?.charAt(0)?.toUpperCase() ?? '?'}</span>
                  <span className="flex-1 min-w-0">
                    <span className="block text-sm font-semibold text-gray-900 truncate" data-no-translate>{u.full_name ?? '—'}</span>
                    <span className="block text-xs text-gray-400">{formatDate(u.created_at)}{u.country ? ` · ${COUNTRY[u.country] ?? u.country}` : ''}</span>
                  </span>
                  <span className={`text-[11px] px-2 py-0.5 rounded-full font-semibold flex-shrink-0 ${r.cls}`}>{r.label}</span>
                </li>
              )
            })}
            {!recentUsers?.length && <li className="p-6 text-center text-sm text-gray-400">Aucun utilisateur</li>}
          </ul>
        </section>
      </div>

      {/* ── Paiements récents ── */}
      <section className="bg-white rounded-2xl border border-gray-100 shadow-sm">
        <div className="px-4 sm:px-5 py-3.5 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-bold text-gray-900">Paiements confirmés récents</h2>
          <Link href="/admin/paiements" className="text-xs text-[#0B3D91] font-semibold flex items-center gap-1">Voir tout <ArrowRight className="w-3 h-3" /></Link>
        </div>
        <ul className="divide-y divide-gray-50">
          {pays.slice(0, 6).map(p => (
            <li key={p.id} className="px-4 sm:px-5 py-3 flex items-center justify-between gap-4">
              <span className="min-w-0">
                <span className="block text-sm font-semibold text-gray-900 truncate" data-no-translate>{p.user?.full_name ?? '—'}</span>
                <span className="block text-xs text-gray-400 truncate">{p.course?.title ?? 'Séance de coaching'} · {formatDate(p.created_at)}</span>
              </span>
              <span className="font-bold text-emerald-600 text-sm flex-shrink-0">{formatPrice(p.amount, p.currency)}</span>
            </li>
          ))}
          {pays.length === 0 && <li className="p-6 text-center text-sm text-gray-400">Aucun paiement confirmé</li>}
        </ul>
      </section>

      <RealtimeActivityFeed initialActivities={activities} />
    </div>
  )
}
