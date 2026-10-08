import { SITE_URL } from '@/lib/site'

/** Open Badges 2.0 (IMS Global / 1EdTech) — badges hébergés, vérifiables par n'importe quelle plateforme. */
export const OB_CONTEXT = 'https://w3id.org/openbadges/v2'
export const issuerUrl = () => `${SITE_URL}/api/openbadges/issuer`
export const badgeUrl = (courseId: string) => `${SITE_URL}/api/openbadges/badge/${courseId}`
export const assertionUrl = (certNumber: string) => `${SITE_URL}/api/openbadges/assertion/${certNumber}`

export const OB_HEADERS = { 'Content-Type': 'application/ld+json; charset=utf-8', 'Cache-Control': 'public, max-age=3600', 'Access-Control-Allow-Origin': '*' }

/** Lien LinkedIn « Ajouter au profil » pré-rempli (rubrique Licences et certifications). */
export function linkedInAddUrl(c: { courseTitle: string; issuedAt: string; certNumber: string }) {
  const d = new Date(c.issuedAt)
  const qs = new URLSearchParams({
    startTask: 'CERTIFICATION_NAME',
    name: c.courseTitle,
    organizationName: 'IBIG E-LEARNING',
    issueYear: String(d.getFullYear()),
    issueMonth: String(d.getMonth() + 1),
    certUrl: `${SITE_URL}/certificat/${c.certNumber}`,
    certId: c.certNumber,
  })
  return `https://www.linkedin.com/profile/add?${qs.toString()}`
}
