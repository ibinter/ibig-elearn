import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

async function requireAdmin(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: p } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!p || !['admin', 'coordinateur'].includes(p.role)) return null
  return user
}

export async function GET() {
  const supabase = await createClient()
  if (!await requireAdmin(supabase)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { data, error } = await supabase
    .from('sso_providers')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: Request) {
  const supabase = await createClient()
  if (!await requireAdmin(supabase)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json()
  const { org_name, provider_type, email_domains, client_id, client_secret,
          issuer_url, saml_metadata_url, saml_metadata_xml,
          button_label, button_logo_url, redirect_url } = body

  if (!org_name || !provider_type || !email_domains?.length) {
    return NextResponse.json({ error: 'org_name, provider_type et email_domains requis' }, { status: 400 })
  }

  const { data, error } = await supabase.from('sso_providers').insert({
    org_id: crypto.randomUUID(),
    org_name: org_name.trim(),
    provider_type,
    email_domains: email_domains.map((d: string) => d.toLowerCase().trim()),
    client_id: client_id || null,
    client_secret: client_secret || null,
    issuer_url: issuer_url || null,
    saml_metadata_url: saml_metadata_url || null,
    saml_metadata_xml: saml_metadata_xml || null,
    button_label: button_label || 'Se connecter via SSO',
    button_logo_url: button_logo_url || null,
    redirect_url: redirect_url || null,
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
