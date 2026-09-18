import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Users, BookOpen, Award, TrendingUp, Download, ChevronRight, BarChart2 } from 'lucide-react'

export default async function AdminPage() {
  const supabase = await createClient()

  const [
    { count: totalUsers },
    { count: totalEnrollments },
    { count: totalCerts },
    { count: totalCourses },
    { data: recentUsers },
    { data: recentEnrollments },
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('enrollments').select('*', { count: 'exact', head: true }),
    supabase.from('certificates').select('*', { count: 'exact', head: true }),
    supabase.from('courses').select('*', { count: 'exact', head: true }).eq('is_published', true),
    supabase.from('profiles').select('id, full_name, email, role, country, created_at').order('created_at', { ascending: false }).limit(8),
    supabase.from('enrollments').select('id, progress_percent, enrolled_at, user:profiles(full_name), course:courses(title)').order('enrolled_at', { ascending: false }).limit(6),
  ])

  const kpis = [
    { label: 'Apprenants', value: totalUsers ?? 0, icon: Users, color: 'text-blue-600 bg-blue-50', href: '/admin/apprenants' },
    { label: 'Inscriptions', value: totalEnrollments ?? 0, icon: TrendingUp, color: 'text-green-600 bg-green-50', href: '/admin/inscriptions' },
    { label: 'Certificats', value: totalCerts ?? 0, icon: Award, color: 'text-purple-600 bg-purple-50', href: '/admin/certificats' },
    { label: 'Formations actives', value: totalCourses ?? 0, icon: BookOpen, color: 'text-orange-600 bg-orange-50', href: '/admin/formations' },
  ]

  const roleColors: Record<string, string> = {
    admin: 'bg-red-100 text-red-700',
    coordinateur: 'bg-purple-100 text-purple-700',
    formateur: 'bg-blue-100 text-blue-700',
    apprenant: 'bg-gray-100 text-gray-600',
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Administration</h1>
          <p className="text-sm text-gray-500 mt-0.5">Vue d&apos;ensemble de la plateforme</p>
        </div>
        <div className="flex gap-3">
          <Link href="/admin/apprenants" className="flex items-center gap-2 text-sm font-medium text-[#0B3D91] hover:underline">
            <BarChart2 className="w-4 h-4" /> Détails
          </Link>
          <a href="/api/admin/export?type=users" className="flex items-center gap-2 bg-[#0B3D91] text-white text-sm font-semibold px-4 py-2 rounded-xl hover:bg-blue-800 transition-colors">
            <Download className="w-4 h-4" /> Export CSV
          </a>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map(({ label, value, icon: Icon, color, href }) => (
          <Link key={label} href={href} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-all group">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color} mb-3`}>
              <Icon className="w-5 h-5" />
            </div>
            <div className="text-2xl font-bold text-gray-900">{value.toLocaleString('fr')}</div>
            <div className="text-sm text-gray-500 mt-0.5">{label}</div>
            <div className="text-xs text-[#0B3D91] mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
              Voir détails →
            </div>
          </Link>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Derniers inscrits */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
            <h2 className="font-bold text-gray-900">Derniers apprenants</h2>
            <Link href="/admin/apprenants" className="text-xs text-[#0B3D91] hover:underline flex items-center gap-1">
              Voir tous <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="divide-y divide-gray-50">
            {(recentUsers ?? []).map((u: any) => (
              <div key={u.id} className="flex items-center gap-3 px-5 py-3">
                <div className="w-8 h-8 ibig-gradient rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                  {(u.full_name ?? u.email ?? '?')[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{u.full_name ?? '—'}</p>
                  <p className="text-xs text-gray-400 truncate">{u.email}</p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${roleColors[u.role ?? 'apprenant'] ?? roleColors['apprenant']}`}>
                  {u.role ?? 'apprenant'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Dernières inscriptions */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
            <h2 className="font-bold text-gray-900">Dernières inscriptions</h2>
            <Link href="/admin/inscriptions" className="text-xs text-[#0B3D91] hover:underline flex items-center gap-1">
              Voir toutes <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="divide-y divide-gray-50">
            {(recentEnrollments ?? []).map((e: any) => (
              <div key={e.id} className="flex items-center gap-3 px-5 py-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{(e.user as any)?.full_name ?? '—'}</p>
                  <p className="text-xs text-gray-400 truncate">{(e.course as any)?.title ?? '—'}</p>
                </div>
                <div className="flex-shrink-0 text-right">
                  <div className="text-xs text-gray-500">{e.progress_percent ?? 0}%</div>
                  <div className="w-16 h-1 bg-gray-100 rounded-full mt-1">
                    <div className="h-full ibig-gradient rounded-full" style={{ width: `${e.progress_percent ?? 0}%` }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Navigation admin */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Gérer les apprenants', href: '/admin/apprenants', emoji: '👥' },
          { label: 'Gérer les formations', href: '/admin/formations', emoji: '📚' },
          { label: 'Inscriptions', href: '/admin/inscriptions', emoji: '📋' },
          { label: 'Exports CSV', href: '/admin/exports', emoji: '📥' },
        ].map(item => (
          <Link key={item.href} href={item.href}
            className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 hover:shadow-md hover:border-[#0B3D91]/20 transition-all text-center">
            <div className="text-2xl mb-2">{item.emoji}</div>
            <p className="text-sm font-medium text-gray-700">{item.label}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}
