import Link from 'next/link'
import type { Metadata } from 'next'
import { buildPartnerTerms, DEFAULT_INSTRUCTOR_SHARE, PARTNER_TERMS_VERSION } from '@/lib/partner'

export const metadata: Metadata = {
  title: 'Convention de partenariat formateurs',
  description: 'Modèle de convention entre IBIG EDUFORM et les formateurs partenaires : validation des formations, partage des revenus, propriété intellectuelle, certificats cosignés.',
  alternates: { canonical: '/conditions-partenaires' },
}

export default function ConditionsPartenairesPage() {
  const terms = buildPartnerTerms({ instructorName: '[Nom du formateur partenaire]', sharePct: DEFAULT_INSTRUCTOR_SHARE })
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      <p className="text-xs font-bold uppercase tracking-widest text-[#FFA500]">Programme Formateurs Partenaires</p>
      <h1 className="mt-2 text-[26px] sm:text-4xl font-extrabold text-[#0B1E4B] leading-tight">Convention de partenariat</h1>
      <p className="mt-3 text-gray-600 text-[15px] leading-relaxed">
        Modèle en vigueur (version {PARTNER_TERMS_VERSION}). La part de revenus indiquée ({DEFAULT_INSTRUCTOR_SHARE} %) est la part standard :
        la part exacte et d&apos;éventuelles conditions particulières figurent dans la convention personnelle qui vous est proposée après étude de votre candidature.
      </p>
      <div className="mt-6 bg-white rounded-2xl border border-gray-100 p-5 sm:p-7 text-[14px] sm:text-[15px] leading-relaxed text-gray-700 whitespace-pre-line">
        {terms}
      </div>
      <Link href="/devenir-partenaire" className="mt-6 flex sm:inline-flex items-center justify-center px-6 py-3.5 rounded-xl ibig-gradient text-white font-bold">
        Devenir formateur partenaire
      </Link>
    </div>
  )
}
