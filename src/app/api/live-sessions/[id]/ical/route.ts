import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: session } = await supabase
    .from('live_sessions')
    .select('*, course:courses(title), instructor:profiles!instructor_id(full_name)')
    .eq('id', id)
    .single()

  if (!session) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const start = new Date(session.scheduled_at)
  const end = new Date(start.getTime() + session.duration_minutes * 60000)

  const fmt = (d: Date) =>
    d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'

  const course = session.course as any
  const instructor = session.instructor as any

  const ical = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//IBIG E-LEARN//FR',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${session.id}@ibig-elearning.com`,
    `DTSTAMP:${fmt(new Date())}`,
    `DTSTART:${fmt(start)}`,
    `DTEND:${fmt(end)}`,
    `SUMMARY:${session.title} — ${course?.title ?? ''}`,
    `DESCRIPTION:Formateur : ${instructor?.full_name ?? ''}\\nLien : ${session.meeting_url}`,
    `URL:${session.meeting_url}`,
    `LOCATION:${session.meeting_url}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n')

  return new NextResponse(ical, {
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': `attachment; filename="session-ibig-${id.slice(0, 8)}.ics"`,
    },
  })
}
