import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Générateur de rapports : jeux de données, colonnes et périmètre.
 * Périmètre « organisation » : uniquement les formations financées par l'entreprise et ses collaborateurs.
 */
export type Scope = { orgId: string | null }
export type Filters = { period: string; courseId?: string | null }
type Row = Record<string, string | number | null>
type Col = { key: string; label: string }

export const PERIODS: Record<string, string> = { '7d': '7 derniers jours', '30d': '30 derniers jours', '90d': '3 derniers mois', '365d': '12 derniers mois', all: 'Depuis le début' }

export const DATASETS: Record<string, { label: string; description: string; adminOnly?: boolean; columns: Col[] }> = {
  enrollments: {
    label: 'Inscriptions et progression', description: 'Qui suit quoi, où en est chacun, échéances et retards.',
    columns: [
      { key: 'learner', label: 'Apprenant' }, { key: 'email', label: 'Email' }, { key: 'course', label: 'Formation' },
      { key: 'enrolled_at', label: 'Inscrit le' }, { key: 'progress', label: 'Progression (%)' }, { key: 'completed_at', label: 'Terminé le' },
      { key: 'due_date', label: 'Échéance' }, { key: 'status', label: 'Statut' }, { key: 'organization', label: 'Entreprise' },
    ],
  },
  certificates: {
    label: 'Certificats', description: 'Certificats délivrés, validité et expirations.',
    columns: [
      { key: 'number', label: 'Numéro' }, { key: 'learner', label: 'Apprenant' }, { key: 'email', label: 'Email' }, { key: 'course', label: 'Formation' },
      { key: 'issued_at', label: 'Délivré le' }, { key: 'expires_at', label: 'Expire le' }, { key: 'status', label: 'Statut' },
    ],
  },
  quiz: {
    label: 'Résultats aux quiz', description: 'Scores, réussites et tentatives signalées.',
    columns: [
      { key: 'learner', label: 'Apprenant' }, { key: 'email', label: 'Email' }, { key: 'course', label: 'Formation' }, { key: 'quiz', label: 'Quiz' },
      { key: 'score', label: 'Score (%)' }, { key: 'passed', label: 'Réussi' }, { key: 'date', label: 'Date' }, { key: 'flagged', label: 'Signalé' },
    ],
  },
  evaluations: {
    label: 'Satisfaction (évaluations)', description: 'Évaluations à chaud, anonymisées.',
    columns: [
      { key: 'course', label: 'Formation' }, { key: 'content', label: 'Contenu /5' }, { key: 'instructor', label: 'Formateur /5' },
      { key: 'applicability', label: 'Utilité /5' }, { key: 'recommend', label: 'Recommandation /10' }, { key: 'comment', label: 'Commentaire' }, { key: 'date', label: 'Date' },
    ],
  },
  attendance: {
    label: 'Présence aux sessions live', description: 'Émargement par session.',
    columns: [
      { key: 'session', label: 'Session' }, { key: 'date', label: 'Date' }, { key: 'course', label: 'Formation' },
      { key: 'learner', label: 'Apprenant' }, { key: 'email', label: 'Email' }, { key: 'present', label: 'Présent' },
    ],
  },
  payments: {
    label: 'Paiements', description: 'Ventes confirmées et en attente.', adminOnly: true,
    columns: [
      { key: 'date', label: 'Date' }, { key: 'learner', label: 'Client' }, { key: 'email', label: 'Email' }, { key: 'item', label: 'Formation / séance' },
      { key: 'amount', label: 'Montant' }, { key: 'currency', label: 'Devise' }, { key: 'status', label: 'Statut' }, { key: 'provider', label: 'Moyen de paiement' },
    ],
  },
}

const d = (v: string | null | undefined) => (v ? new Date(v).toLocaleDateString('fr-FR') : null)
const since = (period: string) => {
  const days = { '7d': 7, '30d': 30, '90d': 90, '365d': 365 }[period]
  return days ? new Date(Date.now() - days * 86400_000).toISOString() : null
}

type Prof = { full_name: string | null; email: string | null } | null

/** Couples (apprenant, formation) financés par l'organisation : base du périmètre entreprise. */
async function orgPairs(admin: SupabaseClient, orgId: string) {
  const { data } = await admin.from('enrollments').select('user_id, course_id').eq('sponsor_org_id', orgId)
  return { pairs: new Set((data ?? []).map(e => `${e.user_id}:${e.course_id}`)), users: [...new Set((data ?? []).map(e => e.user_id))] }
}

