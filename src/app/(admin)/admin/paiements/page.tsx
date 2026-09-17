import { createClient } from '@/lib/supabase/server'
import { formatPrice, formatDate } from '@/lib/utils'
import { CheckCircle, Clock, XCircle } from 'lucide-react'

export default async function AdminPaiementsPage() {
  const supabase = await createClient()

  const { data: payments } = await supabase
    .from('payments')
    .select('*, user:profiles(full_name, email), course:courses(title)')
    .order('created_at', { ascending: false })

  const statusConfig: Record<string, { label: string; className: string; icon: typeof CheckCircle }> = {
    completed: { label: 'Complété', className: 'bg-green-100 text-green-700', icon: CheckCircle },
    pending: { label: 'En attente', className: 'bg-yellow-100 text-yellow-700', icon: Clock },
    failed: { label: 'Échoué', className: 'bg-red-100 text-red-700', icon: XCircle },
    refunded: { label: 'Remboursé', className: 'bg-gray-100 text-gray-600', icon: XCircle },
  }

  const totalRevenue = payments?.filter(p => p.status === 'completed' && p.currency === 'XOF')
    .reduce((sum, p) => sum + p.amount, 0) ?? 0

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Paiements</h1>
          <p className="text-gray-500">{payments?.length ?? 0} transaction(s)</p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-xl px-5 py-3 text-right">
          <p className="text-xs text-green-600 font-medium">Revenus XOF</p>
          <p className="text-xl font-bold text-green-700">{formatPrice(totalRevenue)}</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Utilisateur</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell">Formation</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Montant</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">Méthode</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Statut</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {(payments as any[])?.map(p => {
              const s = statusConfig[p.status] ?? statusConfig.pending
              const Icon = s.icon
              return (
                <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3">
                    <p className="font-semibold text-gray-900 text-sm">{p.user?.full_name}</p>
                    <p className="text-xs text-gray-400">{p.user?.email}</p>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 hidden lg:table-cell max-w-[180px]">
                    <p className="truncate">{p.course?.title}</p>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="font-bold text-[#0B3D91] text-sm">{formatPrice(p.amount, p.currency)}</span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500 capitalize hidden md:table-cell">{p.method?.replace('_', ' ')}</td>
                  <td className="px-4 py-3">
                    <span className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium w-fit ${s.className}`}>
                      <Icon className="w-3.5 h-3.5" /> {s.label}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500 hidden lg:table-cell">{formatDate(p.created_at)}</td>
                </tr>
              )
            })}
            {(!payments || payments.length === 0) && (
              <tr>
                <td colSpan={6} className="text-center py-12 text-gray-400">Aucun paiement enregistré</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
