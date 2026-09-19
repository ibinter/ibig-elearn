import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { data: enrollments } = await supabase
    .from('enrollments')
    .select(`
      id, progress_percent, status, enrolled_at, completed_at,
      user:profiles(full_name, email, country),
      course:courses!inner(id, title, instructor_id)
    `)
    .eq('course.instructor_id', user.id)
    .order('enrolled_at', { ascending: false })

  const rows = (enrollments ?? []) as any[]

  const header = ['Nom', 'Email', 'Pays', 'Formation', 'Progression (%)', 'Statut', "Date d'inscription", 'Date complétion']
  const lines = rows.map(e => [
    e.user?.full_name ?? '',
    e.user?.email ?? '',
    e.user?.country ?? '',
    e.course?.title ?? '',
    e.progress_percent ?? 0,
    e.status === 'completed' ? 'Terminé' : 'En cours',
    e.enrolled_at ? new Date(e.enrolled_at).toLocaleDateString('fr-FR') : '',
    e.completed_at ? new Date(e.completed_at).toLocaleDateString('fr-FR') : '',
  ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))

  const csv = [header.join(','), ...lines].join('\r\n')
  const BOM = '﻿'

  return new NextResponse(BOM + csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="apprenants-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  })
}
