import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { DollarSign, TrendingUp, BookOpen, Calendar } from 'lucide-react'
import { formatPrice } from '@/lib/utils'
import Link from 'next/link'

export default async function FormateurRevenusPage() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll() } }
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  // Cours du formateur
  const { data: courses } = await supabase
    .from('courses')
    .select('id, title, slug, price_xof, price_eur, enrollment_count')
    .eq('instructor_id', user.id)
    .eq('is_published', true)

  const courseIds = (courses ?? []).map((c: any) => c.id)

  // Paiements sur ces cours
  const { data: payments } = courseIds.length
    ? await supabase
        .from('payments')
        .select('id, amount, currency, created_at, course_id, user:profiles(full_name)')
        .in('course_id', courseIds)
        .eq('status', 'completed')
        .order('created_at', { ascending: false })
    : { data: [] }

  // Revenus par cours
  const revenueByCourse: Record<string, { title: string; slug: string; xof: number; eur: number; count: number }> = {}
  for (const c of (courses ?? []) as any[]) {
    revenueByCourse[c.id] = { title: c.title, slug: c.slug, xof: 0, eur: 0, count: 0 }
  }
  for (const p of (payments ?? []) as any[]) {
    if (!revenueByCourse[p.course_id]) continue
    revenueByCourse[p.course_id].count += 1
    if (p.currency === 'XOF' || p.currency === 'XAF') revenueByCourse[p.course_id].xof += p.amount
    else if (p.currency === 'EUR') revenueByCourse[p.course_id].eur += p.amount
    else revenueByCourse[p.course_id].xof += p.amount * 655 // approx conversion
  }

  // Revenus par mois (12 derniers mois)
  const now = new Date()
  const months: { label: string; xof: number }[] = []
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    months.push({
      label: d.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' }),
      xof: 0,
    })
  }
  for (const p of (payments ?? []) as any[]) {
    const d = new Date(p.created_at)
    const diff = (now.getFullYear() - d.getFullYear()) * 12 + (now.getMonth() - d.getMonth())
    if (diff >= 0 && diff < 12) {
      const idx = 11 - diff
      const amt = (p.currency === 'XOF' || p.currency === 'XAF') ? p.amount : p.amount * 655
      months[idx].xof += amt
    }
  }

  const totalXof = Object.values(revenueByCourse).reduce((s, r) => s + r.xof, 0)
  const totalTransactions = (payments ?? []).length
  const maxMonthly = Math.max(...months.map(m => m.xof), 1)

  const courseList = Object.entries(revenueByCourse).sort((a, b) => b[1].xof - a[1].xof)

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Revenus</h1>
        <p className="text-gray-500 mt-1">Suivi de vos gains sur toutes vos formations</p>
      </div>

      {/* KPIs */}
      <div className="grid sm:grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Revenus totaux', value: formatPrice(totalXof, 'XOF'), icon: DollarSign, color: 'text-green-600 bg-green-50' },
          { label: 'Transactions', value: totalTransactions.toString(), icon: TrendingUp, color: 'text-blue-600 bg-blue-50' },
          { label: 'Formations actives', value: (courses?.length ?? 0).toString(), icon: BookOpen, color: 'text-purple-600 bg-purple-50' },
        ].map(k => (
          <div key={k.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${k.color}`}>
              <k.icon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-gray-500">{k.label}</p>
              <p className="text-xl font-bold text-gray-900">{k.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Graphique mensuel SVG */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-8">
        <div className="flex items-center gap-2 mb-6">
          <Calendar className="w-4 h-4 text-gray-400" />
          <h2 className="font-semibold text-gray-900">Revenus mensuels (12 derniers mois)</h2>
        </div>
        <div className="overflow-x-auto">
          <svg viewBox={`0 0 ${months.length * 56} 160`} className="w-full" style={{ minWidth: '520px' }}>
            {months.map((m, i) => {
              const barH = maxMonthly > 0 ? Math.round((m.xof / maxMonthly) * 110) : 0
              const x = i * 56 + 8
              const y = 130 - barH
              return (
                <g key={m.label}>
                  <rect x={x} y={y} width={40} height={barH || 2} rx={5}
                    fill={i === months.length - 1 ? '#FFA500' : '#0B3D91'}
                    opacity={i === months.length - 1 ? 1 : 0.75}
                  />
                  {m.xof > 0 && (
                    <text x={x + 20} y={y - 4} textAnchor="middle" fontSize="8" fill="#374151" fontWeight="600">
                      {m.xof >= 1000000 ? `${(m.xof / 1000000).toFixed(1)}M` : m.xof >= 1000 ? `${Math.round(m.xof / 1000)}k` : m.xof}
                    </text>
                  )}
                  <text x={x + 20} y={150} textAnchor="middle" fontSize="9" fill="#9ca3af">{m.label}</text>
                </g>
              )
            })}
          </svg>
        </div>
      </div>

      {/* Tableau par cours */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-8">
        <div className="px-6 py-4 border-b border-gray-50">
          <h2 className="font-semibold text-gray-900">Revenus par formation</h2>
        </div>
        {courseList.length === 0 ? (
          <div className="py-12 text-center text-gray-400">Aucun revenu enregistré</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
                <th className="text-left px-6 py-3">Formation</th>
                <th className="text-right px-6 py-3">Transactions</th>
                <th className="text-right px-6 py-3">Revenus (XOF)</th>
                <th className="text-right px-6 py-3">Part (%)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {courseList.map(([id, r]) => (
                <tr key={id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <Link href={`/formateur/formations/${id}/stats`} className="font-medium text-gray-900 hover:text-[#0B3D91] transition-colors">
                      {r.title}
                    </Link>
                  </td>
                  <td className="px-6 py-4 text-right text-gray-600">{r.count}</td>
                  <td className="px-6 py-4 text-right font-semibold text-gray-900">{r.xof.toLocaleString('fr-FR')} XOF</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <div className="w-20 bg-gray-100 rounded-full h-1.5">
                        <div className="h-1.5 rounded-full bg-[#0B3D91]" style={{ width: `${totalXof > 0 ? Math.round((r.xof / totalXof) * 100) : 0}%` }} />
                      </div>
                      <span className="text-gray-500 text-xs w-8 text-right">
                        {totalXof > 0 ? Math.round((r.xof / totalXof) * 100) : 0}%
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-gray-50 font-bold">
                <td className="px-6 py-3 text-gray-900">Total</td>
                <td className="px-6 py-3 text-right text-gray-900">{totalTransactions}</td>
                <td className="px-6 py-3 text-right text-gray-900">{totalXof.toLocaleString('fr-FR')} XOF</td>
                <td className="px-6 py-3 text-right text-gray-500">100%</td>
              </tr>
            </tfoot>
          </table>
        )}
      </div>

      {/* Dernières transactions */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-50">
          <h2 className="font-semibold text-gray-900">Dernières transactions</h2>
        </div>
        {(payments ?? []).length === 0 ? (
          <div className="py-12 text-center text-gray-400">Aucune transaction</div>
        ) : (
          <div className="divide-y divide-gray-50">
            {(payments as any[]).slice(0, 20).map((p: any) => (
              <div key={p.id} className="px-6 py-4 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{p.user?.full_name ?? 'Apprenant'}</p>
                  <p className="text-xs text-gray-400">{revenueByCourse[p.course_id]?.title ?? '—'} · {new Date(p.created_at).toLocaleDateString('fr-FR')}</p>
                </div>
                <span className="text-sm font-bold text-green-600 flex-shrink-0">+{formatPrice(p.amount, p.currency)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
