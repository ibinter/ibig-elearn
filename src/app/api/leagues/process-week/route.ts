import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isCronAuthorized } from '@/lib/cron'

export async function POST(req: NextRequest) {
  if (!isCronAuthorized(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = createAdminClient()

  // Semaine précédente (lundi dernier)
  const prevMonday = new Date()
  prevMonday.setDate(prevMonday.getDate() - 7 - ((prevMonday.getDay() + 6) % 7))
  const weekStart = prevMonday.toISOString().slice(0, 10)

  const { error } = await supabase.rpc('process_league_week', { p_week_start: weekStart })

  if (error) {
    console.error('process_league_week error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true, week_start: weekStart })
}

// Vercel Cron appelle les tâches en GET
export const GET = POST
