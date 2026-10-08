import { createHmac, timingSafeEqual } from 'crypto'
import { SITE_URL } from '@/lib/site'

/** Flux iCalendar personnel (RFC 5545) : séances de coaching, sessions live, échéances de formation. */
export type CalEvent = {
  uid: string; title: string; description?: string; url?: string
  start: Date; end?: Date; allDay?: boolean
}

const secret = () => process.env.CALENDAR_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || 'ibig-calendar'

/** Jeton permanent (révocable en changeant CALENDAR_SECRET) : les agendas ne savent pas renouveler un lien. */
export function calendarToken(userId: string) {
  const sig = createHmac('sha256', secret()).update(`cal:${userId}`).digest('base64url').slice(0, 32)
  return `${userId}.${sig}`
}

export function readCalendarToken(token: string): string | null {
  const [userId, sig] = token.replace(/\.ics$/, '').split('.')
  if (!userId || !sig) return null
  const expected = calendarToken(userId).split('.')[1]
  const a = Buffer.from(sig), b = Buffer.from(expected)
  return a.length === b.length && timingSafeEqual(a, b) ? userId : null
}

export const calendarFeedUrl = (userId: string) => `${SITE_URL}/api/calendrier/${calendarToken(userId)}.ics`

const stamp = (d: Date) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
const day = (d: Date) => d.toISOString().slice(0, 10).replace(/-/g, '')
const esc = (s: string) => s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n')

/** Plie les lignes à 75 octets comme l'exige la norme. */
function fold(line: string) {
  const out: string[] = []
  let cur = ''
  for (const ch of line) {
    if (Buffer.byteLength(cur + ch) > 74) { out.push(cur); cur = ' ' + ch } else cur += ch
  }
  out.push(cur)
  return out.join('\r\n')
}

export function toICS(name: string, events: CalEvent[]) {
  const now = stamp(new Date())
  const lines = [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//IBIG E-LEARNING//Agenda//FR', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH',
    `X-WR-CALNAME:${esc(name)}`, 'X-WR-TIMEZONE:UTC', 'REFRESH-INTERVAL;VALUE=DURATION:PT1H', 'X-PUBLISHED-TTL:PT1H',
  ]
  for (const e of events) {
    lines.push('BEGIN:VEVENT', `UID:${e.uid}@ibig-elearning.com`, `DTSTAMP:${now}`)
    if (e.allDay) {
      const next = new Date(e.start.getTime() + 86400_000)
      lines.push(`DTSTART;VALUE=DATE:${day(e.start)}`, `DTEND;VALUE=DATE:${day(next)}`)
    } else {
      lines.push(`DTSTART:${stamp(e.start)}`, `DTEND:${stamp(e.end ?? new Date(e.start.getTime() + 3600_000))}`)
      lines.push('BEGIN:VALARM', 'ACTION:DISPLAY', `DESCRIPTION:${esc(e.title)}`, 'TRIGGER:-PT15M', 'END:VALARM')
    }
    lines.push(`SUMMARY:${esc(e.title)}`)
    if (e.description) lines.push(`DESCRIPTION:${esc(e.description)}`)
    if (e.url) lines.push(`URL:${e.url}`)
    lines.push('END:VEVENT')
  }
  lines.push('END:VCALENDAR')
  return lines.map(fold).join('\r\n') + '\r\n'
}

/** Lien « Ajouter à Google Agenda » pour un événement isolé. */
export function googleEventUrl(e: { title: string; start: Date; end: Date; details?: string }) {
  const qs = new URLSearchParams({ action: 'TEMPLATE', text: e.title, dates: `${stamp(e.start)}/${stamp(e.end)}`, details: e.details ?? '' })
  return `https://calendar.google.com/calendar/render?${qs.toString()}`
}
