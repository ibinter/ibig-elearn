import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if ((profile as any)?.role !== 'formateur') return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })

  // Vérifier que le cours appartient au formateur (si spécifié)
  if (body.course_id) {
    const { data: course } = await supabase.from('courses').select('instructor_id').eq('id', body.course_id).single()
    if ((course as any)?.instructor_id !== user.id) return NextResponse.json({ error: 'Formation non autorisée' }, { status: 403 })
  }

  const { data, error } = await supabase.from('coupons').insert({
    code: body.code,
    discount_type: body.discount_type,
    discount_value: body.discount_value,
    max_uses: body.max_uses,
    expires_at: body.expires_at,
    course_id: body.course_id,
    instructor_id: user.id,
    is_active: true,
    used_count: 0,
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id')
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  await supabase.from('coupons').delete().eq('id', id).eq('instructor_id', user.id)
  return NextResponse.json({ ok: true })
}
