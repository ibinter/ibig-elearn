import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * Recertification : le certificat expiré passe dans l'historique et la progression
 * de la formation repart de zéro ; un nouveau certificat sera délivré à la fin.
 */
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const { courseId } = await req.json().catch(() => ({}))
  if (!courseId) return NextResponse.json({ error: 'Formation manquante' }, { status: 400 })

  const admin = createAdminClient()
  const [{ data: cert }, { data: enrollment }] = await Promise.all([
    admin.from('certificates').select('id, expires_at').eq('user_id', user.id).eq('course_id', courseId).is('superseded_at', null).maybeSingle(),
    admin.from('enrollments').select('id').eq('user_id', user.id).eq('course_id', courseId).maybeSingle(),
  ])
  if (!enrollment) return NextResponse.json({ error: 'Inscription introuvable' }, { status: 404 })
  if (!cert?.expires_at) return NextResponse.json({ error: 'Ce certificat est permanent : aucune recertification nécessaire.' }, { status: 400 })

  // Ouverte 30 jours avant l'expiration
  if (new Date(cert.expires_at).getTime() - Date.now() > 30 * 86400_000) {
    return NextResponse.json({ error: 'La recertification ouvre 30 jours avant l’expiration du certificat.' }, { status: 400 })
  }

  await admin.from('certificates').update({ superseded_at: new Date().toISOString() }).eq('id', cert.id)
  await admin.from('lesson_progress').delete().eq('user_id', user.id).eq('course_id', courseId)
  await admin.from('enrollments').update({ progress_percent: 0, completed_at: null, status: 'active' }).eq('id', enrollment.id)

  return NextResponse.json({ ok: true, href: `/apprendre/${courseId}` })
}
