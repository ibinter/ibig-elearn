import { createAdminClient } from '@/lib/supabase/admin'
import { Plug } from 'lucide-react'
import { SITE_URL } from '@/lib/site'
import { toolUrls } from '@/lib/lti'
import LtiAdmin from './LtiAdmin'

export const metadata = { title: 'Intégration LTI' }

export default async function AdminLtiPage() {
  const admin = createAdminClient()
  const [{ data: platforms }, { data: orgs }, { data: launches }] = await Promise.all([
    admin.from('lti_platforms').select('id, name, issuer, client_id, is_active, org:organizations(name)').order('created_at', { ascending: false }),
    admin.from('organizations').select('id, name').eq('is_active', true).order('name'),
    admin.from('lti_launches').select('platform_id'),
  ])
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2"><Plug className="w-6 h-6 text-[#0B3D91]" /> Intégration LTI 1.3</h1>
        <p className="text-gray-500 text-sm mt-1">Intégrez les formations IBIG E-LEARNING dans le LMS d&apos;une université ou d&apos;une entreprise (Moodle, Canvas, Blackboard, Open edX…). Les apprenants sont connectés et inscrits automatiquement.</p>
      </div>
      <LtiAdmin
        urls={toolUrls(SITE_URL)}
        orgs={orgs ?? []}
        platforms={(platforms ?? []).map(p => ({
          id: p.id, name: p.name, issuer: p.issuer, client_id: p.client_id, is_active: p.is_active,
          org: (p.org as unknown as { name: string } | null)?.name ?? null,
          launches: (launches ?? []).filter(l => l.platform_id === p.id).length,
        }))}
      />
    </div>
  )
}
