import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

/** Enregistrement des plateformes LTI (équipe IBIG). */
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  const { data: me } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!['admin', 'coordinateur'].includes(me?.role ?? '')) return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })

  const b = await req.json().catch(() => ({}))
  const admin = createAdminClient()
  if (b.action === 'toggle') {
    await admin.from('lti_platforms').update({ is_active: !!b.isActive }).eq('id', String(b.id))
    return NextResponse.json({ ok: true })
  }
  if (b.action === 'delete') {
    await admin.from('lti_platforms').delete().eq('id', String(b.id))
    return NextResponse.json({ ok: true })
  }

  const https = (v: unknown) => { const s = String(v ?? '').trim(); return /^https:\/\/\S+$/.test(s) ? s : null }
  const name = String(b.name ?? '').trim().slice(0, 120)
  const issuer = String(b.issuer ?? '').trim().replace(/\/$/, '')
  const clientId = String(b.clientId ?? '').trim()
  const loginUrl = https(b.authLoginUrl), jwksUrl = https(b.jwksUrl)
  if (!name || !issuer || !clientId || !loginUrl || !jwksUrl) {
    return NextResponse.json({ error: 'Nom, issuer, client ID, URL d’authentification et URL JWKS (https) sont requis.' }, { status: 400 })
  }
  const deploymentIds = String(b.deploymentIds ?? '').split(/[\s,]+/).map(s => s.trim()).filter(Boolean)
  const { error } = await admin.from('lti_platforms').insert({
    name, issuer, client_id: clientId, auth_login_url: loginUrl, jwks_url: jwksUrl, deployment_ids: deploymentIds,
    org_id: b.orgId ? String(b.orgId) : null,
  })
  if (error) return NextResponse.json({ error: error.code === '23505' ? 'Cette plateforme est déjà enregistrée.' : error.message }, { status: 400 })
  return NextResponse.json({ ok: true })
}
