import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isCronAuthorized } from '@/lib/cron'
import { notifyUsers } from '@/lib/notify'
import { sendEmail } from '@/lib/email'
import { issueCertificate } from '@/lib/certificates'
import { SITE_URL } from '@/lib/site'

export const maxDuration = 300

type Admin = ReturnType<typeof createAdminClient>
const DAY = 86400_000
const fr = (d: string | Date) => new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })

const mail = (title: string, text: string, cta: string, href: string) => `
  <div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;color:#111">
    <h2 style="color:#0B3D91">${title}</h2><p>${text}</p>
    <p><a href="${SITE_URL}${href}" style="display:inline-block;background:#FFA500;color:#000;font-weight:700;padding:12px 24px;border-radius:10px;text-decoration:none">${cta}</a></p>
    <p style="color:#888;font-size:12px">IBIG E-LEARNING</p></div>`

/** Réserve une relance : renvoie false si elle a déjà été envoyée (journal unique). */
async function claim(admin: Admin, userId: string, refId: string, kind: string) {
  const { data } = await admin.from('compliance_reminders')
    .upsert({ user_id: userId, ref_id: refId, kind }, { onConflict: 'user_id,ref_id,kind', ignoreDuplicates: true })
    .select('id')
  return (data?.length ?? 0) > 0
}

async function remind(admin: Admin, email: string | null, userId: string, title: string, text: string, cta: string, href: string) {
  await notifyUsers([userId], { title, body: text, link: href })
  if (email) await sendEmail({ to: email, subject: title, html: mail(title, text, cta, href) }).catch(() => {})
}

/**
 * Tâche quotidienne de conformité :
 *  1. relances d'échéance des formations obligatoires (J-7, J-1, retard) + alerte des responsables ;
 *  2. alertes d'expiration des certificats (J-30, expiré) ;
 *  3. rattrapage des certificats non délivrés (formations terminées à 100 %).
 */
