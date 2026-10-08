import { createClient } from '@/lib/supabase/server'
import type { MetadataRoute } from 'next'
import { articles } from '@/lib/blog'
import { toIsoDate } from '@/lib/blog-format'
import { SITE_URL } from '@/lib/site'

const BASE_URL = SITE_URL


export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = await createClient()
  const { data: courses } = await supabase
    .from('courses')
    .select('slug, updated_at, instructor_id')
    .eq('is_published', true)

  const courseUrls: MetadataRoute.Sitemap = (courses ?? []).map(c => ({
    url: `${BASE_URL}/formation/${c.slug}`,
    lastModified: new Date(c.updated_at),
    changeFrequency: 'weekly',
    priority: 0.8,
  }))

  const { data: posts } = await supabase
    .from('blog_posts')
    .select('slug, published_at, updated_at')
    .eq('is_published', true)

  const blogMap = new Map<string, MetadataRoute.Sitemap[number]>()
  for (const a of articles) {
    const iso = toIsoDate(a.date)
    blogMap.set(a.slug, {
      url: `${BASE_URL}/blog/${a.slug}`,
      lastModified: iso ? new Date(iso) : undefined,
      changeFrequency: 'monthly',
      priority: 0.6,
    })
  }
  for (const p of posts ?? []) {
    blogMap.set(p.slug, {
      url: `${BASE_URL}/blog/${p.slug}`,
      lastModified: new Date(p.updated_at ?? p.published_at ?? Date.now()),
      changeFrequency: 'monthly',
      priority: 0.6,
    })
  }
  const blogUrls = [...blogMap.values()]

  // Offres de coaching, profils formateurs publics et parcours
  const [{ data: offers }, { data: paths }] = await Promise.all([
    supabase.from('coaching_offers').select('id, coach_id, updated_at').eq('is_active', true),
    supabase.from('learning_paths').select('slug, updated_at').eq('is_published', true),
  ])
  const instructorIds = new Set([...(courses ?? []).map(c => (c as { instructor_id?: string }).instructor_id), ...(offers ?? []).map(o => o.coach_id)].filter(Boolean) as string[])
  const extraUrls: MetadataRoute.Sitemap = [
    ...(offers ?? []).map(o => ({ url: `${BASE_URL}/coaching/${o.id}`, lastModified: o.updated_at ? new Date(o.updated_at) : undefined, changeFrequency: 'weekly' as const, priority: 0.6 })),
    ...(paths ?? []).map(p => ({ url: `${BASE_URL}/parcours/${p.slug}`, lastModified: p.updated_at ? new Date(p.updated_at) : undefined, changeFrequency: 'weekly' as const, priority: 0.7 })),
    ...[...instructorIds].map(id => ({ url: `${BASE_URL}/formateur/${id}`, changeFrequency: 'monthly' as const, priority: 0.5 })),
  ]

  return [
    { url: BASE_URL, changeFrequency: 'daily', priority: 1 },
    { url: `${BASE_URL}/catalogue`, changeFrequency: 'daily', priority: 0.9 },
    { url: `${BASE_URL}/parcours`, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${BASE_URL}/coaching`, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${BASE_URL}/certifications`, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE_URL}/blog`, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${BASE_URL}/entreprise`, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE_URL}/devenir-formateur`, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE_URL}/devenir-partenaire`, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE_URL}/conditions-partenaires`, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${BASE_URL}/a-propos`, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE_URL}/contact`, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE_URL}/faq`, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE_URL}/verify`, changeFrequency: 'monthly', priority: 0.4 },
    { url: `${BASE_URL}/classement`, changeFrequency: 'weekly', priority: 0.4 },
    { url: `${BASE_URL}/cgu`, changeFrequency: 'yearly', priority: 0.2 },
    { url: `${BASE_URL}/cgv`, changeFrequency: 'yearly', priority: 0.2 },
    { url: `${BASE_URL}/confidentialite`, changeFrequency: 'yearly', priority: 0.2 },
    { url: `${BASE_URL}/mentions-legales`, changeFrequency: 'yearly', priority: 0.2 },
    ...courseUrls,
    ...blogUrls,
    ...extraUrls,
  ]
}
