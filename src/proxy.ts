import { type NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { updateSession } from '@/lib/supabase/middleware'

const PUBLIC_PATHS = [
  '/_next', '/favicon', '/icons', '/manifest', '/api/auth',
  '/robots.txt', '/sitemap.xml',
]

function isPublicPath(pathname: string) {
  return PUBLIC_PATHS.some(p => pathname.startsWith(p))
}

function extractSubdomain(host: string): string | null {
  const hostname = host.split(':')[0]
  const ignored = ['www', 'app', 'ibig-elearning', 'ibig-elearn', 'localhost', 'vercel']
  const parts = hostname.split('.')
  if (parts.length >= 3) {
    const sub = parts[0]
    if (!ignored.includes(sub) && sub.length > 0) return sub
  }
  if (!hostname.includes('ibig-elearning') && !hostname.includes('ibig-elearn')
      && !hostname.includes('localhost') && !hostname.includes('vercel')
      && !hostname.includes('.com') === false) {
    return hostname
  }
  return null
}

export async function proxy(request: NextRequest) {
  // 1. Update Supabase session (auth cookies)
  const response = await updateSession(request)

  if (isPublicPath(request.nextUrl.pathname)) return response

  // 2. Tenant resolution for white-label
  const host = request.headers.get('host') ?? ''
  const sub = extractSubdomain(host)

  if (!sub) {
    response.headers.delete('x-tenant-id')
    response.headers.delete('x-tenant-data')
    return response
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } }
  )

  const { data: tenant } = await supabase
    .from('tenants')
    .select('id,subdomain,custom_domain,name,logo_url,primary_color,secondary_color,bg_color,text_color,hide_ibig_branding,custom_footer,is_active')
    .or(`subdomain.eq.${sub},custom_domain.eq.${host.split(':')[0]}`)
    .eq('is_active', true)
    .maybeSingle()

  if (tenant) {
    response.headers.set('x-tenant-id', tenant.id)
    response.headers.set('x-tenant-data', Buffer.from(JSON.stringify(tenant)).toString('base64'))
  } else {
    response.headers.delete('x-tenant-id')
    response.headers.delete('x-tenant-data')
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
