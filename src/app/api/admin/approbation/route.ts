import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const { courseId, action, note } = await req.json()
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if ((profile as any)?.role !== 'admin') return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })

  const updates: Record<string, any> = {
    approval_status: action === 'approve' ? 'approved' : 'rejected',
    approval_note: note || null,
    approved_at: new Date().toISOString(),
    approved_by: user.id,
  }

  if (action === 'approve') {
    updates.is_published = true
  }

  const { error } = await supabase.from('courses').update(updates).eq('id', courseId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Notifier le formateur
  const { data: course } = await supabase.from('courses').select('instructor_id, title').eq('id', courseId).single()
  if (course) {
    await supabase.from('notifications').insert({
      user_id: (course as any).instructor_id,
      type: action === 'approve' ? 'course_approved' : 'course_rejected',
      title: action === 'approve' ? 'Formation approuvée !' : 'Formation refusée',
      message: action === 'approve'
        ? `Votre formation "${(course as any).title}" a été approuvée et publiée.`
        : `Votre formation "${(course as any).title}" a été refusée. Motif : ${note}`,
    })
  }

  return NextResponse.json({ ok: true })
}
