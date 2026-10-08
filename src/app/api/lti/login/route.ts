import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { LTI, packState, randomToken } from '@/lib/lti'

/**
 * Étape 1 — initiation OIDC par la plateforme (« third-party initiated login »).
 * On renvoie le navigateur vers la plateforme avec un state et un nonce à usage unique.
 */
async function handle(req: NextRequest) {
  const p = req.method === 'POST'
    ? Object.fromEntries((await req.formData()).entries()) as Record<string, string>
    : Object.fromEntries(req.nextUrl.searchParams.entries())
  const { iss, login_hint, target_link_uri, lti_message_hint, client_id } = p
  if (!iss || !login_hint) return new NextResponse('Requête LTI incomplète (iss, login_hint)', { status: 400 })

  const admin = createAdminClient()
  let q = admin.from('lti_platforms').select('id, client_id, auth_login_url').eq('issuer', iss).eq('is_active', true)
  if (client_id) q = q.eq('client_id', client_id)
  const { data: platforms } = await q
  const platform = platforms?.[0]
  if (!platform) return new NextResponse('Plateforme LTI non enregistrée auprès d’IBIG E-LEARNING', { status: 403 })

  const state = randomToken(), nonce = randomToken()
  const url = new URL(platform.auth_login_url)
  const params: Record<string, string> = {
    scope: 'openid', response_type: 'id_token', response_mode: 'form_post', prompt: 'none',
    client_id: platform.client_id, redirect_uri: `${req.nextUrl.origin}/api/lti/launch`,
    login_hint, state, nonce, ...(lti_message_hint ? { lti_message_hint } : {}),
  }
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v)

  const res = NextResponse.redirect(url, 302)
  // Retour en POST cross-site : le cookie doit être SameSite=None ; Secure
  res.cookies.set(`lti_state_${state}`, packState({ state, nonce, platformId: platform.id }), {
    httpOnly: true, secure: true, sameSite: 'none', maxAge: LTI.STATE_TTL_S, path: '/api/lti',
  })
  if (target_link_uri) res.cookies.set(`lti_target_${state}`, target_link_uri.slice(0, 500), { httpOnly: true, secure: true, sameSite: 'none', maxAge: LTI.STATE_TTL_S, path: '/api/lti' })
  return res
}

export const GET = handle
export const POST = handle
