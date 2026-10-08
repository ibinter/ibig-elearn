import { createHmac, randomBytes, timingSafeEqual } from 'crypto'
import { exportJWK, generateKeyPair } from 'jose'
import type { SupabaseClient } from '@supabase/supabase-js'

/** LTI 1.3 — IBIG E-LEARNING en tant qu'outil (« tool ») intégré dans un LMS (Moodle, Canvas, Blackboard…). */
export const LTI = {
  claim: (name: string) => `https://purl.imsglobal.org/spec/lti/claim/${name}`,
  STATE_TTL_S: 600,
}

export type Platform = {
  id: string; name: string; issuer: string; client_id: string; auth_login_url: string; jwks_url: string
  deployment_ids: string[]; org_id: string | null; is_active: boolean
}

export function toolUrls(origin: string) {
  return {
    login: `${origin}/api/lti/login`,
    launch: `${origin}/api/lti/launch`,
    jwks: `${origin}/api/lti/jwks`,
    target: `${origin}/api/lti/launch?course=<identifiant-de-la-formation>`,
  }
}

/** Paire de clés RS256 de l'outil, générée au premier besoin et conservée en base. */
export async function toolKey(admin: SupabaseClient) {
  const { data } = await admin.from('lti_tool_keys').select('kid, public_jwk').order('created_at').limit(1).maybeSingle()
  if (data) return data as { kid: string; public_jwk: Record<string, unknown> }
  const { publicKey, privateKey } = await generateKeyPair('RS256', { extractable: true })
  const kid = randomBytes(8).toString('hex')
  const public_jwk = { ...(await exportJWK(publicKey)), kid, alg: 'RS256', use: 'sig' }
  const private_jwk = { ...(await exportJWK(privateKey)), kid, alg: 'RS256' }
  await admin.from('lti_tool_keys').insert({ kid, public_jwk, private_jwk })
  return { kid, public_jwk }
}

// ── État OIDC (anti-rejeu) : cookie signé, transmis lors du retour cross-site ──
const secret = () => process.env.LTI_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || 'ibig-lti'

export function packState(v: { state: string; nonce: string; platformId: string }) {
  const body = Buffer.from(JSON.stringify({ ...v, exp: Math.floor(Date.now() / 1000) + LTI.STATE_TTL_S })).toString('base64url')
  return `${body}.${createHmac('sha256', secret()).update(body).digest('base64url')}`
}

export function unpackState(cookie: string | undefined): { state: string; nonce: string; platformId: string } | null {
  if (!cookie) return null
  const [body, sig] = cookie.split('.')
  if (!body || !sig) return null
  const expected = createHmac('sha256', secret()).update(body).digest('base64url')
  const a = Buffer.from(sig), b = Buffer.from(expected)
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null
  const v = JSON.parse(Buffer.from(body, 'base64url').toString())
  return v.exp > Date.now() / 1000 ? v : null
}

export const randomToken = () => randomBytes(18).toString('base64url')
