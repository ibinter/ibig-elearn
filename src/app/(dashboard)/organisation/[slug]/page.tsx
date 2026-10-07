import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import {
  Building2, Users, TrendingUp, Award, Activity, BookOpen, Clock, CheckCircle2, UserPlus, Target, Mail,
} from 'lucide-react'
import { ORG_ROLE_LABEL, PLAN_LABEL } from '@/lib/org'
import { formatDate } from '@/lib/utils'
import { InvitePanel, CohortPanel, AddToCohort, RemoveMember, CancelInvite, ExportTeam } from './OrgActions'

export const metadata = { title: 'Espace entreprise' }

type Member = { user_id: string; role: string; joined_at: string; profile: { full_name: string | null; email: string | null; last_activity_date: string | null } | null }
type Enr = { user_id: string; course_id: string; progress_percent: number | null; completed_at: string | null }

export default async function OrganisationPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/connexion')

  const admin = createAdminClient()
  const { data: org } = await admin.from('organizations').select('*').eq('slug', slug).maybeSingle()
  if (!org) notFound()
  const { data: me } = await admin.from('organization_members').select('role')
    .eq('org_id', org.id).eq('user_id', user.id).eq('is_active', true).maybeSingle()
  const { data: staff } = await admin.from('profiles').select('role').eq('id', user.id).single()
  const isStaff = ['admin', 'coordinateur'].includes(staff?.role ?? '')
  if (!isStaff && (!me || !['owner', 'admin', 'manager'].includes(me.role))) redirect('/tableau-de-bord')

  const [{ data: membersRaw }, { data: cohortsRaw }, { data: invites }, { data: catalog }] = await Promise.all([
    admin.from('organization_members')
      .select('user_id, role, joined_at, profile:profiles!organization_members_user_id_fkey(full_name, email, last_activity_date)')
      .eq('org_id', org.id).eq('is_active', true).order('joined_at', { ascending: false }),
    admin.from('cohorts').select('id, name, course_ids, end_date, is_active, created_at, cohort_members(user_id)')
      .eq('org_id', org.id).order('created_at', { ascending: false }),
    admin.from('org_invitations').select('id, email, role, created_at, expires_at')
      .eq('org_id', org.id).is('accepted_at', null).gt('expires_at', new Date().toISOString()).order('created_at', { ascending: false }),
    admin.from('courses').select('id, title, duration_hours').eq('is_published', true).order('title'),
  ])

  const members = (membersRaw ?? []) as unknown as Member[]
  const cohorts = (cohortsRaw ?? []) as unknown as { id: string; name: string; course_ids: string[]; end_date: string | null; is_active: boolean; cohort_members: { user_id: string }[] }[]
  const memberIds = members.map(m => m.user_id)

  // Progression sur les formations financées par l'entreprise uniquement
  const [{ data: enrRaw }, { data: certs }] = memberIds.length
    ? await Promise.all([
        admin.from('enrollments').select('user_id, course_id, progress_percent, completed_at').eq('sponsor_org_id', org.id).in('user_id', memberIds),
        admin.from('certificates').select('user_id, course_id').in('user_id', memberIds),
      ])
    : [{ data: [] }, { data: [] }]
  const enrollments = (enrRaw ?? []) as Enr[]
  const sponsored = new Set(enrollments.map(e => `${e.user_id}:${e.course_id}`))
  const orgCerts = (certs ?? []).filter(c => sponsored.has(`${c.user_id}:${c.course_id}`))

  const courseTitle = new Map((catalog ?? []).map(c => [c.id as string, c.title as string]))
  const weekAgo = new Date(Date.now() - 7 * 86400_000).toISOString().slice(0, 10)
  const learners = members.filter(m => m.role === 'learner' || enrollments.some(e => e.user_id === m.user_id))

  const pct = (list: Enr[]) => list.length ? Math.round(list.reduce((s, e) => s + (e.progress_percent ?? 0), 0) / list.length) : 0
  const stats = {
    seatsUsed: members.length + (invites?.length ?? 0),
    active7: members.filter(m => (m.profile?.last_activity_date ?? '') >= weekAgo).length,
    avg: pct(enrollments),
    completed: enrollments.filter(e => (e.progress_percent ?? 0) >= 100 || e.completed_at).length,
    certs: orgCerts.length,
  }
  const seatPct = Math.min(100, Math.round((stats.seatsUsed / Math.max(1, org.max_seats)) * 100))

  const rows = members.map(m => {
    const mine = enrollments.filter(e => e.user_id === m.user_id)
    return {
      id: m.user_id,
      name: m.profile?.full_name ?? m.profile?.email ?? '—',
      email: m.profile?.email ?? '',
      role: m.role,
      lastActive: m.profile?.last_activity_date ?? null,
      courses: mine.length,
      done: mine.filter(e => (e.progress_percent ?? 0) >= 100 || e.completed_at).length,
      avg: pct(mine),
      certs: orgCerts.filter(c => c.user_id === m.user_id).length,
    }
  }).sort((a, b) => b.avg - a.avg)

  const cohortCards = cohorts.map(c => {
    const ids = new Set(c.cohort_members.map(m => m.user_id))
    const list = enrollments.filter(e => ids.has(e.user_id) && c.course_ids.includes(e.course_id))
    return { ...c, size: ids.size, avg: pct(list), done: list.filter(e => (e.progress_percent ?? 0) >= 100).length, total: list.length }
  })

  const canManageAdmins = isStaff || ['owner', 'admin'].includes(me?.role ?? '')
  const memberOptions = members.map(m => ({ id: m.user_id, name: m.profile?.full_name ?? m.profile?.email ?? '—' }))

  return (
    <div className="max-w-6xl mx-auto space-y-5 sm:space-y-6">
      {/* ── En-tête ── */}
      <div className="relative overflow-hidden rounded-3xl hero-photo bg-team text-white p-5 sm:p-7">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          {org.logo_url
            ? <img src={org.logo_url} alt="" className="w-14 h-14 rounded-2xl object-cover bg-white" />
            : <span className="w-14 h-14 rounded-2xl bg-white/15 backdrop-blur border border-white/20 flex items-center justify-center"><Building2 className="w-7 h-7" /></span>}
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#FFA500]">Espace entreprise · {PLAN_LABEL[org.plan] ?? org.plan}</p>
            <h1 className="text-2xl sm:text-3xl font-extrabold truncate" data-no-translate>{org.name}</h1>
            <p className="text-sm text-blue-100">{ORG_ROLE_LABEL[me?.role ?? ''] ?? 'Équipe IBIG'}</p>
          </div>
          <div className="sm:w-56">
            <div className="flex justify-between text-xs text-blue-100 mb-1.5"><span>Sièges utilisés</span><span className="font-bold text-white">{stats.seatsUsed} / {org.max_seats}</span></div>
            <div className="h-2.5 bg-white/20 rounded-full overflow-hidden"><div className={`h-full rounded-full ${seatPct >= 90 ? 'bg-red-400' : 'bg-[#FFA500]'}`} style={{ width: `${seatPct}%` }} /></div>
            {seatPct >= 90 && <Link href="/contact" className="mt-1.5 block text-xs text-[#FFA500] font-semibold">Ajouter des sièges →</Link>}
          </div>
        </div>
      </div>

      {/* ── Indicateurs ── */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-2.5 sm:gap-4">
        {[
          { label: 'Collaborateurs', value: members.length, icon: Users, cls: 'bg-blue-50 text-[#0B3D91]' },
          { label: 'Actifs (7 jours)', value: stats.active7, icon: Activity, cls: 'bg-emerald-50 text-emerald-600' },
          { label: 'Progression moyenne', value: `${stats.avg} %`, icon: TrendingUp, cls: 'bg-orange-50 text-orange-600' },
          { label: 'Formations terminées', value: stats.completed, icon: CheckCircle2, cls: 'bg-purple-50 text-purple-600' },
          { label: 'Certificats obtenus', value: stats.certs, icon: Award, cls: 'bg-yellow-50 text-yellow-600' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <span className={`w-9 h-9 rounded-xl flex items-center justify-center ${s.cls}`}><s.icon className="w-5 h-5" /></span>
            <p className="mt-3 text-xl sm:text-2xl font-extrabold text-gray-900 leading-none">{s.value}</p>
            <p className="text-xs text-gray-500 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* ── Premiers pas ── */}
      {members.length <= 1 && cohorts.length === 0 && (
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5 sm:p-7">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#FFA500]">Premiers pas</p>
          <h2 className="mt-1 text-xl font-bold text-gray-900">Lancez la formation de vos équipes en 3 étapes</h2>
          <ol className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { icon: UserPlus, t: 'Invitez vos collaborateurs', d: 'Par email : ils créent leur compte en un clic.' },
              { icon: Target, t: 'Créez un parcours', d: 'Choisissez les formations et les personnes concernées.' },
              { icon: TrendingUp, t: 'Suivez les résultats', d: 'Progression, formations terminées et certificats.' },
            ].map((s, i) => (
              <li key={s.t} className="rounded-2xl bg-gray-50 p-4">
                <span className="w-9 h-9 rounded-xl bg-[#0B3D91] text-white flex items-center justify-center"><s.icon className="w-[18px] h-[18px]" /></span>
                <p className="mt-2.5 font-semibold text-gray-900 text-sm">{i + 1}. {s.t}</p>
                <p className="text-xs text-gray-500 mt-0.5">{s.d}</p>
              </li>
            ))}
          </ol>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6">
        <InvitePanel orgId={org.id} canInviteManagers={canManageAdmins} free={Math.max(0, org.max_seats - stats.seatsUsed)}
          cohorts={cohorts.map(c => ({ id: c.id, name: c.name }))} />
        <CohortPanel orgId={org.id} courses={(catalog ?? []).map(c => ({ id: c.id as string, title: c.title as string }))} members={memberOptions} />
      </div>

      {/* ── Parcours d'équipe ── */}
      {cohortCards.length > 0 && (
        <section>
          <h2 className="font-bold text-gray-900 mb-3 flex items-center gap-2"><Target className="w-5 h-5 text-[#0B3D91]" /> Parcours d&apos;équipe</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
            {cohortCards.map(c => (
              <div key={c.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-bold text-gray-900 truncate">{c.name}</p>
                    <p className="text-xs text-gray-500">{c.size} collaborateur{c.size > 1 ? 's' : ''} · {c.course_ids.length} formation{c.course_ids.length > 1 ? 's' : ''}{c.end_date ? ` · échéance ${formatDate(c.end_date)}` : ''}</p>
                  </div>
                  <span className="text-lg font-extrabold text-[#0B3D91]">{c.avg}%</span>
                </div>
                <div className="mt-3 h-2 bg-gray-100 rounded-full overflow-hidden"><div className="h-full bg-gradient-to-r from-[#0B3D91] to-[#FFA500] rounded-full" style={{ width: `${c.avg}%` }} /></div>
                <ul className="mt-3 space-y-1">
                  {c.course_ids.slice(0, 4).map(id => (
                    <li key={id} className="text-xs text-gray-600 flex items-center gap-1.5 truncate"><BookOpen className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />{courseTitle.get(id) ?? 'Formation'}</li>
                  ))}
                </ul>
                <div className="mt-3 pt-3 border-t border-gray-50 flex items-center justify-between gap-2">
                  <span className="text-xs text-gray-500">{c.done}/{c.total} formations terminées</span>
                  <AddToCohort orgId={org.id} cohortId={c.id} members={memberOptions.filter(m => !c.cohort_members.some(x => x.user_id === m.id))} />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Équipe ── */}
      <section className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-4 sm:px-5 py-3.5 border-b border-gray-100 flex items-center justify-between gap-3">
          <h2 className="font-bold text-gray-900 flex items-center gap-2"><Users className="w-5 h-5 text-[#0B3D91]" /> Équipe ({members.length})</h2>
          <ExportTeam orgName={org.name} rows={rows.map(r => ({ ...r, role: ORG_ROLE_LABEL[r.role] ?? r.role }))} />
        </div>
        {rows.length === 0 ? (
          <p className="p-6 text-center text-sm text-gray-400">Aucun collaborateur pour l&apos;instant.</p>
        ) : (
          <ul className="divide-y divide-gray-50">
            {rows.map(r => (
              <li key={r.id} className="px-4 sm:px-5 py-3.5 flex items-center gap-3">
                <span className="w-10 h-10 rounded-full bg-[#0B3D91]/10 text-[#0B3D91] flex items-center justify-center font-bold flex-shrink-0">{r.name.charAt(0).toUpperCase()}</span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-gray-900 truncate" data-no-translate>{r.name}</p>
                  <p className="text-xs text-gray-500 truncate">
                    {ORG_ROLE_LABEL[r.role] ?? r.role} · {r.courses} formation{r.courses > 1 ? 's' : ''}{r.certs ? ` · ${r.certs} certificat${r.certs > 1 ? 's' : ''}` : ''}
                    {r.lastActive ? ` · actif le ${formatDate(r.lastActive)}` : ' · jamais connecté'}
                  </p>
                </div>
                {r.courses > 0 && (
                  <div className="hidden sm:flex items-center gap-2 w-36">
                    <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden"><div className="h-full bg-[#0B3D91] rounded-full" style={{ width: `${r.avg}%` }} /></div>
                    <span className="text-xs font-semibold text-gray-600 w-9 text-right">{r.avg}%</span>
                  </div>
                )}
                <span className="sm:hidden text-xs font-bold text-[#0B3D91]">{r.courses ? `${r.avg}%` : ''}</span>
                {r.id !== user.id && r.role !== 'owner' && (r.role === 'learner' || canManageAdmins) && <RemoveMember orgId={org.id} userId={r.id} name={r.name} />}
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* ── Invitations en attente ── */}
      {(invites ?? []).length > 0 && (
        <section className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-4 sm:px-5 py-3.5 border-b border-gray-100 flex items-center gap-2">
            <Mail className="w-5 h-5 text-[#0B3D91]" /><h2 className="font-bold text-gray-900">Invitations en attente ({invites!.length})</h2>
          </div>
          <ul className="divide-y divide-gray-50">
            {invites!.map(i => (
              <li key={i.id} className="px-4 sm:px-5 py-3 flex items-center gap-3">
                <Clock className="w-4 h-4 text-amber-500 flex-shrink-0" />
                <span className="min-w-0 flex-1">
                  <span className="block text-sm text-gray-900 truncate" data-no-translate>{i.email}</span>
                  <span className="block text-xs text-gray-400">{ORG_ROLE_LABEL[i.role] ?? i.role} · expire le {formatDate(i.expires_at)}</span>
                </span>
                <CancelInvite orgId={org.id} invitationId={i.id} />
              </li>
            ))}
          </ul>
        </section>
      )}
      <Link href="/tableau-de-bord" className="block text-center text-sm text-gray-500 hover:text-[#0B3D91] py-2">← Mon espace apprenant</Link>
    </div>
  )
}
