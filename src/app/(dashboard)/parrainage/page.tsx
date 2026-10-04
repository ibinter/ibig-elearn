import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ReferralDashboard from './ReferralDashboard'

export default async function ParrainagePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/connexion')

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, referral_code, xp_points')
    .eq('id', user.id)
    .single()

  const { data: referrals } = await supabase
    .from('referrals')
    .select('id, status, converted_at, created_at, referred:referred_id(full_name, avatar_url, created_at)')
    .eq('referrer_id', user.id)
    .order('created_at', { ascending: false })

  const { data: rewards } = await supabase
    .from('referral_rewards')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const stats = {
    total: referrals?.length ?? 0,
    converted: referrals?.filter(r => r.status !== 'pending').length ?? 0,
    xpEarned: rewards?.filter(r => r.reward_type === 'xp').reduce((s, r) => s + r.reward_value, 0) ?? 0,
  }

  return (
    <ReferralDashboard
      profile={profile as any}
      referrals={(referrals as any) ?? []}
      stats={stats}
      appUrl={process.env.NEXT_PUBLIC_APP_URL ?? 'https://ibiglearn.com'}
    />
  )
}
