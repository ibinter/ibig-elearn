import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Building2, CheckCircle, XCircle } from 'lucide-react'

export default async function RejoindreOrgPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Charger l'invitation
  const { data: inv } = await supabase
    .from('org_invitations')
    .select('*, organizations(id, name, logo_url, plan)')
    .eq('token', token)
    .single()

  if (!inv) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl border border-gray-200 p-8 max-w-md text-center">
          <XCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-gray-900 mb-2">Lien invalide</h1>
          <p className="text-gray-500 text-sm">Cette invitation n'existe pas ou a expiré.</p>
          <Link href="/" className="mt-6 inline-block text-[#0B3D91] font-semibold hover:underline text-sm">
            Retour à l'accueil
          </Link>
        </div>
      </div>
    )
  }

  const expired = new Date(inv.expires_at) < new Date()
  const org = inv.organizations as any

  // Si déjà acceptée
  if (inv.accepted_at) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl border border-gray-200 p-8 max-w-md text-center">
          <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-gray-900 mb-2">Invitation déjà acceptée</h1>
          <p className="text-gray-500 text-sm">Vous avez déjà rejoint {org?.name}.</p>
          <Link href="/tableau-de-bord" className="mt-6 inline-block bg-[#0B3D91] text-white font-semibold px-6 py-2.5 rounded-xl hover:bg-[#0a3480] transition-colors text-sm">
            Accéder au tableau de bord
          </Link>
        </div>
      </div>
    )
  }

  // Si pas connecté → rediriger vers inscription avec le token en param
  if (!user) {
    redirect(`/inscription?invite=${token}&email=${encodeURIComponent(inv.email)}`)
  }

  // Accepter l'invitation
  const { error } = await supabase.from('organization_members').insert({
    org_id: inv.org_id,
    user_id: user.id,
    role: inv.role,
    invited_by: inv.invited_by,
    invited_at: inv.created_at,
    joined_at: new Date().toISOString(),
  })

  if (!error) {
    await supabase.from('org_invitations').update({ accepted_at: new Date().toISOString() }).eq('id', inv.id)
    await supabase.from('profiles').update({ org_id: inv.org_id }).eq('id', user.id)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-gray-200 p-8 max-w-md text-center">
        {error ? (
          <>
            <XCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <h1 className="text-xl font-bold text-gray-900 mb-2">Erreur</h1>
            <p className="text-gray-500 text-sm">{error.message}</p>
          </>
        ) : (
          <>
            {org?.logo_url ? (
              <img src={org.logo_url} alt={org.name} className="w-16 h-16 rounded-xl object-cover mx-auto mb-4 border border-gray-200" />
            ) : (
              <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-[#0B3D91] to-[#FFA500] flex items-center justify-center mx-auto mb-4">
                <Building2 className="w-8 h-8 text-white" />
              </div>
            )}
            <CheckCircle className="w-10 h-10 text-green-400 mx-auto mb-3" />
            <h1 className="text-xl font-bold text-gray-900 mb-2">Bienvenue dans {org?.name} !</h1>
            <p className="text-gray-500 text-sm mb-6">Vous avez rejoint l'organisation avec succès. Accédez à vos formations assignées depuis votre tableau de bord.</p>
            <Link href="/tableau-de-bord"
              className="inline-block bg-[#0B3D91] text-white font-semibold px-6 py-3 rounded-xl hover:bg-[#0a3480] transition-colors">
              Accéder à mes formations
            </Link>
          </>
        )}
      </div>
    </div>
  )
}
