/** URL publique canonique du site (sans slash final). Source unique pour SEO, e-mails et liens absolus. */
export const SITE_URL = (process.env.NEXT_PUBLIC_APP_URL || 'https://ibiglearn.com').replace(/\/+$/, '')

export const SITE_NAME = 'IBIG E-LEARNING'
