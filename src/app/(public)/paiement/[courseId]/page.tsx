import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { notFound } from 'next/navigation'
import PaymentForm from './PaymentForm'

export default async function PaiementPage({ params }: { params: Promise<{ courseId: string }> }) {
  const { courseId } = await params
  const cookieStore = await cookies()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll() } }
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/connexion')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()

  const { data: course } = await supabase
    .from('courses')
    .select(`*, profiles!courses_instructor_id_fkey(full_name), categories(name)`)
    .eq('id', courseId)
    .single()

  if (!course) notFound()

  // Vérifier si déjà inscrit
  const { data: existing } = await supabase
    .from('enrollments')
    .select('id')
    .eq('user_id', user.id)
    .eq('course_id', courseId)
    .single()

  if (existing) redirect(`/apprendre/${courseId}/debut`)

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Résumé commande */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl border border-gray-200 p-6 sticky top-6">
              <h2 className="font-semibold text-gray-900 mb-4">Votre commande</h2>
              <div className="space-y-3">
                <div className="aspect-video rounded-lg overflow-hidden bg-gray-100">
                  {course.thumbnail_url ? (
                    <img src={course.thumbnail_url} alt={course.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-100 to-blue-200">
                      <span className="text-4xl">📚</span>
                    </div>
                  )}
                </div>
                <h3 className="font-medium text-gray-900 text-sm leading-snug">{course.title}</h3>
                <p className="text-xs text-gray-500">par {(course.profiles as any)?.full_name}</p>
                <div className="border-t pt-3 mt-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 text-sm">Sous-total</span>
                    <span className="font-semibold text-gray-900">
                      {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: course.currency || 'XOF', maximumFractionDigits: 0 }).format(course.price)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Formulaire paiement */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h1 className="text-xl font-bold text-gray-900 mb-6">Finaliser le paiement</h1>
              <PaymentForm
                courseId={courseId}
                amount={course.price}
                currency={course.currency || 'XOF'}
                courseName={course.title}
                userEmail={user.email!}
                userPhone={profile?.phone || ''}
                userName={profile?.full_name || ''}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
