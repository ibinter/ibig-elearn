import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { ArrowLeft, Download } from 'lucide-react'

export default async function AdminInscriptionsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>
}) {
  const { q = '', page = '1' } = await searchParams
  const supabase = await createClient()

  const perPage = 25
  const pageNum = Math.max(1, parseInt(page))
  const from = (pageNum - 1) * perPage
  const to = from + perPage - 1

  let query = supabase
    .from('enrollments')
    .select(
      'id, progress_percent, enrolled_at, is_completed, user:profiles(full_name, email), course:courses(title, slug)',
      { count: 'exact' }
    )
    .order('enrolled_at', { ascending: false })
    .range(from, to)

  const { data: enrollments, count } = await query
  const totalPages = Math.ceil((count ?? 0) / perPage)

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin" className="text-gray-400 hover:text-gray-700">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-gray-900">Inscriptions</h1>
          <p className="text-sm text-gray-500">{(count ?? 0).toLocaleString('fr')} inscriptions au total</p>
        </div>
        <a href="/api/admin/export?type=enrollments"
          className="flex items-center gap-2 bg-[#0B3D91] text-white text-sm font-semibold px-4 py-2 rounded-xl hover:bg-blue-800 transition-colors">
          <Download className="w-4 h-4" /> CSV
        </a>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Apprenant</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">Formation</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">Progression</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">Statut</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {(enrollments ?? []).map((e: any) => (
                <tr key={e.id} className="hover:bg-gray-50/60 transition-colors">
                  <td className="px-5 py-3">
                    <p className="text-sm font-medium text-gray-900">{e.user?.full_name ?? '—'}</p>
                    <p className="text-xs text-gray-400">{e.user?.email}</p>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700 max-w-[200px] truncate">{e.course?.title ?? '—'}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-1.5 bg-gray-100 rounded-full">
                        <div
                          className="h-full ibig-gradient rounded-full"
                          style={{ width: `${e.progress_percent ?? 0}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-600 font-medium">{e.progress_percent ?? 0}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {e.is_completed ? (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-medium">Terminée</span>
                    ) : (e.progress_percent ?? 0) > 0 ? (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-medium">En cours</span>
                    ) : (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 font-medium">Non démarrée</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-400">
                    {e.enrolled_at ? new Date(e.enrolled_at).toLocaleDateString('fr-FR') : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-gray-50">
            <span className="text-sm text-gray-500">Page {pageNum} sur {totalPages}</span>
            <div className="flex gap-2">
              {pageNum > 1 && (
                <Link href={`/admin/inscriptions?page=${pageNum - 1}`} className="text-sm px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50">Précédent</Link>
              )}
              {pageNum < totalPages && (
                <Link href={`/admin/inscriptions?page=${pageNum + 1}`} className="text-sm px-3 py-1.5 bg-[#0B3D91] text-white rounded-lg hover:bg-blue-800">Suivant</Link>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
