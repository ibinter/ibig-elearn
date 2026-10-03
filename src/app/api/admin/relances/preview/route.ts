import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { searchParams } = new URL(req.url)
  const thresholdDays = parseInt(searchParams.get('days') ?? '14')
  const segment = searchParams.get('segment') ?? 'all'
  const courseId = searchParams.get('course_id') ?? null

  const cutoffDate = new Date(Date.now() - thresholdDays * 86400000).toISOString()

  // Get all enrollments with user + course info
  let enrollQuery = supabase
    .from('enrollments')
    .select('id, user_id, course_id, progress_percent, enrolled_at, user:profiles(full_name, email, country), course:courses(title, slug, thumbnail_url)')
    .gt('progress_percent', 0)
    .lt('progress_percent', 100)

  if (courseId) enrollQuery = enrollQuery.eq('course_id', courseId)

  const { data: enrollments } = await enrollQuery

  if (!enrollments?.length) return NextResponse.json({ users: [], total: 0 })

  // Get last activity per user+course from lesson_progress
  const userIds = [...new Set(enrollments.map(e => e.user_id))]
  const { data: lastActivities } = await supabase
    .from('lesson_progress')
    .select('user_id, course_id, updated_at')
    .in('user_id', userIds)

  // Map: user+course -> last activity date
  const activityMap: Record<string, string> = {}
  for (const lp of lastActivities ?? []) {
    const key = `${lp.user_id}:${lp.course_id}`
    if (!activityMap[key] || lp.updated_at > activityMap[key]) {
      activityMap[key] = lp.updated_at
    }
  }

  const inactive = enrollments
    .map(e => {
      const lastActive = activityMap[`${e.user_id}:${e.course_id}`] ?? e.enrolled_at
      const daysInactive = Math.floor((Date.now() - new Date(lastActive).getTime()) / 86400000)
      return { ...e, lastActive, daysInactive }
    })
    .filter(e => {
      if (e.daysInactive < thresholdDays) return false
      if (segment === 'low_progress') return e.progress_percent < 25
      if (segment === 'never_started') return e.progress_percent === 0
      if (segment === 'almost_done') return e.progress_percent >= 75
      return true
    })
    .sort((a, b) => b.daysInactive - a.daysInactive)
    .slice(0, 200)

  return NextResponse.json({
    users: inactive.map(e => ({
      user_id: e.user_id,
      email: (e.user as any)?.email ?? '',
      full_name: (e.user as any)?.full_name ?? '',
      country: (e.user as any)?.country ?? '',
      course_id: e.course_id,
      course_title: (e.course as any)?.title ?? '',
      course_slug: (e.course as any)?.slug ?? '',
      progress_percent: e.progress_percent ?? 0,
      days_inactive: e.daysInactive,
      last_active: e.lastActive,
    })),
    total: inactive.length,
  })
}
