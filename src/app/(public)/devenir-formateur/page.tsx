import Link from 'next/link'
import { CheckCircle, Users, Globe, TrendingUp, Star, Mail } from 'lucide-react'

export const metadata = { title: 'Devenir formateur — IBIG E-LEARN', description: 'Partagez votre expertise et touchez des milliers d\'apprenants africains sur IBIG E-LEARN.' }

const avantages = [
  { icon: Users, title: 'Audience panafricaine', desc: 'Accédez à une audience de milliers de professionnels dans 12 pays.' },
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
      <section className="ibig-gradient text-white py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl sm:text-5xl font-bold mb-5">
            Partagez votre expertise,<br />
            <span className="text-[#FFA500]">touchez l'Afrique entière</span>
          </h1>
          <p className="text-blue-100 text-lg max-w-2xl mx-auto mb-8">
            Rejoignez notre réseau de formateurs experts et créez des formations professionnelles certifiantes pour des milliers d'apprenants africains.
          </p>
          <a href="mailto:formateurs@ibiglearn.com"
            className="inline-flex items-center gap-2 bg-[#FFA500] hover:bg-orange-500 text-black font-bold px-8 py-4 rounded-xl transition-colors text-base">
            <Mail className="w-5 h-5" /> Postuler maintenant
          </a>
        </div>
      </section>

      {/* Avantages */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">Pourquoi enseigner sur IBIG E-LEARN ?</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
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
          <div className="grid lg:grid-cols-2 gap-12 items-center">
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
      <section className="py-16 ibig-gradient text-white">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Prêt à transmettre votre savoir ?</h2>
          <p className="text-blue-100 mb-6">Envoyez-nous votre candidature. Notre équipe vous répond dans les 5 jours ouvrés.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a href="mailto:formateurs@ibiglearn.com"
              className="flex items-center justify-center gap-2 bg-[#FFA500] hover:bg-orange-500 text-black font-bold px-8 py-4 rounded-xl transition-colors">
              <Mail className="w-5 h-5" /> formateurs@ibiglearn.com
            </a>
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
