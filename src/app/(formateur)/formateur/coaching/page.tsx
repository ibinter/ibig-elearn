import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import {
  CalendarClock, CheckCircle2, Circle, Wallet, HeartHandshake, Users, AlertTriangle, ExternalLink, Clock,
} from 'lucide-react'
import CoachingManager from './CoachingManager'
import CalendarSync from '@/components/ui/CalendarSync'
import { calendarFeedUrl } from '@/lib/calendar'
import BookingCard, { type BookingView } from '@/app/(dashboard)/mes-seances/BookingCard'

export const metadata = { title: 'Tableau de bord coach' }

const fcfa = (n: number) => `${Math.round(n).toLocaleString('fr-FR')} FCFA`

export default async function FormateurCoachingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/connexion')

  const since90 = new Date(Date.now() - 90 * 86400_000).toISOString()
  const [{ data: offers }, { data: availability }, { data: profile }, { data: bookingsRaw }, { data: earnings }] = await Promise.all([
    supabase.from('coaching_offers').select('*').eq('coach_id', user.id).order('created_at', { ascending: false }),
    supabase.from('coach_availability').select('id, weekday, start_time, end_time').eq('coach_id', user.id).order('weekday').order('start_time'),
    supabase.from('profiles').select('full_name, timezone, bio, avatar_url, professional_title, payout_balance_xof, partner_share_pct').eq('id', user.id).single(),
    supabase.from('coaching_bookings')
      .select('id, status, starts_at, ends_at, meeting_url, price_xof, learner_goal, coach_notes, learner_id, offer:coaching_offers(title, duration_min, format), coach:profiles!coaching_bookings_coach_id_fkey(full_name), learner:profiles!coaching_bookings_learner_id_fkey(full_name)')
      .eq('coach_id', user.id)
      .in('status', ['confirmed', 'completed', 'cancelled'])
      .gte('starts_at', since90)
      .order('starts_at'),
    supabase.from('instructor_earnings').select('instructor_amount_xof, created_at')
      .eq('instructor_id', user.id).eq('status', 'credited').not('coaching_booking_id', 'is', null),
  ])

  const now = Date.now()
  const bookings = ((bookingsRaw ?? []) as unknown as (Omit<BookingView, 'role'> & { learner_id: string })[])
    .map(b => ({ ...b, role: 'coach' as const }))
  const upcoming = bookings.filter(b => b.status === 'confirmed' && new Date(b.ends_at).getTime() > now)
  const toClose = bookings.filter(b => b.status === 'confirmed' && new Date(b.ends_at).getTime() <= now)
  const since30 = now - 30 * 86400_000
  const done30 = bookings.filter(b => b.status === 'completed' && new Date(b.starts_at).getTime() >= since30)
  const cancelled30 = bookings.filter(b => b.status === 'cancelled' && new Date(b.starts_at).getTime() >= since30)
  const learners = new Set(bookings.filter(b => b.status !== 'cancelled').map(b => b.learner_id)).size
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()
  const earnedMonth = (earnings ?? []).filter(e => e.created_at >= monthStart).reduce((s, e) => s + e.instructor_amount_xof, 0)
  const earnedTotal = (earnings ?? []).reduce((s, e) => s + e.instructor_amount_xof, 0)
  const nextWeek = upcoming.filter(b => new Date(b.starts_at).getTime() < now + 7 * 86400_000).length

  // Démarrage : ce qu'il faut pour être réservable
  const activeOffers = (offers ?? []).filter(o => o.is_active).length
  const checklist = [
    { done: activeOffers > 0, label: 'Publier au moins une offre de coaching', href: '#offres' },
    { done: (availability ?? []).length > 0, label: 'Renseigner vos disponibilités hebdomadaires', href: '#offres' },
    { done: !!profile?.bio && !!profile?.professional_title, label: 'Compléter votre bio et votre titre professionnel', href: '/profil' },
    { done: !!profile?.avatar_url, label: 'Ajouter une photo de profil', href: '/profil' },
  ]
  const ready = checklist.every(c => c.done)
  const share = Number(profile?.partner_share_pct ?? 50)

  return (
    <div className="max-w-5xl space-y-5 sm:space-y-6">
      {/* ── En-tête ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-[22px] sm:text-2xl font-bold text-gray-900">Tableau de bord coach</h1>
          <p className="text-gray-500 text-sm">Vos séances, vos revenus et vos offres de coaching</p>
        </div>
        {ready && (
          <Link href={`/coaching/${(offers ?? []).find(o => o.is_active)?.id ?? ''}`} target="_blank"
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm font-semibold text-gray-700">
            <ExternalLink className="w-4 h-4" /> Voir ma page publique
          </Link>
        )}
      </div>

      {/* ── Prochaine séance / revenus ── */}
      <div className="relative overflow-hidden rounded-3xl hero-photo bg-coaching text-white p-5 sm:p-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 sm:items-center">
          <div className="sm:col-span-2 min-w-0">
            {upcoming[0] ? (
              <>
                <p className="text-xs font-semibold uppercase tracking-wider text-[#FFA500]">Prochaine séance</p>
                <p className="mt-1 text-xl sm:text-2xl font-bold leading-snug truncate">{upcoming[0].offer?.title}</p>
                <p className="mt-1 text-sm text-blue-100">
                  {new Date(upcoming[0].starts_at).toLocaleString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}
                  {' · '}<span data-no-translate>{upcoming[0].learner?.full_name}</span>
                </p>
                {upcoming[0].learner_goal && <p className="mt-2 text-sm text-white/80 line-clamp-2">« {upcoming[0].learner_goal} »</p>}
              </>
            ) : (
              <>
                <p className="text-xs font-semibold uppercase tracking-wider text-[#FFA500]">Agenda</p>
                <p className="mt-1 text-xl sm:text-2xl font-bold">Aucune séance programmée</p>
                <p className="mt-1 text-sm text-blue-100">{ready ? 'Partagez votre page coach pour recevoir vos premières réservations.' : 'Terminez la configuration ci-dessous pour être réservable.'}</p>
              </>
            )}
          </div>
          <div className="rounded-2xl bg-white/10 backdrop-blur border border-white/15 p-4">
            <p className="text-xs text-blue-100">Revenus coaching du mois</p>
            <p className="text-2xl font-extrabold">{fcfa(earnedMonth)}</p>
            <p className="text-[11px] text-blue-200 mt-0.5">Total : {fcfa(earnedTotal)} · votre part {share} %</p>
            <Link href="/formateur/virements" className="mt-2.5 flex items-center justify-center gap-1.5 bg-[#FFA500] text-black font-bold text-sm py-2 rounded-xl">
              <Wallet className="w-4 h-4" /> Solde : {fcfa(profile?.payout_balance_xof ?? 0)}
            </Link>
          </div>
        </div>
      </div>

      {/* ── Compteurs ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        {[
          { label: 'À venir', sub: `${nextWeek} cette semaine`, value: upcoming.length, icon: CalendarClock, cls: 'bg-blue-50 text-[#0B3D91]' },
          { label: 'Réalisées (30 j)', value: done30.length, icon: CheckCircle2, cls: 'bg-emerald-50 text-emerald-600' },
          { label: 'Apprenants accompagnés', value: learners, icon: Users, cls: 'bg-purple-50 text-purple-600' },
          { label: 'Annulations (30 j)', value: cancelled30.length, icon: Clock, cls: 'bg-rose-50 text-rose-600' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <span className={`w-9 h-9 rounded-xl flex items-center justify-center ${s.cls}`}><s.icon className="w-5 h-5" /></span>
            <p className="mt-3 text-2xl font-extrabold text-gray-900 leading-none">{s.value}</p>
            <p className="text-xs text-gray-500 mt-1">{s.label}{s.sub ? ` · ${s.sub}` : ''}</p>
          </div>
        ))}
      </div>

      {/* ── Démarrage ── */}
      {!ready && (
        <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-bold text-gray-900">Devenez réservable</h2>
            <span className="text-xs font-semibold text-gray-500">{checklist.filter(c => c.done).length}/{checklist.length}</span>
          </div>
          <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-[#FFA500] rounded-full" style={{ width: `${(checklist.filter(c => c.done).length / checklist.length) * 100}%` }} />
          </div>
          <ul className="mt-3 space-y-1">
            {checklist.map(c => (
              <li key={c.label}>
                <Link href={c.href} className={`flex items-center gap-2.5 rounded-xl px-2 py-2 text-sm ${c.done ? 'text-gray-400 line-through' : 'text-gray-800 hover:bg-gray-50'}`}>
                  {c.done ? <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" /> : <Circle className="w-5 h-5 text-gray-300 flex-shrink-0" />}
                  {c.label}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* ── À clôturer ── */}
      {toClose.length > 0 && (
        <section className="space-y-3">
          <h2 className="font-bold text-gray-900 flex items-center gap-2"><AlertTriangle className="w-5 h-5 text-amber-500" /> À clôturer ({toClose.length})</h2>
          <p className="text-sm text-gray-500 -mt-1">Ces séances sont passées : marquez-les comme réalisées et ajoutez vos notes de suivi.</p>
          {toClose.map(b => <BookingCard key={b.id} b={b} />)}
        </section>
      )}

      <CalendarSync feedUrl={calendarFeedUrl(user.id)} />

      {/* ── Agenda ── */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-gray-900 flex items-center gap-2"><CalendarClock className="w-5 h-5 text-[#0B3D91]" /> Séances à venir</h2>
          <Link href="/mes-seances" className="text-sm text-[#0B3D91] font-semibold">Historique →</Link>
        </div>
        {upcoming.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-6 text-center text-sm text-gray-500">
            <HeartHandshake className="w-9 h-9 text-gray-300 mx-auto mb-2" />
            Vos prochaines réservations apparaîtront ici, avec le lien de visio et l&apos;objectif de l&apos;apprenant.
          </div>
        ) : upcoming.slice(0, 8).map(b => <BookingCard key={b.id} b={b} />)}
      </section>

      {/* ── Offres & disponibilités ── */}
      <section id="offres" className="scroll-mt-20 space-y-3">
        <h2 className="font-bold text-gray-900">Mes offres et disponibilités</h2>
        <CoachingManager
          coachId={user.id}
          initialOffers={offers ?? []}
          initialAvailability={availability ?? []}
          timezone={profile?.timezone ?? 'Africa/Abidjan'} />
      </section>
    </div>
  )
}
