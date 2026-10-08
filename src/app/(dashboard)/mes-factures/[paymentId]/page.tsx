import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import DownloadInvoice from './DownloadInvoice'

interface Props { params: Promise<{ paymentId: string }> }

export default async function FacturePage({ params }: Props) {
  const { paymentId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) notFound()

  const { data: payment } = await supabase
    .from('payments')
    .select('*, courses(title, slug), profiles:user_id(full_name, email, phone, country)')
    .eq('id', paymentId)
    .eq('user_id', user.id)
    .eq('status', 'completed')
    .single()

  if (!payment) notFound()

  const profile = payment.profiles as any
  const course = payment.courses as any
  const invoiceNumber = payment.invoice_number ?? payment.provider_reference ?? `IBIG-${paymentId.slice(0, 8).toUpperCase()}`
  const issuedDate = new Date(payment.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
  const amountFormatted = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(payment.amount)
  const currency = payment.currency ?? 'XOF'
  const tvaNote = currency === 'XOF' ? 'TVA non applicable (régime UEMOA)' : 'TVA incluse si applicable'

  return (
    <>
      {/* Barre d'actions */}
      <div className="print:hidden bg-white border-b border-gray-200 px-6 py-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link href="/mes-factures" className="flex items-center gap-1.5 text-gray-500 hover:text-gray-700 text-sm transition-colors">
            <ArrowLeft className="w-4 h-4" /> Mes factures
          </Link>
          <span className="text-gray-300">·</span>
          <span className="text-sm font-medium text-gray-700">Facture {invoiceNumber}</span>
        </div>
        <DownloadInvoice invoiceNumber={invoiceNumber} />
      </div>

      {/* Fond gris impression */}
      <div className="min-h-screen bg-gray-100 print:bg-white flex items-start justify-center py-8 print:py-0">
        {/* Facture A4 portrait */}
        <div
          id="invoice"
          className="w-[794px] bg-white shadow-2xl print:shadow-none"
          style={{ fontFamily: "'Segoe UI', Arial, sans-serif", minHeight: '1123px' }}
        >
          <div className="px-14 py-12">
            {/* En-tête */}
            <div className="flex items-start justify-between mb-10">
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-[#0B3D91] flex items-center justify-center">
                    <span className="text-white font-black text-base">I</span>
                  </div>
                  <div>
                    <p className="text-[#0B3D91] font-black text-lg leading-none tracking-tight">IBIG E-LEARNING</p>
                    <p className="text-[#FFA500] text-[10px] font-semibold tracking-widest uppercase">Plateforme panafricaine</p>
                  </div>
                </div>
                <p className="text-xs text-gray-500 leading-relaxed">
                  IBIG SARL<br />
                  Abidjan, Côte d&apos;Ivoire<br />
                  support@ibig-elearning.com<br />
                  ibig-elearning.com
                </p>
              </div>

              <div className="text-right">
                <h1 className="text-3xl font-bold text-gray-900 mb-1">FACTURE</h1>
                <p className="text-sm text-gray-500 font-mono">{invoiceNumber}</p>
                <div className="mt-3 bg-green-50 border border-green-200 rounded-lg px-4 py-2 inline-block">
                  <p className="text-xs text-green-600 font-semibold uppercase tracking-wide">Payée</p>
                </div>
              </div>
            </div>

            <div className="w-full h-px bg-gray-200 mb-8" />

            {/* Détails facture + client */}
            <div className="grid grid-cols-2 gap-8 mb-10">
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Informations facture</p>
                <div className="space-y-1.5 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Date d&apos;émission</span>
                    <span className="font-medium text-gray-900">{issuedDate}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Référence paiement</span>
                    <span className="font-medium text-gray-900 font-mono text-xs">{payment.provider_reference}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Mode de paiement</span>
                    <span className="font-medium text-gray-900 capitalize">{payment.method?.replace('_', ' ') ?? 'Mobile Money'}</span>
                  </div>
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Facturé à</p>
                <div className="text-sm text-gray-700 space-y-0.5">
                  <p className="font-semibold text-gray-900">{profile?.full_name ?? '—'}</p>
                  <p>{profile?.email ?? user.email}</p>
                  {profile?.phone && <p>{profile.phone}</p>}
                  {profile?.country && (
                    <p>{profile.country}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Tableau des articles */}
            <div className="mb-8">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-[#0B3D91]">
                    <th className="text-left text-white font-semibold px-4 py-3 rounded-tl-lg">Description</th>
                    <th className="text-center text-white font-semibold px-4 py-3">Qté</th>
                    <th className="text-right text-white font-semibold px-4 py-3 rounded-tr-lg">Montant</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-gray-100">
                    <td className="px-4 py-4">
                      <p className="font-semibold text-gray-900">{course?.title ?? 'Formation en ligne'}</p>
                      <p className="text-xs text-gray-500 mt-0.5">Accès à vie · Certificat inclus · Plateforme IBIG E-LEARNING</p>
                    </td>
                    <td className="px-4 py-4 text-center text-gray-700">1</td>
                    <td className="px-4 py-4 text-right font-semibold text-gray-900">
                      {amountFormatted} {currency}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Totaux */}
            <div className="flex justify-end mb-8">
              <div className="w-64">
                <div className="flex justify-between text-sm py-2 border-b border-gray-100">
                  <span className="text-gray-500">Sous-total</span>
                  <span className="font-medium text-gray-900">{amountFormatted} {currency}</span>
                </div>
                <div className="flex justify-between text-xs py-2 border-b border-gray-100">
                  <span className="text-gray-400 italic">{tvaNote}</span>
                  <span className="text-gray-400">—</span>
                </div>
                <div className="flex justify-between py-3 bg-[#0B3D91]/5 px-3 rounded-lg mt-2">
                  <span className="font-bold text-gray-900">Total TTC</span>
                  <span className="font-bold text-[#0B3D91] text-lg">{amountFormatted} {currency}</span>
                </div>
              </div>
            </div>

            {/* Mention paiement confirmé */}
            <div className="bg-green-50 border border-green-200 rounded-xl px-5 py-4 mb-8 flex items-center gap-3">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-green-600 text-base">✓</span>
              </div>
              <div>
                <p className="text-sm font-semibold text-green-800">Paiement reçu et confirmé</p>
                <p className="text-xs text-green-600">Transaction traitée via CinetPay · Réf. {payment.provider_reference}</p>
              </div>
            </div>

            {/* Pied de page */}
            <div className="w-full h-px bg-gray-200 mb-6" />
            <div className="text-center text-xs text-gray-400 space-y-1">
              <p className="font-semibold text-gray-500">IBIG SARL — Abidjan, Côte d&apos;Ivoire</p>
              <p>support@ibig-elearning.com · ibig-elearning.com</p>
              <p>Cette facture tient lieu de reçu officiel. Conservez-la pour vos archives.</p>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @media print {
          @page { size: A4 portrait; margin: 0; }
          body { margin: 0; }
          .print\\:hidden { display: none !important; }
        }
      `}</style>
    </>
  )
}
