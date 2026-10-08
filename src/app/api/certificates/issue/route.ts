import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { issueCertificate } from '@/lib/certificates'

/** Bouton « Obtenir mon certificat » : même logique que la délivrance automatique. */
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { courseId } = await req.json().catch(() => ({}))
  if (!courseId) return NextResponse.json({ error: 'courseId requis' }, { status: 400 })

  const r = await issueCertificate(createAdminClient(), user.id, String(courseId))
  if (!r.issued) {
    const msg = r.reason === 'not_enrolled' ? 'Inscription introuvable' : r.reason === 'incomplete' ? 'Formation non terminée' : 'Erreur création certificat'
    return NextResponse.json({ error: msg }, { status: r.reason === 'insert_failed' ? 500 : 400 })
  }
  return NextResponse.json({ certId: r.certificateId, certificateId: r.certificateId, certificateNumber: r.certNumber })
}
