import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/site'

const BASE_URL = SITE_URL

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
          '/choisir-mode/',
          '/rejoindre/',
          '/connexion',
          '/mot-de-passe-oublie',
        ],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
  }
}