export async function GET(req: NextRequest) {
  if (!isCronAuthorized(req)) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  const admin = createAdminClient()
  const now = Date.now()
  const stats = { due7: 0, due1: 0, overdue: 0, managers: 0, expiry30: 0, expired: 0, certificates: 0 }

  // ── 1. Échéances ──
  const { data: dues } = await admin.from('enrollments')
    .select('id, user_id, course_id, due_date, progress_percent, sponsor_org_id, course:courses(title), user:profiles!enrollments_user_id_fkey(full_name, email)')
    .not('due_date', 'is', null).is('completed_at', null).lt('progress_percent', 100)
    .lte('due_date', new Date(now + 7 * DAY).toISOString().slice(0, 10))

  const overdueByOrg = new Map<string, { name: string; course: string; due: string }[]>()
  for (const e of (dues ?? []) as unknown as { id: string; user_id: string; due_date: string; progress_percent: number | null; sponsor_org_id: string | null; course: { title: string } | null; user: { full_name: string | null; email: string | null } | null }[]) {
    const left = Math.ceil((new Date(e.due_date + 'T23:59:59').getTime() - now) / DAY)
    const course = e.course?.title ?? 'votre formation'
    const kind = left < 0 ? 'overdue' : left <= 1 ? 'due_1d' : 'due_7d'
    if (await claim(admin, e.user_id, e.id, kind)) {
      if (kind === 'overdue') {
        await remind(admin, e.user?.email ?? null, e.user_id, 'Formation obligatoire en retard',
          `L'échéance de « ${course} » était fixée au ${fr(e.due_date)}. Vous en êtes à ${e.progress_percent ?? 0} % : terminez-la dès que possible.`, 'Reprendre la formation', '/mes-formations')
        stats.overdue++
      } else {
        await remind(admin, e.user?.email ?? null, e.user_id, left <= 1 ? 'Échéance demain' : 'Échéance dans 7 jours',
          `La formation obligatoire « ${course} » est à terminer avant le ${fr(e.due_date)} (progression : ${e.progress_percent ?? 0} %).`, 'Continuer ma formation', '/mes-formations')
        stats[kind === 'due_1d' ? 'due1' : 'due7']++
      }
    }
    if (left < 0 && e.sponsor_org_id) {
      const list = overdueByOrg.get(e.sponsor_org_id) ?? []
      list.push({ name: e.user?.full_name ?? 'Collaborateur', course, due: e.due_date })
      overdueByOrg.set(e.sponsor_org_id, list)
    }
  }

  // Alerte hebdomadaire des responsables (une par organisation et par semaine)
  const monday = new Date(now - ((new Date(now).getUTCDay() + 6) % 7) * DAY).toISOString().slice(0, 10)
  for (const [orgId, late] of overdueByOrg) {
    const { data: org } = await admin.from('organizations').select('id, slug, name').eq('id', orgId).single()
    const { data: managers } = await admin.from('organization_members')
      .select('user_id, profile:profiles!organization_members_user_id_fkey(email)')
      .eq('org_id', orgId).eq('is_active', true).in('role', ['owner', 'admin', 'manager'])
    const refId = `${orgId}:${monday}`
    for (const m of (managers ?? []) as unknown as { user_id: string; profile: { email: string | null } | null }[]) {
      if (!(await claim(admin, m.user_id, refId, 'manager_overdue'))) continue
      const lines = late.slice(0, 15).map(l => `• ${l.name} — ${l.course} (échéance ${fr(l.due)})`).join('<br>')
      await remind(admin, m.profile?.email ?? null, m.user_id, `${late.length} formation(s) obligatoire(s) en retard`,
        `Collaborateurs de ${org?.name ?? 'votre entreprise'} en retard :<br>${lines}`, 'Voir le suivi de l’équipe', `/organisation/${org?.slug ?? ''}`)
      stats.managers++
    }
  }

  // ── 2. Expiration des certificats ──
  const { data: expiring } = await admin.from('certificates')
    .select('id, user_id, course_title, expires_at, user:profiles!certificates_user_id_fkey(email)')
    .is('superseded_at', null).eq('is_revoked', false).not('expires_at', 'is', null)
    .lte('expires_at', new Date(now + 30 * DAY).toISOString())
  for (const c of (expiring ?? []) as unknown as { id: string; user_id: string; course_title: string | null; expires_at: string; user: { email: string | null } | null }[]) {
    const expired = new Date(c.expires_at).getTime() <= now
    const kind = expired ? 'expired' : 'expiry_30d'
    if (!(await claim(admin, c.user_id, c.id, kind))) continue
    await remind(admin, c.user?.email ?? null, c.user_id,
      expired ? 'Certificat expiré : recertification nécessaire' : 'Votre certificat expire bientôt',
      expired
        ? `Votre certificat « ${c.course_title ?? 'formation'} » a expiré le ${fr(c.expires_at)}. Suivez la recertification pour le renouveler.`
        : `Votre certificat « ${c.course_title ?? 'formation'} » expire le ${fr(c.expires_at)}. Pensez à le renouveler.`,
      'Renouveler mon certificat', '/mes-certificats')
    stats[expired ? 'expired' : 'expiry30']++
  }

  // ── 3. Certificats non délivrés (rattrapage) ──
  const { data: finished } = await admin.from('enrollments').select('user_id, course_id').gte('progress_percent', 100).limit(500)
  for (const e of finished ?? []) {
    const { data: cert } = await admin.from('certificates').select('id').eq('user_id', e.user_id).eq('course_id', e.course_id).is('superseded_at', null).maybeSingle()
    if (cert) continue
    const r = await issueCertificate(admin, e.user_id, e.course_id).catch(() => null)
    if (r?.issued && !('alreadyExisted' in r)) stats.certificates++
  }

  return NextResponse.json({ ok: true, ...stats })
}
