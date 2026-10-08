import { NextRequest, NextResponse } from 'next/server'
import { DATASETS, PERIODS, nextRun } from '@/lib/reports'
import { reportAccess } from '@/lib/reports-auth'

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** Programmation d'un rapport envoyé par email (hebdomadaire ou mensuel). */
export async function POST(req: NextRequest) {
  const b = await req.json().catch(() => ({}))
  const orgId = b.orgId ? String(b.orgId) : null
  const access = await reportAccess(orgId)
  if (!access) return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
  const { admin, user } = access

  if (b.action === 'delete') {
    let q = admin.from('report_schedules').delete().eq('id', String(b.id))
    q = orgId ? q.eq('org_id', orgId) : q.is('org_id', null)
    await q
    return NextResponse.json({ ok: true })
  }

  const dataset = String(b.dataset ?? '')
  if (!DATASETS[dataset] || (DATASETS[dataset].adminOnly && orgId)) return NextResponse.json({ error: 'Rapport inconnu' }, { status: 400 })
  const frequency = b.frequency === 'monthly' ? 'monthly' : 'weekly'
  const recipients = [...new Set(String(b.recipients ?? '').split(/[\s,;]+/).map(s => s.trim().toLowerCase()).filter(s => EMAIL.test(s)))].slice(0, 20)
  if (!recipients.length) return NextResponse.json({ error: 'Indiquez au moins un destinataire.' }, { status: 400 })
  const name = String(b.name ?? '').trim().slice(0, 120) || DATASETS[dataset].label

  const { error } = await admin.from('report_schedules').insert({
    org_id: orgId, name, dataset, period: b.period in PERIODS ? b.period : (frequency === 'weekly' ? '7d' : '30d'),
    course_id: b.courseId || null, columns: Array.isArray(b.columns) ? b.columns.map(String) : [],
    frequency, recipients, next_run_at: nextRun(frequency).toISOString(), created_by: user.id,
  })
  if (error) return NextResponse.json({ error: 'Programmation impossible' }, { status: 500 })
  return NextResponse.json({ ok: true })
}
