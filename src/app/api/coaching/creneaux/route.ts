import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { BOOKING_HORIZON_DAYS, generateSlots } from '@/lib/coaching'

/** Créneaux réservables d'une offre (public). */
export async function GET(req: NextRequest) {
  const offerId = req.nextUrl.searchParams.get('offer')
  if (!offerId) return NextResponse.json({ error: 'offer requis' }, { status: 400 })
  const supabase = await createClient()

  const { data: offer } = await supabase.from('coaching_offers')
    .select('id, coach_id, duration_min, is_active, coach:profiles(timezone)').eq('id', offerId).single()
  if (!offer || !offer.is_active) return NextResponse.json({ error: 'Offre indisponible' }, { status: 404 })

  const from = new Date()
  const to = new Date(from.getTime() + (BOOKING_HORIZON_DAYS + 1) * 86400_000)
  const [{ data: availability }, { data: busy }] = await Promise.all([
    supabase.from('coach_availability').select('weekday, start_time, end_time').eq('coach_id', offer.coach_id),
    supabase.rpc('coach_busy_slots', { p_coach: offer.coach_id, p_from: from.toISOString(), p_to: to.toISOString() }),
  ])
  const coach = (Array.isArray(offer.coach) ? offer.coach[0] : offer.coach) as { timezone?: string } | null

  const slots = generateSlots({
    availability: availability ?? [],
    busy: (busy ?? []) as { starts_at: string; ends_at: string }[],
    durationMin: offer.duration_min,
    timezone: coach?.timezone || 'Africa/Abidjan',
  })
  return NextResponse.json({ slots }, { headers: { 'Cache-Control': 'no-store' } })
}
