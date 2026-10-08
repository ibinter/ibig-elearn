import { createHash, createHmac, randomBytes } from 'crypto'
import type { NextRequest } from 'next/server'
import type { SupabaseClient } from '@supabase/supabase-js'
import { createAdminClient } from '@/lib/supabase/admin'

// ── Clés d'API ──────────────────────────────────────────────
export const hashKey = (key: string) => createHash('sha256').update(key).digest('hex')

/** Nouvelle clé : renvoyée une seule fois en clair, seule son empreinte est stockée. */
export function newApiKey() {
  const key = `ibig_live_${randomBytes(24).toString('base64url')}`
  return { key, prefix: key.slice(0, 14), hash: hashKey(key) }
}

/** Authentifie une requête d'API (Authorization: Bearer ibig_live_…) et renvoie l'organisation. */
export async function apiAuth(req: NextRequest): Promise<{ orgId: string; admin: SupabaseClient } | null> {
  const header = req.headers.get('authorization') ?? ''
  const key = header.startsWith('Bearer ') ? header.slice(7).trim() : ''
  if (!key.startsWith('ibig_live_')) return null
  const admin = createAdminClient()
  const { data } = await admin.from('api_keys').select('id, org_id, revoked_at').eq('key_hash', hashKey(key)).maybeSingle()
  if (!data || data.revoked_at) return null
  const { data: org } = await admin.from('organizations').select('is_active').eq('id', data.org_id).single()
  if (!org?.is_active) return null
  void admin.from('api_keys').update({ last_used_at: new Date().toISOString() }).eq('id', data.id)
  return { orgId: data.org_id, admin }
}

// ── Webhooks ────────────────────────────────────────────────
export const WEBHOOK_EVENTS = {
  'enrollment.created': 'Un collaborateur est inscrit à une formation',
  'course.completed': 'Un collaborateur termine une formation',
  'certificate.issued': 'Un certificat est délivré',
} as const
export type WebhookEvent = keyof typeof WEBHOOK_EVENTS

export const newWebhookSecret = () => `whsec_${randomBytes(24).toString('base64url')}`
export const sign = (secret: string, body: string) => `sha256=${createHmac('sha256', secret).update(body).digest('hex')}`

/**
 * Envoie un événement aux webhooks actifs de l'organisation (signature HMAC-SHA256 dans X-IBIG-Signature).
 * Ne lève jamais d'erreur : un webhook en panne ne doit pas bloquer la plateforme.
 */
export async function emitOrgEvent(orgId: string | null | undefined, event: WebhookEvent, data: Record<string, unknown>) {
  if (!orgId) return
  try {
    const admin = createAdminClient()
    const { data: endpoints } = await admin.from('webhook_endpoints').select('id, url, secret, events').eq('org_id', orgId).eq('is_active', true)
    const targets = (endpoints ?? []).filter(e => (e.events ?? []).includes(event))
    if (!targets.length) return
    const payload = { id: `evt_${randomBytes(12).toString('hex')}`, event, created_at: new Date().toISOString(), data }
    const body = JSON.stringify(payload)
    await Promise.allSettled(targets.map(async ep => {
      let status: number | null = null, ok = false, error: string | null = null
      try {
        const res = await fetch(ep.url, {
          method: 'POST', body, signal: AbortSignal.timeout(5000),
          headers: { 'Content-Type': 'application/json', 'User-Agent': 'IBIG-Webhooks/1.0', 'X-IBIG-Event': event, 'X-IBIG-Signature': sign(ep.secret, body) },
        })
        status = res.status; ok = res.ok
      } catch (e) { error = (e as Error).message.slice(0, 300) }
      await admin.from('webhook_deliveries').insert({ endpoint_id: ep.id, event, payload, status_code: status, ok, error })
    }))
  } catch { /* jamais bloquant */ }
}
