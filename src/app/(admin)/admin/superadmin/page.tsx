import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Shield, UserCheck, AlertTriangle, Crown, Users } from 'lucide-react'
import RoleSelector from '@/components/admin/RoleSelector'

export default async function SuperadminAccessPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/connexion')

  const { data: me } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (me?.role !== 'admin') redirect('/admin')

  const [
    { data: admins },
    { data: coordinateurs },
    { count: totalAdmins },
  ] = await Promise.all([
    supabase
      .from('profiles')
      .select('id, full_name, email, created_at')
      .eq('role', 'admin')
      .order('created_at'),
    supabase
      .from('profiles')
      .select('id, full_name, email, created_at')
      .eq('role', 'coordinateur')
      .order('created_at'),
    supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('role', 'admin'),
  ])

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-1 flex items-center gap-2">
          <Shield className="w-6 h-6 text-[#0B3D91]" />
          Accès administration
        </h1>
        <p className="text-gray-500">Gérez les rôles admin et coordinateur de la plateforme</p>
      </div>

      {/* Avertissement si 1 seul admin */}
      {(totalAdmins ?? 0) <= 1 && (
        <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-2xl p-4">
          <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-amber-800 text-sm">Compte admin unique</p>
            <p className="text-amber-700 text-sm mt-0.5">Vous êtes le seul administrateur. Ajoutez un second admin avant toute modification pour éviter un blocage.</p>
          </div>
        </div>
      )}

      {/* Règles d'accès */}
      <div className="bg-[#0B3D91]/5 border border-[#0B3D91]/20 rounded-2xl p-5">
        <h2 className="font-bold text-[#0B3D91] mb-3 flex items-center gap-2">
          <UserCheck className="w-4 h-4" />
          Niveaux d'accès
        </h2>
        <div className="grid md:grid-cols-2 gap-3">
          {[
            { role: 'Admin', color: 'bg-red-100 text-red-700', desc: 'Accès complet : gestion des rôles, paramètres, exports, tout.' },
            { role: 'Coordinateur', color: 'bg-purple-100 text-purple-700', desc: 'Console admin complète sauf gestion des admins et rôles admin.' },
            { role: 'Formateur', color: 'bg-blue-100 text-blue-700', desc: 'Espace formateur uniquement (dashboard apprenant + espace pro).' },
            { role: 'Apprenant', color: 'bg-gray-100 text-gray-600', desc: 'Accès cours uniquement, aucun accès admin.' },
          ].map(r => (
            <div key={r.role} className="flex items-start gap-3">
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${r.color}`}>{r.role}</span>
              <p className="text-sm text-gray-600">{r.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Admins */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
        <div className="p-5 border-b border-gray-100 flex items-center gap-2">
          <Crown className="w-5 h-5 text-red-500" />
          <h2 className="font-bold text-gray-900">Administrateurs ({totalAdmins ?? 0})</h2>
        </div>
        <div className="divide-y divide-gray-50">
          {(admins ?? []).map((u: any) => (
            <div key={u.id} className="px-5 py-4 flex items-center justify-between gap-4">
              <div>
                <p className="font-semibold text-sm text-gray-900">{u.full_name ?? '—'}</p>
                <p className="text-xs text-gray-400">{u.email}</p>
              </div>
              {u.id === user.id ? (
                <span className="text-xs font-bold text-red-600 bg-red-50 px-3 py-1 rounded-full">admin (vous)</span>
              ) : (
                <RoleSelector userId={u.id} currentRole="admin" />
              )}
            </div>
          ))}
          {(admins ?? []).length === 0 && (
            <p className="px-5 py-8 text-center text-gray-400 text-sm">Aucun administrateur trouvé</p>
          )}
        </div>
      </div>

      {/* Coordinateurs */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
        <div className="p-5 border-b border-gray-100 flex items-center gap-2">
          <Users className="w-5 h-5 text-purple-500" />
          <h2 className="font-bold text-gray-900">Coordinateurs ({(coordinateurs ?? []).length})</h2>
        </div>
        <div className="divide-y divide-gray-50">
          {(coordinateurs ?? []).map((u: any) => (
            <div key={u.id} className="px-5 py-4 flex items-center justify-between gap-4">
              <div>
                <p className="font-semibold text-sm text-gray-900">{u.full_name ?? '—'}</p>
                <p className="text-xs text-gray-400">{u.email}</p>
              </div>
              <RoleSelector userId={u.id} currentRole="coordinateur" />
            </div>
          ))}
          {(coordinateurs ?? []).length === 0 && (
            <p className="px-5 py-8 text-center text-gray-400 text-sm">Aucun coordinateur — promouvez un utilisateur depuis <a href="/admin/utilisateurs" className="text-[#0B3D91] underline">Utilisateurs</a></p>
          )}
        </div>
      </div>
    </div>
  )
}
