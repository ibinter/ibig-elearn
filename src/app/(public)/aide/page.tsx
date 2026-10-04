import Link from 'next/link'
import type { Metadata } from 'next'
import { BookOpen, Users, Shield, ChevronRight, Play, Award, MessageCircle, Upload, BarChart2, Settings } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Centre d\'aide — IBIG E-LEARNING',
  description: 'Guides de prise en main de la plateforme IBIG E-LEARNING pour les apprenants, formateurs et administrateurs.',
  alternates: { canonical: 'https://ibig-elearning.com/aide' },
}

const guides = [
  {
    role: 'apprenant',
    icon: BookOpen,
    color: 'bg-blue-50 text-[#0B3D91] border-blue-100',
    btnColor: 'bg-[#0B3D91] hover:bg-blue-800',
    title: 'Guide Apprenant',
    subtitle: 'Je veux me former en ligne',
    desc: 'Découvrez comment vous inscrire, trouver une formation, suivre vos cours, obtenir votre certificat et utiliser l\'assistant SARA.',
    steps: ['Créer votre compte', 'Trouver une formation', 'S\'inscrire et payer', 'Suivre vos cours', 'Obtenir votre certificat'],
    href: '/aide/apprenant',
  },
  {
    role: 'formateur',
    icon: Upload,
    color: 'bg-orange-50 text-[#FFA500] border-orange-100',
    btnColor: 'bg-[#FFA500] hover:bg-orange-500',
    title: 'Guide Formateur',
    subtitle: 'Je veux créer et vendre des formations',
    desc: 'Apprenez à créer vos formations, ajouter vos leçons vidéo, gérer vos apprenants, suivre vos revenus et interagir avec votre communauté.',
    steps: ['Créer votre profil formateur', 'Créer une formation', 'Ajouter des leçons', 'Publier et promouvoir', 'Gérer vos revenus'],
    href: '/aide/formateur',
  },
]

const faqs = [
  { q: 'Comment réinitialiser mon mot de passe ?', a: 'Cliquez sur "Mot de passe oublié ?" sur la page de connexion et suivez les instructions envoyées par email.' },
  { q: 'Les certificats sont-ils reconnus ?', a: 'Oui, les certificats IBIG E-LEARNING sont reconnus par nos entreprises partenaires en Afrique francophone.' },
  { q: 'Quels modes de paiement sont acceptés ?', a: 'Orange Money, MTN Money, Wave, Visa et Mastercard sont acceptés sur la plateforme.' },
  { q: 'Puis-je accéder aux cours hors connexion ?', a: 'L\'accès hors ligne est disponible via l\'application mobile IBIG (bientôt sur les stores).' },
  { q: 'Comment contacter le support ?', a: 'Via l\'assistant SARA (chat en bas de l\'écran), par email à contact@ibig-elearning.com ou via la page Contact.' },
]

export default function AidePage() {
  return (
    <div className="min-h-screen bg-gray-50">

      {/* Hero */}
      <section className="bg-[#0B3D91] text-white py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-4 py-1.5 text-sm font-medium mb-6">
            <MessageCircle className="w-4 h-4" /> Centre d'aide IBIG E-LEARNING
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-4">Comment pouvons-nous vous aider ?</h1>
          <p className="text-blue-200 text-lg mb-8">Guides complets pour chaque profil d'utilisateur</p>
          <div className="flex flex-wrap justify-center gap-3 text-sm">
            {[
              { label: 'Guide Apprenant', href: '/aide/apprenant' },
              { label: 'Guide Formateur', href: '/aide/formateur' },
              { label: 'Contact', href: '/contact' },
            ].map(l => (
              <Link key={l.href} href={l.href}
                className="bg-white/10 hover:bg-white/20 px-4 py-2 rounded-full transition-colors">
                {l.label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Guides par rôle */}
      <section className="max-w-6xl mx-auto px-4 py-16">
        <h2 className="text-2xl font-bold text-gray-900 text-center mb-12">Choisissez votre guide</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {guides.map(g => (
            <div key={g.role} className={`bg-white rounded-2xl border ${g.color.split(' ')[2]} p-6 flex flex-col shadow-sm hover:shadow-md transition-shadow`}>
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${g.color.split(' ')[0]}`}>
                <g.icon className={`w-6 h-6 ${g.color.split(' ')[1]}`} />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-1">{g.title}</h3>
              <p className="text-sm font-medium text-gray-500 mb-3">{g.subtitle}</p>
              <p className="text-sm text-gray-600 mb-5 flex-1">{g.desc}</p>
              <ul className="space-y-2 mb-6">
                {g.steps.map((s, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-gray-700">
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0 ${g.btnColor.split(' ')[0]}`}>{i + 1}</span>
                    {s}
                  </li>
                ))}
              </ul>
              <Link href={g.href}
                className={`flex items-center justify-center gap-2 ${g.btnColor} text-white font-semibold py-3 px-4 rounded-xl transition-colors text-sm`}>
                Lire le guide <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ rapide */}
      <section className="bg-white border-t border-gray-100 py-16">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-10">Questions fréquentes</h2>
          <div className="space-y-4">
            {faqs.map((f, i) => (
              <div key={i} className="bg-gray-50 rounded-xl p-5 border border-gray-100">
                <p className="font-semibold text-gray-900 mb-2">{f.q}</p>
                <p className="text-sm text-gray-600">{f.a}</p>
              </div>
            ))}
          </div>
          <div className="text-center mt-10">
            <Link href="/faq" className="text-[#0B3D91] font-semibold hover:underline">
              Voir toutes les questions →
            </Link>
          </div>
        </div>
      </section>

      {/* CTA contact */}
      <section className="bg-[#0B3D91] text-white py-12">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <h2 className="text-xl font-bold mb-3">Vous n'avez pas trouvé votre réponse ?</h2>
          <p className="text-blue-200 mb-6">Notre équipe et l'assistante SARA sont disponibles 24h/24.</p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/contact"
              className="bg-white text-[#0B3D91] font-bold px-6 py-3 rounded-xl hover:bg-blue-50 transition-colors">
              Contacter le support
            </Link>
            <Link href="/connexion"
              className="border border-white/30 text-white font-semibold px-6 py-3 rounded-xl hover:bg-white/10 transition-colors">
              Parler à SARA
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
