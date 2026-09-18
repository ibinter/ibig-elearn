import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendEmail } from '@/lib/email'
import { rappelInactifEmail } from '@/lib/email-templates'

// Cron job — appelé par Vercel Cron ou manuellement par admin
export async function GET(req: NextRequest) {
  const secret = req.headers.get('x-cron-secret')
  if (secret !== process.env.CRON_SECRET && process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const supabase = await createClient()
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

  // Apprenants inactifs depuis 7+ jours avec une formation en cours
  const { data: inactifs } = await supabase
    .from('profiles')
    .select('id, full_name, email, last_activity_date')
    .lt('last_activity_date', sevenDaysAgo)
    .not('last_activity_date', 'is', null)
    .eq('role', 'apprenant')

  if (!inactifs?.length) return NextResponse.json({ sent: 0 })

  let sent = 0
  for (const user of inactifs) {
    if (!user.email) continue
    const days = Math.floor((Date.now() - new Date(user.last_activity_date).getTime()) / 86400000)
    const tpl = rappelInactifEmail({ name: user.full_name ?? 'Apprenant', daysSinceActivity: days })
    const result = await sendEmail({ to: user.email, ...tpl })
    if (result.ok) sent++
  }

  return NextResponse.json({ sent, total: inactifs.length })
}
