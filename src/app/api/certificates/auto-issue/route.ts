import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendEmail, certificatEmail } from '@/lib/email'

// Appelée automatiquement quand la progression atteint 100%
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { courseId } = await req.json()
  if (!courseId) return NextResponse.json({ error: 'courseId requis' }, { status: 400 })

  // Vérifier l'inscription et la progression
  const { data: enrollment } = await supabase
    .from('enrollments')
    .select('*, course:courses(id, title, slug, total_lessons)')
    .eq('user_id', user.id)
    .eq('course_id', courseId)
    .single()

  if (!enrollment) return NextResponse.json({ error: 'Inscription introuvable' }, { status: 404 })

  // Compter les leçons complétées
  const { count: completedLessons } = await supabase
    .from('lesson_progress')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('course_id', courseId)
    .eq('is_completed', true)

  const { count: totalLessons } = await supabase
    .from('lessons')
    .select('*', { count: 'exact', head: true })
    .eq('course_id', courseId)

  const progressPct = totalLessons ? Math.round((completedLessons ?? 0) / totalLessons * 100) : 0

  // Mettre à jour la progression dans enrollments
  await supabase.from('enrollments').update({
    progress_percent: progressPct,
    status: progressPct >= 100 ? 'completed' : 'active',
    completed_at: progressPct >= 100 ? new Date().toISOString() : null,
  }).eq('user_id', user.id).eq('course_id', courseId)

  if (progressPct < 100) {
    return NextResponse.json({ issued: false, progress: progressPct })
  }

  // Vérifier si certificat déjà émis
  const { data: existing } = await supabase
    .from('certificates')
    .select('id, certificate_number')
    .eq('user_id', user.id)
    .eq('course_id', courseId)
    .single()

  if (existing) {
    return NextResponse.json({ issued: true, certificateId: existing.id, alreadyExisted: true })
  }

  // Générer numéro unique
  const certNumber = `IBIG-${new Date().getFullYear()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`

  const { data: certificate } = await supabase
    .from('certificates')
    .insert({
      user_id: user.id,
      course_id: courseId,
      certificate_number: certNumber,
      issued_at: new Date().toISOString(),
    })
    .select('id')
    .single()

  // Notification in-app
  const course = enrollment.course as any
  await supabase.from('notifications').insert({
    user_id: user.id,
    type: 'certificate',
    title: '🎓 Certificat obtenu !',
    message: `Félicitations ! Vous avez terminé "${course?.title}" et reçu votre certificat.`,
    link: `/mes-certificats/${certificate?.id}/imprimer`,
  })

  // Email certificat
  try {
    const { data: profile } = await supabase.from('profiles').select('full_name, email').eq('id', user.id).single()
    const certUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? 'https://ibig-elearn.vercel.app'}/mes-certificats/${certificate?.id}/imprimer`
    const tpl = certificatEmail({
      name: profile?.full_name ?? 'Apprenant',
      courseTitle: course?.title ?? '',
      certNumber,
      certUrl,
    })
    await sendEmail({ to: profile?.email ?? user.email ?? '', ...tpl })
  } catch { /* non bloquant */ }

  // Points de fidélité pour complétion
  try {
    await supabase.rpc('add_loyalty_points', {
      p_user_id: user.id,
      p_points: 100,
      p_reason: `Cours terminé : ${course?.title}`,
      p_reference_id: courseId,
    })
  } catch { /* non bloquant */ }

  return NextResponse.json({ issued: true, certificateId: certificate?.id, certNumber, progress: 100 })
}
