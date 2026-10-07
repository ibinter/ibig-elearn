import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import CoachingManager from './CoachingManager'

export const metadata = { title: 'Coaching' }

export default async function FormateurCoachingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/connexion')

  const [{ data: offers }, { data: availability }, { data: profile }, { data: bookings }] = await Promise.all([
    supabase.from('coaching_offers').select('*').eq('coach_id', user.id).order('created_at', { ascending: false }),
    supabase.from('coach_availability').select('id, weekday, start_time, end_time').eq('coach_id', user.id).order('weekday').order('start_time'),
    supabase.from('profiles').select('timezone').eq('id', user.id).single(),
    supabase.from('coaching_bookings').select('id, status, starts_at, price_xof').eq('coach_id', user.id).in('status', ['confirmed', 'completed']),
  ])

  const upcoming = (bookings ?? []).filter(b => b.status === 'confirmed' && new Date(b.starts_at).getTime() > Date.now()).length
  const done = (bookings ?? []).filter(b => b.status === 'completed').length

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Coaching individuel</h1>
          <p className="text-gray-500 text-sm mt-0.5">Vos offres, vos disponibilités et vos séances réservées</p>
        </div>
        <Link href="/mes-seances" className="inline-flex items-center justify-center px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm font-semibold text-gray-700">
          Voir mes séances ({upcoming} à venir · {done} réalisées)
        </Link>
      </div>
      <CoachingManager
        coachId={user.id}
        initialOffers={offers ?? []}
        initialAvailability={availability ?? []}
        timezone={profile?.timezone ?? 'Africa/Abidjan'} />
    </div>
  )
}
