import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET : liste les course_id dans la wishlist de l'user
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json([], { status: 200 })

  const { data } = await supabase.from('wishlists').select('course_id').eq('user_id', user.id)
  return NextResponse.json((data ?? []).map(r => r.course_id))
}

// POST : toggle wishlist (ajoute ou supprime)
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const { course_id } = await req.json()
  if (!course_id) return NextResponse.json({ error: 'course_id manquant' }, { status: 400 })

  const { data: existing } = await supabase.from('wishlists').select('id').eq('user_id', user.id).eq('course_id', course_id).single()

  if (existing) {
    await supabase.from('wishlists').delete().eq('id', existing.id)
    return NextResponse.json({ action: 'removed' })
  } else {
    await supabase.from('wishlists').insert({ user_id: user.id, course_id })
    return NextResponse.json({ action: 'added' })
  }
}
