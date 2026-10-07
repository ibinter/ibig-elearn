import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { addToCohort } from '@/lib/org'
import { notifyUsers } from '@/lib/notify'

/** Crée un parcours d'équipe (formations + collaborateurs) ou y ajoute des collaborateurs. */
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const body = await request.json().catch(() => ({}))
  const orgId = String(body.orgId ?? '')
  const admin = createAdminClient()
  const { data: me } = await admin.from('organization_members').select('role')
    .eq('org_id', orgId).eq('user_id', user.id).eq('is_active', true).maybeSingle()
  if (!me || !['owner', 'admin', 'manager'].includes(me.role)) return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })

  // Seuls les collaborateurs actifs de l'organisation peuvent être ajoutés
  const requested = [...new Set(((body.memberIds ?? []) as unknown[]).map(String))]
  const { data: valid } = requested.length
    ? await admin.from('organization_members').select('user_id').eq('org_id', orgId).eq('is_active', true).in('user_id', requested)
    : { data: [] }
  const memberIds = (valid ?? []).map(v => v.user_id as string)

  let cohortId = body.cohortId ? String(body.cohortId) : null
  let title = ''
  if (cohortId) {
    const { data: c } = await admin.from('cohorts').select('id, name').eq('id', cohortId).eq('org_id', orgId).maybeSingle()
    if (!c) return NextResponse.json({ error: 'Parcours introuvable' }, { status: 404 })
    title = c.name
  } else {
    const name = String(body.name ?? '').trim().slice(0, 120)
    const courseIds = [...new Set(((body.courseIds ?? []) as unknown[]).map(String))]
    if (!name) return NextResponse.json({ error: 'Donnez un nom au parcours.' }, { status: 400 })
    const { data: courses } = courseIds.length
      ? await admin.from('courses').select('id').eq('is_published', true).in('id', courseIds)
      : { data: [] }
    if (!courses?.length) return NextResponse.json({ error: 'Choisissez au moins une formation.' }, { status: 400 })
    const endDate = body.endDate && /^\d{4}-\d{2}-\d{2}$/.test(body.endDate) ? body.endDate : null
    const { data: created, error } = await admin.from('cohorts').insert({
      org_id: orgId, name, description: body.description ? String(body.description).slice(0, 500) : null,
      course_ids: courses.map(c => c.id), start_date: new Date().toISOString().slice(0, 10), end_date: endDate, manager_id: user.id,
    }).select('id').single()
    if (error || !created) return NextResponse.json({ error: 'Création impossible' }, { status: 500 })
    cohortId = created.id
    title = name
  }

  await addToCohort(admin, orgId, cohortId!, memberIds)
  if (memberIds.length) {
    await notifyUsers(memberIds.filter(id => id !== user.id), {
      title: 'Nouvelles formations disponibles',
      body: `Votre entreprise vous a inscrit au parcours « ${title} ». Bonne formation !`,
      link: '/mes-formations',
    })
  }
  return NextResponse.json({ ok: true, cohortId })
}
