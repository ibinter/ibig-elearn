import { createClient } from '@/lib/supabase/server'
import { DollarSign, CheckCircle, XCircle } from 'lucide-react'
import PayoutActions from './PayoutActions'

export default async function AdminVirementsPage() {
  const supabase = await createClient()

  const [{ data: pending }, { data: history }] = await Promise.all([
    supabase.from('payout_requests').select('*, instructor:profiles(full_name, email)').eq('status', 'pending').order('created_at'),
    supabase.from('payout_requests').select('*, instructor:profiles(full_name)').in('status', ['paid', 'rejected', 'approved']).order('created_at', { ascending: false }).limit(30),
  ])

  const totalPending = pending?.reduce((sum: number, r: any) => sum + r.amount, 0) ?? 0

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Demandes de virement</h1>
          <p className="text-gray-500 mt-1">{pending?.length ?? 0} demande(s) en attente — Total : {totalPending.toLocaleString('fr-FR')} XOF</p>
        </div>
      </div>

      {/* Demandes en attente */}
      {!pending?.length ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
          <CheckCircle className="w-12 h-12 text-green-300 mx-auto mb-3" />
          <p className="text-gray-500">Aucune demande en attente.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {(pending as any[]).map(req => (
            <div key={req.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-bold text-gray-900">{req.instructor?.full_name}</p>
                  <p className="text-sm text-gray-500">{req.instructor?.email}</p>
                  <p className="text-sm text-gray-600 mt-2">
                    <strong>{req.amount.toLocaleString('fr-FR')} XOF</strong> via <span className="font-medium">{req.method}</span>
                    {req.phone && <> · {req.phone}</>}
                  </p>
                  {req.notes && <p className="text-sm text-gray-400 mt-1 italic">{req.notes}</p>}
                  <p className="text-xs text-gray-400 mt-1">{new Date(req.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                </div>
                <PayoutActions requestId={req.id} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Historique */}
      {history && history.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="font-bold text-gray-900">Historique</h2>
          </div>
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Formateur</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Montant</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase hidden md:table-cell">Méthode</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Statut</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase hidden lg:table-cell">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {(history as any[]).map(r => (
                <tr key={r.id} className="hover:bg-gray-50">
                  <td className="px-5 py-3 text-sm font-medium text-gray-900">{r.instructor?.full_name}</td>
                  <td className="px-4 py-3 text-sm font-semibold text-right">{r.amount.toLocaleString('fr-FR')} XOF</td>
                  <td className="px-4 py-3 text-sm text-gray-500 hidden md:table-cell">{r.method}</td>
                  <td className="px-4 py-3 text-center">
                    {r.status === 'paid'
                      ? <span className="text-xs font-semibold text-green-700 bg-green-50 px-2.5 py-1 rounded-full">Payé</span>
                      : r.status === 'approved'
                      ? <span className="text-xs font-semibold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full">Approuvé</span>
                      : <span className="text-xs font-semibold text-red-700 bg-red-50 px-2.5 py-1 rounded-full">Refusé</span>
                    }
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-400 hidden lg:table-cell">{new Date(r.created_at).toLocaleDateString('fr-FR')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
