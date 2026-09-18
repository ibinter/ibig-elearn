import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET — récupérer les notifications de l'utilisateur
export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ notifications: [] })

  const { data } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(20)

  return NextResponse.json({ notifications: data ?? [] })
}

// POST — marquer comme lu
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { ids } = await req.json()

  if (ids === 'all') {
    await supabase.from('notifications').update({ is_read: true }).eq('user_id', user.id)
  } else if (Array.isArray(ids)) {
    await supabase.from('notifications').update({ is_read: true }).eq('user_id', user.id).in('id', ids)
  }

  return NextResponse.json({ ok: true })
}
