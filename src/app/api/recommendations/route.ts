import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Anonymous: return top-rated courses
  if (!user) {
    const { data } = await supabase
      .from('courses')
      .select('id, title, slug, thumbnail_url, price_xof, level, rating_avg, enrollment_count, instructor:profiles(full_name), category:categories(name)')
      .eq('is_published', true)
      .order('rating_avg', { ascending: false })
      .limit(8)
    return NextResponse.json(data ?? [])
  }

  // Get user's enrolled courses and their categories
  const { data: enrollments } = await supabase
    .from('enrollments')
    .select('course_id, course:courses(category_id, level)')
    .eq('user_id', user.id)

  const enrolledIds = new Set((enrollments ?? []).map(e => e.course_id))
  const categoryCounts: Record<string, number> = {}
  const levels: Record<string, number> = {}

  for (const e of enrollments ?? []) {
    const cat = (e.course as any)?.category_id
    const lvl = (e.course as any)?.level
    if (cat) categoryCounts[cat] = (categoryCounts[cat] ?? 0) + 1
    if (lvl) levels[lvl] = (levels[lvl] ?? 0) + 1
  }

  // Preferred category (most enrolled in)
  const topCategory = Object.entries(categoryCounts).sort((a, b) => b[1] - a[1])[0]?.[0]
  // Preferred level
  const topLevel = Object.entries(levels).sort((a, b) => b[1] - a[1])[0]?.[0]

  let query = supabase
    .from('courses')
    .select('id, title, slug, thumbnail_url, price_xof, level, rating_avg, enrollment_count, instructor:profiles(full_name), category:categories(name)')
    .eq('is_published', true)
    .order('rating_avg', { ascending: false })
    .limit(12)

  const { data: candidates } = await query

  if (!candidates) return NextResponse.json([])

  // Filter out already enrolled, score by relevance
  const scored = candidates
    .filter(c => !enrolledIds.has(c.id))
    .map(c => {
      let score = (c.rating_avg ?? 0) * 10 + Math.log1p(c.enrollment_count ?? 0)
      if (topCategory && (c as any).category?.id === topCategory) score += 30
      if (topLevel && c.level === topLevel) score += 15
      return { ...c, _score: score }
    })
    .sort((a, b) => b._score - a._score)
    .slice(0, 8)
    .map(({ _score, ...c }) => c)

  // If fewer than 4 personalized, pad with top-rated
  if (scored.length < 4) {
    const fallback = candidates
      .filter(c => !enrolledIds.has(c.id) && !scored.find(s => s.id === c.id))
      .slice(0, 8 - scored.length)
    return NextResponse.json([...scored, ...fallback])
  }

  return NextResponse.json(scored)
}
