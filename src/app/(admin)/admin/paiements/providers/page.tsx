import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ProvidersManager from './ProvidersManager'

export default async function PaymentProvidersAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/connexion')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!profile || !['admin','coordinateur'].includes(profile.role)) redirect('/dashboard')

  const { data: providers } = await supabase
    .from('payment_providers')
    .select('*')
    .order('position')

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Providers de paiement</h1>
        <p className="text-gray-400 mt-1 text-sm">
          Activez, désactivez ou définissez le provider par défaut. Le provider par défaut est utilisé automatiquement selon le pays de l'apprenant.
        </p>
      </div>
      <ProvidersManager providers={providers ?? []} />
    </div>
  )
}
