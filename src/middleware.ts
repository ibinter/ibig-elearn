import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

// Paths that never need tenant resolution
const PUBLIC_PATHS = [
  '/_next', '/favicon', '/icons', '/manifest', '/api/auth',
  '/robots.txt', '/sitemap.xml',
]

function isPublicPath(pathname: string) {
  return PUBLIC_PATHS.some(p => pathname.startsWith(p))
}

function extractSubdomain(host: string): string | null {
  // Remove port
  const hostname = host.split(':')[0]
  // e.g. "total.ibig-elearning.com" → "total"
  // Ignore www, app, ibig-elearning.com itself, localhost, vercel preview
  const ignored = ['www', 'app', 'ibig-elearning', 'ibig-elearn', 'localhost', 'vercel']
  const parts = hostname.split('.')
  if (parts.length >= 3) {
    const sub = parts[0]
    if (!ignored.includes(sub) && sub.length > 0) return sub
  }
  // Also check for full custom domain (not a subdomain of ibig-elearning.com)
  if (!hostname.includes('ibig-elearning') && !hostname.includes('ibig-elearn')
      && !hostname.includes('localhost') && !hostname.includes('vercel')
      && !hostname.includes('.com') === false) {
    return hostname // full custom domain lookup
  }
  return null
}

export async function middleware(request: NextRequest) {
  const host = request.headers.get('host') ?? ''
  const { pathname } = request.nextUrl

  if (isPublicPath(pathname)) return NextResponse.next()

  const sub = extractSubdomain(host)

  if (!sub) {
    // Main platform — clear any stale tenant header
    const res = NextResponse.next()
    res.headers.delete('x-tenant-id')
    res.headers.delete('x-tenant-data')
    return res
  }

  // Look up tenant from Supabase (server-side, no cookie needed)
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

  const res = NextResponse.next()

  if (tenant) {
    // Pass compact tenant data to server components via header
    res.headers.set('x-tenant-id', tenant.id)
    res.headers.set('x-tenant-data', Buffer.from(JSON.stringify(tenant)).toString('base64'))
  } else {
    res.headers.delete('x-tenant-id')
    res.headers.delete('x-tenant-data')
  }

  return res
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
