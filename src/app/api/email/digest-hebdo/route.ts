import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isCronAuthorized } from '@/lib/cron'
import { sendEmail } from '@/lib/email'
import { SITE_URL } from '@/lib/site'

const APP_URL = SITE_URL

function digestHtml(opts: {
  firstName: string
  xpWeek: number
  lessonsWeek: number
  streakDays: number
  coursesInProgress: { title: string; progress: number; slug: string }[]
  nextRecommended?: { title: string; slug: string } | null
}): string {
  const { firstName, xpWeek, lessonsWeek, streakDays, coursesInProgress, nextRecommended } = opts
  const progressRows = coursesInProgress.slice(0, 3).map(c => `
    <tr>
      <td style="padding:8px 0;font-size:14px;color:#374151;">${c.title}</td>
      <td style="padding:8px 0;text-align:right;">
        <div style="background:#e5e7eb;border-radius:99px;height:8px;width:120px;display:inline-block;overflow:hidden;">
          <div style="background:#0B3D91;height:8px;width:${c.progress}%;"></div>
        </div>
        <span style="font-size:12px;color:#6b7280;margin-left:8px;">${c.progress}%</span>
      </td>
    </tr>`).join('')

  return `<!DOCTYPE html>
<html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:32px 16px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;max-width:600px;">

  <!-- Header -->
  <tr><td style="background:linear-gradient(135deg,#0B3D91,#1a5cbf);padding:32px 40px;text-align:center;">
    <h1 style="color:#fff;margin:0;font-size:24px;">📊 Votre bilan de la semaine</h1>
    <p style="color:#bfdbfe;margin:8px 0 0;font-size:14px;">Semaine du ${new Date(Date.now() - 7 * 86400000).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })} au ${new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
  </td></tr>

  <!-- Salut -->
  <tr><td style="padding:32px 40px 0;">
    <p style="font-size:16px;color:#111827;margin:0 0 24px;">Bonjour <strong>${firstName}</strong> 👋,</p>
    <p style="font-size:14px;color:#6b7280;margin:0 0 24px;">Voici un résumé de votre activité cette semaine sur IBIG E-LEARNING.</p>
  </td></tr>

  <!-- KPIs -->
  <tr><td style="padding:0 40px 24px;">
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td width="33%" align="center" style="background:#eff6ff;border-radius:12px;padding:16px;margin:4px;">
          <div style="font-size:28px;font-weight:bold;color:#0B3D91;">${xpWeek}</div>
          <div style="font-size:12px;color:#6b7280;margin-top:4px;">XP gagnés ⚡</div>
        </td>
        <td width="4%"></td>
        <td width="33%" align="center" style="background:#f0fdf4;border-radius:12px;padding:16px;">
          <div style="font-size:28px;font-weight:bold;color:#16a34a;">${lessonsWeek}</div>
          <div style="font-size:12px;color:#6b7280;margin-top:4px;">Leçons terminées 📚</div>
        </td>
        <td width="4%"></td>
        <td width="33%" align="center" style="background:#fff7ed;border-radius:12px;padding:16px;">
          <div style="font-size:28px;font-weight:bold;color:#ea580c;">${streakDays}j</div>
          <div style="font-size:12px;color:#6b7280;margin-top:4px;">Série en cours 🔥</div>
        </td>
      </tr>
    </table>
  </td></tr>

  ${coursesInProgress.length ? `
  <!-- Formations en cours -->
  <tr><td style="padding:0 40px 24px;">
    <h3 style="font-size:16px;color:#111827;margin:0 0 12px;">Vos formations en cours</h3>
    <table width="100%" cellpadding="0" cellspacing="0">${progressRows}</table>
  </td></tr>` : ''}

  ${nextRecommended ? `
  <!-- Recommandation -->
  <tr><td style="padding:0 40px 24px;">
    <div style="background:linear-gradient(135deg,#fff7ed,#fffbeb);border:1px solid #fed7aa;border-radius:12px;padding:20px;">
      <p style="font-size:13px;color:#9a3412;font-weight:bold;margin:0 0 8px;text-transform:uppercase;letter-spacing:.05em;">✨ Recommandé pour vous</p>
      <p style="font-size:15px;color:#111827;font-weight:600;margin:0 0 12px;">${nextRecommended.title}</p>
      <a href="${APP_URL}/formation/${nextRecommended.slug}" style="background:#FFA500;color:#000;font-weight:bold;font-size:13px;padding:10px 20px;border-radius:8px;text-decoration:none;display:inline-block;">Découvrir →</a>
    </div>
  </td></tr>` : ''}

  <!-- CTA -->
  <tr><td style="padding:0 40px 32px;text-align:center;">
    <a href="${APP_URL}/tableau-de-bord" style="background:#0B3D91;color:#fff;font-weight:bold;font-size:14px;padding:14px 32px;border-radius:12px;text-decoration:none;display:inline-block;">Reprendre mon apprentissage</a>
  </td></tr>

  <!-- Footer -->
  <tr><td style="background:#f9fafb;padding:20px 40px;text-align:center;border-top:1px solid #e5e7eb;">
    <p style="font-size:12px;color:#9ca3af;margin:0;">IBIG E-LEARNING · Plateforme panafricaine de formation</p>
    <p style="font-size:12px;color:#9ca3af;margin:4px 0 0;"><a href="${APP_URL}/profil" style="color:#9ca3af;">Se désabonner des emails</a></p>
  </td></tr>

</table>
</td></tr>
</table>
</body></html>`
}

