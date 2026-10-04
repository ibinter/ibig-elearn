import { createClient } from '@/lib/supabase/server'
import type { MetadataRoute } from 'next'

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://ibig-elearning.com'

const BLOG_SLUGS = [
  'reconversion-professionnelle-afrique',
  'competences-numeriques-2026',
  'formation-en-ligne-vs-presentielle',
  'creer-entreprise-cote-divoire',
  'marche-immobilier-africain',
  'mobile-money-formation-afrique',
  'revolution-apprentissage-afrique-francophone',
]

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = await createClient()
  const { data: courses } = await supabase
    .from('courses')
    .select('slug, updated_at')
    .eq('is_published', true)

  const courseUrls: MetadataRoute.Sitemap = (courses ?? []).map(c => ({
    url: `${BASE_URL}/formation/${c.slug}`,
    lastModified: new Date(c.updated_at),
    changeFrequency: 'weekly',
    priority: 0.8,
  }))

  const blogUrls: MetadataRoute.Sitemap = BLOG_SLUGS.map(slug => ({
    url: `${BASE_URL}/blog/${slug}`,
    changeFrequency: 'monthly',
    priority: 0.6,
  }))

  return [
    { url: BASE_URL, changeFrequency: 'daily', priority: 1 },
    { url: `${BASE_URL}/catalogue`, changeFrequency: 'daily', priority: 0.9 },
    { url: `${BASE_URL}/parcours`, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${BASE_URL}/certifications`, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE_URL}/blog`, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${BASE_URL}/entreprise`, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE_URL}/devenir-formateur`, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE_URL}/a-propos`, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE_URL}/contact`, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE_URL}/faq`, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE_URL}/verify`, changeFrequency: 'monthly', priority: 0.4 },
    { url: `${BASE_URL}/inscription`, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE_URL}/cgu`, changeFrequency: 'yearly', priority: 0.2 },
    { url: `${BASE_URL}/cgv`, changeFrequency: 'yearly', priority: 0.2 },
    { url: `${BASE_URL}/confidentialite`, changeFrequency: 'yearly', priority: 0.2 },
    { url: `${BASE_URL}/mentions-legales`, changeFrequency: 'yearly', priority: 0.2 },
    ...courseUrls,
    ...blogUrls,
  ]
}
