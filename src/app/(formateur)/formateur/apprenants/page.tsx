import { createClient } from '@/lib/supabase/server'
import { Users, BookOpen, TrendingUp, Search, Download } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import Link from 'next/link'

interface PageProps {
  searchParams: Promise<{ q?: string; cours?: string; statut?: string }>
}

export default async function FormateurApprenantsPage({ searchParams }: PageProps) {
  const params = await searchParams
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  let query = supabase
    .from('enrollments')
    .select(`
      id, progress_percent, status, enrolled_at,
      user:profiles(full_name, email, country),
      course:courses!inner(id, title, instructor_id)
    `)
    .eq('course.instructor_id', user.id)
    .order('enrolled_at', { ascending: false })

  if (params.statut === 'completed') query = query.eq('status', 'completed')
  else if (params.statut === 'active') query = query.eq('status', 'active')

  const { data: enrollmentsRaw } = await query

  // Filtrage côté serveur pour q (nom/email) et cours
  let enrollments = (enrollmentsRaw ?? []) as any[]
  if (params.q) {
    const q = params.q.toLowerCase()
    enrollments = enrollments.filter(e =>
      e.user?.full_name?.toLowerCase().includes(q) ||
      e.user?.email?.toLowerCase().includes(q)
    )
  }
  if (params.cours) {
    enrollments = enrollments.filter(e =>
      e.course?.title?.toLowerCase().includes(params.cours!.toLowerCase())
    )
  }

  const uniqueStudents = new Set(enrollments?.map((e: any) => e.user?.email)).size
  const completed = enrollments?.filter(e => e.status === 'completed').length ?? 0
  const avgProgress = enrollments?.length
    ? Math.round(enrollments.reduce((sum, e) => sum + e.progress_percent, 0) / enrollments.length)
    : 0

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mes apprenants</h1>
          <p className="text-gray-500 text-sm mt-1">{enrollments.length} inscription(s){params.q || params.cours || params.statut ? ' — filtrés' : ''}</p>
        </div>
        <a href="/api/formateur/apprenants/export" download
          className="flex items-center gap-2 text-sm font-semibold text-[#0B3D91] border border-[#0B3D91] px-4 py-2 rounded-xl hover:bg-blue-50 transition-colors">
          <Download className="w-4 h-4" /> Exporter CSV
        </a>
      </div>

      {/* Recherche & filtres */}
      <form method="get" className="bg-white rounded-xl border border-gray-200 p-4 flex flex-wrap gap-3 items-end">
        <div className="flex-1 min-w-[180px]">
          <label className="text-xs font-medium text-gray-500 mb-1 block">Recherche (nom / email)</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input name="q" defaultValue={params.q} placeholder="Nom ou email..."
              className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0B3D91]" />
          </div>
        </div>
        <div className="flex-1 min-w-[160px]">
          <label className="text-xs font-medium text-gray-500 mb-1 block">Formation</label>
          <input name="cours" defaultValue={params.cours} placeholder="Titre de la formation..."
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0B3D91]" />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-500 mb-1 block">Statut</label>
          <select name="statut" defaultValue={params.statut ?? ''}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0B3D91] bg-white">
            <option value="">Tous</option>
            <option value="active">En cours</option>
            <option value="completed">Terminés</option>
          </select>
        </div>
        <button type="submit" className="px-4 py-2 bg-[#0B3D91] text-white text-sm font-semibold rounded-lg hover:bg-blue-800 transition-colors">
          Filtrer
        </button>
        {(params.q || params.cours || params.statut) && (
          <Link href="/formateur/apprenants" className="px-4 py-2 text-sm text-gray-500 hover:text-gray-800 transition-colors">
            Réinitialiser
          </Link>
        )}
      </form>

      {/* Stats */}
      <div className="grid sm:grid-cols-3 gap-4">
        {[
          { label: 'Apprenants uniques', value: uniqueStudents, icon: Users, color: 'text-blue-600 bg-blue-50' },
          { label: 'Formations terminées', value: completed, icon: BookOpen, color: 'text-green-600 bg-green-50' },
          { label: 'Progression moyenne', value: `${avgProgress}%`, icon: TrendingUp, color: 'text-purple-600 bg-purple-50' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${s.color}`}>
              <s.icon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xl font-bold text-gray-900">{s.value}</p>
              <p className="text-sm text-gray-500">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Table apprenants */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Apprenant</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell">Formation</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Progression</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">Inscrit le</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {enrollments.map(e => (
              <tr key={e.id} className="hover:bg-gray-50">
                <td className="px-5 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-[#0B3D91] text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                      {e.user?.full_name?.charAt(0)}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 text-sm">{e.user?.full_name}</p>
                      <p className="text-xs text-gray-400">{e.user?.country}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-gray-600 hidden lg:table-cell max-w-[180px]">
                  <p className="truncate">{e.course?.title}</p>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-gray-100 rounded-full h-1.5 max-w-[80px]">
                      <div className="h-1.5 rounded-full bg-[#0B3D91]" style={{ width: `${e.progress_percent}%` }} />
                    </div>
                    <span className="text-xs text-gray-500 font-medium">{e.progress_percent}%</span>
                    {e.status === 'completed' && (
                      <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded font-medium">Terminé</span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-gray-500 hidden md:table-cell">{formatDate(e.enrolled_at)}</td>
              </tr>
            ))}
            {(!enrollments || enrollments.length === 0) && (
              <tr>
                <td colSpan={4} className="text-center py-12">
                  <Users className="w-10 h-10 text-gray-200 mx-auto mb-2" />
                  <p className="text-gray-400 text-sm">Aucun apprenant inscrit à vos formations</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
