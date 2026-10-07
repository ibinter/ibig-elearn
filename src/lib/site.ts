/**
 * URL publique canonique du site (sans slash final).
 * Source unique pour le SEO (canonical, sitemap, robots, JSON-LD), les e-mails et les liens absolus.
 * Volontairement indépendante de NEXT_PUBLIC_APP_URL : surchargeable via NEXT_PUBLIC_SITE_URL si besoin.
 */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://ibig-elearning.com').replace(/\/+$/, '')

export const SITE_NAME = 'IBIG E-LEARNING'
