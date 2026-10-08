import { NextRequest, NextResponse } from 'next/server'
import { apiAuth } from '@/lib/integrations'
import { SITE_URL } from '@/lib/site'

/** GET /api/v1/certificates?since=ISO — certificats obtenus via les formations financées par l'organisation. */
export async function GET(req: NextRequest) {
  const auth = await apiAuth(req)
  if (!auth) return NextResponse.json({ error: 'Clé d’API invalide' }, { status: 401 })
  const { data: enr } = await auth.admin.from('enrollments').select('user_id, course_id').eq('sponsor_org_id', auth.orgId)
  const pairs = new Set((enr ?? []).map(e => `${e.user_id}:${e.course_id}`))
  const userIds = [...new Set((enr ?? []).map(e => e.user_id))]
  if (!userIds.length) return NextResponse.json({ data: [] })

  let q = auth.admin.from('certificates')
    .select('user_id, course_id, certificate_number, issued_at, expires_at, is_revoked, superseded_at, learner_name, course_title')
    .in('user_id', userIds).order('issued_at', { ascending: false })
  const since = req.nextUrl.searchParams.get('since')
  if (since && !Number.isNaN(Date.parse(since))) q = q.gte('issued_at', new Date(since).toISOString())
  const { data } = await q
  return NextResponse.json({
    data: (data ?? []).filter(c => pairs.has(`${c.user_id}:${c.course_id}`)).map(c => ({
      ...c, status: c.is_revoked ? 'revoked' : c.superseded_at ? 'superseded' : c.expires_at && new Date(c.expires_at) < new Date() ? 'expired' : 'valid',
      verify_url: `${SITE_URL}/certificat/${c.certificate_number}`,
    })),
  })
}
