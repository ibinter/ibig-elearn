import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import DocumentButtons from './DocumentButtons'

export default async function DocumentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: cohort } = await supabase
    .from('b2b_cohorts')
    .select('*, b2b_request:b2b_requests(company, contact_name, email, phone, sector, company_size), course:courses(title)')
    .eq('id', id)
    .single()

  if (!cohort) notFound()

  const { data: members } = await supabase
    .from('b2b_cohort_members')
    .select('*')
    .eq('cohort_id', id)
    .order('full_name')

  const req = cohort.b2b_request as any
  const course = cohort.course as any
  const memberCount = members?.length ?? 0
  const unitPrice = cohort.price_per_learner ?? 0
  const totalHT = unitPrice * memberCount
  const tva = 0 // TVA 0% par défaut Afrique francophone
  const totalTTC = totalHT * (1 + tva)

  const today = new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      <div className="flex items-center gap-3 mb-2">
        <Link href={`/admin/entreprise/cohortes/${id}`} className="text-gray-400 hover:text-gray-600">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-xl font-bold text-gray-900">Documents — {cohort.name}</h1>
      </div>

      <DocumentButtons cohortId={id} bcNumber={cohort.bon_de_commande_number} />

      {/* Aperçu bon de commande */}
      <div id="bon-de-commande" className="bg-white rounded-2xl border border-gray-200 p-8 space-y-6 print:shadow-none print:border-none">
        {/* En-tête */}
        <div className="flex items-start justify-between">
          <div>
            <div className="text-2xl font-black text-[#0B3D91]">IBIG E-LEARN</div>
            <div className="text-sm text-gray-500 mt-1">Plateforme panafricaine de formation en ligne</div>
            <div className="text-sm text-gray-500">contact@ibig-elearning.com</div>
            <div className="text-sm text-gray-500">ibig-elearning.com</div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-gray-900">BON DE COMMANDE</div>
            <div className="text-sm font-mono text-gray-600 mt-1">{cohort.bon_de_commande_number ?? '—'}</div>
            <div className="text-sm text-gray-500 mt-1">Date : {today}</div>
          </div>
        </div>

        {/* Entreprise */}
        <div className="grid grid-cols-2 gap-8">
          <div className="bg-gray-50 rounded-xl p-4">
            <div className="text-xs font-bold text-gray-400 uppercase mb-2">Émis par</div>
            <div className="font-semibold text-gray-900">IBIG E-LEARN</div>
            <div className="text-sm text-gray-600">Plateforme de formation</div>
          </div>
          <div className="bg-blue-50 rounded-xl p-4">
            <div className="text-xs font-bold text-gray-400 uppercase mb-2">Destinataire</div>
            <div className="font-semibold text-gray-900">{req?.company}</div>
            <div className="text-sm text-gray-600">{req?.contact_name}</div>
            <div className="text-sm text-gray-600">{req?.email}</div>
            {req?.phone && <div className="text-sm text-gray-600">{req?.phone}</div>}
            {req?.sector && <div className="text-sm text-gray-500">{req?.sector}</div>}
          </div>
        </div>

        {/* Objet */}
        <div>
          <div className="text-xs font-bold text-gray-400 uppercase mb-2">Objet</div>
          <p className="text-gray-700 text-sm">
            Formation <strong>{course?.title}</strong> pour {memberCount} collaborateur{memberCount > 1 ? 's' : ''} — Cohorte : {cohort.name}
          </p>
          {cohort.description && <p className="text-gray-500 text-sm mt-1">{cohort.description}</p>}
          {(cohort.start_date || cohort.end_date) && (
            <p className="text-gray-500 text-sm mt-1">
              Période :{' '}
              {cohort.start_date ? new Date(cohort.start_date).toLocaleDateString('fr-FR') : '—'} au{' '}
              {cohort.end_date ? new Date(cohort.end_date).toLocaleDateString('fr-FR') : '—'}
            </p>
          )}
        </div>

        {/* Tableau */}
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-[#0B3D91] text-white">
              <th className="text-left px-4 py-2.5 rounded-tl-lg">Désignation</th>
              <th className="text-center px-4 py-2.5">Qté</th>
              <th className="text-right px-4 py-2.5">P.U. HT</th>
              <th className="text-right px-4 py-2.5 rounded-tr-lg">Total HT</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-gray-100">
              <td className="px-4 py-3 text-gray-800">
                Accès formation en ligne — <em>{course?.title}</em><br />
                <span className="text-xs text-gray-500">Cohorte : {cohort.name}</span>
              </td>
              <td className="text-center px-4 py-3 text-gray-700">{memberCount}</td>
              <td className="text-right px-4 py-3 text-gray-700 font-mono">
                {unitPrice.toLocaleString('fr-FR')} {cohort.currency}
              </td>
              <td className="text-right px-4 py-3 text-gray-900 font-semibold font-mono">
                {totalHT.toLocaleString('fr-FR')} {cohort.currency}
              </td>
            </tr>
          </tbody>
          <tfoot>
            <tr className="bg-gray-50">
              <td colSpan={3} className="text-right px-4 py-2.5 text-sm font-medium text-gray-600">Total HT</td>
              <td className="text-right px-4 py-2.5 font-mono font-semibold">{totalHT.toLocaleString('fr-FR')} {cohort.currency}</td>
            </tr>
            <tr className="bg-gray-50">
              <td colSpan={3} className="text-right px-4 py-2 text-sm text-gray-500">TVA (0%)</td>
              <td className="text-right px-4 py-2 font-mono text-gray-500">0 {cohort.currency}</td>
            </tr>
            <tr className="bg-[#0B3D91] text-white">
              <td colSpan={3} className="text-right px-4 py-3 font-bold rounded-bl-lg">TOTAL TTC</td>
              <td className="text-right px-4 py-3 font-bold font-mono text-lg rounded-br-lg">
                {totalTTC.toLocaleString('fr-FR')} {cohort.currency}
              </td>
            </tr>
          </tfoot>
        </table>

        {/* Liste apprenants */}
        {members && members.length > 0 && (
          <div>
            <div className="text-xs font-bold text-gray-400 uppercase mb-3">Liste des bénéficiaires</div>
            <div className="grid grid-cols-2 gap-1">
              {members.map((m, i) => (
                <div key={m.id} className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 rounded-lg px-3 py-1.5">
                  <span className="text-xs text-gray-400 font-mono w-5">{i + 1}.</span>
                  <span className="font-medium text-gray-800">{m.full_name ?? '—'}</span>
                  <span className="text-gray-400 text-xs truncate">{m.email}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="border-t border-gray-100 pt-4 text-xs text-gray-400 text-center">
          Ce bon de commande est valable 30 jours à compter de sa date d'émission.
          Paiement à 30 jours date de facture. Pour toute question : contact@ibig-elearning.com
        </div>
      </div>
    </div>
  )
}
