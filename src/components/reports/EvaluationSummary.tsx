import { createAdminClient } from '@/lib/supabase/admin'
import { MessageSquareHeart, Star } from 'lucide-react'
import { formatDate } from '@/lib/utils'

type Row = { content_rating: number; instructor_rating: number; applicability: number; recommend_score: number; comment: string | null; created_at: string; course: { title: string } | null }

/**
 * Synthèse des évaluations à chaud (satisfaction + NPS) pour un ensemble de formations.
 * Composant serveur : lit les évaluations avec la clé de service, l'appelant ayant vérifié les droits.
 */
export default async function EvaluationSummary({ courseIds, showCourse = false }: { courseIds?: string[]; showCourse?: boolean }) {
  if (courseIds && !courseIds.length) return null
  let q = createAdminClient().from('course_evaluations')
    .select('content_rating, instructor_rating, applicability, recommend_score, comment, created_at, course:courses(title)')
  if (courseIds) q = q.in('course_id', courseIds)
  const { data } = await q.order('created_at', { ascending: false }).limit(1000)
  const rows = (data ?? []) as unknown as Row[]

  const avg = (k: keyof Pick<Row, 'content_rating' | 'instructor_rating' | 'applicability'>) =>
    rows.length ? rows.reduce((s, r) => s + r[k], 0) / rows.length : 0
  const promoters = rows.filter(r => r.recommend_score >= 9).length
  const detractors = rows.filter(r => r.recommend_score <= 6).length
  const nps = rows.length ? Math.round(((promoters - detractors) / rows.length) * 100) : null
  const comments = rows.filter(r => r.comment).slice(0, 6)

  return (
    <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-bold text-gray-900 flex items-center gap-2"><MessageSquareHeart className="w-5 h-5 text-[#FFA500]" /> Satisfaction des apprenants</h2>
        <span className="text-xs text-gray-400">{rows.length} évaluation{rows.length > 1 ? 's' : ''}</span>
      </div>
      {rows.length === 0 ? (
        <p className="mt-4 text-sm text-gray-400">Aucune évaluation pour l&apos;instant. Les apprenants sont invités à évaluer dès 80 % de progression.</p>
      ) : (
        <>
          <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { l: 'Contenu', v: avg('content_rating') },
              { l: 'Formateur', v: avg('instructor_rating') },
              { l: 'Utilité au travail', v: avg('applicability') },
            ].map(k => (
              <div key={k.l} className="rounded-xl bg-gray-50 p-3">
                <p className="text-xs text-gray-500">{k.l}</p>
                <p className="mt-1 flex items-center gap-1 text-xl font-extrabold text-gray-900">{k.v.toFixed(1)} <Star className="w-4 h-4 text-[#FFA500] fill-[#FFA500]" /></p>
              </div>
            ))}
            <div className={`rounded-xl p-3 ${nps! >= 30 ? 'bg-emerald-50' : nps! >= 0 ? 'bg-amber-50' : 'bg-red-50'}`}>
              <p className="text-xs text-gray-500" title="Net Promoter Score : % de promoteurs (9-10) moins % de détracteurs (0-6)">Recommandation (NPS)</p>
              <p className="mt-1 text-xl font-extrabold text-gray-900">{nps! > 0 ? '+' : ''}{nps}</p>
            </div>
          </div>
          {comments.length > 0 && (
            <ul className="mt-4 space-y-2">
              {comments.map((c, i) => (
                <li key={i} className="rounded-xl border border-gray-100 px-3.5 py-2.5 text-sm text-gray-700">
                  « {c.comment} »
                  <span className="block mt-1 text-[11px] text-gray-400">{showCourse && c.course?.title ? `${c.course.title} · ` : ''}{formatDate(c.created_at)} · recommandation {c.recommend_score}/10</span>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </section>
  )
}
