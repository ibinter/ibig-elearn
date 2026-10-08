import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

function generateRoomName(title: string) {
  const slug = title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .slice(0, 40)
  const rand = Math.random().toString(36).slice(2, 8)
  return `ibig-${slug}-${rand}`
}

// GET : liste des sessions (à venir + en cours)
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const courseId = request.nextUrl.searchParams.get('course_id')
  const upcoming = request.nextUrl.searchParams.get('upcoming') === '1'

  let query = supabase
    .from('live_sessions')
    .select(`
      id, title, description, scheduled_at, duration_minutes, status,
      platform, room_name, join_url, recording_url, is_public,
      cover_url, tags, started_at, ended_at, max_participants,
      instructor:instructor_id(id, full_name, avatar_url),
      live_registrations(count)
    `)
    .order('scheduled_at', { ascending: true })

  if (courseId) query = query.eq('course_id', courseId)
  if (upcoming) query = query.in('status', ['scheduled', 'live'])

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

// POST : créer une session live (formateur)
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || !['formateur', 'admin'].includes(profile.role)) {
    return NextResponse.json({ error: 'Réservé aux formateurs' }, { status: 403 })
  }

  const body = await request.json()
  const {
    courseId, orgId, title, description, scheduledAt,
    durationMinutes = 60, platform = 'jitsi', joinUrl,
    maxParticipants = 100, isPublic = false, requiresEnroll = true,
    coverUrl, tags = [],
  } = body

  if (!title || !scheduledAt) {
    return NextResponse.json({ error: 'title et scheduledAt requis' }, { status: 400 })
  }
  // Un formateur ne programme une session que sur ses propres formations
  if (courseId && profile.role === 'formateur') {
    const { data: course } = await supabase.from('courses').select('instructor_id').eq('id', courseId).maybeSingle()
    if (course?.instructor_id !== user.id) return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
  }

  const roomName = generateRoomName(title)

  const { data: session, error } = await supabase.from('live_sessions').insert({
    course_id:        courseId ?? null,
    org_id:           orgId ?? null,
    instructor_id:    user.id,
    title,
    description:      description ?? null,
    scheduled_at:     scheduledAt,
    duration_minutes: durationMinutes,
    platform,
    room_name:        roomName,
    join_url:         platform === 'jitsi'
                        ? `${process.env.NEXT_PUBLIC_JITSI_DOMAIN ?? 'meet.jit.si'}/${roomName}`
                        : joinUrl ?? null,
    max_participants: maxParticipants,
    is_public:        isPublic,
    requires_enroll:  requiresEnroll,
    cover_url:        coverUrl ?? null,
    tags,
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Auto-inscrire le formateur
  await supabase.from('live_registrations').insert({
    session_id: session.id,
    user_id: user.id,
  })

  return NextResponse.json(session, { status: 201 })
}
