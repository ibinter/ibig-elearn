import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const { amount, method, phone, notes } = await req.json()
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('payout_balance_xof, role').eq('id', user.id).single()
  if ((profile as any)?.role !== 'formateur') return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
  if ((profile as any)?.payout_balance_xof < amount) return NextResponse.json({ error: 'Solde insuffisant' }, { status: 400 })

  const { error } = await supabase.from('payout_requests').insert({
    instructor_id: user.id, amount, method, phone, notes, status: 'pending',
  })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
