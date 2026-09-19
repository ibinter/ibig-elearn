import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Download, Users, ArrowLeft } from 'lucide-react'

export default async function AdminApprenantsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>
}) {
  const { q = '', page = '1' } = await searchParams
  const supabase = await createClient()

  const perPage = 20
  const pageNum = Math.max(1, parseInt(page))
  const from = (pageNum - 1) * perPage
  const to = from + perPage - 1

  let query = supabase
    .from('profiles')
    .select('id, full_name, email, role, country, created_at, points, level, streak_days', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to)

  if (q) {
    query = query.or(`full_name.ilike.%${q}%,email.ilike.%${q}%`)
  }

  const { data: users, count } = await query

  const totalPages = Math.ceil((count ?? 0) / perPage)

  const roleColors: Record<string, string> = {
    admin: 'bg-red-100 text-red-700',
    coordinateur: 'bg-purple-100 text-purple-700',
    formateur: 'bg-blue-100 text-blue-700',
    apprenant: 'bg-gray-100 text-gray-600',
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin" className="text-gray-400 hover:text-gray-700">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-gray-900">Apprenants</h1>
          <p className="text-sm text-gray-500">{count ?? 0} utilisateurs inscrits</p>
        </div>
        <a href="/api/admin/export?type=users"
          className="flex items-center gap-2 bg-[#0B3D91] text-white text-sm font-semibold px-4 py-2 rounded-xl hover:bg-blue-800 transition-colors">
          <Download className="w-4 h-4" /> Exporter CSV
        </a>
      </div>

      {/* Recherche */}
      <form method="get" className="flex gap-3">
        <input
          name="q"
          defaultValue={q}
          placeholder="Rechercher par nom ou email..."
          className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B3D91]"
        />
        <button type="submit" className="bg-[#0B3D91] text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-blue-800 transition-colors">
          Rechercher
        </button>
        {q && (
          <Link href="/admin/apprenants" className="border border-gray-200 px-4 py-2.5 rounded-xl text-sm text-gray-600 hover:bg-gray-50">
            Réinitialiser
          </Link>
        )}
      </form>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Nom</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">Email</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">Rôle</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">Pays</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">Points</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">Inscrit le</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {(users ?? []).map((u: any) => (
                <tr key={u.id} className="hover:bg-gray-50/60 transition-colors">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 ibig-gradient rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                        {(u.full_name ?? u.email ?? '?')[0].toUpperCase()}
                      </div>
                      <span className="text-sm font-medium text-gray-900">{u.full_name ?? '—'}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{u.email}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${roleColors[u.role ?? 'apprenant']}`}>
                      {u.role ?? 'apprenant'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">{u.country ?? '—'}</td>
                  <td className="px-4 py-3 text-sm font-semibold text-[#0B3D91]">{(u.points ?? 0).toLocaleString('fr')}</td>
                  <td className="px-4 py-3 text-sm text-gray-400">
                    {u.created_at ? new Date(u.created_at).toLocaleDateString('fr-FR') : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-gray-50">
            <span className="text-sm text-gray-500">
              Page {pageNum} sur {totalPages}
            </span>
            <div className="flex gap-2">
              {pageNum > 1 && (
                <Link href={`/admin/apprenants?page=${pageNum - 1}${q ? `&q=${q}` : ''}`}
                  className="text-sm px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50">
                  Précédent
                </Link>
              )}
              {pageNum < totalPages && (
                <Link href={`/admin/apprenants?page=${pageNum + 1}${q ? `&q=${q}` : ''}`}
                  className="text-sm px-3 py-1.5 bg-[#0B3D91] text-white rounded-lg hover:bg-blue-800">
                  Suivant
                </Link>
              )}
            </div>
          </div>
        )}

        {(users ?? []).length === 0 && (
          <div className="flex flex-col items-center py-12 text-gray-400">
            <Users className="w-10 h-10 mb-3 opacity-30" />
            <p>Aucun utilisateur trouvé</p>
          </div>
        )}
      </div>
    </div>
  )
}
