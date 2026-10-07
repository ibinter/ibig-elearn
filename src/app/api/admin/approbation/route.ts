import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { notifyUsers } from '@/lib/notify'

export async function POST(req: NextRequest) {
  const { courseId, action, note } = await req.json()
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!['admin', 'coordinateur'].includes((profile as any)?.role ?? '')) return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })

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
  const { data: course } = await supabase.from('courses').select('instructor_id, title, slug').eq('id', courseId).single()
  if (course) {
    await notifyUsers([(course as any).instructor_id], {
      title: action === 'approve' ? 'Formation validée et mise en ligne' : 'Formation : modifications demandées',
      body: action === 'approve'
        ? `Votre formation « ${(course as any).title} » est en ligne. Les apprenants peuvent maintenant s'y inscrire.`
        : `« ${(course as any).title} » — ${note || "voir les commentaires d'IBIG EDUFORM"}`,
      link: action === 'approve' ? `/formation/${(course as any).slug}` : `/formateur/formations/${courseId}/modifier`,
    })
  }

  return NextResponse.json({ ok: true })
}
