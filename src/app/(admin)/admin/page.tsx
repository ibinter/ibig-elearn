import { createClient } from '@/lib/supabase/server'
import { Users, BookOpen, Award, DollarSign, TrendingUp, Activity, ArrowRight, MapPin, BarChart3 } from 'lucide-react'
import { formatPrice, formatDate } from '@/lib/utils'
import Link from 'next/link'
import RealtimeActivityFeed from '@/components/admin/RealtimeActivityFeed'

export default async function AdminPage() {
  const supabase = await createClient()

  const [
    { count: totalUsers },
    { count: totalCourses },
    { count: totalEnrollments },
    { count: totalCerts },
    { data: recentPayments },
    { data: recentUsers },
    { data: topCourses },
    { data: revenueData },
    { data: countryData },
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('courses').select('*', { count: 'exact', head: true }).eq('is_published', true),
    supabase.from('enrollments').select('*', { count: 'exact', head: true }),
    supabase.from('certificates').select('*', { count: 'exact', head: true }),
    supabase.from('payments').select('*, user:profiles(full_name), course:courses(title)').eq('status', 'completed').order('created_at', { ascending: false }).limit(8),
    supabase.from('profiles').select('id, full_name, email, country, created_at, role').order('created_at', { ascending: false }).limit(6),
    supabase.from('courses').select('id, title, slug, enrollment_count, price_xof, is_featured').eq('is_published', true).order('enrollment_count', { ascending: false }).limit(5),
    supabase.from('payments').select('amount, currency, created_at').eq('status', 'completed'),
    supabase.from('profiles').select('country').not('country', 'is', null),
  ])

  const totalRevenue = revenueData?.filter(p => p.currency === 'XOF').reduce((s, p) => s + p.amount, 0) ?? 0
  const totalRevenueEur = revenueData?.filter(p => p.currency === 'EUR').reduce((s, p) => s + p.amount, 0) ?? 0
  const completionRate = totalEnrollments ? Math.round(((totalCerts ?? 0) / totalEnrollments) * 100) : 0

  // Revenus 12 derniers mois
  const months = Array.from({ length: 12 }, (_, i) => {
    const d = new Date()
    d.setMonth(d.getMonth() - (11 - i))
    return { key: d.toISOString().slice(0, 7), label: d.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' }) }
  })
  const revenueByMonth = months.map(m => ({
    ...m,
    xof: revenueData?.filter(p => p.currency === 'XOF' && p.created_at.slice(0, 7) === m.key).reduce((s, p) => s + p.amount, 0) ?? 0,
    eur: revenueData?.filter(p => p.currency === 'EUR' && p.created_at.slice(0, 7) === m.key).reduce((s, p) => s + p.amount, 0) ?? 0,
    count: revenueData?.filter(p => p.created_at.slice(0, 7) === m.key).length ?? 0,
  }))
  const maxRevenue = Math.max(...revenueByMonth.map(m => m.xof + m.eur * 655), 1)

  // Pays top
  const countryCount: Record<string, number> = {}
  countryData?.forEach(u => { if (u.country) countryCount[u.country] = (countryCount[u.country] ?? 0) + 1 })
  const topCountries = Object.entries(countryCount).sort((a, b) => b[1] - a[1]).slice(0, 8)
  const maxCountry = Math.max(...topCountries.map(c => c[1]), 1)

  const countryNames: Record<string, string> = {
    CI: 'Côte d\'Ivoire', SN: 'Sénégal', CM: 'Cameroun', BF: 'Burkina Faso',
    ML: 'Mali', GN: 'Guinée', TG: 'Togo', BJ: 'Bénin', MA: 'Maroc',
    FR: 'France', BE: 'Belgique', NG: 'Nigéria', GH: 'Ghana', CD: 'RD Congo',
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Tableau de bord Admin</h1>
        <p className="text-gray-500">Vue d&apos;ensemble de la plateforme IBIG E-LEARN</p>
      </div>

      {/* Stats KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
        {[
          { label: 'Utilisateurs', value: totalUsers ?? 0, icon: Users, color: 'bg-blue-50 text-blue-600' },
          { label: 'Formations', value: totalCourses ?? 0, icon: BookOpen, color: 'bg-purple-50 text-purple-600' },
          { label: 'Inscriptions', value: totalEnrollments ?? 0, icon: TrendingUp, color: 'bg-green-50 text-green-600' },
          { label: 'Certificats', value: totalCerts ?? 0, icon: Award, color: 'bg-yellow-50 text-yellow-600' },
          { label: 'Revenus XOF', value: formatPrice(totalRevenue), icon: DollarSign, color: 'bg-emerald-50 text-emerald-600', text: true },
          { label: 'Taux complétion', value: `${completionRate}%`, icon: Activity, color: 'bg-orange-50 text-orange-600', text: true },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${s.color} mb-3`}>
              <s.icon className="w-5 h-5" />
            </div>
            <div className={`font-bold text-gray-900 ${(s as any).text ? 'text-sm' : 'text-2xl'}`}>{s.value}</div>
            <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Graphique revenus 12 mois */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="font-bold text-gray-900">Revenus — 12 derniers mois</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Total XOF : {formatPrice(totalRevenue)} {totalRevenueEur > 0 && `· EUR : ${formatPrice(totalRevenueEur, 'EUR')}`}
            </p>
          </div>
          <BarChart3 className="w-5 h-5 text-gray-300" />
        </div>
        <div className="flex items-end gap-1.5 h-40">
          {revenueByMonth.map(m => {
            const combined = m.xof + m.eur * 655
            const pct = (combined / maxRevenue) * 100
            return (
              <div key={m.key} className="flex-1 flex flex-col items-center gap-1 group relative">
                {m.count > 0 && (
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                    {m.count} paiement{m.count > 1 ? 's' : ''}
                  </div>
                )}
                <div className="w-full rounded-t-md bg-gray-100 relative overflow-hidden" style={{ height: '120px' }}>
                  <div
                    className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-[#0B3D91] to-[#1a5fd4] rounded-t-md transition-all"
                    style={{ height: `${pct}%` }}
                  />
                  {m.eur > 0 && (
                    <div
                      className="absolute bottom-0 left-0 right-0 bg-[#FFA500]/70 rounded-t-md transition-all"
                      style={{ height: `${(m.eur * 655 / maxRevenue) * 100}%` }}
                    />
                  )}
                </div>
                <span className="text-[9px] text-gray-400 text-center leading-tight">{m.label}</span>
              </div>
            )
          })}
        </div>
        <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
          <span className="flex items-center gap-1"><span className="w-3 h-2 rounded bg-[#0B3D91] inline-block" /> XOF / FCFA</span>
          <span className="flex items-center gap-1"><span className="w-3 h-2 rounded bg-[#FFA500]/70 inline-block" /> EUR</span>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6 mb-6">
        {/* Distribution pays */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-5">
            <MapPin className="w-5 h-5 text-[#0B3D91]" />
            <h2 className="font-bold text-gray-900">Apprenants par pays</h2>
          </div>
          <div className="space-y-3">
            {topCountries.length === 0 && <p className="text-sm text-gray-400 text-center py-4">Aucune donnée</p>}
            {topCountries.map(([cc, count]) => (
              <div key={cc}>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="font-medium text-gray-700">{countryNames[cc] ?? cc}</span>
                  <span className="text-gray-500 text-xs">{count}</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-[#0B3D91] rounded-full" style={{ width: `${(count / maxCountry) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top formations */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="p-5 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-bold text-gray-900">Top formations</h2>
            <Link href="/admin/formations" className="text-xs text-[#0B3D91] hover:underline flex items-center gap-1">
              Voir tout <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="divide-y divide-gray-50">
            {(topCourses as any[])?.map((c, i) => (
              <div key={c.id} className="flex items-center gap-3 px-5 py-3">
                <span className={`text-xs font-bold w-5 flex-shrink-0 ${i === 0 ? 'text-[#FFA500]' : 'text-gray-400'}`}>#{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{c.title}</p>
                  <p className="text-xs text-gray-400">{c.enrollment_count} inscrits</p>
                </div>
                {c.is_featured && <span className="text-[10px] text-[#FFA500]">⭐</span>}
              </div>
            ))}
            {!topCourses?.length && <div className="p-6 text-center text-sm text-gray-400">Aucune donnée</div>}
          </div>
        </div>

        {/* Taux de complétion */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h2 className="font-bold text-gray-900 mb-5">KPIs business</h2>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1.5">
                <span className="text-gray-600">Taux de complétion</span>
                <span className="font-bold text-gray-900">{completionRate}%</span>
              </div>
              <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-green-500 rounded-full" style={{ width: `${completionRate}%` }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1.5">
                <span className="text-gray-600">Conversion inscriptions</span>
                <span className="font-bold text-gray-900">
                  {totalEnrollments && totalUsers ? Math.round((totalEnrollments / (totalUsers ?? 1)) * 100) : 0}%
                </span>
              </div>
              <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-[#0B3D91] rounded-full" style={{ width: `${totalEnrollments && totalUsers ? Math.round((totalEnrollments / (totalUsers ?? 1)) * 100) : 0}%` }} />
              </div>
            </div>
            <div className="pt-3 border-t border-gray-100 grid grid-cols-2 gap-3">
              <div className="text-center p-3 bg-gray-50 rounded-xl">
                <div className="text-xl font-bold text-gray-900">{totalCerts}</div>
                <div className="text-xs text-gray-500">Certificats émis</div>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-xl">
                <div className="text-xl font-bold text-gray-900">{topCountries.length}</div>
                <div className="text-xs text-gray-500">Pays représentés</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Paiements récents */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="p-5 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-bold text-gray-900">Paiements récents</h2>
            <Link href="/admin/paiements" className="text-xs text-[#0B3D91] hover:underline flex items-center gap-1">
              Voir tout <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="divide-y divide-gray-50">
            {recentPayments && recentPayments.length > 0 ? (recentPayments as any[]).map(p => (
              <div key={p.id} className="p-4 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{p.user?.full_name}</p>
                  <p className="text-xs text-gray-400 truncate">{p.course?.title}</p>
                </div>
                <p className="font-bold text-green-600 text-sm flex-shrink-0">{formatPrice(p.amount, p.currency)}</p>
              </div>
            )) : <div className="p-6 text-center text-sm text-gray-400">Aucun paiement</div>}
          </div>
        </div>

        {/* Nouveaux utilisateurs */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="p-5 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-bold text-gray-900">Nouveaux utilisateurs</h2>
            <Link href="/admin/utilisateurs" className="text-xs text-[#0B3D91] hover:underline flex items-center gap-1">
              Voir tout <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="divide-y divide-gray-50">
            {recentUsers && recentUsers.length > 0 ? (recentUsers as any[]).map(u => (
              <div key={u.id} className="p-4 flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-[#0B3D91] text-white flex items-center justify-center font-bold text-sm flex-shrink-0">
                  {u.full_name?.charAt(0)?.toUpperCase() ?? '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{u.full_name}</p>
                  <p className="text-xs text-gray-400">{formatDate(u.created_at)}</p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${
                  u.role === 'admin' ? 'bg-red-100 text-red-700' :
                  u.role === 'formateur' ? 'bg-blue-100 text-blue-700' :
                  'bg-gray-100 text-gray-600'}`}>
                  {u.role}
                </span>
              </div>
            )) : <div className="p-6 text-center text-sm text-gray-400">Aucun utilisateur</div>}
          </div>
        </div>
      </div>

      {/* Activité en direct */}
      {(() => {
        const initialActivities = [
          ...(recentPayments ?? []).slice(0, 5).map((p: any) => ({
            id: p.id,
            type: 'payment' as const,
            label: `Paiement de ${formatPrice(p.amount, p.currency)}${p.user?.full_name ? ` — ${p.user.full_name}` : ''}`,
            time: p.created_at,
            amount: p.amount,
          })),
          ...(recentUsers ?? []).slice(0, 5).map((u: any) => ({
            id: u.id,
            type: 'user' as const,
            label: `${u.full_name ?? 'Nouvel utilisateur'} vient de s'inscrire`,
            time: u.created_at,
          })),
        ].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()).slice(0, 10)
        return <RealtimeActivityFeed initialActivities={initialActivities} />
      })()}
    </div>
  )
}
