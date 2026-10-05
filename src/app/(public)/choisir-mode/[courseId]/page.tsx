import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import ModeSelectorForm from './ModeSelectorForm'

export default async function ChoisirModePage({ params }: { params: Promise<{ courseId: string }> }) {
  const { courseId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/connexion?redirectTo=/choisir-mode/${courseId}`)

  const { data: course, error: courseError } = await supabase
    .from('courses')
    .select('id, title, slug, thumbnail_url, price_xof, has_certificate')
    .eq('id', courseId)
    .single()
  console.error('[choisir-mode] courseId:', courseId, '| user:', user?.id ?? 'null', '| course:', course?.id ?? 'null', '| error:', courseError?.code, courseError?.message)
  if (!course) notFound()

  // Vérifier si déjà inscrit
  const { data: existing } = await supabase
    .from('enrollments')
    .select('id, mode')
    .eq('user_id', user.id)
    .eq('course_id', courseId)
    .single()

  // Si déjà inscrit, proposer de changer le mode
  const currentMode = existing?.mode ?? null
  const isAlreadyEnrolled = !!existing

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <p className="text-sm text-gray-500 font-medium uppercase tracking-wider mb-2">Mode d'apprentissage</p>
          <h1 className="text-2xl font-bold text-gray-900">Comment voulez-vous apprendre ?</h1>
          <p className="text-gray-500 mt-2">Choisissez votre style d'apprentissage pour <strong>{course.title}</strong></p>
        </div>

        <ModeSelectorForm
          courseId={courseId}
          courseSlug={course.slug}
          priceXof={course.price_xof}
          isFree={course.price_xof === 0}
          hasCertificate={course.has_certificate ?? true}
          isAlreadyEnrolled={isAlreadyEnrolled}
          currentMode={currentMode}
        />
      </div>
    </div>
  )
}
