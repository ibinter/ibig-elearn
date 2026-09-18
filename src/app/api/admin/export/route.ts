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
