import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/reviews?courseId=xxx
export async function GET(req: NextRequest) {
  const courseId = req.nextUrl.searchParams.get('courseId')
  if (!courseId) return NextResponse.json({ error: 'courseId requis' }, { status: 400 })

  const supabase = await createClient()
  const { data } = await supabase
    .from('reviews')
    .select('id, rating, comment, created_at, user:profiles(full_name, avatar_url)')
    .eq('course_id', courseId)
    .eq('is_published', true)
    .order('created_at', { ascending: false })

  return NextResponse.json(data ?? [])
}

// POST /api/reviews  { courseId, rating, comment }
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { courseId, rating, comment } = await req.json()
  if (!courseId || !rating || rating < 1 || rating > 5) {
    return NextResponse.json({ error: 'Données invalides' }, { status: 400 })
  }

  // Vérifier que l'utilisateur est inscrit
  const { data: enrollment } = await supabase
    .from('enrollments')
    .select('id')
    .eq('user_id', user.id)
    .eq('course_id', courseId)
    .single()

  if (!enrollment) return NextResponse.json({ error: 'Vous devez être inscrit pour laisser un avis' }, { status: 403 })

  const { data, error } = await supabase
    .from('reviews')
    .upsert({ user_id: user.id, course_id: courseId, rating, comment: comment?.trim() || null, updated_at: new Date().toISOString() }, { onConflict: 'user_id,course_id' })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
