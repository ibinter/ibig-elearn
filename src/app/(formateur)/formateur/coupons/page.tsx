import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Tag, Plus } from 'lucide-react'
import CouponManager from './CouponManager'

export default async function FormateurCouponsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/connexion')

  const [{ data: coupons }, { data: courses }] = await Promise.all([
    supabase.from('coupons').select('*, course:courses(title)').eq('instructor_id', user.id).order('created_at', { ascending: false }),
    supabase.from('courses').select('id, title').eq('instructor_id', user.id).eq('is_published', true),
  ])

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2"><Tag className="w-6 h-6" /> Codes promo</h1>
          <p className="text-gray-500 mt-1">Créez des réductions pour vos formations</p>
        </div>
      </div>
      <CouponManager coupons={coupons ?? []} courses={courses ?? []} />
    </div>
  )
}
