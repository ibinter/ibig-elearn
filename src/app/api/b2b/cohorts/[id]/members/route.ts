import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendEmail } from '@/lib/email'
import { SITE_URL } from '@/lib/site'

async function requireAdmin(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  return profile?.role === 'admin' ? user : null
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: cohortId } = await params
  const supabase = await createClient()
  if (!await requireAdmin(supabase)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json()
  const { members } = body as { members: { email: string; full_name?: string }[] }

  if (!members?.length) return NextResponse.json({ error: 'Aucun membre fourni' }, { status: 400 })

  const { data: cohort } = await supabase
    .from('b2b_cohorts')
    .select('*, course:courses(title, slug), b2b_request:b2b_requests(company)')
    .eq('id', cohortId)
    .single()

  if (!cohort) return NextResponse.json({ error: 'Cohorte introuvable' }, { status: 404 })

  const results = { added: 0, skipped: 0, errors: [] as string[] }

  for (const member of members) {
    if (!member.email) continue

    // Check if user already exists
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id, full_name')
      .eq('email', member.email)
      .maybeSingle()

    const { error: insertErr } = await supabase.from('b2b_cohort_members').upsert({
      cohort_id: cohortId,
      email: member.email,
      full_name: member.full_name || existingProfile?.full_name || null,
      user_id: existingProfile?.id || null,
      status: 'invited',
    }, { onConflict: 'cohort_id,email', ignoreDuplicates: true })

    if (insertErr) {
      results.errors.push(member.email)
      continue
    }
    results.added++

    // Envoyer email d'invitation
    const course = cohort.course as any
    const b2bReq = cohort.b2b_request as any
    const appUrl = SITE_URL
    try {
      await sendEmail({
        to: member.email,
        subject: `Invitation formation — ${course?.title} · ${b2bReq?.company ?? ''}`,
        html: `
<!DOCTYPE html><html><head><meta charset="utf-8"/></head><body style="font-family:Arial,sans-serif;background:#f5f5f5;margin:0;padding:20px">
<div style="max-width:560px;margin:0 auto;background:white;border-radius:12px;overflow:hidden">
  <div style="background:linear-gradient(135deg,#0B3D91,#1a5bb5);padding:28px 32px">
    <p style="color:white;font-size:20px;font-weight:bold;margin:0">Votre invitation à la formation</p>
  </div>
  <div style="padding:28px 32px">
    <p style="color:#374151;font-size:15px">Bonjour ${member.full_name ?? member.email},</p>
    <p style="color:#374151;font-size:15px"><strong>${b2bReq?.company ?? 'Votre entreprise'}</strong> vous invite à rejoindre la formation :</p>
    <div style="background:#f0f4ff;border-radius:10px;padding:20px;margin:20px 0">
      <p style="margin:0;font-size:16px;font-weight:bold;color:#0B3D91">${course?.title ?? cohort.name}</p>
      <p style="margin:4px 0 0;font-size:13px;color:#6b7280">${cohort.name}</p>
    </div>
    <a href="${appUrl}/inscription" style="display:inline-block;background:#0B3D91;color:white;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:bold;font-size:14px">Créer mon compte et commencer →</a>
    <p style="margin-top:16px;font-size:13px;color:#6b7280">Si vous avez déjà un compte, <a href="${appUrl}/connexion" style="color:#0B3D91">connectez-vous</a>.</p>
  </div>
</div>
</body></html>`,
      })
    } catch (e) {
      console.error('[cohort member] email error:', e)
    }
  }

  return NextResponse.json({ ok: true, ...results })
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: cohortId } = await params
  const supabase = await createClient()
  if (!await requireAdmin(supabase)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { memberId } = await req.json()
  const { error } = await supabase.from('b2b_cohort_members').delete().eq('id', memberId).eq('cohort_id', cohortId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
