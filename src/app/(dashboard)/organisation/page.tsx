import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Building2, ArrowRight } from 'lucide-react'
import { getManagedOrgs } from '@/lib/org'

export const metadata = { title: 'Espace entreprise' }

export default async function OrganisationIndexPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/connexion')

  const orgs = await getManagedOrgs(createAdminClient(), user.id)
  if (orgs.length === 1) redirect(`/organisation/${orgs[0].slug}`)

  return (
    <div className="max-w-xl mx-auto py-6">
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 sm:p-8 text-center">
        <span className="w-14 h-14 rounded-2xl bg-[#0B3D91]/10 text-[#0B3D91] flex items-center justify-center mx-auto"><Building2 className="w-7 h-7" /></span>
        {orgs.length > 1 ? (
          <>
            <h1 className="mt-4 text-xl font-bold text-gray-900">Choisissez votre entreprise</h1>
            <ul className="mt-5 space-y-2 text-left">
              {orgs.map(o => (
                <li key={o.id}>
                  <Link href={`/organisation/${o.slug}`} className="flex items-center justify-between rounded-2xl border border-gray-100 px-4 py-3.5 hover:bg-gray-50">
                    <span className="font-semibold text-gray-900" data-no-translate>{o.name}</span><ArrowRight className="w-4 h-4 text-gray-400" />
                  </Link>
                </li>
              ))}
            </ul>
          </>
        ) : (
          <>
            <h1 className="mt-4 text-xl font-bold text-gray-900">Formez vos équipes avec IBIG E-LEARNING</h1>
            <p className="mt-2 text-gray-500 text-[15px]">
              Votre compte n&apos;est rattaché à aucun espace entreprise. Demandez un devis : notre équipe ouvre votre espace,
              puis vous invitez vos collaborateurs et suivez leur progression.
            </p>
            <Link href="/entreprise#contact" className="mt-5 inline-flex items-center gap-2 bg-[#FFA500] text-black font-bold px-6 py-3 rounded-xl">
              Demander un devis gratuit <ArrowRight className="w-4 h-4" />
            </Link>
          </>
        )}
      </div>
    </div>
  )
}
