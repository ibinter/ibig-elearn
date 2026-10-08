import { NextRequest, NextResponse } from 'next/server'
import { DATASETS, PERIODS, pickColumns, runReport, toCsv } from '@/lib/reports'
import { reportAccess } from '@/lib/reports-auth'

/** Exécute un rapport : aperçu JSON (100 premières lignes) ou fichier CSV complet. */
export async function POST(req: NextRequest) {
  const b = await req.json().catch(() => ({}))
  const orgId = b.orgId ? String(b.orgId) : null
  const access = await reportAccess(orgId)
  if (!access) return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })

  const dataset = String(b.dataset ?? '')
  const def = DATASETS[dataset]
  if (!def || (def.adminOnly && orgId)) return NextResponse.json({ error: 'Rapport inconnu' }, { status: 400 })
  const period = b.period in PERIODS ? b.period : '30d'
  const rows = await runReport(access.admin, dataset, { orgId }, { period, courseId: b.courseId || null })
  const cols = pickColumns(dataset, b.columns)

  if (b.format === 'csv') {
    const name = `rapport-${dataset}-${new Date().toISOString().slice(0, 10)}.csv`
    return new NextResponse(toCsv(rows, cols), { headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': `attachment; filename="${name}"` } })
  }
  return NextResponse.json({ columns: cols, rows: rows.slice(0, 100), total: rows.length })
}
