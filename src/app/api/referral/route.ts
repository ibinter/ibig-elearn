import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET — retourne le code de parrainage de l'utilisateur connecté
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  // Récupérer ou générer le code
  const { data: profile } = await supabase
    .from('profiles')
    .select('referral_code')
    .eq('id', user.id)
    .single()

  let code = (profile as any)?.referral_code
  if (!code) {
    // Générer un code unique basé sur l'ID
    code = user.id.split('-')[0].toUpperCase() + Math.random().toString(36).slice(2, 5).toUpperCase()
    await supabase.from('profiles').update({ referral_code: code }).eq('id', user.id)
  }

  // Comptage des filleuls
  const { count: totalRefs } = await supabase
    .from('referrals')
    .select('*', { count: 'exact', head: true })
    .eq('referrer_id', user.id)

  const { count: rewardedRefs } = await supabase
    .from('referrals')
    .select('*', { count: 'exact', head: true })
    .eq('referrer_id', user.id)
    .eq('status', 'rewarded')

  return NextResponse.json({
    code,
    referralUrl: `https://ibig-elearn.vercel.app/inscription?ref=${code}`,
    totalRefs: totalRefs ?? 0,
    rewardedRefs: rewardedRefs ?? 0,
    pointsPerReferral: 50,
  })
}
