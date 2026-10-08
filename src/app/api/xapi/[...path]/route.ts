import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { createAdminClient } from '@/lib/supabase/admin'
import { readXapiToken } from '@/lib/scorm'
import { completeLesson } from '@/lib/progress'

/**
 * LRS xAPI intégré (sous-ensemble de la spécification 1.0.3) :
 *  - /api/xapi/statements          POST · PUT · GET
 *  - /api/xapi/activities/state    GET · PUT · POST · DELETE
 *  - /api/xapi/about               GET
 * Authentification par jeton HTTP Basic propre à l'apprenant et à la leçon.
 */
const HEADERS = { 'X-Experience-API-Version': '1.0.3' }
const COMPLETING = /\/(completed|passed|mastered)$/i

const json = (data: unknown, status = 200) => NextResponse.json(data, { status, headers: HEADERS })
const empty = (status = 204) => new NextResponse(null, { status, headers: HEADERS })

async function route(req: NextRequest, path: string[]) {
  const resource = path.join('/')
  if (resource === 'about') return json({ version: ['1.0.3', '1.0.0'] })

  const auth = readXapiToken(req.headers.get('authorization'))
  if (!auth) return json({ error: 'Non autorisé' }, 401)
  const admin = createAdminClient()

  if (resource === 'statements') {
    if (req.method === 'GET') {
      const id = req.nextUrl.searchParams.get('statementId')
      if (id) {
        const { data } = await admin.from('xapi_statements').select('statement').eq('id', id).eq('user_id', auth.userId).maybeSingle()
        return data ? json(data.statement) : json({ error: 'Introuvable' }, 404)
      }
      const { data } = await admin.from('xapi_statements').select('statement')
        .eq('user_id', auth.userId).eq('lesson_id', auth.lessonId).order('stored_at', { ascending: false }).limit(100)
      return json({ statements: (data ?? []).map(d => d.statement), more: '' })
    }

    const body = await req.json().catch(() => null)
    const list = (Array.isArray(body) ? body : body ? [body] : []) as Record<string, unknown>[]
    if (!list.length || list.length > 500) return json({ error: 'Déclarations invalides' }, 400)
    const fixedId = req.method === 'PUT' ? req.nextUrl.searchParams.get('statementId') : null
    const stored = new Date().toISOString()

    const rows = list.map(s => {
      const id = String(fixedId ?? s.id ?? randomUUID())
      const verb = String((s.verb as { id?: string } | undefined)?.id ?? '')
      const activityId = String((s.object as { id?: string } | undefined)?.id ?? '')
      return { id, user_id: auth.userId, lesson_id: auth.lessonId, verb, activity_id: activityId, statement: { ...s, id, stored, authority: { objectType: 'Agent', name: 'IBIG E-LEARNING', mbox: 'mailto:lrs@ibig-elearning.com' } } }
    })
    if (rows.some(r => !r.verb)) return json({ error: 'Verbe manquant' }, 400)
    await admin.from('xapi_statements').upsert(rows, { onConflict: 'id', ignoreDuplicates: true })

    // Réussite ou achèvement de l'activité principale → leçon validée
    const done = rows.some(r => COMPLETING.test(r.verb) &&
      ((r.statement as { result?: { success?: boolean } }).result?.success !== false))
    if (done) {
      const { data: lesson } = await admin.from('lessons').select('course_id').eq('id', auth.lessonId).single()
      const { data: progress } = await admin.from('lesson_progress').select('is_completed').eq('user_id', auth.userId).eq('lesson_id', auth.lessonId).maybeSingle()
      const { data: enrolled } = lesson
        ? await admin.from('enrollments').select('id').eq('user_id', auth.userId).eq('course_id', lesson.course_id).maybeSingle()
        : { data: null }
      if (lesson && enrolled && !progress?.is_completed) await completeLesson(admin, auth.userId, lesson.course_id, auth.lessonId).catch(() => {})
    }
    return req.method === 'PUT' ? empty() : json(rows.map(r => r.id))
  }

  if (resource === 'activities/state') {
    const sp = req.nextUrl.searchParams
    const activityId = sp.get('activityId') ?? ''
    const stateId = sp.get('stateId')
    const registration = sp.get('registration') ?? ''
    if (!activityId) return json({ error: 'activityId requis' }, 400)
    const base = admin.from('xapi_state')

    if (req.method === 'GET') {
      if (!stateId) {
        const { data } = await base.select('state_id').eq('user_id', auth.userId).eq('activity_id', activityId).eq('registration', registration)
        return json((data ?? []).map(d => d.state_id))
      }
      const { data } = await base.select('content, content_type').eq('user_id', auth.userId).eq('activity_id', activityId)
        .eq('state_id', stateId).eq('registration', registration).maybeSingle()
      if (!data) return json({ error: 'Introuvable' }, 404)
      return new NextResponse(data.content, { headers: { ...HEADERS, 'Content-Type': data.content_type ?? 'application/octet-stream' } })
    }
    if (req.method === 'DELETE') {
      let q = base.delete().eq('user_id', auth.userId).eq('activity_id', activityId).eq('registration', registration)
      if (stateId) q = q.eq('state_id', stateId)
      await q
      return empty()
    }
    if (!stateId) return json({ error: 'stateId requis' }, 400)
    const content = await req.text()
    if (content.length > 1_000_000) return json({ error: 'Contenu trop volumineux' }, 413)
    await base.upsert({
      user_id: auth.userId, activity_id: activityId, state_id: stateId, registration, content,
      content_type: req.headers.get('content-type') ?? 'application/octet-stream', updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id,activity_id,state_id,registration' })
    return empty()
  }

  return json({ error: 'Ressource non prise en charge' }, 404)
}

type Ctx = { params: Promise<{ path: string[] }> }
export const GET = async (req: NextRequest, { params }: Ctx) => route(req, (await params).path)
export const POST = async (req: NextRequest, { params }: Ctx) => route(req, (await params).path)
export const PUT = async (req: NextRequest, { params }: Ctx) => route(req, (await params).path)
export const DELETE = async (req: NextRequest, { params }: Ctx) => route(req, (await params).path)
