import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { ArrowLeft, Eye, EyeOff, BookOpen } from 'lucide-react'

export default async function AdminFormationsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>
}) {
  const { page = '1' } = await searchParams
  const supabase = await createClient()

  const perPage = 20
  const pageNum = Math.max(1, parseInt(page))
  const from = (pageNum - 1) * perPage
  const to = from + perPage - 1

  const { data: courses, count } = await supabase
    .from('courses')
    .select(
      'id, title, slug, is_published, price, category, level, total_lessons, duration_hours, created_at, formateur:profiles!courses_instructor_id_fkey(full_name)',
      { count: 'exact' }
    )
    .order('created_at', { ascending: false })
    .range(from, to)

  // Nombre d'inscrits par formation
  const courseIds = (courses ?? []).map(c => c.id)
  const { data: enrollCounts } = await supabase
    .from('enrollments')
    .select('course_id')
    .in('course_id', courseIds)

  const enrollMap: Record<string, number> = {}
  for (const e of enrollCounts ?? []) {
    enrollMap[e.course_id] = (enrollMap[e.course_id] ?? 0) + 1
  }

  const totalPages = Math.ceil((count ?? 0) / perPage)
  const published = (courses ?? []).filter(c => c.is_published).length

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin" className="text-gray-400 hover:text-gray-700">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-gray-900">Formations</h1>
          <p className="text-sm text-gray-500">{count ?? 0} formations · {published} publiées</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Formation</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">Formateur</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">Catégorie</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">Inscrits</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">Prix</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {(courses ?? []).map((c: any) => (
                <tr key={c.id} className="hover:bg-gray-50/60 transition-colors">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 ibig-gradient rounded-lg flex items-center justify-center flex-shrink-0">
                        <BookOpen className="w-4 h-4 text-white" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate max-w-[200px]">{c.title}</p>
                        <p className="text-xs text-gray-400">{c.total_lessons ?? 0} leçons · {c.duration_hours ?? 0}h</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{c.formateur?.full_name ?? '—'}</td>
                  <td className="px-4 py-3">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 font-medium">{c.category ?? '—'}</span>
                  </td>
                  <td className="px-4 py-3 text-sm font-semibold text-gray-900">{(enrollMap[c.id] ?? 0).toLocaleString('fr')}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    {c.price > 0 ? `${c.price.toLocaleString('fr')} XOF` : <span className="text-green-600 font-medium">Gratuit</span>}
                  </td>
                  <td className="px-4 py-3">
                    {c.is_published ? (
                      <span className="flex items-center gap-1 text-xs text-green-700 bg-green-50 px-2 py-0.5 rounded-full font-medium w-fit">
                        <Eye className="w-3 h-3" /> Publiée
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full font-medium w-fit">
                        <EyeOff className="w-3 h-3" /> Brouillon
                      </span>
                    )}
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
                <Link href={`/admin/formations?page=${pageNum - 1}`} className="text-sm px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50">Précédent</Link>
              )}
              {pageNum < totalPages && (
                <Link href={`/admin/formations?page=${pageNum + 1}`} className="text-sm px-3 py-1.5 bg-[#0B3D91] text-white rounded-lg hover:bg-blue-800">Suivant</Link>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
