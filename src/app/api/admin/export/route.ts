import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!profile || !['admin', 'coordinateur'].includes(profile.role ?? '')) {
    return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
  }

  const type = req.nextUrl.searchParams.get('type') ?? 'users'

  if (type === 'users') {
    const { data } = await supabase
      .from('profiles')
      .select('id, full_name, email, role, country, phone, level, points, streak_days, created_at')
      .order('created_at', { ascending: false })

    const headers = ['ID', 'Nom', 'Email', 'Rôle', 'Pays', 'Téléphone', 'Niveau', 'Points', 'Streak', 'Inscrit le']
    const rows = (data ?? []).map(u => [
      u.id, u.full_name ?? '', u.email ?? '', u.role ?? '', u.country ?? '',
      u.phone ?? '', u.level ?? '', u.points ?? 0, u.streak_days ?? 0,
      u.created_at ? new Date(u.created_at).toLocaleDateString('fr-FR') : '',
    ])
    return csvResponse(headers, rows, 'apprenants')
  }

  if (type === 'enrollments') {
    const { data } = await supabase
      .from('enrollments')
      .select('id, progress_percent, enrolled_at, user:profiles(full_name, email), course:courses(title)')
      .order('enrolled_at', { ascending: false })

    const headers = ['ID', 'Apprenant', 'Email', 'Formation', 'Progression (%)', 'Date inscription']
    const rows = (data ?? []).map((e: any) => [
      e.id,
      e.user?.full_name ?? '',
      e.user?.email ?? '',
      e.course?.title ?? '',
      e.progress_percent ?? 0,
      e.enrolled_at ? new Date(e.enrolled_at).toLocaleDateString('fr-FR') : '',
    ])
    return csvResponse(headers, rows, 'inscriptions')
  }

  if (type === 'certificates') {
    const { data } = await supabase
      .from('certificates')
      .select('id, certificate_number, issued_at, user:profiles(full_name, email), course:courses(title)')
      .order('issued_at', { ascending: false })

    const headers = ['Numéro', 'Apprenant', 'Email', 'Formation', 'Délivré le']
    const rows = (data ?? []).map((c: any) => [
      c.certificate_number ?? c.id,
      c.user?.full_name ?? '',
      c.user?.email ?? '',
      c.course?.title ?? '',
      c.issued_at ? new Date(c.issued_at).toLocaleDateString('fr-FR') : '',
    ])
    return csvResponse(headers, rows, 'certificats')
  }

  const dateFrom = req.nextUrl.searchParams.get('from')
  const dateTo = req.nextUrl.searchParams.get('to')

  if (type === 'payments') {
    let query = supabase
      .from('payments')
      .select('id, amount, currency, payment_method, status, created_at, user:profiles(full_name, email), course:courses(title)')
      .eq('status', 'completed')
      .order('created_at', { ascending: false })
    if (dateFrom) query = query.gte('created_at', dateFrom)
    if (dateTo) query = query.lte('created_at', dateTo + 'T23:59:59')

    const { data } = await query
    const headers = ['Référence', 'Date', 'Apprenant', 'Email', 'Formation', 'Montant HT', 'Devise', 'Moyen de paiement', 'TVA', 'Montant TTC']
    const rows = (data ?? []).map((p: any) => [
      p.id.slice(0, 8).toUpperCase(),
      p.created_at ? new Date(p.created_at).toLocaleDateString('fr-FR') : '',
      p.user?.full_name ?? '',
      p.user?.email ?? '',
      p.course?.title ?? '',
      p.amount,
      p.currency,
      p.payment_method ?? '',
      0,
      p.amount,
    ])
    return csvResponse(headers, rows, 'journal-ventes')
  }

  if (type === 'payouts') {
    let query = supabase
      .from('payout_requests')
      .select('id, amount, currency, status, created_at, processed_at, instructor:profiles(full_name, email)')
      .order('created_at', { ascending: false })
    if (dateFrom) query = query.gte('created_at', dateFrom)
    if (dateTo) query = query.lte('created_at', dateTo + 'T23:59:59')

    const { data } = await query
    const headers = ['ID', 'Formateur', 'Email', 'Montant', 'Devise', 'Statut', 'Demandé le', 'Traité le']
    const rows = (data ?? []).map((p: any) => [
      p.id.slice(0, 8).toUpperCase(),
      (p.instructor as any)?.full_name ?? '',
      (p.instructor as any)?.email ?? '',
      p.amount,
      p.currency,
      p.status,
      p.created_at ? new Date(p.created_at).toLocaleDateString('fr-FR') : '',
      p.processed_at ? new Date(p.processed_at).toLocaleDateString('fr-FR') : '',
    ])
    return csvResponse(headers, rows, 'virements-formateurs')
  }

  if (type === 'b2b') {
    let query = supabase
      .from('b2b_cohorts')
      .select('id, name, bon_de_commande_number, price_per_learner, currency, status, start_date, end_date, created_at, b2b_request:b2b_requests(company, contact_name, email), course:courses(title)')
      .order('created_at', { ascending: false })
    if (dateFrom) query = query.gte('created_at', dateFrom)
    if (dateTo) query = query.lte('created_at', dateTo + 'T23:59:59')

    const { data: cohorts } = await query

    // Count members
    const ids = cohorts?.map(c => c.id) ?? []
    const { data: members } = ids.length
      ? await supabase.from('b2b_cohort_members').select('cohort_id').in('cohort_id', ids)
      : { data: [] }
    const countMap: Record<string, number> = {}
    for (const m of members ?? []) countMap[m.cohort_id] = (countMap[m.cohort_id] ?? 0) + 1

    const headers = ['N° Bon de commande', 'Date', 'Entreprise', 'Contact', 'Email', 'Formation', 'Cohorte', 'Apprenants', 'Prix unit.', 'Devise', 'Total HT', 'Statut']
    const rows = (cohorts ?? []).map((c: any) => {
      const nb = countMap[c.id] ?? 0
      const total = (c.price_per_learner ?? 0) * nb
      return [
        c.bon_de_commande_number ?? '',
        c.created_at ? new Date(c.created_at).toLocaleDateString('fr-FR') : '',
        c.b2b_request?.company ?? '',
        c.b2b_request?.contact_name ?? '',
        c.b2b_request?.email ?? '',
        c.course?.title ?? '',
        c.name,
        nb,
        c.price_per_learner ?? 0,
        c.currency,
        total,
        c.status,
      ]
    })
    return csvResponse(headers, rows, 'cohortes-b2b')
  }

  return NextResponse.json({ error: 'Type inconnu' }, { status: 400 })
}

function csvResponse(headers: string[], rows: (string | number)[][], filename: string) {
  const escape = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`
  const csv = [
    headers.map(escape).join(','),
    ...rows.map(row => row.map(escape).join(',')),
  ].join('\r\n')

  return new NextResponse('﻿' + csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}_${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  })
}
