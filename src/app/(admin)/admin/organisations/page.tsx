import { createAdminClient } from '@/lib/supabase/admin'
import Link from 'next/link'
import { Briefcase, Users, ExternalLink } from 'lucide-react'
import { PLAN_LABEL } from '@/lib/org'
import { formatDate } from '@/lib/utils'
import { CreateOrgForm, OrgSettings } from './OrgAdminForms'

export const metadata = { title: 'Espaces entreprise' }

export default async function AdminOrganisationsPage() {
  // Accès déjà réservé à l'équipe IBIG par le layout admin
  const admin = createAdminClient()
  const [{ data: orgs }, { data: members }, { data: invites }, { data: wonRequests }] = await Promise.all([
    admin.from('organizations').select('id, name, slug, plan, max_seats, is_active, billing_email, created_at').order('created_at', { ascending: false }),
    admin.from('organization_members').select('org_id, role').eq('is_active', true),
    admin.from('org_invitations').select('org_id, role, email').is('accepted_at', null).gt('expires_at', new Date().toISOString()),
    admin.from('b2b_requests').select('id, company, contact_name, email, phone, learners_count, status')
      .in('status', ['new', 'contacted', 'proposal_sent', 'won']).order('created_at', { ascending: false }).limit(50),
  ])

  const count = (orgId: string) => (members ?? []).filter(m => m.org_id === orgId).length
  const pending = (orgId: string) => (invites ?? []).filter(i => i.org_id === orgId).length
  const ownerPending = (orgId: string) => (invites ?? []).find(i => i.org_id === orgId && i.role === 'owner')?.email

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2"><Briefcase className="w-6 h-6 text-[#0B3D91]" /> Espaces entreprise</h1>
        <p className="text-gray-500 text-sm mt-1">Ouvrez un espace à une entreprise cliente : son responsable invite ses collaborateurs et suit leur progression.</p>
      </div>

      <CreateOrgForm requests={((wonRequests ?? []) as { id: string; company: string | null; contact_name: string | null; email: string | null; phone: string | null; learners_count: number | null }[])
        .map(r => ({ id: r.id, company: r.company ?? '', contact: r.contact_name ?? '', email: r.email ?? '', phone: r.phone ?? '', seats: Number(r.learners_count) || 10 }))} />

      <section className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 border-b border-gray-100 font-bold text-gray-900">Organisations ({orgs?.length ?? 0})</div>
        {(orgs ?? []).length === 0 ? (
          <p className="p-6 text-center text-sm text-gray-400">Aucun espace entreprise pour l&apos;instant.</p>
        ) : (
          <ul className="divide-y divide-gray-50">
            {orgs!.map(o => {
              const used = count(o.id) + pending(o.id)
              return (
                <li key={o.id} className="px-5 py-4 flex flex-col lg:flex-row lg:items-center gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-gray-900 flex items-center gap-2">
                      {o.name}
                      {!o.is_active && <span className="text-[11px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">Désactivé</span>}
                    </p>
                    <p className="text-xs text-gray-500">
                      {PLAN_LABEL[o.plan] ?? o.plan} · <Users className="inline w-3 h-3" /> {used}/{o.max_seats} sièges · créé le {formatDate(o.created_at)}
                      {ownerPending(o.id) ? ` · responsable invité : ${ownerPending(o.id)}` : ''}
                    </p>
                  </div>
                  <OrgSettings orgId={o.id} plan={o.plan} maxSeats={o.max_seats} isActive={o.is_active} />
                  <Link href={`/organisation/${o.slug}`} className="flex items-center gap-1.5 text-sm font-semibold text-[#0B3D91]">Ouvrir <ExternalLink className="w-3.5 h-3.5" /></Link>
                </li>
              )
            })}
          </ul>
        )}
      </section>
    </div>
  )
}
