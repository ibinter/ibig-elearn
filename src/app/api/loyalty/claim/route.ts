import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const REWARDS = [
  { points: 500, label: 'Accès 1 cours gratuit' },
  { points: 1000, label: 'Réduction 20% sur votre prochain achat' },
  { points: 2000, label: 'Coaching individuel 30 min' },
  { points: 5000, label: 'Accès Premium 1 mois offert' },
]

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { points } = await req.json()
  const reward = REWARDS.find(r => r.points === points)
  if (!reward) return NextResponse.json({ error: 'Récompense invalide' }, { status: 400 })

  // Vérifier les points disponibles
  const { data: profile } = await supabase
    .from('profiles')
    .select('loyalty_points_total')
    .eq('id', user.id)
    .single()

  if ((profile?.loyalty_points_total ?? 0) < points) {
    return NextResponse.json({ error: 'Points insuffisants' }, { status: 400 })
  }

  // Vérifier si pas déjà réclamé récemment (même récompense dans les 30 jours)
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
  const { count: recentClaims } = await supabase
    .from('loyalty_points')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('points', -points)
    .gte('created_at', thirtyDaysAgo)

  if ((recentClaims ?? 0) > 0) {
    return NextResponse.json({ error: 'Vous avez déjà réclamé cette récompense ce mois-ci.' }, { status: 400 })
  }

  // Déduire les points
  const newTotal = (profile?.loyalty_points_total ?? 0) - points
  await supabase.from('profiles').update({ loyalty_points_total: newTotal }).eq('id', user.id)

  // Historique
  await supabase.from('loyalty_points').insert({
    user_id: user.id,
    points: -points,
    reason: `Récompense réclamée : ${reward.label}`,
  })

  // Notification
  await supabase.from('notifications').insert({
    user_id: user.id,
    type: 'promo',
    title: '🎁 Récompense réclamée !',
    message: `Votre récompense "${reward.label}" a été enregistrée. Notre équipe vous contactera sous 48h.`,
  })

  return NextResponse.json({ ok: true, newTotal, reward: reward.label })
}
