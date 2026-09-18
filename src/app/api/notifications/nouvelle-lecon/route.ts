import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendEmail } from '@/lib/email'
import { nouvelleLeonEmail } from '@/lib/email-templates'

// Appelé par le formateur après publication d'une nouvelle leçon
// POST { lessonId, courseId }
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { lessonId, courseId } = await req.json()
  if (!lessonId || !courseId) return NextResponse.json({ error: 'Données manquantes' }, { status: 400 })

  const { data: lesson } = await supabase.from('lessons').select('title').eq('id', lessonId).single()
  const { data: course } = await supabase.from('courses').select('title, slug, instructor_id').eq('id', courseId).single()
  if (!lesson || !course) return NextResponse.json({ error: 'Introuvable' }, { status: 404 })

  // Vérifier que c'est bien le formateur de ce cours
  if (course.instructor_id !== user.id) {
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    if (!['admin', 'coordinateur'].includes(profile?.role ?? '')) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }
  }

  // Récupérer tous les apprenants inscrits
  const { data: enrollments } = await supabase
    .from('enrollments')
    .select('user:profiles(full_name, email, id)')
    .eq('course_id', courseId)
    .eq('is_active', true)

  if (!enrollments?.length) return NextResponse.json({ sent: 0 })

  let sent = 0
  for (const enr of enrollments) {
    const u = enr.user as any
    if (!u?.email) continue
    const tpl = nouvelleLeonEmail({
      name: u.full_name ?? 'Apprenant',
      courseTitle: course.title,
      lessonTitle: lesson.title,
      courseSlug: course.slug,
      lessonId,
    })
    const result = await sendEmail({ to: u.email, ...tpl })
    if (result.ok) sent++
  }

  return NextResponse.json({ sent, total: enrollments.length })
}
