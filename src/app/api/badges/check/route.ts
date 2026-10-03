import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Called internally when a course is completed to auto-award enrollment_count badges
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Count completed enrollments for this user
  const { count } = await supabase
    .from('enrollments')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('progress_percent', 100)

  const completed = count ?? 0

  // Get all enrollment_count badges
  const { data: badges } = await supabase
    .from('badges')
    .select('id, criteria_type, criteria_value')
    .eq('criteria_type', 'enrollment_count')
    .eq('is_active', true)

  // Get already-earned badges
  const { data: earned } = await supabase
    .from('user_badges')
    .select('badge_id')
    .eq('user_id', user.id)

  const earnedIds = new Set(earned?.map(e => e.badge_id) ?? [])
  const toAward = (badges ?? []).filter(b => {
    const needed = (b.criteria_value as any)?.count ?? 1
    return completed >= needed && !earnedIds.has(b.id)
  })

  if (toAward.length) {
    await supabase.from('user_badges').insert(
      toAward.map(b => ({ user_id: user.id, badge_id: b.id }))
    )
  }

  return NextResponse.json({ awarded: toAward.length, badges: toAward.map(b => b.id) })
}
