import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { DollarSign, Clock, CheckCircle, XCircle, TrendingUp } from 'lucide-react'
import PayoutRequestForm from './PayoutRequestForm'

export default async function VirementPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/connexion')

  const [{ data: profile }, { data: requests }, { data: earnings }] = await Promise.all([
    supabase.from('profiles').select('full_name, payout_balance_xof').eq('id', user.id).single(),
    supabase.from('payout_requests').select('*').eq('instructor_id', user.id).order('created_at', { ascending: false }),
    supabase.from('enrollments').select('amount_paid').eq('instructor_id', user.id),
  ])

  const totalEarned = earnings?.reduce((sum: number, e: any) => sum + (e.amount_paid ?? 0), 0) ?? 0
  const totalPaid = requests?.filter((r: any) => r.status === 'paid').reduce((sum: number, r: any) => sum + r.amount, 0) ?? 0
  const pendingAmount = requests?.filter((r: any) => r.status === 'pending').reduce((sum: number, r: any) => sum + r.amount, 0) ?? 0
  const balance = (profile as any)?.payout_balance_xof ?? 0

  const statusLabel: Record<string, { label: string; color: string }> = {
    pending: { label: 'En attente', color: 'text-yellow-600 bg-yellow-50' },
    approved: { label: 'Approuvé', color: 'text-blue-600 bg-blue-50' },
    paid: { label: 'Payé', color: 'text-green-600 bg-green-50' },
    rejected: { label: 'Refusé', color: 'text-red-600 bg-red-50' },
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Demandes de virement</h1>
        <p className="text-gray-500 mt-1">Gérez vos retraits de revenus de formation</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: TrendingUp, label: 'Total gagné', value: `${totalEarned.toLocaleString('fr-FR')} XOF`, color: 'bg-blue-50 text-[#0B3D91]' },
          { icon: DollarSign, label: 'Solde disponible', value: `${balance.toLocaleString('fr-FR')} XOF`, color: 'bg-green-50 text-green-700' },
          { icon: Clock, label: 'En attente', value: `${pendingAmount.toLocaleString('fr-FR')} XOF`, color: 'bg-yellow-50 text-yellow-700' },
          { icon: CheckCircle, label: 'Total retiré', value: `${totalPaid.toLocaleString('fr-FR')} XOF`, color: 'bg-gray-50 text-gray-700' },
        ].map(stat => (
          <div key={stat.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className={`w-10 h-10 rounded-xl ${stat.color} flex items-center justify-center mb-3`}>
              <stat.icon className="w-5 h-5" />
            </div>
            <p className="text-xs text-gray-500 mb-1">{stat.label}</p>
            <p className="font-bold text-gray-900">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Formulaire de demande */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h2 className="font-bold text-gray-900 mb-4">Nouvelle demande de virement</h2>
        <PayoutRequestForm balance={balance} />
      </div>

      {/* Historique */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-bold text-gray-900">Historique des demandes</h2>
        </div>
        {!requests?.length ? (
          <div className="p-12 text-center text-gray-400">Aucune demande de virement pour l&apos;instant.</div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Date</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Montant</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Méthode</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Statut</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Note admin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {(requests as any[]).map(req => {
                const s = statusLabel[req.status] ?? statusLabel.pending
                return (
                  <tr key={req.id} className="hover:bg-gray-50">
                    <td className="px-5 py-4 text-sm text-gray-600">{new Date(req.created_at).toLocaleDateString('fr-FR')}</td>
                    <td className="px-4 py-4 text-sm font-semibold text-gray-900 text-right">{req.amount.toLocaleString('fr-FR')} XOF</td>
                    <td className="px-4 py-4 text-sm text-gray-600">{req.method ?? 'Mobile Money'}</td>
                    <td className="px-4 py-4 text-center">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${s.color}`}>{s.label}</span>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-400">{req.admin_note ?? '—'}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
