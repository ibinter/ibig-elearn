import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { Users, BookOpen, Building2, ArrowLeft, FileText, Calendar } from 'lucide-react'
import Link from 'next/link'
import MembersManager from './MembersManager'
import CohortStatusSelect from './CohortStatusSelect'

export default async function CohortDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: cohort } = await supabase
    .from('b2b_cohorts')
    .select('*, b2b_request:b2b_requests(company, contact_name, email, phone), course:courses(title, slug)')
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
  const totalAmount = cohort.price_per_learner ? cohort.price_per_learner * memberCount : null

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin/entreprise/cohortes" className="text-gray-400 hover:text-gray-600">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-gray-900">{cohort.name}</h1>
          <p className="text-sm text-gray-500">{req?.company} · {cohort.bon_de_commande_number}</p>
        </div>
        <Link
          href={`/admin/entreprise/cohortes/${id}/document`}
          className="flex items-center gap-2 ibig-gradient text-white text-sm font-semibold px-4 py-2 rounded-xl hover:opacity-90 transition-opacity"
        >
          <FileText className="w-4 h-4" /> Bon de commande / Facture
        </Link>
      </div>

      {/* Info card */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-3">
          <h2 className="font-semibold text-gray-900 text-sm uppercase text-xs text-gray-400">Détails</h2>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2 text-gray-700">
              <Building2 className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <span className="font-medium">{req?.company}</span>
              <span className="text-gray-400">— {req?.contact_name}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-700">
              <BookOpen className="w-4 h-4 text-gray-400 flex-shrink-0" />
              {course?.title}
            </div>
            {(cohort.start_date || cohort.end_date) && (
              <div className="flex items-center gap-2 text-gray-700">
                <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
                {cohort.start_date ? new Date(cohort.start_date).toLocaleDateString('fr-FR') : '—'} →{' '}
                {cohort.end_date ? new Date(cohort.end_date).toLocaleDateString('fr-FR') : '—'}
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-3">
          <h2 className="text-xs font-semibold text-gray-400 uppercase">Facturation</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Apprenants</span>
              <span className="font-semibold">{memberCount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Prix / apprenant</span>
              <span className="font-semibold">{cohort.price_per_learner ? `${cohort.price_per_learner.toLocaleString('fr-FR')} ${cohort.currency}` : '—'}</span>
            </div>
            {totalAmount !== null && (
              <div className="flex justify-between border-t border-gray-100 pt-2 mt-1">
                <span className="text-gray-700 font-medium">Total</span>
                <span className="font-bold text-[#0B3D91]">{totalAmount.toLocaleString('fr-FR')} {cohort.currency}</span>
              </div>
            )}
          </div>
          <div className="pt-2">
            <span className="text-xs text-gray-400 font-medium">Statut : </span>
            <CohortStatusSelect cohortId={id} currentStatus={cohort.status} />
          </div>
        </div>
      </div>

      {/* Membres */}
      <MembersManager cohortId={id} members={members ?? []} />
    </div>
  )
}
