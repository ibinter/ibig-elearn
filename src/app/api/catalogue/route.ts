import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  const supabase = createAdminClient()

  const { data: courses, error } = await supabase
    .from('courses')
    .select('slug, title, description, short_description, price_xof, price_eur')
    .eq('is_published', true)
    .order('title')

  if (error) {
    return NextResponse.json({ error: 'Erreur base de données' }, { status: 500 })
  }

  const products = (courses ?? []).map((c) => ({
    slug: c.slug,
    name: c.title,
    pricingType: 'COURSE' as const,
    price: c.price_xof ?? 0,
    rate: 15,
    siteUrl: `https://ibig-elearning.com/cours/${c.slug}`,
    description: c.short_description || c.description || c.title,
  }))

  return NextResponse.json(
    { products },
    {
      headers: {
        'Access-Control-Allow-Origin': 'https://ibigpartners.com',
        'Access-Control-Allow-Methods': 'GET',
        'Cache-Control': 'no-store',
      },
    }
  )
}
