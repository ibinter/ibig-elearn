import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createRemoteJWKSet, jwtVerify } from 'jose'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { LTI, unpackState, type Platform } from '@/lib/lti'

const fail = (msg: string, status = 400) =>
  new NextResponse(`<!doctype html><meta charset="utf-8"><title>IBIG E-LEARNING</title><body style="font-family:Arial;padding:40px;text-align:center"><h2 style="color:#0B3D91">Connexion LTI impossible</h2><p>${msg}</p></body>`,
    { status, headers: { 'Content-Type': 'text/html; charset=utf-8' } })

/**
 * Étape 2 — lancement : la plateforme renvoie un id_token signé (JWT).
 * On le vérifie (signature JWKS, iss, aud, nonce, déploiement), on connecte ou crée le compte,
 * on inscrit l'apprenant à la formation demandée puis on ouvre le lecteur.
 */
export async function POST(req: NextRequest) {
  const form = await req.formData()
  const idToken = String(form.get('id_token') ?? '')
  const state = String(form.get('state') ?? '')
  if (!idToken || !state) return fail('Jeton de lancement manquant.')

  const jar = await cookies()
  const saved = unpackState(jar.get(`lti_state_${state}`)?.value)
  if (!saved || saved.state !== state) return fail('Session de lancement expirée ou invalide. Relancez l’activité depuis votre plateforme.', 401)
  const target = jar.get(`lti_target_${state}`)?.value

  const admin = createAdminClient()
  const { data: platform } = await admin.from('lti_platforms').select('*').eq('id', saved.platformId).maybeSingle() as { data: Platform | null }
  if (!platform?.is_active) return fail('Plateforme non autorisée.', 403)

  let claims: Record<string, unknown>
  try {
    const { payload } = await jwtVerify(idToken, createRemoteJWKSet(new URL(platform.jwks_url)), { issuer: platform.issuer, audience: platform.client_id })
    claims = payload as Record<string, unknown>
  } catch {
    return fail('Signature du jeton invalide.', 401)
  }
  if (claims.nonce !== saved.nonce) return fail('Jeton déjà utilisé.', 401)
  const deployment = String(claims[LTI.claim('deployment_id')] ?? '')
  if (platform.deployment_ids.length && !platform.deployment_ids.includes(deployment)) return fail('Déploiement non autorisé.', 403)
  if (claims[LTI.claim('message_type')] !== 'LtiResourceLinkRequest') return fail('Type de message LTI non pris en charge.')

  // Formation demandée : paramètre personnalisé « course » ou ?course= dans l'URL cible
  const custom = (claims[LTI.claim('custom')] ?? {}) as Record<string, string>
  let courseRef = custom.course ?? custom.course_slug ?? ''
  const targetUri = String(claims[LTI.claim('target_link_uri')] ?? target ?? '')
  if (!courseRef && targetUri) { try { courseRef = new URL(targetUri).searchParams.get('course') ?? '' } catch { /* ignoré */ } }
  if (!courseRef) return fail('Aucune formation indiquée (paramètre « course »).')
  const isUuid = /^[0-9a-f-]{36}$/i.test(courseRef)
  const { data: course } = await admin.from('courses').select('id').eq(isUuid ? 'id' : 'slug', courseRef).eq('is_published', true).maybeSingle()
  if (!course) return fail('Formation introuvable sur IBIG E-LEARNING.', 404)

  // Identité : l'email est indispensable pour rattacher le compte
  const email = String(claims.email ?? '').toLowerCase()
  if (!email) return fail('Votre plateforme ne transmet pas l’adresse email : activez le partage de l’email pour cet outil.')
  const name = String(claims.name ?? [claims.given_name, claims.family_name].filter(Boolean).join(' ') ?? '').trim() || email.split('@')[0]

  let { data: profile } = await admin.from('profiles').select('id').eq('email', email).maybeSingle()
  if (!profile) {
    const { data: created, error } = await admin.auth.admin.createUser({ email, email_confirm: true, user_metadata: { full_name: name, source: 'lti' } })
    if (error || !created.user) return fail('Création du compte impossible.', 500)
    profile = { id: created.user.id }
  }

  await admin.from('enrollments').upsert({
    user_id: profile.id, course_id: course.id, status: 'active', mode: 'autonome', paid_amount: 0, sponsor_org_id: platform.org_id,
  }, { onConflict: 'user_id,course_id', ignoreDuplicates: true })
  await admin.from('lti_launches').insert({ platform_id: platform.id, user_id: profile.id, course_id: course.id, lti_sub: String(claims.sub ?? '') })

  // Ouverture de session sans mot de passe (lien à usage unique vérifié côté serveur)
  const { data: link, error: linkError } = await admin.auth.admin.generateLink({ type: 'magiclink', email })
  if (linkError || !link.properties?.hashed_token) return fail('Ouverture de session impossible.', 500)
  const supabase = await createClient()
  const { error: otpError } = await supabase.auth.verifyOtp({ type: 'magiclink', token_hash: link.properties.hashed_token })
  if (otpError) return fail('Ouverture de session impossible.', 500)

  jar.delete(`lti_state_${state}`)
  jar.delete(`lti_target_${state}`)
  return NextResponse.redirect(new URL(`/apprendre/${course.id}`, req.nextUrl.origin), 303)
}
