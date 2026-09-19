import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const { requestId, status, note } = await req.json()
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if ((profile as any)?.role !== 'admin') return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })

  const { data: req_data } = await supabase.from('payout_requests').select('instructor_id, amount').eq('id', requestId).single()
  if (!req_data) return NextResponse.json({ error: 'Demande introuvable' }, { status: 404 })

  await supabase.from('payout_requests').update({
    status, admin_note: note || null, processed_at: new Date().toISOString(), processed_by: user.id,
  }).eq('id', requestId)

  // Si payé, décrémenter le solde du formateur
  if (status === 'paid') {
    const { data: instructorProfile } = await supabase.from('profiles').select('payout_balance_xof').eq('id', (req_data as any).instructor_id).single()
    const newBalance = Math.max(0, ((instructorProfile as any)?.payout_balance_xof ?? 0) - (req_data as any).amount)
    await supabase.from('profiles').update({ payout_balance_xof: newBalance }).eq('id', (req_data as any).instructor_id)
  }

  // Notifier le formateur
  await supabase.from('notifications').insert({
    user_id: (req_data as any).instructor_id,
    type: status === 'paid' ? 'payout_paid' : 'payout_rejected',
    title: status === 'paid' ? 'Virement effectué !' : 'Demande de virement refusée',
    message: status === 'paid'
      ? `Votre virement de ${(req_data as any).amount.toLocaleString('fr-FR')} XOF a été effectué.`
      : `Votre demande de virement a été refusée. ${note ? `Motif : ${note}` : ''}`,
  })

  return NextResponse.json({ ok: true })
}
