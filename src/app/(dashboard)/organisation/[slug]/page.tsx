import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import OrgDashboard from './OrgDashboard'

export default async function OrganisationPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/connexion')

  // Charger l'organisation
  const { data: org } = await supabase
    .from('organizations')
    .select('*')
    .eq('slug', slug)
    .single()
  if (!org) notFound()

  // Vérifier que l'utilisateur est admin/owner/manager
  const { data: membership } = await supabase
    .from('organization_members')
    .select('role')
    .eq('org_id', org.id)
    .eq('user_id', user.id)
    .eq('is_active', true)
    .single()

  if (!membership || !['owner','admin','manager'].includes(membership.role)) {
    redirect('/tableau-de-bord')
  }

  // Cohortes
  const { data: cohorts } = await supabase
    .from('cohorts')
    .select(`
      id, name, description, start_date, end_date, is_active,
      cohort_members(count)
    `)
    .eq('org_id', org.id)
    .order('created_at', { ascending: false })

  // Membres
  const { data: members } = await supabase
    .from('organization_members')
    .select(`
      id, role, joined_at, is_active,
      profiles:user_id(id, full_name, email, avatar_url, xp_points, xp_level, last_activity_date)
    `)
    .eq('org_id', org.id)
    .order('joined_at', { ascending: false })

  // Statistiques globales
  const totalMembers = members?.filter(m => m.is_active).length ?? 0
  const activeThisWeek = members?.filter(m => {
    const profile = m.profiles as any
    if (!profile?.last_activity_date) return false
    const d = new Date(profile.last_activity_date)
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    return d >= weekAgo
  }).length ?? 0

  return (
    <OrgDashboard
      org={org}
      userRole={membership.role}
      cohorts={cohorts ?? []}
      members={members ?? []}
      stats={{ totalMembers, activeThisWeek, totalSeats: org.max_seats, usedSeats: org.used_seats }}
    />
  )
}
