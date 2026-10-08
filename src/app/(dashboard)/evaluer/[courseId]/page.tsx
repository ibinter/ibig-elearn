import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, MessageSquareHeart } from 'lucide-react'
import EvaluationForm from './EvaluationForm'

export const metadata = { title: 'Évaluer la formation' }

export default async function EvaluerPage({ params }: { params: Promise<{ courseId: string }> }) {
  const { courseId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/connexion')

  const [{ data: course }, { data: enr }, { data: existing }] = await Promise.all([
    supabase.from('courses').select('title').eq('id', courseId).maybeSingle(),
    supabase.from('enrollments').select('progress_percent, completed_at').eq('user_id', user.id).eq('course_id', courseId).maybeSingle(),
    supabase.from('course_evaluations').select('content_rating, instructor_rating, applicability, recommend_score, comment').eq('user_id', user.id).eq('course_id', courseId).maybeSingle(),
  ])
  if (!course || !enr) notFound()
  const open = (enr.progress_percent ?? 0) >= 80 || !!enr.completed_at

  return (
    <div className="max-w-xl mx-auto space-y-4">
      <Link href="/mes-formations" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-[#0B3D91]"><ArrowLeft className="w-4 h-4" /> Mes formations</Link>
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5 sm:p-8">
        <span className="w-12 h-12 rounded-2xl bg-[#FFA500]/10 text-[#FFA500] flex items-center justify-center"><MessageSquareHeart className="w-6 h-6" /></span>
        <h1 className="mt-3 text-xl font-bold text-gray-900">Votre avis sur la formation</h1>
        <p className="text-sm text-gray-500 mb-6">{course.title} · 1 minute</p>
        {open ? (
          <EvaluationForm courseId={courseId} initial={existing ? {
            contentRating: existing.content_rating, instructorRating: existing.instructor_rating, applicability: existing.applicability,
            recommendScore: existing.recommend_score, comment: existing.comment ?? '',
          } : null} />
        ) : (
          <p className="text-sm text-gray-600">L&apos;évaluation s&apos;ouvre lorsque vous avez suivi au moins 80 % de la formation (vous en êtes à {enr.progress_percent ?? 0} %).</p>
        )}
      </div>
    </div>
  )
}
