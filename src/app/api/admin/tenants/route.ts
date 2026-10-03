import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!profile || !['admin', 'coordinateur'].includes(profile.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { data, error } = await supabase
    .from('tenants')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!profile || !['admin', 'coordinateur'].includes(profile.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json()
  const { subdomain, name, custom_domain, logo_url, favicon_url,
          primary_color, secondary_color, bg_color, text_color,
          hide_ibig_branding, custom_footer, allowed_categories } = body

  if (!subdomain || !name) {
    return NextResponse.json({ error: 'subdomain and name are required' }, { status: 400 })
  }

  const { data, error } = await supabase.from('tenants').insert({
    subdomain: subdomain.toLowerCase().trim(),
    name, custom_domain: custom_domain || null, logo_url: logo_url || null,
    favicon_url: favicon_url || null,
    primary_color: primary_color || '#0B3D91',
    secondary_color: secondary_color || '#FFA500',
    bg_color: bg_color || '#FFFFFF',
    text_color: text_color || '#1A1A2E',
    hide_ibig_branding: !!hide_ibig_branding,
    custom_footer: custom_footer || null,
    allowed_categories: allowed_categories?.length ? allowed_categories : null,
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
