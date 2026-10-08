import { NextRequest, NextResponse } from 'next/server'
import { apiAuth } from '@/lib/integrations'
import { SITE_URL } from '@/lib/site'

/** GET /api/v1/courses — catalogue des formations publiées. */
export async function GET(req: NextRequest) {
  const auth = await apiAuth(req)
  if (!auth) return NextResponse.json({ error: 'Clé d’API invalide' }, { status: 401 })
  const { data } = await auth.admin.from('courses')
    .select('id, slug, title, short_description, level, language, duration_hours, price_xof, certificate_validity_months, category:categories(name)')
    .eq('is_published', true).order('title')
  return NextResponse.json({
    data: (data ?? []).map(c => ({ ...c, category: (c.category as unknown as { name: string } | null)?.name ?? null, url: `${SITE_URL}/formation/${c.slug}` })),
  })
}
