import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { CheckCircle, XCircle, BookOpen } from 'lucide-react'

export default async function PaiementConfirmationPage({
  searchParams,
}: {
  searchParams: Promise<{ transaction_id?: string; status?: string; course_id?: string }>
}) {
  const params = await searchParams
  const { transaction_id, status, course_id } = params

  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll() } }
  )

  let payment = null
  if (transaction_id) {
    const { data } = await supabase
      .from('payments')
      .select('*, courses(title, slug)')
      .eq('provider_reference', transaction_id)
      .single()
    payment = data
  }

  const success = status === 'ACCEPTED' || payment?.status === 'completed'

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center">
        {success ? (
          <>
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Paiement réussi !</h1>
            <p className="text-gray-600 mb-6">
              Votre inscription à{' '}
              <strong>{payment?.courses?.title || 'la formation'}</strong>{' '}
              est confirmée. Vous pouvez commencer à apprendre maintenant.
            </p>
            {transaction_id && (
              <p className="text-xs text-gray-400 mb-6">Référence : {transaction_id}</p>
            )}
            <div className="flex flex-col gap-3">
              {course_id && (
                <Link
                  href={`/apprendre/${course_id}/debut`}
                  className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition-colors"
                >
                  <BookOpen className="w-4 h-4" />
                  Commencer la formation
                </Link>
              )}
              <Link
                href="/mes-formations"
                className="text-blue-600 hover:underline text-sm"
              >
                Voir mes formations
              </Link>
            </div>
          </>
        ) : (
          <>
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-5">
              <XCircle className="w-8 h-8 text-red-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Paiement échoué</h1>
            <p className="text-gray-600 mb-6">
              Votre paiement n&apos;a pas pu être traité. Aucun montant n&apos;a été débité.
            </p>
            <div className="flex flex-col gap-3">
              {course_id && (
                <Link
                  href={`/paiement/${course_id}`}
                  className="bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 rounded-xl transition-colors"
                >
                  Réessayer
                </Link>
              )}
              <Link href="/catalogue" className="text-blue-600 hover:underline text-sm">
                Retour au catalogue
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
