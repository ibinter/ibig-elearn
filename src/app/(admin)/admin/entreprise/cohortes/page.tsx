import { createClient } from '@/lib/supabase/server'
import { Building2, Users, BookOpen, PlusCircle, FileText } from 'lucide-react'
import Link from 'next/link'
import NewCohortButton from './NewCohortButton'

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  draft:     { label: 'Brouillon',  color: 'bg-gray-100 text-gray-700' },
  confirmed: { label: 'Confirmé',  color: 'bg-blue-100 text-blue-700' },
  active:    { label: 'En cours',  color: 'bg-green-100 text-green-700' },
  completed: { label: 'Terminé',   color: 'bg-purple-100 text-purple-700' },
  cancelled: { label: 'Annulé',    color: 'bg-red-100 text-red-700' },
}

export default async function CohorteListPage() {
  const supabase = await createClient()

  const [{ data: cohorts }, { data: b2bRequests }, { data: courses }] = await Promise.all([
    supabase
      .from('b2b_cohorts')
      .select('*, b2b_request:b2b_requests(company, contact_name, email), course:courses(title)')
      .order('created_at', { ascending: false }),
    supabase
      .from('b2b_requests')
      .select('id, company, contact_name')
      .eq('status', 'won')
      .order('company'),
    supabase
      .from('courses')
      .select('id, title')
      .eq('status', 'published')
      .order('title'),
  ])

  // Count members per cohort
  const cohortIds = cohorts?.map(c => c.id) ?? []
  const { data: memberCounts } = cohortIds.length
    ? await supabase
        .from('b2b_cohort_members')
        .select('cohort_id')
        .in('cohort_id', cohortIds)
    : { data: [] }

  const countMap: Record<string, number> = {}
  for (const m of memberCounts ?? []) {
    countMap[m.cohort_id] = (countMap[m.cohort_id] ?? 0) + 1
  }

  const stats = {
    total: cohorts?.length ?? 0,
    active: cohorts?.filter(c => c.status === 'active').length ?? 0,
    totalLearners: Object.values(countMap).reduce((a, b) => a + b, 0),
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Users className="w-6 h-6 text-[#0B3D91]" /> Cohortes Entreprise
          </h1>
          <p className="text-gray-500 text-sm mt-1">Groupes d'employés inscrits en formation B2B</p>
        </div>
        <NewCohortButton b2bRequests={b2bRequests ?? []} courses={courses ?? []} />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Total cohortes', value: stats.total, color: 'text-gray-900' },
          { label: 'En cours', value: stats.active, color: 'text-green-600' },
          { label: 'Total apprenants', value: stats.totalLearners, color: 'text-blue-600' },
        ].map((s, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-200 p-4 text-center">
            <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-xs text-gray-500 mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Liste */}
      {!cohorts?.length ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
          <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">Aucune cohorte créée</p>
          <p className="text-xs text-gray-400 mt-1">Créez une cohorte depuis une demande B2B gagnée.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {cohorts.map(cohort => {
            const st = STATUS_LABELS[cohort.status] ?? STATUS_LABELS.draft
            const req = cohort.b2b_request as any
            const course = cohort.course as any
            const memberCount = countMap[cohort.id] ?? 0
            const totalAmount = cohort.price_per_learner ? cohort.price_per_learner * memberCount : null

            return (
              <div key={cohort.id} className="bg-white rounded-2xl border border-gray-200 p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap">
                      <h2 className="font-bold text-gray-900">{cohort.name}</h2>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${st.color}`}>{st.label}</span>
                      {cohort.bon_de_commande_number && (
                        <span className="text-xs text-gray-400 font-mono">{cohort.bon_de_commande_number}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-500 flex-wrap">
                      <span className="flex items-center gap-1"><Building2 className="w-3.5 h-3.5" /> {req?.company ?? '—'}</span>
                      <span className="flex items-center gap-1"><BookOpen className="w-3.5 h-3.5" /> {course?.title ?? '—'}</span>
                      <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> {memberCount} apprenants</span>
                      {totalAmount !== null && (
                        <span className="font-medium text-gray-700">
                          {totalAmount.toLocaleString('fr-FR')} {cohort.currency}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <Link
                      href={`/admin/entreprise/cohortes/${cohort.id}`}
                      className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <Users className="w-3.5 h-3.5" /> Gérer
                    </Link>
                    <Link
                      href={`/admin/entreprise/cohortes/${cohort.id}/document`}
                      className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-[#0B3D91] text-white rounded-lg hover:opacity-90 transition-opacity"
                    >
                      <FileText className="w-3.5 h-3.5" /> Documents
                    </Link>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
