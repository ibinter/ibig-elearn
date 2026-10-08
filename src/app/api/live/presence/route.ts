import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

/** Émargement : le formateur de la session marque un participant présent ou absent. */
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const b = await req.json().catch(() => ({}))
  const sessionId = String(b.sessionId ?? '')
  const userId = String(b.userId ?? '')
  const admin = createAdminClient()
  const [{ data: session }, { data: me }] = await Promise.all([
    admin.from('live_sessions').select('instructor_id').eq('id', sessionId).maybeSingle(),
    admin.from('profiles').select('role').eq('id', user.id).single(),
  ])
  if (!session || (session.instructor_id !== user.id && !['admin', 'coordinateur'].includes(me?.role ?? ''))) {
    return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
  }

  const attended = !!b.attended
  const { data: existing } = await admin.from('live_registrations').select('id, join_time').eq('session_id', sessionId).eq('user_id', userId).maybeSingle()
  if (existing) {
    await admin.from('live_registrations').update({ attended, join_time: attended ? existing.join_time ?? new Date().toISOString() : existing.join_time }).eq('id', existing.id)
  } else {
    await admin.from('live_registrations').insert({ session_id: sessionId, user_id: userId, attended, join_time: attended ? new Date().toISOString() : null })
  }
  return NextResponse.json({ ok: true })
}