export async function runReport(admin: SupabaseClient, dataset: string, scope: Scope, f: Filters): Promise<Row[]> {
  const from = since(f.period)
  const today = new Date().toISOString().slice(0, 10)

  if (dataset === 'enrollments') {
    let q = admin.from('enrollments')
      .select('user_id, course_id, enrolled_at, progress_percent, completed_at, due_date, user:profiles!enrollments_user_id_fkey(full_name, email), course:courses(title), org:organizations(name)')
      .order('enrolled_at', { ascending: false }).limit(10000)
    if (scope.orgId) q = q.eq('sponsor_org_id', scope.orgId)
    if (from) q = q.gte('enrolled_at', from)
    if (f.courseId) q = q.eq('course_id', f.courseId)
    const { data } = await q
    return (data ?? []).map(e => {
      const u = e.user as unknown as Prof
      const done = !!e.completed_at || (e.progress_percent ?? 0) >= 100
      return {
        learner: u?.full_name ?? null, email: u?.email ?? null, course: (e.course as unknown as { title: string } | null)?.title ?? null,
        enrolled_at: d(e.enrolled_at), progress: e.progress_percent ?? 0, completed_at: d(e.completed_at), due_date: d(e.due_date),
        status: done ? 'Terminée' : e.due_date && e.due_date < today ? 'En retard' : (e.progress_percent ?? 0) > 0 ? 'En cours' : 'Non commencée',
        organization: (e.org as unknown as { name: string } | null)?.name ?? null,
      }
    })
  }

  if (dataset === 'certificates') {
    let q = admin.from('certificates')
      .select('user_id, course_id, certificate_number, issued_at, expires_at, is_revoked, superseded_at, course_title, user:profiles!certificates_user_id_fkey(full_name, email)')
      .order('issued_at', { ascending: false }).limit(10000)
    if (from) q = q.gte('issued_at', from)
    if (f.courseId) q = q.eq('course_id', f.courseId)
    let rows = (await q).data ?? []
    if (scope.orgId) { const { pairs } = await orgPairs(admin, scope.orgId); rows = rows.filter(c => pairs.has(`${c.user_id}:${c.course_id}`)) }
    return rows.map(c => {
      const u = c.user as unknown as Prof
      return {
        number: c.certificate_number, learner: u?.full_name ?? null, email: u?.email ?? null, course: c.course_title,
        issued_at: d(c.issued_at), expires_at: d(c.expires_at),
        status: c.is_revoked ? 'Révoqué' : c.superseded_at ? 'Remplacé' : c.expires_at && new Date(c.expires_at) < new Date() ? 'Expiré' : 'Valide',
      }
    })
  }

  if (dataset === 'quiz') {
    let q = admin.from('quiz_attempts')
      .select('user_id, course_id, score, passed, attempted_at, submitted_at, is_flagged, status, lesson:lessons(title, course_id, course:courses(title))')
      .neq('status', 'in_progress').order('attempted_at', { ascending: false }).limit(10000)
    if (from) q = q.gte('attempted_at', from)
    let rows = ((await q).data ?? []) as unknown as { user_id: string; course_id: string | null; score: number; passed: boolean; attempted_at: string; submitted_at: string | null; is_flagged: boolean; lesson: { title: string; course_id: string; course: { title: string } | null } | null }[]
    if (f.courseId) rows = rows.filter(a => a.lesson?.course_id === f.courseId)
    if (scope.orgId) { const { pairs } = await orgPairs(admin, scope.orgId); rows = rows.filter(a => pairs.has(`${a.user_id}:${a.lesson?.course_id}`)) }
    const ids = [...new Set(rows.map(r => r.user_id))]
    const { data: people } = ids.length ? await admin.from('profiles').select('id, full_name, email').in('id', ids) : { data: [] }
    const who = new Map((people ?? []).map(p => [p.id, p]))
    return rows.map(a => ({
      learner: who.get(a.user_id)?.full_name ?? null, email: who.get(a.user_id)?.email ?? null, course: a.lesson?.course?.title ?? null,
      quiz: a.lesson?.title ?? null, score: a.score, passed: a.passed ? 'Oui' : 'Non', date: d(a.submitted_at ?? a.attempted_at), flagged: a.is_flagged ? 'Oui' : 'Non',
    }))
  }

  if (dataset === 'evaluations') {
    let q = admin.from('course_evaluations')
      .select('user_id, course_id, content_rating, instructor_rating, applicability, recommend_score, comment, created_at, course:courses(title)')
      .order('created_at', { ascending: false }).limit(10000)
    if (from) q = q.gte('created_at', from)
    if (f.courseId) q = q.eq('course_id', f.courseId)
    let rows = (await q).data ?? []
    if (scope.orgId) { const { pairs } = await orgPairs(admin, scope.orgId); rows = rows.filter(r => pairs.has(`${r.user_id}:${r.course_id}`)) }
    return rows.map(r => ({
      course: (r.course as unknown as { title: string } | null)?.title ?? null, content: r.content_rating, instructor: r.instructor_rating,
      applicability: r.applicability, recommend: r.recommend_score, comment: r.comment, date: d(r.created_at),
    }))
  }

  if (dataset === 'attendance') {
    let q = admin.from('live_sessions').select('id, title, scheduled_at, course_id, course:courses(title), live_registrations(user_id, attended)').order('scheduled_at', { ascending: false }).limit(1000)
    if (from) q = q.gte('scheduled_at', from)
    if (f.courseId) q = q.eq('course_id', f.courseId)
    const sessions = ((await q).data ?? []) as unknown as { id: string; title: string; scheduled_at: string; course_id: string | null; course: { title: string } | null; live_registrations: { user_id: string; attended: boolean | null }[] }[]
    const members = scope.orgId ? new Set((await orgPairs(admin, scope.orgId)).users) : null
    const regs = sessions.flatMap(s => s.live_registrations.filter(r => !members || members.has(r.user_id)).map(r => ({ s, r })))
    const ids = [...new Set(regs.map(x => x.r.user_id))]
    const { data: people } = ids.length ? await admin.from('profiles').select('id, full_name, email').in('id', ids) : { data: [] }
    const who = new Map((people ?? []).map(p => [p.id, p]))
    return regs.map(({ s, r }) => ({
      session: s.title, date: d(s.scheduled_at), course: s.course?.title ?? null,
      learner: who.get(r.user_id)?.full_name ?? null, email: who.get(r.user_id)?.email ?? null, present: r.attended ? 'Oui' : 'Non',
    }))
  }

  if (dataset === 'payments' && !scope.orgId) {
    let q = admin.from('payments').select('created_at, amount, currency, status, provider, method, user:profiles(full_name, email), course:courses(title), coaching_booking_id')
      .order('created_at', { ascending: false }).limit(10000)
    if (from) q = q.gte('created_at', from)
    if (f.courseId) q = q.eq('course_id', f.courseId)
    return ((await q).data ?? []).map(p => {
      const u = p.user as unknown as Prof
      return {
        date: d(p.created_at), learner: u?.full_name ?? null, email: u?.email ?? null,
        item: (p.course as unknown as { title: string } | null)?.title ?? (p.coaching_booking_id ? 'Séance de coaching' : null),
        amount: p.amount, currency: p.currency, status: p.status === 'completed' ? 'Confirmé' : p.status === 'pending' ? 'En attente' : p.status, provider: p.provider ?? p.method,
      }
    })
  }
  return []
}

export function toCsv(rows: Row[], cols: Col[]) {
  const esc = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`
  return '﻿' + [cols.map(c => esc(c.label)).join(';'), ...rows.map(r => cols.map(c => esc(r[c.key])).join(';'))].join('\r\n')
}

export function pickColumns(dataset: string, keys?: string[] | null) {
  const all = DATASETS[dataset]?.columns ?? []
  const chosen = keys?.length ? all.filter(c => keys.includes(c.key)) : all
  return chosen.length ? chosen : all
}

export function nextRun(frequency: 'weekly' | 'monthly', from = new Date()) {
  const n = new Date(from)
  n.setUTCHours(6, 0, 0, 0)
  if (frequency === 'weekly') { n.setUTCDate(n.getUTCDate() + ((8 - n.getUTCDay()) % 7 || 7)) }   // lundi suivant
  else { n.setUTCMonth(n.getUTCMonth() + 1, 1) }                                                    // 1er du mois suivant
  return n
}
