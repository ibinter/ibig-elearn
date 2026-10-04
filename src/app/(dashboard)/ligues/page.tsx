import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import LeagueBoard from './LeagueBoard'

export default async function LiguesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/connexion')

  // Profil courant
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, full_name, avatar_url, xp_points, xp_level, league_division')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/connexion')

  // S'assurer que l'utilisateur est dans une ligue (idempotent)
  await supabase.rpc('assign_to_league', { p_user_id: user.id })

  // Ligue de la semaine courante pour cet utilisateur
  const weekStart = getWeekStart()

  const { data: myLeague } = await supabase
    .from('leagues')
    .select('id, division, week_start, week_end')
    .eq('division', profile.league_division)
    .eq('week_start', weekStart)
    .single()

  let participants: any[] = []
  if (myLeague) {
    const { data } = await supabase
      .from('league_participants')
      .select(`
        id, xp_gained, rank,
        profiles:user_id (id, full_name, avatar_url, xp_level, league_division)
      `)
      .eq('league_id', myLeague.id)
      .order('xp_gained', { ascending: false })
    participants = data ?? []
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <LeagueBoard
        currentUserId={user.id}
        division={profile.league_division}
        weekStart={weekStart}
        weekEnd={getWeekEnd()}
        participants={participants}
        league={myLeague ?? null}
      />
    </div>
  )
}

function getWeekStart() {
  const d = new Date()
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1) // lundi
  const mon = new Date(d.setDate(diff))
  return mon.toISOString().slice(0, 10)
}

function getWeekEnd() {
  const d = new Date()
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? 0 : 7) // dimanche
  const sun = new Date(d.setDate(diff))
  return sun.toISOString().slice(0, 10)
}
