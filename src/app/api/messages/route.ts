import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/messages?courseId=xxx&withUserId=yyy
export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const courseId = req.nextUrl.searchParams.get('courseId')
  const withUserId = req.nextUrl.searchParams.get('withUserId')
  if (!courseId || !withUserId) return NextResponse.json({ error: 'Paramètres manquants' }, { status: 400 })

  const { data } = await supabase
    .from('messages')
    .select('id, content, is_read, created_at, sender_id, sender:profiles!sender_id(full_name, avatar_url)')
    .eq('course_id', courseId)
    .or(`and(sender_id.eq.${user.id},recipient_id.eq.${withUserId}),and(sender_id.eq.${withUserId},recipient_id.eq.${user.id})`)
    .order('created_at', { ascending: true })

  // Marquer les messages reçus comme lus
  await supabase.from('messages')
    .update({ is_read: true })
    .eq('course_id', courseId)
    .eq('recipient_id', user.id)
    .eq('sender_id', withUserId)
    .eq('is_read', false)

  return NextResponse.json(data ?? [])
}

// POST /api/messages  { courseId, recipientId, content }
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { courseId, recipientId, content } = await req.json()
  if (!courseId || !recipientId || !content?.trim()) {
    return NextResponse.json({ error: 'Données manquantes' }, { status: 400 })
  }

  // Vérifier que l'expéditeur est inscrit au cours ou est le formateur
  const { data: course } = await supabase.from('courses').select('instructor_id').eq('id', courseId).single()
  const isInstructor = course?.instructor_id === user.id
  if (!isInstructor) {
    const { data: enroll } = await supabase.from('enrollments').select('id').eq('user_id', user.id).eq('course_id', courseId).single()
    if (!enroll) return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
  }

  const { data, error } = await supabase.from('messages').insert({
    course_id: courseId,
    sender_id: user.id,
    recipient_id: recipientId,
    content: content.trim(),
  }).select('id, content, is_read, created_at, sender_id').single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
