import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { notifyStaff } from '@/lib/notify'

/** Soumission d'une formation à la validation IBIG EDUFORM (formateurs partenaires uniquement). */
export async function POST(req: NextRequest) {
  const { courseId } = await req.json()
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const [{ data: course }, { data: profile }] = await Promise.all([
    supabase.from('courses').select('instructor_id, title, approval_status, is_published').eq('id', courseId).single(),
    supabase.from('profiles').select('full_name, role, is_partner').eq('id', user.id).single(),
  ])
  if (!course || course.instructor_id !== user.id) return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
  const isStaff = ['admin', 'coordinateur'].includes(profile?.role ?? '')
  if (!isStaff && !profile?.is_partner) {
    return NextResponse.json({ error: 'Signez d\'abord la convention de partenariat IBIG EDUFORM.' }, { status: 403 })
  }
  if (course.is_published) return NextResponse.json({ error: 'Cette formation est déjà en ligne.' }, { status: 409 })
  if (course.approval_status === 'pending') return NextResponse.json({ ok: true })

  // Contenu minimum avant soumission
  const { count } = await supabase.from('modules').select('id', { count: 'exact', head: true }).eq('course_id', courseId)
  if (!count) return NextResponse.json({ error: 'Ajoutez au moins un module avec des leçons avant de soumettre.' }, { status: 400 })

  const { error } = await supabase.from('courses').update({
    approval_status: 'pending',
    submitted_at: new Date().toISOString(),
  }).eq('id', courseId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await notifyStaff({
    title: 'Nouvelle formation à valider',
    body: `« ${course.title} » — soumise par ${profile?.full_name ?? 'un formateur partenaire'}.`,
    link: '/admin/approbations',
  })
  return NextResponse.json({ ok: true })
}
