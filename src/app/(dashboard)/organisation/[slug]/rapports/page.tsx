import Link from 'next/link'
import { redirect, notFound } from 'next/navigation'
import { ArrowLeft, FileBarChart } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { DATASETS } from '@/lib/reports'
import ReportBuilder from '@/components/reports/ReportBuilder'

export const metadata = { title: 'Rapports de l’entreprise' }

export default async function OrgReportsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/connexion')

  const admin = createAdminClient()
  const { data: org } = await admin.from('organizations').select('id, name, slug').eq('slug', slug).maybeSingle()
  if (!org) notFound()
  const { data: me } = await admin.from('organization_members').select('role').eq('org_id', org.id).eq('user_id', user.id).eq('is_active', true).maybeSingle()
  if (!me || !['owner', 'admin', 'manager'].includes(me.role)) redirect('/tableau-de-bord')

  const [{ data: enr }, { data: schedules }] = await Promise.all([
    admin.from('enrollments').select('course:courses(id, title)').eq('sponsor_org_id', org.id),
    admin.from('report_schedules').select('id, name, dataset, frequency, recipients, next_run_at').eq('org_id', org.id).order('created_at', { ascending: false }),
  ])
  const courses = [...new Map((enr ?? []).map(e => e.course as unknown as { id: string; title: string } | null).filter(Boolean).map(c => [c!.id, c!])).values()]

  return (
    <div className="max-w-6xl mx-auto space-y-5">
      <Link href={`/organisation/${org.slug}`} className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-[#0B3D91]"><ArrowLeft className="w-4 h-4" /> <span data-no-translate>{org.name}</span></Link>
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2"><FileBarChart className="w-6 h-6 text-[#0B3D91]" /> Rapports de formation</h1>
        <p className="text-gray-500 text-sm mt-1">Suivi de vos collaborateurs sur les formations financées par l&apos;entreprise : export Excel et envoi automatique.</p>
      </div>
      <ReportBuilder orgId={org.id} courses={courses} schedules={schedules ?? []}
        datasets={Object.entries(DATASETS).filter(([, d]) => !d.adminOnly).map(([key, d]) => ({ key, label: d.label, description: d.description, columns: d.columns }))} />
    </div>
  )
}
