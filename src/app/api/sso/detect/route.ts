import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Détecte si un domaine email a un provider SSO configuré
export async function POST(req: Request) {
  const { email } = await req.json()
  if (!email || !email.includes('@')) return NextResponse.json({ provider: null })

  const domain = email.split('@')[1].toLowerCase()
  const supabase = await createClient()

  const { data } = await supabase
    .from('sso_providers')
    .select('id, provider_type, button_label, button_logo_url, org_id')
    .eq('is_active', true)
    .contains('email_domains', [domain])
    .maybeSingle()

  return NextResponse.json({ provider: data ?? null })
}
