import type { MetadataRoute } from 'next'

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://ibig-elearning.com'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin/',
          '/api/',
          '/apprendre/',
          '/tableau-de-bord/',
          '/mes-formations/',
          '/mes-certificats/',
          '/mes-factures/',
          '/mes-favoris/',
          '/mes-badges/',
          '/mes-notes/',
          '/mes-stats/',
          '/mes-parcours/',
          '/profil/',
          '/messages/',
          '/notifications/',
          '/parrainage/',
          '/fidelite/',
          '/sessions-live/',
          '/paiement/',
          '/formateur/',
          '/connexion',
          '/mot-de-passe-oublie',
        ],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
  }
}
