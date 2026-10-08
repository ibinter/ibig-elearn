import { NextRequest, NextResponse } from 'next/server'
import { createHash } from 'crypto'
import { createAdminClient } from '@/lib/supabase/admin'
import { SITE_URL } from '@/lib/site'
import { OB_CONTEXT, OB_HEADERS, assertionUrl, badgeUrl } from '@/lib/openbadges'

/** Assertion Open Badges hébergée : la preuve vérifiable qu'un apprenant a obtenu le badge. */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ number: string }> }) {
  const { number } = await params
  const admin = createAdminClient()
  const { data: cert } = await admin.from('certificates')
    .select('certificate_number, course_id, user_id, issued_at, expires_at, is_revoked, revoke_reason')
    .eq('certificate_number', number.toUpperCase()).maybeSingle()
  if (!cert) return NextResponse.json({ error: 'Introuvable' }, { status: 404 })

  // Le destinataire est identifié par l'empreinte salée de son email (la norme évite d'exposer l'adresse)
  const { data: profile } = await admin.from('profiles').select('email').eq('id', cert.user_id).single()
  const salt = cert.certificate_number.toLowerCase()
  const identity = 'sha256$' + createHash('sha256').update((profile?.email ?? '').toLowerCase() + salt).digest('hex')

  if (cert.is_revoked) {
    return NextResponse.json({ '@context': OB_CONTEXT, id: assertionUrl(cert.certificate_number), revoked: true, revocationReason: cert.revoke_reason ?? 'Révoqué' },
      { status: 410, headers: OB_HEADERS })
  }

  return NextResponse.json({
    '@context': OB_CONTEXT,
    type: 'Assertion',
    id: assertionUrl(cert.certificate_number),
    recipient: { type: 'email', hashed: true, salt, identity },
    badge: badgeUrl(cert.course_id),
    issuedOn: new Date(cert.issued_at).toISOString(),
    ...(cert.expires_at ? { expires: new Date(cert.expires_at).toISOString() } : {}),
    verification: { type: 'hosted' },
    evidence: `${SITE_URL}/certificat/${cert.certificate_number}`,
  }, { headers: OB_HEADERS })
}
