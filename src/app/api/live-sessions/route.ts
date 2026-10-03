import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendEmail } from '@/lib/email'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { course_id, title, description, scheduled_at, duration_minutes, meeting_url, platform } = body

  const { data: session, error } = await supabase.from('live_sessions').insert({
    course_id,
    instructor_id: user.id,
    title,
    description: description || null,
    scheduled_at,
    duration_minutes,
    meeting_url,
    platform,
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Récupérer infos formation + formateur
  const [{ data: course }, { data: instructor }] = await Promise.all([
    supabase.from('courses').select('title, slug').eq('id', course_id).single(),
    supabase.from('profiles').select('full_name').eq('id', user.id).single(),
  ])

  // Notifier tous les apprenants inscrits à la formation
  const { data: enrollments } = await supabase
    .from('enrollments')
    .select('user_id, profiles:user_id(full_name, email)')
    .eq('course_id', course_id)

  if (enrollments?.length && course && session) {
    const sessionDate = new Date(scheduled_at)
    const dateStr = sessionDate.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    const timeStr = sessionDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    const platformLabel: Record<string, string> = { zoom: 'Zoom', meet: 'Google Meet', other: 'Visioconférence' }
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://ibig-elearning.com'

    await Promise.all(enrollments.map(async (e) => {
      const profile = e.profiles as any
      if (!profile?.email) return

      // Notification in-app
      await supabase.from('notifications').insert({
        user_id: e.user_id,
        type: 'live_session',
        title: `📹 Session live — ${title}`,
        body: `${instructor?.full_name ?? 'Votre formateur'} organise une session live le ${dateStr} à ${timeStr} pour "${course.title}".`,
        link: `/sessions-live`,
      })

      // Email
      await sendEmail({
        to: profile.email,
        subject: `📹 Session live planifiée — ${course.title}`,
        html: `
<!DOCTYPE html><html><head><meta charset="utf-8"/></head><body style="font-family:Arial,sans-serif;background:#f5f5f5;margin:0;padding:20px">
<div style="max-width:560px;margin:0 auto;background:white;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.08)">
  <div style="background:linear-gradient(135deg,#0B3D91,#1a5bb5);padding:28px 32px">
    <p style="color:white;font-size:22px;font-weight:bold;margin:0">📹 Session live planifiée</p>
  </div>
  <div style="padding:28px 32px">
    <p style="color:#374151;font-size:15px">Bonjour ${profile.full_name ?? ''} 👋</p>
    <p style="color:#374151;font-size:15px"><strong>${instructor?.full_name ?? 'Votre formateur'}</strong> a planifié une session live pour votre formation <strong>${course.title}</strong>.</p>
    <div style="background:#f0f4ff;border-radius:10px;padding:20px;margin:20px 0">
      <p style="margin:0 0 8px;font-size:14px;color:#374151"><strong>📌 ${title}</strong></p>
      ${description ? `<p style="margin:0 0 8px;font-size:13px;color:#6b7280">${description}</p>` : ''}
      <p style="margin:0 0 4px;font-size:14px;color:#374151">📅 ${dateStr} à ${timeStr}</p>
      <p style="margin:0;font-size:14px;color:#374151">⏱ Durée : ${duration_minutes} minutes · ${platformLabel[platform] ?? 'Visio'}</p>
    </div>
    <a href="${meeting_url}" style="display:inline-block;background:#0B3D91;color:white;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:bold;font-size:14px">Rejoindre la session →</a>
    <p style="margin-top:20px;font-size:13px;color:#6b7280">Vous pouvez aussi retrouver toutes vos sessions depuis <a href="${appUrl}/sessions-live" style="color:#0B3D91">votre espace apprenant</a>.</p>
  </div>
</div>
</body></html>`,
      })
    }))
  }

  return NextResponse.json({ success: true })
}
