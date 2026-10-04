import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const { sessionId } = await request.json()
  if (!sessionId) return NextResponse.json({ error: 'sessionId requis' }, { status: 400 })

  const { data: session } = await supabase
    .from('live_sessions')
    .select('id, status, max_participants, requires_enroll, course_id')
    .eq('id', sessionId)
    .single()

  if (!session) return NextResponse.json({ error: 'Session introuvable' }, { status: 404 })
  if (session.status === 'ended' || session.status === 'cancelled') {
    return NextResponse.json({ error: 'Session terminée ou annulée' }, { status: 400 })
  }

  // Vérifier l'inscription au cours si requise
  if (session.requires_enroll && session.course_id) {
    const { data: enrollment } = await supabase
      .from('enrollments')
      .select('id')
      .eq('user_id', user.id)
      .eq('course_id', session.course_id)
      .single()
    if (!enrollment) {
      return NextResponse.json({ error: 'Inscription à la formation requise' }, { status: 403 })
    }
  }

  // Vérifier le nombre de participants
  const { count } = await supabase
    .from('live_registrations')
    .select('id', { count: 'exact', head: true })
    .eq('session_id', sessionId)

  if ((count ?? 0) >= session.max_participants) {
    return NextResponse.json({ error: 'Session complète' }, { status: 400 })
  }

  const { error } = await supabase.from('live_registrations').upsert({
    session_id: sessionId,
    user_id: user.id,
    registered_at: new Date().toISOString(),
  }, { onConflict: 'session_id,user_id' })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Récupérer l'URL de la salle
  const { data: full } = await supabase
    .from('live_sessions')
    .select('room_name, join_url, platform')
    .eq('id', sessionId)
    .single()

  return NextResponse.json({ ok: true, joinUrl: full?.join_url, roomName: full?.room_name })
}
