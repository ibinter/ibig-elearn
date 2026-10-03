import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { searchParams } = new URL(req.url)
  const requestId = searchParams.get('request_id')

  let query = supabase
    .from('b2b_cohorts')
    .select(`*, b2b_request:b2b_requests(company, contact_name, email), course:courses(title, slug), b2b_cohort_members(count)`)
    .order('created_at', { ascending: false })

  if (requestId) query = query.eq('b2b_request_id', requestId)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ cohorts: data })
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json()
  const { b2b_request_id, course_id, name, description, price_per_learner, currency, start_date, end_date } = body

  if (!b2b_request_id || !course_id || !name) {
    return NextResponse.json({ error: 'Champs requis manquants' }, { status: 400 })
  }

  // Générer numéro de bon de commande
  const year = new Date().getFullYear()
  const { count } = await supabase.from('b2b_cohorts').select('*', { count: 'exact', head: true })
  const bcNum = `BC-${year}-${String((count ?? 0) + 1).padStart(4, '0')}`

  const { data, error } = await supabase.from('b2b_cohorts').insert({
    b2b_request_id,
    course_id,
    name,
    description: description || null,
    price_per_learner: price_per_learner || null,
    currency: currency || 'XOF',
    start_date: start_date || null,
    end_date: end_date || null,
    bon_de_commande_number: bcNum,
    status: 'draft',
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ cohort: data })
}
