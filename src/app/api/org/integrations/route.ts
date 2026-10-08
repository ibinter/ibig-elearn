import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { newApiKey, newWebhookSecret, sign, WEBHOOK_EVENTS } from '@/lib/integrations'

/** Clés d'API et webhooks d'une organisation (propriétaire ou administrateur uniquement). */
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const b = await req.json().catch(() => ({}))
  const orgId = String(b.orgId ?? '')
  const admin = createAdminClient()
  const { data: me } = await admin.from('organization_members').select('role')
    .eq('org_id', orgId).eq('user_id', user.id).eq('is_active', true).maybeSingle()
  if (!me || !['owner', 'admin'].includes(me.role)) return NextResponse.json({ error: 'Réservé au propriétaire ou à un administrateur de l’espace' }, { status: 403 })

  switch (b.action) {
    case 'create_key': {
      const { key, prefix, hash } = newApiKey()
      const name = String(b.name ?? '').trim().slice(0, 80) || 'Intégration'
      const { error } = await admin.from('api_keys').insert({ org_id: orgId, name, key_prefix: prefix, key_hash: hash, created_by: user.id })
      if (error) return NextResponse.json({ error: 'Création impossible' }, { status: 500 })
      return NextResponse.json({ ok: true, key })   // affichée une seule fois
    }
    case 'revoke_key':
      await admin.from('api_keys').update({ revoked_at: new Date().toISOString() }).eq('id', String(b.id)).eq('org_id', orgId)
      return NextResponse.json({ ok: true })
    case 'create_webhook': {
      const url = String(b.url ?? '').trim()
      if (!/^https:\/\/[^\s]+$/.test(url)) return NextResponse.json({ error: 'L’URL doit commencer par https://' }, { status: 400 })
      const events = ((b.events ?? []) as string[]).filter(e => e in WEBHOOK_EVENTS)
      if (!events.length) return NextResponse.json({ error: 'Choisissez au moins un événement' }, { status: 400 })
      const secret = newWebhookSecret()
      const { error } = await admin.from('webhook_endpoints').insert({ org_id: orgId, url, events, secret, created_by: user.id })
      if (error) return NextResponse.json({ error: 'Création impossible' }, { status: 500 })
      return NextResponse.json({ ok: true, secret })   // affiché une seule fois
    }
    case 'delete_webhook':
      await admin.from('webhook_endpoints').delete().eq('id', String(b.id)).eq('org_id', orgId)
      return NextResponse.json({ ok: true })
    case 'test_webhook': {
      const { data: ep } = await admin.from('webhook_endpoints').select('id, url, secret').eq('id', String(b.id)).eq('org_id', orgId).maybeSingle()
      if (!ep) return NextResponse.json({ error: 'Webhook introuvable' }, { status: 404 })
      const payload = { id: 'evt_test', event: 'ping', created_at: new Date().toISOString(), data: { message: 'Test de connexion IBIG E-LEARNING' } }
      const body = JSON.stringify(payload)
      let status: number | null = null, ok = false, error: string | null = null
      try {
        const res = await fetch(ep.url, { method: 'POST', body, signal: AbortSignal.timeout(5000), headers: { 'Content-Type': 'application/json', 'X-IBIG-Event': 'ping', 'X-IBIG-Signature': sign(ep.secret, body) } })
        status = res.status; ok = res.ok
      } catch (e) { error = (e as Error).message.slice(0, 300) }
      await admin.from('webhook_deliveries').insert({ endpoint_id: ep.id, event: 'ping', payload, status_code: status, ok, error })
      return NextResponse.json({ ok, status, error })
    }
    default:
      return NextResponse.json({ error: 'Action inconnue' }, { status: 400 })
  }
}
