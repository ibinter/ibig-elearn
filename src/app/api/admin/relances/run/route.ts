import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendEmail } from '@/lib/email'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://ibig-elearning.com'

function relanceEmailHtml({
  name,
  courseTitle,
  courseSlug,
  progressPercent,
  daysInactive,
}: {
  name: string
  courseTitle: string
  courseSlug: string
  progressPercent: number
  daysInactive: number
}) {
  const url = `${APP_URL}/apprendre/${courseSlug}`
  const progressBar = Math.min(100, progressPercent)

  const encouragement =
    progressPercent === 0 ? 'Vous n\'avez pas encore commencé — c\'est le moment idéal !'
    : progressPercent < 25 ? 'Vous avez fait les premiers pas, continuez sur votre lancée !'
    : progressPercent < 75 ? `Vous êtes à ${progressPercent}% — vous êtes à mi-chemin !`
    : `Vous êtes à ${progressPercent}% — le certificat est tout proche !`

  return `<!DOCTYPE html><html><head><meta charset="utf-8"/></head>
<body style="margin:0;padding:0;background:#f4f6fb;font-family:'Segoe UI',Arial,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6fb;padding:32px 16px">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(11,61,145,.08)">
  <tr>
    <td style="background:linear-gradient(135deg,#0B3D91,#1558c0);padding:32px 40px;text-align:center">
      <p style="margin:0;font-size:22px;font-weight:800;color:#fff">IBIG <span style="color:#FFA500">E-LEARN</span></p>
      <p style="margin:8px 0 0;font-size:13px;color:#a8c4f0">Votre formation vous attend</p>
    </td>
  </tr>
  <tr>
    <td style="padding:40px">
      <p style="margin:0 0 6px;font-size:22px;font-weight:700;color:#1a1a2e">Bonjour ${name} 👋</p>
      <p style="margin:0 0 24px;font-size:15px;color:#666;line-height:1.7">
        Vous n'avez pas visité <strong>${courseTitle}</strong> depuis <strong>${daysInactive} jour${daysInactive > 1 ? 's' : ''}</strong>. ${encouragement}
      </p>

      <div style="background:#f0f4ff;border-radius:12px;padding:20px 24px;margin-bottom:28px">
        <p style="margin:0 0 8px;font-size:13px;font-weight:600;color:#374151">${courseTitle}</p>
        <div style="background:#dbeafe;border-radius:999px;height:10px;overflow:hidden;margin-bottom:6px">
          <div style="background:linear-gradient(90deg,#0B3D91,#1a5fd4);height:100%;width:${progressBar}%;border-radius:999px" />
        </div>
        <p style="margin:0;font-size:12px;color:#6b7280">${progressPercent}% complété</p>
      </div>

      <table cellpadding="0" cellspacing="0" style="margin-bottom:28px">
        <tr>
          <td style="background:#0B3D91;border-radius:10px;padding:0">
            <a href="${url}" style="display:block;padding:14px 28px;font-size:15px;font-weight:700;color:#fff;text-decoration:none">
              ▶ Reprendre ma formation
            </a>
          </td>
        </tr>
      </table>

      <div style="border-top:1px solid #eef0f5;padding-top:20px;font-size:13px;color:#9ca3af">
        <p style="margin:0">Pour vous désabonner de ces rappels, contactez-nous à <a href="mailto:contact@ibig-elearning.com" style="color:#0B3D91">contact@ibig-elearning.com</a>.</p>
      </div>
    </td>
  </tr>
  <tr>
    <td style="background:#f8f9fc;padding:16px 40px;text-align:center;border-top:1px solid #eef0f5">
      <p style="margin:0;font-size:12px;color:#999">© 2026 IBIG E-LEARNING · <a href="${APP_URL}" style="color:#0B3D91;text-decoration:none">ibig-elearning.com</a></p>
    </td>
  </tr>
</table>
</td></tr>
</table>
</body></html>`
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json()
  const { users, threshold_days, segment, campaign_name, course_id } = body as {
    users: {
      user_id: string; email: string; full_name: string; course_id: string
      course_title: string; course_slug: string; progress_percent: number; days_inactive: number
    }[]
    threshold_days: number
    segment: string
    campaign_name: string
    course_id: string | null
  }

  if (!users?.length) return NextResponse.json({ error: 'Aucun destinataire' }, { status: 400 })

  // Créer la campagne
  const { data: campaign, error: campErr } = await supabase.from('relance_campaigns').insert({
    name: campaign_name ?? `Relance ${threshold_days}j — ${new Date().toLocaleDateString('fr-FR')}`,
    threshold_days,
    segment: segment ?? 'all',
    course_id: course_id ?? null,
    recipients_count: users.length,
    triggered_by: user.id,
    status: 'completed',
  }).select().single()

  if (campErr || !campaign) return NextResponse.json({ error: campErr?.message ?? 'Erreur création campagne' }, { status: 500 })

  let sent = 0
  const logs = []

  for (const u of users) {
    try {
      const encouragement = u.progress_percent >= 75
        ? `🏁 Plus que ${100 - u.progress_percent}% pour décrocher votre certificat !`
        : u.progress_percent >= 25
          ? `🚀 Vous êtes à ${u.progress_percent}%— continuez !`
          : '📚 Reprenez là où vous en étiez !'

      await sendEmail({
        to: u.email,
        subject: `${encouragement} Reprenez ${u.course_title} sur IBIG E-LEARNING`,
        html: relanceEmailHtml({
          name: u.full_name?.split(' ')[0] ?? u.email.split('@')[0],
          courseTitle: u.course_title,
          courseSlug: u.course_slug,
          progressPercent: u.progress_percent,
          daysInactive: u.days_inactive,
        }),
      })
      logs.push({ campaign_id: campaign.id, user_id: u.user_id, email: u.email, course_id: u.course_id, days_inactive: u.days_inactive, progress_percent: u.progress_percent, status: 'sent' })
      sent++
    } catch {
      logs.push({ campaign_id: campaign.id, user_id: u.user_id, email: u.email, course_id: u.course_id, days_inactive: u.days_inactive, progress_percent: u.progress_percent, status: 'failed' })
    }
  }

  // Sauvegarder les logs en batch
  if (logs.length) await supabase.from('relance_logs').insert(logs)

  // Mettre à jour sent_count
  await supabase.from('relance_campaigns').update({ sent_count: sent }).eq('id', campaign.id)

  return NextResponse.json({ ok: true, sent, total: users.length, campaign_id: campaign.id })
}
