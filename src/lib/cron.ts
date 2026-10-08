import type { NextRequest } from 'next/server'

/**
 * Autorise une tâche planifiée.
 * Vercel Cron envoie `Authorization: Bearer <CRON_SECRET>` quand la variable est définie ;
 * `x-cron-secret` reste accepté pour un déclenchement manuel. Sans secret configuré,
 * seul l'agent Vercel Cron (ou le développement local) est accepté.
 */
export function isCronAuthorized(req: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (secret) {
    return req.headers.get('authorization') === `Bearer ${secret}` || req.headers.get('x-cron-secret') === secret
  }
  return process.env.NODE_ENV !== 'production' || (req.headers.get('user-agent') ?? '').startsWith('vercel-cron')
}
