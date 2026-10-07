import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()

  const { data: session } = await supabase
    .from('live_sessions')
    .select('title, description, scheduled_at, duration_minutes, join_url, room_name, platform')
    .eq('id', id)
    .single()

  if (!session) {
    return NextResponse.json({ error: 'Session introuvable' }, { status: 404 })
  }

  const start = new Date(session.scheduled_at)
  const end = new Date(start.getTime() + session.duration_minutes * 60 * 1000)

  const fmt = (d: Date) =>
    d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'

  const domain = process.env.NEXT_PUBLIC_JITSI_DOMAIN ?? 'meet.jit.si'
  const joinUrl =
    session.join_url ??
    (session.platform === 'jitsi' ? `https://${domain}/${session.room_name}` : '')

  const ical = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//IBIG E-LEARN//Sessions Live//FR',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:live-${id}@ibig-elearning.com`,
    `DTSTAMP:${fmt(new Date())}`,
    `DTSTART:${fmt(start)}`,
    `DTEND:${fmt(end)}`,
    `SUMMARY:${session.title.replace(/\n/g, ' ')}`,
    session.description ? `DESCRIPTION:${session.description.replace(/\n/g, '\\n')}` : '',
    joinUrl ? `URL:${joinUrl}` : '',
    'END:VEVENT',
    'END:VCALENDAR',
  ]
    .filter(Boolean)
    .join('\r\n')

  return new NextResponse(ical, {
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': `attachment; filename="session-${id}.ics"`,
    },
  })
}
