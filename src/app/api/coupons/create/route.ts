import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!['admin', 'coordinateur'].includes(profile?.role ?? '')) return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })

  const body = await req.json()
  const code = (body.code as string)?.toUpperCase().replace(/\s/g, '')
  if (!code || !body.discount_type || !body.discount_value) {
    return NextResponse.json({ error: 'Champs obligatoires manquants' }, { status: 400 })
  }

  const { data, error } = await supabase.from('coupons').insert({
    code,
    discount_type: body.discount_type,
    discount_value: body.discount_value,
    max_uses: body.max_uses ?? null,
    min_amount: body.min_amount ?? null,
    max_discount_amount: body.max_discount_amount ?? null,
    expires_at: body.expires_at ?? null,
    one_per_user: body.one_per_user ?? false,
    description: body.description ?? null,
    course_id: body.course_id ?? null,
    created_by: user.id,
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
