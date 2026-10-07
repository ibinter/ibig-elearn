import Link from 'next/link'
import { CheckCircle, Users, Globe, TrendingUp, Star, Mail } from 'lucide-react'

export const metadata = { alternates: { canonical: '/devenir-formateur' }, title: 'Devenir formateur', description: 'Partagez votre expertise et touchez des milliers d\'apprenants africains sur IBIG E-LEARNING.' }

const avantages = [
  { icon: Users, title: 'Audience panafricaine', desc: 'Accédez à une audience de milliers de professionnels dans 14 pays.' },
  { icon: TrendingUp, title: 'Revenus récurrents', desc: 'Gagnez à chaque inscription à votre formation, sans limite.' },
  { icon: Globe, title: 'Paiements Mobile Money', desc: 'Recevez vos revenus en XOF, XAF ou EUR, par Mobile Money ou virement.' },
  { icon: Star, title: 'Notoriété et crédibilité', desc: 'Renforcez votre positionnement d\'expert reconnu sur le continent.' },
]

const etapes = [
  { num: '01', title: 'Postulez', desc: 'Envoyez votre candidature avec votre domaine d\'expertise et un exemple de contenu.' },
  { num: '02', title: 'Validation', desc: 'Notre équipe évalue votre profil et vous contacte sous 5 jours ouvrés.' },
  { num: '03', title: 'Création', desc: 'Créez votre formation sur notre plateforme avec l\'accompagnement de notre équipe.' },
  { num: '04', title: 'Publication & revenus', desc: 'Votre formation est publiée et vous commencez à percevoir vos revenus.' },
]

export default function DevenirFormateurPage() {
  return (
    <div>
      {/* Hero */}
      <section className="hero-photo bg-learner text-white py-10 md:py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl sm:text-5xl font-bold mb-5">
            Partagez votre expertise,<br />
            <span className="text-[#FFA500]">touchez l'Afrique entière</span>
          </h1>
          <p className="text-blue-100 text-lg max-w-2xl mx-auto mb-8">
            Rejoignez notre réseau de formateurs experts et créez des formations professionnelles certifiantes pour des milliers d'apprenants africains.
          </p>
          <Link href="/devenir-partenaire"
            className="inline-flex items-center gap-2 bg-[#FFA500] hover:bg-orange-500 text-black font-bold px-8 py-4 rounded-xl transition-colors text-base">
            <Mail className="w-5 h-5" /> Postuler maintenant
          </Link>
        </div>
      </section>

      {/* Avantages */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">Pourquoi enseigner sur IBIG E-LEARNING ?</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {avantages.map(a => (
              <div key={a.title} className="bg-gray-50 rounded-2xl p-6 text-center">
                <div className="w-12 h-12 rounded-xl ibig-gradient flex items-center justify-center mx-auto mb-4">
                  <a.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-bold text-gray-900 mb-2">{a.title}</h3>
                <p className="text-gray-500 text-sm">{a.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Conditions */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Qui peut devenir formateur ?</h2>
              <p className="text-gray-600 mb-4">Nous recherchons des experts praticiens dans leurs domaines, capables de transmettre des connaissances concrètes et applicables.</p>
              <ul className="space-y-3">
                {[
                  'Minimum 3 ans d\'expérience professionnelle dans votre domaine',
                  'Capacité à créer du contenu vidéo de qualité',
                  'Maîtrise du français (et/ou anglais pour les formations bilingues)',
                  'Disponibilité pour répondre aux questions des apprenants',
                  'Engagement pour la qualité et la mise à jour du contenu',
                ].map(item => (
                  <li key={item} className="flex items-start gap-2.5">
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-600 text-sm">{item}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-8 relative rounded-3xl overflow-hidden aspect-[16/10] shadow-xl">
                <picture>
                  <source media="(max-width: 767px)" srcSet="/images/bg/about-m.webp" />
                  <img src="/images/bg/about.webp" alt="Une formatrice partage son expertise avec des apprenantes" loading="lazy" className="w-full h-full object-cover" />
                </picture>
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-5 text-white">
                  <p className="font-bold">Partagez votre expertise</p>
                  <p className="text-sm text-white/80">Et percevez 50 % des revenus de vos formations.</p>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Le processus en 4 étapes</h2>
              {etapes.map(e => (
                <div key={e.num} className="flex items-start gap-4 bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                  <div className="w-10 h-10 rounded-xl ibig-gradient flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                    {e.num}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 mb-0.5">{e.title}</h3>
                    <p className="text-gray-500 text-sm">{e.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 hero-photo bg-partner text-white">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Prêt à transmettre votre savoir ?</h2>
          <p className="text-blue-100 mb-6">Créez votre compte, déposez votre candidature en ligne : IBIG EDUFORM vous répond sous 5 jours ouvrés avec sa proposition de partenariat.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/devenir-partenaire"
              className="flex items-center justify-center gap-2 bg-[#FFA500] hover:bg-orange-500 text-black font-bold px-8 py-4 rounded-xl transition-colors">
              <Mail className="w-5 h-5" /> Déposer ma candidature
            </Link>
            <Link href="/contact"
              className="flex items-center justify-center gap-2 bg-white/10 border border-white/30 hover:bg-white/20 text-white font-semibold px-8 py-4 rounded-xl transition-colors">
              Nous contacter
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