export async function POST(req: NextRequest) {
  // Protéger avec un secret cron
  if (!isCronAuthorized(req)) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const supabase = createAdminClient()
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

  // Récupérer les utilisateurs actifs (au moins 1 leçon cette semaine OU streak > 0)
  const { data: activeUsers } = await supabase
    .from('profiles')
    .select('id, full_name, email, streak_days')
    .eq('role', 'etudiant')
    .not('email', 'is', null)

  if (!activeUsers?.length) return NextResponse.json({ sent: 0 })

  let sent = 0
  const errors: string[] = []

  for (const user of activeUsers) {
    try {
      // XP gagnés cette semaine
      const { data: xpEvents } = await supabase
        .from('xp_events')
        .select('xp_gained')
        .eq('user_id', user.id)
        .gte('created_at', weekAgo)
      const xpWeek = xpEvents?.reduce((s, e) => s + (e.xp_gained ?? 0), 0) ?? 0

      // Leçons terminées cette semaine
      const { count: lessonsWeek } = await supabase
        .from('lesson_progress')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('is_completed', true)
        .gte('completed_at', weekAgo)

      // Skip si aucune activité
      if ((xpWeek === 0) && (lessonsWeek === 0) && (user.streak_days ?? 0) === 0) continue

      // Formations en cours
      const { data: enrollments } = await supabase
        .from('enrollments')
        .select('progress_percent, course:courses(title, slug)')
        .eq('user_id', user.id)
        .gt('progress_percent', 0)
        .lt('progress_percent', 100)
        .order('last_accessed_at', { ascending: false })
        .limit(3)

      const coursesInProgress = (enrollments ?? []).map((e: any) => ({
        title: e.course?.title ?? 'Formation',
        progress: e.progress_percent ?? 0,
        slug: e.course?.slug ?? '',
      }))

      // Recommandation via RPC
      const { data: recs } = await supabase
        .rpc('get_recommended_courses', { p_user_id: user.id, p_limit: 1 })
      const nextRecommended = recs?.[0] ? { title: recs[0].title, slug: recs[0].slug } : null

      const firstName = user.full_name?.split(' ')[0] ?? 'Apprenant'

      await sendEmail({
        to: user.email!,
        subject: `📊 Votre bilan de la semaine — ${xpWeek > 0 ? `+${xpWeek} XP gagnés !` : 'Reprenez votre parcours !'}`,
        html: digestHtml({
          firstName,
          xpWeek,
          lessonsWeek: lessonsWeek ?? 0,
          streakDays: user.streak_days ?? 0,
          coursesInProgress,
          nextRecommended,
        }),
      })
      sent++
    } catch (err: any) {
      errors.push(`${user.id}: ${err.message}`)
    }
  }

  return NextResponse.json({ sent, total: activeUsers.length, errors: errors.length ? errors : undefined })
}

// Vercel Cron appelle les tâches en GET
export const GET = POST
