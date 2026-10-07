import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Mentions légales',
  description: 'Mentions légales de la plateforme IBIG E-LEARNING — IBIG SARL, Intermark Business International Group, Abidjan Cocody Riviera Palmeraie.',
  alternates: { canonical: '/mentions-legales' },
}

const LAST_UPDATE = 'Octobre 2026'

export default function MentionsLegalesPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-[#0B3D91] text-white py-12">
        <div className="max-w-3xl mx-auto px-4">
          <h1 className="text-3xl font-bold mb-2">Mentions légales</h1>
          <p className="text-blue-200 text-sm">Dernière mise à jour : {LAST_UPDATE}</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-12 space-y-10">

        <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-7">
          <h2 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100">1. Éditeur du site</h2>
          <div className="space-y-2 text-sm text-gray-600">
            <p><strong className="text-gray-800">Raison sociale :</strong> IBIG SARL — Intermark Business International Group</p>
            <p><strong className="text-gray-800">Marques :</strong> IBIG E-LEARNING · IBIG EDUFORM</p>
            <p><strong className="text-gray-800">Siège social :</strong> Abidjan, Cocody Riviera Palmeraie (non loin de la pharmacie Rue Ministre), Côte d'Ivoire</p>
            <p><strong className="text-gray-800">Présence :</strong> Acteur panafricain présent dans 17 pays de l'espace OHADA</p>
            <p><strong className="text-gray-800">Téléphone :</strong> +225 27 22 27 60 14 / +225 07 78 88 25 92 / +225 05 65 90 47 79 / +225 01 53 59 55 44</p>
            <p><strong className="text-gray-800">Email :</strong> contact@ibig-elearning.com</p>
            <p><strong className="text-gray-800">Site web :</strong> ibig-elearning.com</p>
          </div>
        </section>

        <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-7">
          <h2 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100">2. Directeur de la publication</h2>
          <p className="text-sm text-gray-600">Le directeur de la publication est le représentant légal d'IBIG SARL. Pour toute question relative au contenu de la plateforme, contactez : <a href="mailto:contact@ibig-elearning.com" className="text-[#0B3D91] underline">contact@ibig-elearning.com</a></p>
        </section>

        <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-7">
          <h2 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100">3. Hébergement</h2>
          <div className="space-y-2 text-sm text-gray-600">
            <p><strong className="text-gray-800">Hébergeur :</strong> Vercel Inc.</p>
            <p><strong className="text-gray-800">Adresse :</strong> 340 Pine Street, Suite 1401, San Francisco, CA 94104, États-Unis</p>
            <p><strong className="text-gray-800">Site :</strong> vercel.com</p>
            <p className="mt-3"><strong className="text-gray-800">Base de données :</strong> Supabase Inc., 970 Toa Payoh North, #07-04, Singapore 318992</p>
          </div>
        </section>

        <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-7">
          <h2 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100">4. Propriété intellectuelle</h2>
          <p className="text-sm text-gray-600 leading-relaxed">L'ensemble des contenus disponibles sur ibig-elearning.com (textes, images, vidéos, logos, icônes, données, code source) sont la propriété exclusive d'IBIG SARL ou de ses partenaires et sont protégés par les lois en vigueur sur la propriété intellectuelle. Toute reproduction, représentation, modification, publication ou adaptation de tout ou partie de ces éléments, quel que soit le moyen ou le procédé utilisé, est interdite sans autorisation écrite préalable d'IBIG SARL.</p>
        </section>

        <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-7">
          <h2 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100">5. Responsabilité</h2>
          <p className="text-sm text-gray-600 leading-relaxed">IBIG SARL s'efforce d'assurer l'exactitude et la mise à jour des informations publiées sur ibig-elearning.com. Toutefois, elle ne peut garantir l'exactitude, la précision ou l'exhaustivité des informations mises à disposition sur ce site. En conséquence, IBIG SARL décline toute responsabilité pour toute imprécision, inexactitude ou omission portant sur des informations disponibles sur le site, ainsi que pour tout dommage résultant d'une intrusion frauduleuse d'un tiers ayant entraîné une modification des informations.</p>
        </section>

        <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-7">
          <h2 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100">6. Liens hypertextes</h2>
          <p className="text-sm text-gray-600 leading-relaxed">Le site ibig-elearning.com peut contenir des liens vers d'autres sites. IBIG SARL n'est pas responsable du contenu de ces sites externes et ne peut être tenue responsable de dommages résultant de l'accès à ces sites. La création de tout lien hypertexte pointant vers ibig-elearning.com est soumise à l'accord préalable écrit d'IBIG SARL.</p>
        </section>

        <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-7">
          <h2 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100">7. Droit applicable</h2>
          <p className="text-sm text-gray-600 leading-relaxed">Les présentes mentions légales sont régies par le droit ivoirien et le droit de l'espace OHADA. En cas de litige, les juridictions compétentes sont celles d'Abidjan, Côte d'Ivoire, sauf disposition légale contraire.</p>
        </section>

        <div className="flex flex-wrap gap-3">
          <Link href="/cgu" className="text-sm text-[#0B3D91] underline">CGU</Link>
          <Link href="/cgv" className="text-sm text-[#0B3D91] underline">CGV</Link>
          <Link href="/confidentialite" className="text-sm text-[#0B3D91] underline">Politique de confidentialité</Link>
        </div>
      </div>
    </div>
  )
}
