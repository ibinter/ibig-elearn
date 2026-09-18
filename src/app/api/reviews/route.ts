import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const { course_id, rating, comment } = await req.json()
  if (!course_id || !rating) return NextResponse.json({ error: 'Champs manquants' }, { status: 400 })

  // Vérifie inscription
  const { data: enroll } = await supabase.from('enrollments').select('id').eq('user_id', user.id).eq('course_id', course_id).single()
  if (!enroll) return NextResponse.json({ error: 'Vous devez être inscrit pour laisser un avis.' }, { status: 403 })

  const { error } = await supabase.from('reviews').upsert(
    { user_id: user.id, course_id, rating, comment: comment || null, updated_at: new Date().toISOString() },
    { onConflict: 'user_id,course_id' }
  )
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
