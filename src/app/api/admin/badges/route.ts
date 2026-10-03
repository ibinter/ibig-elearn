import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

async function checkAdmin(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  return data?.role === 'admin' ? user : null
}

export async function GET() {
  const supabase = await createClient()
  const { data: badges } = await supabase
    .from('badges')
    .select('*, user_badges(count)')
    .order('created_at')
  return NextResponse.json({ badges: badges ?? [] })
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  if (!await checkAdmin(supabase)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json()
  const { name, description, icon, color, criteria_type, criteria_value, course_id } = body

  const { data, error } = await supabase.from('badges').insert({
    name, description, icon, color, criteria_type,
    criteria_value: criteria_value ?? {},
    course_id: course_id || null,
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ badge: data })
}
