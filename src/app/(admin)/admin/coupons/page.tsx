import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Tag, Plus, Users, TrendingUp } from 'lucide-react'
import CouponForm from './CouponForm'
import CouponList from './CouponList'

export default async function AdminCouponsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/connexion')
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!['admin', 'coordinateur'].includes(profile?.role ?? '')) redirect('/tableau-de-bord')

  const { data: coupons } = await supabase
    .from('coupons')
    .select('*, course:courses(title)')
    .order('created_at', { ascending: false })

  const active = coupons?.filter(c => c.is_active).length ?? 0
  const totalUses = coupons?.reduce((s, c) => s + (c.used_count ?? 0), 0) ?? 0

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2"><Tag className="w-6 h-6 text-[#0B3D91]" /> Coupons & Promotions</h1>
          <p className="text-gray-500 text-sm mt-1">Gérez vos codes de réduction</p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total coupons', value: coupons?.length ?? 0, icon: Tag, color: 'text-[#0B3D91]' },
          { label: 'Actifs', value: active, icon: TrendingUp, color: 'text-green-600' },
          { label: 'Utilisations', value: totalUses, icon: Users, color: 'text-purple-600' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs text-gray-500 mb-1">{s.label}</p>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <CouponForm />
      <CouponList coupons={coupons ?? []} />
    </div>
  )
}
