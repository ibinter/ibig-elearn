import { createClient } from '@/lib/supabase/server'
import { Users, BookOpen, Award, DollarSign, TrendingUp, Activity } from 'lucide-react'
import { formatPrice } from '@/lib/utils'

export default async function AdminPage() {
  const supabase = await createClient()

  const [
    { count: totalUsers },
    { count: totalCourses },
    { count: totalEnrollments },
    { count: totalCerts },
    { data: recentPayments },
    { data: recentUsers },
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('courses').select('*', { count: 'exact', head: true }).eq('is_published', true),
    supabase.from('enrollments').select('*', { count: 'exact', head: true }),
    supabase.from('certificates').select('*', { count: 'exact', head: true }),
    supabase.from('payments').select('*, user:profiles(full_name), course:courses(title)').eq('status', 'completed').order('created_at', { ascending: false }).limit(5),
    supabase.from('profiles').select('id, full_name, email, country, created_at, role').order('created_at', { ascending: false }).limit(5),
  ])

  const { data: revenueData } = await supabase.from('payments').select('amount').eq('status', 'completed').eq('currency', 'XOF')
  const totalRevenue = revenueData?.reduce((sum, p) => sum + p.amount, 0) ?? 0

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Tableau de bord Admin</h1>
        <p className="text-gray-500">Vue d&apos;ensemble de la plateforme IBIG E-LEARN</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
        {[
          { label: 'Utilisateurs', value: totalUsers ?? 0, icon: Users, color: 'bg-blue-50 text-blue-600' },
          { label: 'Formations', value: totalCourses ?? 0, icon: BookOpen, color: 'bg-purple-50 text-purple-600' },
          { label: 'Inscriptions', value: totalEnrollments ?? 0, icon: TrendingUp, color: 'bg-green-50 text-green-600' },
          { label: 'Certificats', value: totalCerts ?? 0, icon: Award, color: 'bg-yellow-50 text-yellow-600' },
          { label: 'Revenus (XOF)', value: formatPrice(totalRevenue), icon: DollarSign, color: 'bg-emerald-50 text-emerald-600', isText: true },
          { label: 'Taux complétion', value: totalEnrollments ? `${Math.round(((totalCerts ?? 0) / totalEnrollments) * 100)}%` : '0%', icon: Activity, color: 'bg-orange-50 text-orange-600', isText: true },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${s.color} mb-3`}>
              <s.icon className="w-5 h-5" />
            </div>
            <div className={`font-bold text-gray-900 ${(s as any).isText ? 'text-base' : 'text-2xl'}`}>{s.value}</div>
            <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Paiements récents */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="p-5 border-b border-gray-100">
            <h2 className="font-bold text-gray-900">Paiements récents</h2>
          </div>
          <div className="divide-y divide-gray-50">
            {recentPayments && recentPayments.length > 0 ? (recentPayments as any[]).map(p => (
              <div key={p.id} className="p-4 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{p.user?.full_name}</p>
                  <p className="text-xs text-gray-400 truncate">{p.course?.title}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="font-bold text-green-600 text-sm">{formatPrice(p.amount, p.currency)}</p>
                  <p className="text-xs text-gray-400">{p.method}</p>
                </div>
              </div>
            )) : (
              <div className="p-6 text-center text-sm text-gray-400">Aucun paiement</div>
            )}
          </div>
        </div>

        {/* Nouveaux utilisateurs */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="p-5 border-b border-gray-100">
            <h2 className="font-bold text-gray-900">Nouveaux utilisateurs</h2>
          </div>
          <div className="divide-y divide-gray-50">
            {recentUsers && recentUsers.length > 0 ? (recentUsers as any[]).map(u => (
              <div key={u.id} className="p-4 flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-[#0B3D91] text-white flex items-center justify-center font-bold text-sm flex-shrink-0">
                  {u.full_name?.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{u.full_name}</p>
                  <p className="text-xs text-gray-400 truncate">{u.email}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${u.role === 'admin' ? 'bg-red-100 text-red-700' : u.role === 'formateur' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>
                    {u.role}
                  </span>
                </div>
              </div>
            )) : (
              <div className="p-6 text-center text-sm text-gray-400">Aucun utilisateur</div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
