import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import JitsiRoom from './JitsiRoom'

export default async function LiveRoomPage({ params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/connexion')

  const { data: session } = await supabase
    .from('live_sessions')
    .select(`
      id, title, description, status, platform, room_name, join_url,
      scheduled_at, duration_minutes, recording_url,
      instructor:instructor_id(id, full_name, avatar_url),
      course:course_id(id, title)
    `)
    .eq('id', sessionId)
    .single()

  if (!session) notFound()

  // Vérifier l'inscription à la session
  const { data: reg } = await supabase
    .from('live_registrations')
    .select('id, attended')
    .eq('session_id', sessionId)
    .eq('user_id', user.id)
    .single()

  if (!reg) {
    // Tenter l'auto-inscription
    const { error } = await supabase.from('live_registrations').insert({
      session_id: sessionId,
      user_id: user.id,
    })
    if (error) redirect('/sessions-live')
  }

  // Marquer comme présent
  await supabase.from('live_registrations')
    .update({ attended: true, join_time: new Date().toISOString() })
    .eq('session_id', sessionId)
    .eq('user_id', user.id)

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, avatar_url, role')
    .eq('id', user.id)
    .single()

  const isInstructor = (session.instructor as any)?.id === user.id || profile?.role === 'admin'

  return (
    <JitsiRoom
      sessionId={sessionId}
      session={session as any}
      userId={user.id}
      userName={profile?.full_name ?? 'Apprenant'}
      userAvatar={profile?.avatar_url ?? null}
      isInstructor={isInstructor}
    />
  )
}
