import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { FileText, Download, ExternalLink } from 'lucide-react'
import Link from 'next/link'

export const metadata = { title: 'Mes factures' }

export default async function MesFacturesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/connexion')

  const { data: payments } = await supabase
    .from('payments')
    .select('id, invoice_number, provider_reference, amount, currency, created_at, courses(title)')
    .eq('user_id', user.id)
    .eq('status', 'completed')
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <FileText className="w-6 h-6 text-[#0B3D91]" /> Mes factures
        </h1>
        <p className="text-sm text-gray-500 mt-1">{payments?.length ?? 0} facture{(payments?.length ?? 0) > 1 ? 's' : ''}</p>
      </div>

      {!payments?.length ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
          <FileText className="w-12 h-12 mx-auto mb-3 text-gray-200" />
          <p className="text-gray-500 font-medium">Aucune facture pour l&apos;instant</p>
          <p className="text-sm text-gray-400 mt-1">Vos factures apparaîtront ici après chaque paiement confirmé.</p>
          <Link href="/catalogue" className="inline-block mt-4 ibig-gradient text-white font-semibold px-5 py-2.5 rounded-xl text-sm hover:opacity-90 transition-opacity">
            Découvrir les formations
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left text-gray-500 font-semibold px-5 py-3">Facture</th>
                <th className="text-left text-gray-500 font-semibold px-5 py-3">Formation</th>
                <th className="text-left text-gray-500 font-semibold px-5 py-3">Date</th>
                <th className="text-right text-gray-500 font-semibold px-5 py-3">Montant</th>
                <th className="text-right text-gray-500 font-semibold px-5 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {payments.map(p => {
                const invoiceNum = p.invoice_number ?? p.provider_reference ?? p.id.slice(0, 8).toUpperCase()
                const amount = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(p.amount)
                const date = new Date(p.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
                return (
                  <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                          <FileText className="w-4 h-4 text-[#0B3D91]" />
                        </div>
                        <span className="font-mono text-xs font-semibold text-gray-700">{invoiceNum}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <p className="font-medium text-gray-900 truncate max-w-[220px]">{(p.courses as any)?.title ?? '—'}</p>
                    </td>
                    <td className="px-5 py-4 text-gray-500">{date}</td>
                    <td className="px-5 py-4 text-right">
                      <span className="font-bold text-gray-900">{amount}</span>
                      <span className="text-gray-400 text-xs ml-1">{p.currency ?? 'XOF'}</span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <Link
                        href={`/mes-factures/${p.id}`}
                        className="inline-flex items-center gap-1.5 text-[#0B3D91] hover:underline text-xs font-semibold"
                      >
                        <ExternalLink className="w-3.5 h-3.5" /> Voir / Télécharger
                      </Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
