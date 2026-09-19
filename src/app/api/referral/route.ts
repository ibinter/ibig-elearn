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

  // Filleuls avec détails
  const { data: referrals, count: totalRefs } = await supabase
    .from('referrals')
    .select('id, status, created_at, referred:profiles!referrals_referred_id_fkey(full_name, country, created_at)', { count: 'exact' })
    .eq('referrer_id', user.id)
    .order('created_at', { ascending: false })

  const rewardedRefs = referrals?.filter(r => r.status === 'rewarded').length ?? 0

  return NextResponse.json({
    code,
    referralUrl: `https://ibig-elearn.vercel.app/inscription?ref=${code}`,
    totalRefs: totalRefs ?? 0,
    rewardedRefs,
    pointsPerReferral: 50,
    referrals: (referrals ?? []).map(r => ({
      id: r.id,
      status: r.status,
      created_at: r.created_at,
      name: (r.referred as any)?.full_name ?? 'Anonyme',
      country: (r.referred as any)?.country ?? null,
    })),
  })
}
