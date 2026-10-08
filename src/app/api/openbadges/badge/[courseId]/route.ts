import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { SITE_URL } from '@/lib/site'
import { OB_CONTEXT, OB_HEADERS, badgeUrl, issuerUrl } from '@/lib/openbadges'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ courseId: string }> }) {
  const { courseId } = await params
  const { data: c } = await createAdminClient().from('courses')
    .select('id, title, slug, short_description, thumbnail_url, duration_hours, tags').eq('id', courseId).maybeSingle()
  if (!c) return NextResponse.json({ error: 'Introuvable' }, { status: 404 })

  return NextResponse.json({
    '@context': OB_CONTEXT,
    type: 'BadgeClass',
    id: badgeUrl(c.id),
    name: c.title,
    description: c.short_description ?? `Certificat de réussite de la formation « ${c.title} » (${c.duration_hours ?? 0} h).`,
    image: c.thumbnail_url ?? `${SITE_URL}/logo-full.webp`,
    criteria: {
      id: `${SITE_URL}/formation/${c.slug}`,
      narrative: 'Suivre l’intégralité des leçons de la formation et réussir ses évaluations sur IBIG E-LEARNING.',
    },
    issuer: issuerUrl(),
    tags: Array.isArray(c.tags) ? c.tags.slice(0, 10) : [],
  }, { headers: OB_HEADERS })
}
