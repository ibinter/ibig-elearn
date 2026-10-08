import type { SupabaseClient } from '@supabase/supabase-js'
import { emitOrgEvent } from '@/lib/integrations'

export const MANAGER_ROLES = ['owner', 'admin', 'manager'] as const
export const ORG_ROLE_LABEL: Record<string, string> = {
  owner: 'Propriétaire', admin: 'Administrateur', manager: 'Responsable', learner: 'Collaborateur',
}
export const PLAN_LABEL: Record<string, string> = { starter: 'Starter', business: 'Business', enterprise: 'Enterprise' }

export type ManagedOrg = { id: string; slug: string; name: string; role: string }

/** Organisations que l'utilisateur administre (owner / admin / manager). */
export async function getManagedOrgs(admin: SupabaseClient, userId: string): Promise<ManagedOrg[]> {
  const { data } = await admin
    .from('organization_members')
    .select('role, org:organizations(id, slug, name, is_active)')
    .eq('user_id', userId)
    .eq('is_active', true)
    .in('role', MANAGER_ROLES as unknown as string[])
  return ((data ?? []) as unknown as { role: string; org: { id: string; slug: string; name: string; is_active: boolean } | null }[])
    .filter(m => m.org?.is_active)
    .map(m => ({ id: m.org!.id, slug: m.org!.slug, name: m.org!.name, role: m.role }))
}

/** Sièges occupés = collaborateurs actifs + invitations en attente non expirées. */
export async function seatsUsed(admin: SupabaseClient, orgId: string) {
  const [{ count: members }, { count: invites }] = await Promise.all([
    admin.from('organization_members').select('*', { count: 'exact', head: true }).eq('org_id', orgId).eq('is_active', true),
    admin.from('org_invitations').select('*', { count: 'exact', head: true })
      .eq('org_id', orgId).is('accepted_at', null).gt('expires_at', new Date().toISOString()),
  ])
  return (members ?? 0) + (invites ?? 0)
}

/** Ajoute des collaborateurs à un parcours d'équipe et les inscrit à ses formations (financées par l'organisation). */
export async function addToCohort(admin: SupabaseClient, orgId: string, cohortId: string, userIds: string[]) {
  if (!userIds.length) return
  const { data: cohort } = await admin.from('cohorts').select('course_ids, is_mandatory, end_date').eq('id', cohortId).eq('org_id', orgId).single()
  if (!cohort) return
  await admin.from('cohort_members').upsert(
    userIds.map(user_id => ({ cohort_id: cohortId, user_id })),
    { onConflict: 'cohort_id,user_id', ignoreDuplicates: true })
  const courseIds = (cohort.course_ids ?? []) as string[]
  if (!courseIds.length) return
  const { data: created } = await admin.from('enrollments').upsert(
    userIds.flatMap(user_id => courseIds.map(course_id => ({
      user_id, course_id, status: 'active', mode: 'autonome', paid_amount: 0, sponsor_org_id: orgId,
    }))),
    { onConflict: 'user_id,course_id', ignoreDuplicates: true })
    .select('user_id, course_id, enrolled_at')
  for (const e of created ?? []) {
    await emitOrgEvent(orgId, 'enrollment.created', { user_id: e.user_id, course_id: e.course_id, enrolled_at: e.enrolled_at, due_date: cohort.is_mandatory ? cohort.end_date : null, cohort_id: cohortId })
  }
  // Parcours obligatoire : l'échéance s'applique aux inscriptions (sans écraser une échéance plus proche)
  if (cohort.is_mandatory && cohort.end_date) {
    await admin.from('enrollments').update({ due_date: cohort.end_date })
      .in('user_id', userIds).in('course_id', courseIds).is('completed_at', null)
      .or(`due_date.is.null,due_date.gt.${cohort.end_date}`)
  }
}

/** Rattache un utilisateur à une organisation (réactive un ancien membre). */
export async function addMember(admin: SupabaseClient, orgId: string, userId: string, role: string, invitedBy: string | null) {
  const { data: existing } = await admin.from('organization_members').select('id, is_active').eq('org_id', orgId).eq('user_id', userId).maybeSingle()
  if (existing) {
    if (!existing.is_active) await admin.from('organization_members').update({ is_active: true, role }).eq('id', existing.id)
    return existing.is_active ? 'already_member' as const : 'added' as const
  }
  await admin.from('organization_members').insert({
    org_id: orgId, user_id: userId, role, invited_by: invitedBy, invited_at: new Date().toISOString(),
  })
  await admin.from('profiles').update({ org_id: orgId }).eq('id', userId).is('org_id', null)
  return 'added' as const
}

export function slugify(s: string) {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 50)
}
