import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Lance le flow SSO pour un provider donné
export async function POST(req: Request) {
  const { provider_id, redirect_to } = await req.json()
  if (!provider_id) return NextResponse.json({ error: 'provider_id requis' }, { status: 400 })

  const supabase = await createClient()
  const { data: provider } = await supabase
    .from('sso_providers')
    .select('provider_type, client_id, issuer_url, redirect_url')
    .eq('id', provider_id)
    .eq('is_active', true)
    .single()

  if (!provider) return NextResponse.json({ error: 'Provider introuvable' }, { status: 404 })

  const next = redirect_to ?? '/tableau-de-bord'
  const callbackUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/callback?next=${encodeURIComponent(next)}&sso_provider=${provider_id}`

  // Google / Microsoft via Supabase OAuth
  if (provider.provider_type === 'google' || provider.provider_type === 'microsoft') {
    const oauthProvider = provider.provider_type === 'microsoft' ? 'azure' : 'google'
    return NextResponse.json({ oauth_provider: oauthProvider, callback_url: callbackUrl })
  }

  // OIDC générique ou SAML — retourner les infos pour redirection côté client
  if (provider.provider_type === 'oidc' && provider.issuer_url && provider.client_id) {
    const params = new URLSearchParams({
      client_id: provider.client_id,
      redirect_uri: callbackUrl,
      response_type: 'code',
      scope: 'openid email profile',
      state: provider_id,
    })
    return NextResponse.json({ redirect_url: `${provider.issuer_url}/authorize?${params}` })
  }

  return NextResponse.json({ error: 'Type de provider non supporté' }, { status: 422 })
}
