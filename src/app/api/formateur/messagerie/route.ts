import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const { courseId, subject, body } = await req.json()
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  // Vérifier que le cours appartient au formateur
  const { data: course } = await supabase.from('courses').select('instructor_id, title').eq('id', courseId).single()
  if (!course || (course as any).instructor_id !== user.id) return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })

  // Récupérer tous les apprenants inscrits
  const { data: enrollments } = await supabase
    .from('enrollments')
    .select('user_id')
    .eq('course_id', courseId)

  if (!enrollments?.length) return NextResponse.json({ error: 'Aucun apprenant inscrit' }, { status: 400 })

  // Créer les notifications pour chaque apprenant
  const notifications = enrollments.map((e: any) => ({
    user_id: e.user_id,
    type: 'instructor_message',
    title: subject,
    message: body,
    link: `/apprendre/${courseId}/intro`,
  }))

  await supabase.from('notifications').insert(notifications)

  // Enregistrer le message envoyé
  await supabase.from('bulk_messages').insert({
    instructor_id: user.id,
    course_id: courseId,
    subject,
    body,
    recipients_count: enrollments.length,
    sent_at: new Date().toISOString(),
  })

  return NextResponse.json({ ok: true, recipients: enrollments.length })
}
