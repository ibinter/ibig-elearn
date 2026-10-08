import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isCronAuthorized } from '@/lib/cron'
import { sendEmail } from '@/lib/email'
import { DATASETS, PERIODS, nextRun, pickColumns, runReport, toCsv } from '@/lib/reports'

export const maxDuration = 300

/** Tâche quotidienne : envoie les rapports programmés arrivés à échéance (CSV en pièce jointe). */
export async function GET(req: NextRequest) {
  if (!isCronAuthorized(req)) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  const admin = createAdminClient()
  const { data: due } = await admin.from('report_schedules').select('*').lte('next_run_at', new Date().toISOString()).limit(50)

  let sent = 0
  for (const s of due ?? []) {
    try {
      const rows = await runReport(admin, s.dataset, { orgId: s.org_id }, { period: s.period, courseId: s.course_id })
      const csv = toCsv(rows, pickColumns(s.dataset, s.columns))
      const { data: org } = s.org_id ? await admin.from('organizations').select('name').eq('id', s.org_id).single() : { data: null }
      const date = new Date().toISOString().slice(0, 10)
      await sendEmail({
        to: s.recipients,
        subject: `Rapport IBIG E-LEARNING — ${s.name}`,
        html: `<div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;color:#111">
          <h2 style="color:#0B3D91">${s.name}</h2>
          <p>${DATASETS[s.dataset]?.label ?? s.dataset}${org ? ` · ${org.name}` : ''} · ${PERIODS[s.period] ?? ''}</p>
          <p><strong>${rows.length}</strong> ligne(s) — le fichier est joint (ouvrable dans Excel).</p>
          <p style="color:#888;font-size:12px">Rapport ${s.frequency === 'weekly' ? 'hebdomadaire' : 'mensuel'} programmé sur IBIG E-LEARNING.</p></div>`,
        attachments: [{ filename: `${s.dataset}-${date}.csv`, content: Buffer.from(csv, 'utf8').toString('base64') }],
      })
      sent++
    } catch (e) { console.error('[cron/rapports]', s.id, e) }
    // Prochaine échéance calculée même en cas d'échec, pour ne pas renvoyer en boucle
    await admin.from('report_schedules').update({ last_run_at: new Date().toISOString(), next_run_at: nextRun(s.frequency).toISOString() }).eq('id', s.id)
  }
  return NextResponse.json({ ok: true, sent })
}
