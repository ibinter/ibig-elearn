import { createClient } from '@/lib/supabase/server'
import { formatDate } from '@/lib/utils'

export default async function AdminUtilisateursPage() {
  const supabase = await createClient()

  const { data: users } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false })

  const roleColors: Record<string, string> = {
    admin: 'bg-red-100 text-red-700',
    coordinateur: 'bg-purple-100 text-purple-700',
    formateur: 'bg-blue-100 text-blue-700',
    apprenant: 'bg-gray-100 text-gray-600',
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Utilisateurs</h1>
        <p className="text-gray-500">{users?.length ?? 0} compte(s) enregistré(s)</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Utilisateur</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">Pays</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Rôle</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell">Inscrit le</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {(users as any[])?.map(u => (
              <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-5 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full ibig-gradient flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                      {u.full_name?.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-900 text-sm">{u.full_name}</p>
                      <p className="text-xs text-gray-400 truncate max-w-[200px]">{u.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-gray-600 hidden md:table-cell">{u.country || '—'}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${roleColors[u.role] ?? 'bg-gray-100 text-gray-600'}`}>
                    {u.role}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-500 hidden lg:table-cell">{formatDate(u.created_at)}</td>
              </tr>
            ))}
            {(!users || users.length === 0) && (
              <tr>
                <td colSpan={4} className="text-center py-12 text-gray-400">Aucun utilisateur</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
