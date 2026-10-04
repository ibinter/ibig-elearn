import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const XP_VALUES: Record<string, number> = {
  lesson_completed:   10,
  quiz_passed:        20,
  module_completed:   50,
  course_completed:   100,
  assignment_passed:  30,
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const { event_type, ref_id, ref_label, xp_override } = await req.json()

  const xp = xp_override ?? XP_VALUES[event_type]
  if (!xp || xp <= 0) return NextResponse.json({ error: 'event_type invalide' }, { status: 400 })

  const { data, error } = await supabase.rpc('award_xp', {
    p_user_id:   user.id,
    p_event_type: event_type,
    p_xp:        xp,
    p_ref_id:    ref_id ?? null,
    p_ref_label: ref_label ?? null,
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
