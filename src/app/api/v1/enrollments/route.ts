import { NextRequest, NextResponse } from 'next/server'
import { apiAuth, emitOrgEvent } from '@/lib/integrations'
import { addMember, seatsUsed } from '@/lib/org'

/** GET /api/v1/enrollments?since=ISO&course_id= — inscriptions financées par l'organisation et leur progression. */
export async function GET(req: NextRequest) {
  const auth = await apiAuth(req)
  if (!auth) return NextResponse.json({ error: 'Clé d’API invalide' }, { status: 401 })
  let q = auth.admin.from('enrollments')
    .select('user_id, course_id, enrolled_at, progress_percent, completed_at, due_date, status, course:courses(title), user:profiles!enrollments_user_id_fkey(email, full_name)')
    .eq('sponsor_org_id', auth.orgId).order('enrolled_at', { ascending: false })
  const since = req.nextUrl.searchParams.get('since')
  if (since && !Number.isNaN(Date.parse(since))) q = q.gte('enrolled_at', new Date(since).toISOString())
  const courseId = req.nextUrl.searchParams.get('course_id')
  if (courseId) q = q.eq('course_id', courseId)
  const { data } = await q.limit(5000)
  const today = new Date().toISOString().slice(0, 10)
  return NextResponse.json({
    data: (data ?? []).map(e => {
      const u = e.user as unknown as { email: string | null; full_name: string | null } | null
      const done = !!e.completed_at || (e.progress_percent ?? 0) >= 100
      return {
        user_id: e.user_id, email: u?.email ?? null, name: u?.full_name ?? null,
        course_id: e.course_id, course_title: (e.course as unknown as { title: string } | null)?.title ?? null,
        enrolled_at: e.enrolled_at, progress_percent: e.progress_percent ?? 0, completed_at: e.completed_at, due_date: e.due_date,
        status: done ? 'completed' : e.due_date && e.due_date < today ? 'overdue' : 'in_progress',
      }
    }),
  })
}

/**
 * POST /api/v1/enrollments { email, course_id, due_date? }
 * Inscrit un collaborateur (compte existant requis) à une formation financée par l'organisation.
 */
export async function POST(req: NextRequest) {
  const auth = await apiAuth(req)
  if (!auth) return NextResponse.json({ error: 'Clé d’API invalide' }, { status: 401 })
  const b = await req.json().catch(() => ({}))
  const email = String(b.email ?? '').trim().toLowerCase()
  const courseId = String(b.course_id ?? '')
  const dueDate = typeof b.due_date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(b.due_date) ? b.due_date : null
  if (!email || !courseId) return NextResponse.json({ error: 'email et course_id requis' }, { status: 400 })

  const { admin, orgId } = auth
  const [{ data: course }, { data: profile }, { data: org }] = await Promise.all([
    admin.from('courses').select('id, title').eq('id', courseId).eq('is_published', true).maybeSingle(),
    admin.from('profiles').select('id').eq('email', email).maybeSingle(),
    admin.from('organizations').select('max_seats').eq('id', orgId).single(),
  ])
  if (!course) return NextResponse.json({ error: 'Formation introuvable' }, { status: 404 })
  if (!profile) return NextResponse.json({ error: 'Aucun compte avec cet email : invitez d’abord le collaborateur depuis l’espace entreprise.' }, { status: 404 })

  const { data: member } = await admin.from('organization_members').select('is_active').eq('org_id', orgId).eq('user_id', profile.id).maybeSingle()
  if (!member?.is_active) {
    if ((await seatsUsed(admin, orgId)) >= (org?.max_seats ?? 0)) return NextResponse.json({ error: 'Plus aucun siège disponible' }, { status: 409 })
    await addMember(admin, orgId, profile.id, 'learner', null)
  }

  const { data: created } = await admin.from('enrollments').upsert({
    user_id: profile.id, course_id: courseId, status: 'active', mode: 'autonome', paid_amount: 0, sponsor_org_id: orgId, due_date: dueDate,
  }, { onConflict: 'user_id,course_id', ignoreDuplicates: true }).select('enrolled_at')
  const isNew = (created?.length ?? 0) > 0
  if (isNew) await emitOrgEvent(orgId, 'enrollment.created', { user_id: profile.id, email, course_id: courseId, course_title: course.title, due_date: dueDate, enrolled_at: created![0].enrolled_at })
  else if (dueDate) await admin.from('enrollments').update({ due_date: dueDate }).eq('user_id', profile.id).eq('course_id', courseId).is('completed_at', null)

  return NextResponse.json({ ok: true, created: isNew }, { status: isNew ? 201 : 200 })
}
