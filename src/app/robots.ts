import type { MetadataRoute } from 'next'

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://ibig-elearning.com'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin/', '/api/', '/apprendre/', '/tableau-de-bord/', '/mes-formations/', '/mes-certificats/', '/profil/'],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
  }
}
