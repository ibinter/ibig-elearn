import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q')?.trim()
  if (!q || q.length < 2) return NextResponse.json({ results: [] })

  const supabase = await createClient()
  const search = `%${q}%`

  const [{ data: courses }, { data: instructors }] = await Promise.all([
    supabase
      .from('courses')
      .select('id, title, slug, category, instructor:profiles(full_name)')
      .eq('is_published', true)
      .or(`title.ilike.${search},description.ilike.${search},category.ilike.${search}`)
      .limit(5),
    supabase
      .from('profiles')
      .select('id, full_name, bio, country')
      .eq('role', 'formateur')
      .ilike('full_name', search)
      .limit(3),
  ])

  const results = [
    ...(courses ?? []).map((c: any) => ({
      id: c.id,
      type: 'course' as const,
      title: c.title,
      subtitle: c.instructor?.full_name ? `Par ${c.instructor.full_name}` : c.category,
      href: `/formation/${c.slug}`,
    })),
    ...(instructors ?? []).map((p: any) => ({
      id: p.id,
      type: 'instructor' as const,
      title: p.full_name,
      subtitle: p.country ?? undefined,
      href: `/formateur/${p.id}`,
    })),
  ]

  return NextResponse.json({ results })
}
