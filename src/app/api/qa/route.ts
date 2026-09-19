import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const lessonId = req.nextUrl.searchParams.get('lesson_id')
  const supabase = await createClient()
  const { data } = await supabase
    .from('lesson_qa')
    .select('*, user:profiles!lesson_qa_user_id_fkey(full_name, avatar_url), answered_by:profiles!lesson_qa_answered_by_fkey(full_name)')
    .eq('lesson_id', lessonId)
    .order('upvotes', { ascending: false })
  return NextResponse.json(data ?? [])
}

export async function POST(req: NextRequest) {
  const { lesson_id, course_id, question } = await req.json()
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  const { data, error } = await supabase.from('lesson_qa').insert({ lesson_id, course_id, user_id: user.id, question }).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function PATCH(req: NextRequest) {
  const { id, answer } = await req.json()
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  const { data, error } = await supabase.from('lesson_qa').update({ answer, answered_by: user.id, answered_at: new Date().toISOString() }).eq('id', id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
