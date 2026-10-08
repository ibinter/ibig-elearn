import Link from 'next/link'
import { ArrowLeft, FileBarChart } from 'lucide-react'
import { createAdminClient } from '@/lib/supabase/admin'
import { DATASETS } from '@/lib/reports'
import ReportBuilder from '@/components/reports/ReportBuilder'

export const metadata = { title: 'Générateur de rapports' }

export default async function AdminReportBuilderPage() {
  const admin = createAdminClient()
  const [{ data: courses }, { data: schedules }] = await Promise.all([
    admin.from('courses').select('id, title').order('title'),
    admin.from('report_schedules').select('id, name, dataset, frequency, recipients, next_run_at').is('org_id', null).order('created_at', { ascending: false }),
  ])
  return (
    <div className="max-w-6xl mx-auto space-y-5">
      <Link href="/admin/rapports" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-[#0B3D91]"><ArrowLeft className="w-4 h-4" /> Rapports</Link>
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2"><FileBarChart className="w-6 h-6 text-[#0B3D91]" /> Générateur de rapports</h1>
        <p className="text-gray-500 text-sm mt-1">Composez un rapport, téléchargez-le ou programmez son envoi automatique par email.</p>
      </div>
      <ReportBuilder orgId={null} courses={courses ?? []} schedules={schedules ?? []}
        datasets={Object.entries(DATASETS).map(([key, d]) => ({ key, label: d.label, description: d.description, columns: d.columns }))} />
    </div>
  )
}
