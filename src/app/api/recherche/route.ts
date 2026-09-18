import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q')?.trim() ?? ''
  if (q.length < 2) return NextResponse.json({ courses: [], instructors: [] })

  const supabase = await createClient()
  const search = `%${q}%`

  const [{ data: courses }, { data: instructors }] = await Promise.all([
    supabase
      .from('courses')
      .select('id, title, slug, short_description, thumbnail_url, price_xof, level, rating_avg, review_count, instructor:profiles(full_name)')
      .eq('is_published', true)
      .or(`title.ilike.${search},short_description.ilike.${search},description.ilike.${search}`)
      .limit(12),
    supabase
      .from('profiles')
      .select('id, full_name, bio, avatar_url, country')
      .eq('role', 'formateur')
      .ilike('full_name', search)
      .limit(6),
  ])

  return NextResponse.json({ courses: courses ?? [], instructors: instructors ?? [] })
}
