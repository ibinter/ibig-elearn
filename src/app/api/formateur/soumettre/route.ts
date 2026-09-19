import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const { courseId } = await req.json()
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const { data: course } = await supabase.from('courses').select('instructor_id, title').eq('id', courseId).single()
  if (!course || (course as any).instructor_id !== user.id) return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })

  const { error } = await supabase.from('courses').update({
    approval_status: 'pending',
    submitted_at: new Date().toISOString(),
  }).eq('id', courseId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Notifier les admins
  const { data: admins } = await supabase.from('profiles').select('id').eq('role', 'admin')
  if (admins?.length) {
    await supabase.from('notifications').insert(
      admins.map((a: any) => ({
        user_id: a.id,
        type: 'course_submitted',
        title: 'Nouvelle formation à valider',
        message: `La formation "${(course as any).title}" est soumise pour approbation.`,
      }))
    )
  }

  return NextResponse.json({ ok: true })
}
