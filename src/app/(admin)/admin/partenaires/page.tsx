import { createClient } from '@/lib/supabase/server'
import { Handshake } from 'lucide-react'
import { DEFAULT_INSTRUCTOR_SHARE, type InstructorApplication, type PartnerAgreement } from '@/lib/partner'
import PartnerReviewCard from './PartnerReviewCard'

export const metadata = { title: 'Formateurs partenaires' }

const TABS = [
  { key: 'submitted', label: 'À examiner' },
  { key: 'terms_offered', label: 'Convention envoyée' },
  { key: 'accepted', label: 'Partenaires' },
  { key: 'rejected', label: 'Modifications demandées' },
  { key: 'suspended', label: 'Suspendus' },
] as const

export default async function PartenairesPage({ searchParams }: { searchParams: Promise<{ statut?: string }> }) {
  const { statut } = await searchParams
  const active = TABS.find(t => t.key === statut)?.key ?? 'submitted'
  const supabase = await createClient()

  const [{ data: apps }, { data: counts }, { data: setting }] = await Promise.all([
    supabase.from('instructor_applications').select('*').eq('status', active).order('submitted_at', { ascending: true }),
    supabase.from('instructor_applications').select('status'),
    supabase.from('platform_settings').select('value').eq('key', 'partner_default_share_pct').maybeSingle(),
  ])

  const userIds = (apps ?? []).map(a => a.user_id)
  const [{ data: agreements }, { data: profiles }, { data: earnings }] = await Promise.all([
    userIds.length ? supabase.from('partner_agreements').select('*').in('user_id', userIds).order('offered_at', { ascending: false }) : Promise.resolve({ data: [] as PartnerAgreement[] }),
    userIds.length ? supabase.from('profiles').select('id, email, avatar_url, partner_share_pct, payout_balance_xof').in('id', userIds) : Promise.resolve({ data: [] as { id: string }[] }),
    userIds.length ? supabase.from('instructor_earnings').select('instructor_id, instructor_amount_xof, status').in('instructor_id', userIds) : Promise.resolve({ data: [] as { instructor_id: string; instructor_amount_xof: number; status: string }[] }),
  ])

  // Part formateur par défaut : paramètre « partner_default_share_pct », sinon 50 %
  const configured = Number(setting?.value)
  const defaultShare = Number.isFinite(configured) && configured > 0 && configured < 100 ? configured : DEFAULT_INSTRUCTOR_SHARE
  const count = (k: string) => (counts ?? []).filter(c => c.status === k).length

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3">
        <span className="w-11 h-11 rounded-xl bg-[#0B3D91]/10 text-[#0B3D91] flex items-center justify-center"><Handshake className="w-5 h-5" /></span>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Formateurs partenaires</h1>
          <p className="text-gray-500 text-sm mt-0.5">Candidatures, conventions de partenariat et partage des revenus</p>
        </div>
      </div>

      <nav className="flex gap-2 overflow-x-auto no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
        {TABS.map(t => (
          <a key={t.key} href={`/admin/partenaires?statut=${t.key}`}
            className={`flex-shrink-0 px-3.5 py-2 rounded-full text-sm font-semibold border ${active === t.key ? 'bg-[#0B3D91] border-[#0B3D91] text-white' : 'bg-white border-gray-200 text-gray-600'}`}>
            {t.label} <span className={active === t.key ? 'text-blue-200' : 'text-gray-400'}>({count(t.key)})</span>
          </a>
        ))}
      </nav>

      {!apps?.length ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center text-gray-500">Aucune candidature dans cette catégorie.</div>
      ) : (
        <div className="space-y-4">
          {(apps as InstructorApplication[]).map(app => {
            const p = (profiles as { id: string; email?: string; partner_share_pct?: number | null; payout_balance_xof?: number | null }[]).find(x => x.id === app.user_id)
            const ag = (agreements as PartnerAgreement[]).find(a => a.user_id === app.user_id) ?? null
            const earned = (earnings as { instructor_id: string; instructor_amount_xof: number; status: string }[])
              .filter(e => e.instructor_id === app.user_id && e.status === 'credited')
              .reduce((s, e) => s + Number(e.instructor_amount_xof), 0)
            return (
              <PartnerReviewCard key={app.id} app={app} email={p?.email ?? ''} agreement={ag}
                defaultShare={defaultShare} balance={Number(p?.payout_balance_xof ?? 0)} earned={earned} />
            )
          })}
        </div>
      )}
    </div>
  )
}
