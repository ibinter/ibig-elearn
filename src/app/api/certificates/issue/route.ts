import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendEmail } from '@/lib/email'
import { felicitationsFormationEmail } from '@/lib/email-templates'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { courseId } = await req.json()
  if (!courseId) return NextResponse.json({ error: 'courseId requis' }, { status: 400 })

  // Vérifier que la formation est complète
  const { data: enrollment } = await supabase
    .from('enrollments')
    .select('progress_percent')
    .eq('user_id', user.id)
    .eq('course_id', courseId)
    .single()

  if (!enrollment || enrollment.progress_percent < 100) {
    return NextResponse.json({ error: 'Formation non terminée' }, { status: 400 })
  }

  // Vérifier si le certificat existe déjà
  const { data: existing } = await supabase
    .from('certificates')
    .select('id')
    .eq('user_id', user.id)
    .eq('course_id', courseId)
    .single()

  if (existing) return NextResponse.json({ certificateId: existing.id })

  // Créer le certificat
  const certNumber = `IBIG-${new Date().getFullYear()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`
  const { data: cert, error } = await supabase
    .from('certificates')
    .insert({ user_id: user.id, course_id: courseId, certificate_number: certNumber })
    .select()
    .single()

  if (error || !cert) return NextResponse.json({ error: 'Erreur création certificat' }, { status: 500 })

  // Email de félicitations
  try {
    const { data: profile } = await supabase.from('profiles').select('full_name, email').eq('id', user.id).single()
    const { data: course } = await supabase.from('courses').select('title').eq('id', courseId).single()
    if (profile?.email && course) {
      const tpl = felicitationsFormationEmail({
        name: profile.full_name ?? 'Apprenant',
        courseTitle: course.title,
        certId: cert.id,
      })
      await sendEmail({ to: profile.email, ...tpl })
    }
  } catch (e) { console.error('[cert] email error:', e) }

  return NextResponse.json({ certificateId: cert.id, certificateNumber: certNumber })
}
