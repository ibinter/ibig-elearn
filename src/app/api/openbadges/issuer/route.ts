import { NextResponse } from 'next/server'
import { SITE_URL } from '@/lib/site'
import { OB_CONTEXT, OB_HEADERS, issuerUrl } from '@/lib/openbadges'

export function GET() {
  return NextResponse.json({
    '@context': OB_CONTEXT,
    type: 'Issuer',
    id: issuerUrl(),
    name: 'IBIG E-LEARNING — IBIG EDUFORM',
    url: SITE_URL,
    email: 'contact@ibig-elearning.com',
    description: 'Plateforme panafricaine de formation professionnelle certifiante (IBIG SARL, Abidjan).',
    image: `${SITE_URL}/logo-full.webp`,
  }, { headers: OB_HEADERS })
}
