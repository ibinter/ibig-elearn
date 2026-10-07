import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Building2, CheckCircle2, XCircle, MailWarning } from 'lucide-react'
import { addMember, addToCohort, seatsUsed } from '@/lib/org'

export const metadata = { robots: { index: false, follow: false } }

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-7 sm:p-9 max-w-md w-full text-center">{children}</div>
    </div>
  )
}

export default async function RejoindreOrgPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const admin = createAdminClient()
  const { data: inv } = await admin
    .from('org_invitations')
    .select('id, org_id, email, role, cohort_id, invited_by, accepted_at, expires_at, org:organizations(id, slug, name, logo_url, is_active)')
    .eq('token', token)
    .maybeSingle()
  const org = (inv?.org ?? null) as unknown as { id: string; slug: string; name: string; logo_url: string | null; is_active: boolean } | null

  if (!inv || !org?.is_active || new Date(inv.expires_at) < new Date()) {
    return (
      <Card>
        <XCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
        <h1 className="text-xl font-bold text-gray-900 mb-2">Invitation invalide ou expirée</h1>
        <p className="text-gray-500 text-sm">Demandez à votre entreprise de vous renvoyer une invitation.</p>
        <Link href="/" className="mt-6 inline-block text-[#0B3D91] font-semibold text-sm">Retour à l&apos;accueil</Link>
      </Card>
    )
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/inscription?next=${encodeURIComponent(`/rejoindre/${token}`)}&email=${encodeURIComponent(inv.email)}`)

  const isManager = ['owner', 'admin', 'manager'].includes(inv.role)
  const destination = isManager ? `/organisation/${org.slug}` : '/mes-formations'

  if (!inv.accepted_at) {
    // L'invitation est nominative : elle ne peut être acceptée que par le compte de l'adresse invitée
    if ((user.email ?? '').toLowerCase() !== inv.email.toLowerCase()) {
      return (
        <Card>
          <MailWarning className="w-12 h-12 text-amber-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-gray-900 mb-2">Mauvais compte</h1>
          <p className="text-gray-500 text-sm">
            Cette invitation a été envoyée à <strong data-no-translate>{inv.email}</strong>. Connectez-vous avec ce compte pour l&apos;accepter.
          </p>
          <Link href={`/connexion?redirectTo=/rejoindre/${token}`} className="mt-6 inline-block bg-[#0B3D91] text-white font-semibold px-6 py-3 rounded-xl text-sm">Changer de compte</Link>
        </Card>
      )
    }
    await addMember(admin, inv.org_id, user.id, inv.role, inv.invited_by)
    await admin.from('org_invitations').update({ accepted_at: new Date().toISOString() }).eq('id', inv.id)
    if (inv.cohort_id) await addToCohort(admin, inv.org_id, inv.cohort_id, [user.id])
    await admin.from('organizations').update({ used_seats: await seatsUsed(admin, inv.org_id) }).eq('id', inv.org_id)
  }

  return (
    <Card>
      {org.logo_url
        ? <img src={org.logo_url} alt="" className="w-16 h-16 rounded-2xl object-cover mx-auto mb-4 border border-gray-100" />
        : <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#0B3D91] to-[#FFA500] flex items-center justify-center mx-auto mb-4"><Building2 className="w-8 h-8 text-white" /></div>}
      <CheckCircle2 className="w-9 h-9 text-emerald-500 mx-auto mb-3" />
      <h1 className="text-xl font-bold text-gray-900 mb-2">Bienvenue chez <span data-no-translate>{org.name}</span> !</h1>
      <p className="text-gray-500 text-sm mb-6">
        {isManager
          ? 'Votre espace entreprise est activé : invitez vos collaborateurs et suivez leur progression.'
          : 'Vous avez rejoint l’espace de formation de votre entreprise. Vos formations vous attendent.'}
      </p>
      <Link href={destination} className="inline-block bg-[#0B3D91] text-white font-semibold px-6 py-3 rounded-xl">
        {isManager ? 'Ouvrir mon espace entreprise' : 'Accéder à mes formations'}
      </Link>
    </Card>
  )
}
