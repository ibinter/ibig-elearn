import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { canAccessCourse, mimeFor, SCORM_BUCKET } from '@/lib/scorm'

/**
 * Sert les fichiers d'un paquet depuis le même domaine que la plateforme :
 * indispensable pour que le module accède à l'API SCORM de la fenêtre parente.
 */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ packageId: string; path: string[] }> }) {
  const { packageId, path } = await params
  const filePath = path.map(decodeURIComponent).join('/')
  if (!filePath || filePath.includes('..')) return new NextResponse('Introuvable', { status: 404 })

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new NextResponse('Connexion requise', { status: 401 })

  const admin = createAdminClient()
  const { data: pkg } = await admin.from('scorm_packages').select('course_id').eq('id', packageId).maybeSingle()
  if (!pkg || !(await canAccessCourse(admin, user.id, pkg.course_id))) return new NextResponse('Accès refusé', { status: 403 })

  const { data, error } = await admin.storage.from(SCORM_BUCKET).download(`packages/${packageId}/${filePath}`)
  if (error || !data) return new NextResponse('Introuvable', { status: 404 })

  return new NextResponse(data.stream(), {
    headers: {
      'Content-Type': mimeFor(filePath),
      'Cache-Control': 'private, max-age=3600',
      'X-Content-Type-Options': 'nosniff',
    },
  })
}
