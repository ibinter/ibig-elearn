import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { readCalendarToken, toICS, type CalEvent } from '@/lib/calendar'
import { SITE_URL } from '@/lib/site'

/** Flux d'agenda personnel, à abonner dans Google Agenda, Outlook ou Apple Calendrier. */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const userId = readCalendarToken(token)
  if (!userId) return new NextResponse('Lien d’agenda invalide', { status: 404 })

  const admin = createAdminClient()
  const since = new Date(Date.now() - 30 * 86400_000).toISOString()
  const [{ data: bookings }, { data: enrollments }, { data: own }] = await Promise.all([
    admin.from('coaching_bookings')
      .select('id, starts_at, ends_at, coach_id, learner_id, offer:coaching_offers(title), coach:profiles!coaching_bookings_coach_id_fkey(full_name), learner:profiles!coaching_bookings_learner_id_fkey(full_name)')
      .or(`learner_id.eq.${userId},coach_id.eq.${userId}`).eq('status', 'confirmed').gte('starts_at', since),
    admin.from('enrollments').select('id, course_id, due_date, progress_percent, completed_at, course:courses(title)').eq('user_id', userId),
    admin.from('live_sessions').select('id').eq('instructor_id', userId),
  ])

  const courseIds = (enrollments ?? []).map(e => e.course_id)
  const { data: lives } = await admin.from('live_sessions')
    .select('id, title, description, scheduled_at, duration_minutes, status, course:courses(title)')
    .or([courseIds.length ? `course_id.in.(${courseIds.join(',')})` : null, (own ?? []).length ? `instructor_id.eq.${userId}` : null].filter(Boolean).join(',') || 'id.is.null')
    .neq('status', 'cancelled').gte('scheduled_at', since)

  const events: CalEvent[] = []
  for (const b of (bookings ?? []) as unknown as { id: string; starts_at: string; ends_at: string; coach_id: string; offer: { title: string } | null; coach: { full_name: string } | null; learner: { full_name: string } | null }[]) {
    const asCoach = b.coach_id === userId
    events.push({
      uid: `coaching-${b.id}`, start: new Date(b.starts_at), end: new Date(b.ends_at),
      title: `Coaching · ${b.offer?.title ?? 'Séance'}`,
      description: asCoach ? `Séance avec ${b.learner?.full_name ?? 'un apprenant'}` : `Séance avec ${b.coach?.full_name ?? 'votre coach'}. Lien de visio : ${SITE_URL}/mes-seances`,
      url: `${SITE_URL}/mes-seances`,
    })
  }
  for (const l of (lives ?? []) as unknown as { id: string; title: string; description: string | null; scheduled_at: string; duration_minutes: number | null; course: { title: string } | null }[]) {
    const start = new Date(l.scheduled_at)
    events.push({
      uid: `live-${l.id}`, start, end: new Date(start.getTime() + (l.duration_minutes ?? 60) * 60_000),
      title: `Session live · ${l.title}`, description: [l.course?.title, l.description].filter(Boolean).join(' — '),
      url: `${SITE_URL}/sessions-live/${l.id}`,
    })
  }
  for (const e of (enrollments ?? []) as unknown as { id: string; course_id: string; due_date: string | null; progress_percent: number | null; completed_at: string | null; course: { title: string } | null }[]) {
    if (!e.due_date || e.completed_at || (e.progress_percent ?? 0) >= 100) continue
    events.push({
      uid: `echeance-${e.id}`, start: new Date(e.due_date + 'T00:00:00Z'), allDay: true,
      title: `Échéance · ${e.course?.title ?? 'Formation obligatoire'}`,
      description: 'Formation obligatoire à terminer avant cette date.', url: `${SITE_URL}/apprendre/${e.course_id}`,
    })
  }

  return new NextResponse(toICS('IBIG E-LEARNING', events), {
    headers: { 'Content-Type': 'text/calendar; charset=utf-8', 'Content-Disposition': 'inline; filename="ibig-elearning.ics"', 'Cache-Control': 'private, max-age=900' },
  })
}
