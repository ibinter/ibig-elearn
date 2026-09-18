import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { course_id, title, description, scheduled_at, duration_minutes, meeting_url, platform } = body

  const { error } = await supabase.from('live_sessions').insert({
    course_id,
    instructor_id: user.id,
    title,
    description: description || null,
    scheduled_at,
    duration_minutes,
    meeting_url,
    platform,
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
