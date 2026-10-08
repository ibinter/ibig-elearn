import Link from 'next/link'
import { redirect } from 'next/navigation'
import { CalendarClock, HeartHandshake } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { expireStaleHolds } from '@/lib/coaching-server'
import BookingCard, { type BookingView } from './BookingCard'
import CalendarSync from '@/components/ui/CalendarSync'
import { calendarFeedUrl } from '@/lib/calendar'

export const metadata = { title: 'Mes séances de coaching' }

export default async function MesSeancesPage({ searchParams }: { searchParams: Promise<{ reservee?: string; paiement?: string }> }) {
  const sp = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/connexion?redirectTo=/mes-seances')

  await expireStaleHolds()

  const { data } = await supabase.from('coaching_bookings')
    .select('id, status, starts_at, ends_at, meeting_url, price_xof, learner_goal, coach_notes, coach_id, learner_id, offer:coaching_offers(title, duration_min, format), coach:profiles!coaching_bookings_coach_id_fkey(full_name), learner:profiles!coaching_bookings_learner_id_fkey(full_name)')
    .or(`learner_id.eq.${user.id},coach_id.eq.${user.id}`)
    .neq('status', 'expired')
    .order('starts_at', { ascending: true })

  // Les notes du coach ne sont transmises qu'au coach
  const all = (data ?? []).map(b => {
    const role = b.coach_id === user.id ? 'coach' : 'learner'
    return { ...b, role, coach_notes: role === 'coach' ? b.coach_notes : null }
  }) as unknown as BookingView[]
  const now = Date.now()
  const upcoming = all.filter(b => ['confirmed', 'pending_payment'].includes(b.status) && new Date(b.ends_at).getTime() > now)
  const past = all.filter(b => !upcoming.includes(b)).reverse()

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mes séances</h1>
          <p className="text-gray-500 text-sm mt-0.5">Vos séances de coaching individuel</p>
        </div>
        <Link href="/coaching" className="flex-shrink-0 inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl ibig-gradient text-white text-sm font-semibold">
          <HeartHandshake className="w-4 h-4" /> Réserver
        </Link>
      </div>

      {sp.reservee && <div className="rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm px-4 py-3">Séance réservée ! Vous avez reçu une confirmation.</div>}
      {sp.paiement && <div className="rounded-xl bg-blue-50 border border-blue-200 text-blue-800 text-sm px-4 py-3">Paiement reçu : votre séance sera confirmée dans quelques instants (actualisez la page si besoin).</div>}

      <CalendarSync feedUrl={calendarFeedUrl(user.id)} />

      <section className="space-y-3">
        <h2 className="text-sm font-bold uppercase tracking-wider text-gray-400">À venir</h2>
        {upcoming.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
            <CalendarClock className="w-10 h-10 text-gray-300 mx-auto" />
            <p className="mt-2 text-gray-600 text-sm">Aucune séance à venir.</p>
            <Link href="/coaching" className="mt-3 inline-block text-[#0B3D91] font-semibold text-sm">Découvrir les coachs →</Link>
          </div>
        ) : upcoming.map(b => <BookingCard key={b.id} b={b} />)}
      </section>

      {past.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-gray-400">Historique</h2>
          {past.map(b => <BookingCard key={b.id} b={b} />)}
        </section>
      )}
    </div>
  )
}
