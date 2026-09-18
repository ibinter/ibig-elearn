import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const { code, courseId, amount } = await req.json()
  if (!code || !amount) return NextResponse.json({ error: 'Données manquantes' }, { status: 400 })

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { data: coupon } = await supabase
    .from('coupons')
    .select('*')
    .eq('code', code.toUpperCase())
    .eq('is_active', true)
    .single()

  if (!coupon) return NextResponse.json({ error: 'Code invalide ou expiré' }, { status: 404 })

  const now = new Date()
  if (coupon.expires_at && new Date(coupon.expires_at) < now) {
    return NextResponse.json({ error: 'Ce code a expiré' }, { status: 400 })
  }
  if (coupon.max_uses !== null && coupon.used_count >= coupon.max_uses) {
    return NextResponse.json({ error: 'Ce code a atteint son nombre maximum d\'utilisations' }, { status: 400 })
  }
  if (coupon.course_id && coupon.course_id !== courseId) {
    return NextResponse.json({ error: 'Ce code n\'est pas valable pour cette formation' }, { status: 400 })
  }
  if (coupon.min_amount && amount < coupon.min_amount) {
    return NextResponse.json({ error: `Montant minimum requis : ${coupon.min_amount.toLocaleString()} FCFA` }, { status: 400 })
  }

  // Vérifier usage unique par user
  if (coupon.one_per_user) {
    const { data: prevUse } = await supabase
      .from('coupon_uses')
      .select('id')
      .eq('coupon_id', coupon.id)
      .eq('user_id', user.id)
      .single()
    if (prevUse) return NextResponse.json({ error: 'Vous avez déjà utilisé ce code' }, { status: 400 })
  }

  // Calculer la réduction
  let discount = 0
  if (coupon.discount_type === 'percent') {
    discount = Math.round(amount * coupon.discount_value / 100)
    if (coupon.max_discount_amount) discount = Math.min(discount, coupon.max_discount_amount)
  } else {
    discount = Math.min(coupon.discount_value, amount)
  }

  const finalAmount = Math.max(0, amount - discount)

  return NextResponse.json({
    valid: true,
    couponId: coupon.id,
    discountType: coupon.discount_type,
    discountValue: coupon.discount_value,
    discount,
    finalAmount,
    message: coupon.discount_type === 'percent'
      ? `-${coupon.discount_value}% appliqué`
      : `-${coupon.discount_value.toLocaleString()} FCFA appliqué`,
  })
}
