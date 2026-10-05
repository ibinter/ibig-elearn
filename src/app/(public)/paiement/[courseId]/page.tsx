import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { notFound } from 'next/navigation'
import PaymentForm from './PaymentForm'

export default async function PaiementPage({ params, searchParams }: { params: Promise<{ courseId: string }>; searchParams: Promise<{ mode?: string }> }) {
  const { courseId } = await params
  const { mode: enrollmentMode } = await searchParams
  const supabase = await createClient()

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

  if (existing) redirect(`/apprendre/${courseId}/intro`)

  const userCountry = profile?.country ?? 'CI'

  // Charger les providers actifs depuis la DB, filtrés pour ce pays
  const { data: allProviders } = await supabase
    .from('payment_providers')
    .select('id,name,label,description,is_default,api_route,currencies,methods,region,countries')
    .eq('is_active', true)
    .order('position')

  // Uniquement GeniusPay (provider par défaut — checkout unifié tous opérateurs)
  const providers = (allProviders ?? []).filter(p => p.id === 'geniuspay')

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
                      {new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(course.price_xof)} FCFA
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
                priceXof={course.price_xof}
                priceEur={course.price_eur ?? Math.round(course.price_xof / 655)}
                priceUsd={course.price_usd ?? Math.round(course.price_xof / 600)}
                courseName={course.title}
                userEmail={user.email!}
                userPhone={profile?.phone || ''}
                userName={profile?.full_name || ''}
                userCountry={userCountry}
                providers={providers}
                enrollmentMode={(enrollmentMode as any) ?? 'guide'}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
