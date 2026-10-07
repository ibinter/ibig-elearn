/**
 * Séances de coaching : génération des créneaux réservables.
 *
 * Les disponibilités sont saisies par le coach en heures locales (son fuseau, par défaut
 * Africa/Abidjan) sous forme de plages hebdomadaires. Les créneaux sont stockés en UTC et
 * affichés dans le fuseau de chaque visiteur.
 */

export type Availability = { weekday: number; start_time: string; end_time: string }
export type BusySlot = { starts_at: string; ends_at: string }
export type Slot = { start: string; end: string }

export const BOOKING_HORIZON_DAYS = 21
export const MIN_NOTICE_HOURS = 12        // délai minimum avant une séance
export const HOLD_MINUTES = 20            // créneau bloqué le temps du paiement
export const CANCEL_LIMIT_HOURS = 24      // annulation gratuite jusqu'à 24 h avant

export const WEEKDAYS = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi']
export const DURATIONS = [30, 45, 60, 90, 120] as const

/** Décalage (minutes) du fuseau `tz` à l'instant `date` : heure locale − UTC. */
function tzOffsetMinutes(date: Date, tz: string): number {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-US', {
      timeZone: tz, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
    }).formatToParts(date).map(p => [p.type, p.value]),
  )
  const asUtc = Date.UTC(+parts.year, +parts.month - 1, +parts.day, +parts.hour, +parts.minute, +parts.second)
  return Math.round((asUtc - date.getTime()) / 60000)
}

/** Instant UTC correspondant à une date/heure locale dans le fuseau `tz`. */
export function zonedToUtc(y: number, m: number, d: number, hh: number, mm: number, tz: string): Date {
  const guess = new Date(Date.UTC(y, m, d, hh, mm))
  const offset = tzOffsetMinutes(guess, tz)
  return new Date(guess.getTime() - offset * 60000)
}

/** Date locale (année, mois, jour, jour de semaine) dans le fuseau `tz`. */
function localDate(date: Date, tz: string) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-US', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit', weekday: 'short' })
      .formatToParts(date).map(p => [p.type, p.value]),
  )
  const wd = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(parts.weekday)
  return { y: +parts.year, m: +parts.month - 1, d: +parts.day, weekday: wd }
}

const toMinutes = (t: string) => { const [h, m] = t.split(':').map(Number); return h * 60 + (m || 0) }

/** Créneaux disponibles sur l'horizon de réservation. */
export function generateSlots(opts: {
  availability: Availability[]
  busy: BusySlot[]
  durationMin: number
  timezone: string
  now?: Date
  days?: number
}): Slot[] {
  const { availability, busy, durationMin, timezone } = opts
  const now = opts.now ?? new Date()
  const earliest = now.getTime() + MIN_NOTICE_HOURS * 3600_000
  const busyRanges = busy.map(b => [new Date(b.starts_at).getTime(), new Date(b.ends_at).getTime()] as const)
  const slots: Slot[] = []
  const step = Math.min(durationMin, 30) // créneaux alignés sur des pas de 30 min

  for (let i = 0; i <= (opts.days ?? BOOKING_HORIZON_DAYS); i++) {
    const day = localDate(new Date(now.getTime() + i * 86400_000), timezone)
    for (const a of availability.filter(x => x.weekday === day.weekday)) {
      const startM = toMinutes(a.start_time)
      const endM = toMinutes(a.end_time)
      for (let t = startM; t + durationMin <= endM; t += step) {
        const start = zonedToUtc(day.y, day.m, day.d, Math.floor(t / 60), t % 60, timezone)
        const s = start.getTime()
        const e = s + durationMin * 60000
        if (s < earliest) continue
        if (busyRanges.some(([bs, be]) => s < be && e > bs)) continue
        slots.push({ start: new Date(s).toISOString(), end: new Date(e).toISOString() })
      }
    }
  }
  // dédoublonnage (plages qui se chevauchent) + tri
  const seen = new Set<string>()
  return slots.filter(s => (seen.has(s.start) ? false : (seen.add(s.start), true)))
    .sort((a, b) => a.start.localeCompare(b.start))
}

export function jitsiRoomUrl(bookingId: string): string {
  const domain = process.env.NEXT_PUBLIC_JITSI_DOMAIN ?? 'meet.jit.si'
  const token = crypto.randomUUID().replace(/-/g, '').slice(0, 12)
  return `https://${domain.replace(/^https?:\/\//, '')}/IBIG-Coaching-${bookingId.slice(0, 8)}-${token}`
}

export const BOOKING_STATUS: Record<string, { label: string; cls: string }> = {
  pending_payment: { label: 'Paiement en attente', cls: 'bg-amber-50 text-amber-700 border-amber-200' },
  confirmed: { label: 'Confirmée', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  completed: { label: 'Terminée', cls: 'bg-gray-100 text-gray-600 border-gray-200' },
  cancelled: { label: 'Annulée', cls: 'bg-red-50 text-red-700 border-red-200' },
  expired: { label: 'Expirée', cls: 'bg-gray-50 text-gray-400 border-gray-200' },
}
