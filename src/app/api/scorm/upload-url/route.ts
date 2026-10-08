import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { canManageCourse, MAX_PACKAGE_BYTES, SCORM_BUCKET } from '@/lib/scorm'

/** URL d'envoi signée : le ZIP part directement du navigateur vers le stockage (pas de limite de taille Vercel). */
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const { courseId, size } = await req.json().catch(() => ({}))
  if (!courseId) return NextResponse.json({ error: 'Formation manquante' }, { status: 400 })
  if (Number(size) > MAX_PACKAGE_BYTES) return NextResponse.json({ error: 'Paquet trop volumineux (500 Mo maximum)' }, { status: 400 })

  const admin = createAdminClient()
  if (!(await canManageCourse(admin, user.id, courseId))) return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })

  const path = `uploads/${user.id}/${randomUUID()}.zip`
  const { data, error } = await admin.storage.from(SCORM_BUCKET).createSignedUploadUrl(path)
  if (error || !data) return NextResponse.json({ error: error?.message ?? 'Envoi impossible' }, { status: 500 })
  return NextResponse.json({ path, token: data.token, signedUrl: data.signedUrl })
}
