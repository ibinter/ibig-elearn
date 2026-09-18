import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { discussionId } = await req.json()
  if (!discussionId) return NextResponse.json({ error: 'ID manquant' }, { status: 400 })

  // Toggle like
  const { data: existing } = await supabase
    .from('discussion_likes')
    .select('discussion_id')
    .eq('user_id', user.id)
    .eq('discussion_id', discussionId)
    .single()

  if (existing) {
    await supabase.from('discussion_likes').delete().eq('user_id', user.id).eq('discussion_id', discussionId)
    return NextResponse.json({ liked: false })
  } else {
    await supabase.from('discussion_likes').insert({ user_id: user.id, discussion_id: discussionId })
    return NextResponse.json({ liked: true })
  }
}
