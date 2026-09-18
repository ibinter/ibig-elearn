import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const POINT_VALUES: Record<string, number> = {
  course_completed: 100,
  review_left: 25,
  fast_completion: 50,
  referral: 200,
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { reason, reference_id } = await req.json()
  const points = POINT_VALUES[reason]
  if (!points) return NextResponse.json({ error: 'Unknown reason' }, { status: 400 })

  // Avoid duplicate awards for same reference
  if (reference_id) {
    const { data: existing } = await supabase
      .from('loyalty_points')
      .select('id')
      .eq('user_id', user.id)
      .eq('reason', reason)
      .eq('reference_id', reference_id)
      .single()
    if (existing) return NextResponse.json({ skipped: true })
  }

  const { error } = await supabase.rpc('add_loyalty_points', {
    p_user_id: user.id,
    p_points: points,
    p_reason: reason,
    p_reference_id: reference_id ?? null,
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ awarded: points })
}
