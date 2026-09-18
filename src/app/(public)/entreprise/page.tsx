import type { Metadata } from 'next'
import Link from 'next/link'
import { Building2, Users, Award, BarChart3, CheckCircle, Phone, Mail, ArrowRight, Shield, Globe } from 'lucide-react'
import B2BContactForm from './B2BContactForm'

export const metadata: Metadata = {
  title: 'IBIG E-LEARN Entreprise — Formation en groupe pour vos équipes',
  description: 'Formez vos équipes avec IBIG E-LEARN Entreprise. Accès multi-utilisateurs, suivi des progressions, certificats personnalisés. Devis sur mesure pour PME et grandes entreprises en Afrique.',
  keywords: ['formation entreprise Afrique', 'e-learning B2B', 'formation équipe Afrique', 'corporate learning Afrique'],
}

const ADVANTAGES = [
  {
    icon: <Users className="w-6 h-6 text-[#0B3D91]" />,
    title: 'Accès multi-utilisateurs',
    desc: 'Gérez tous vos collaborateurs depuis un tableau de bord centralisé. Ajoutez ou retirez des membres en quelques clics.',
  },
  {
    icon: <BarChart3 className="w-6 h-6 text-[#0B3D91]" />,
    title: 'Suivi des progressions',
    desc: 'Visualisez en temps réel la progression de chaque collaborateur, les formations complétées et les certificats obtenus.',
  },
  {
    icon: <Award className="w-6 h-6 text-[#FFA500]" />,
    title: 'Certificats à votre image',
    desc: 'Option de certificats co-brandés avec le logo de votre entreprise pour valoriser les formations de vos équipes.',
  },
  {
    icon: <Shield className="w-6 h-6 text-[#0B3D91]" />,
    title: 'Tarifs dégressifs',
    desc: 'Plus vous formez de collaborateurs, plus le prix par personne diminue. À partir de 5 apprenants.',
  },
  {
    icon: <Globe className="w-6 h-6 text-[#FFA500]" />,
    title: 'Multi-pays',
    desc: 'Formez des équipes dispersées dans 12 pays africains. Paiement centralisé en XOF, EUR ou USD.',
  },
  {
    icon: <Phone className="w-6 h-6 text-[#0B3D91]" />,
    title: 'Accompagnement dédié',
    desc: 'Un responsable de compte IBIG suit votre entreprise, organise les formations et reporte les résultats.',
  },
]

const PLANS = [
  {
    name: 'Équipe',
    seats: '5 à 20 apprenants',
    price: 'À partir de 75 000 XOF/mois',
    features: ['Accès illimité au catalogue', 'Tableau de bord entreprise', 'Rapports mensuels', 'Support email'],
    highlight: false,
  },
  {
    name: 'Entreprise',
    seats: '21 à 100 apprenants',
    price: 'Sur devis',
    features: ['Tout le plan Équipe', 'Certificats co-brandés', 'Responsable de compte dédié', 'Formations sur mesure', 'API d\'intégration RH'],
    highlight: true,
  },
  {
    name: 'Grand Compte',
    seats: '100+ apprenants',
    price: 'Sur devis',
    features: ['Tout le plan Entreprise', 'Plateforme en marque blanche', 'Intégration SIRH', 'SLA garanti', 'Formation des formateurs'],
    highlight: false,
  },
]

const CLIENTS_SECTORS = [
  'Banques & Microfinance', 'Télécoms', 'Agroalimentaire', 'Immobilier',
  'ONG & Associations', 'Santé', 'Distribution & Retail', 'Administration publique',
]

export default function EntreprisePage() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="ibig-gradient text-white py-20 px-4">
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-4 py-2 text-sm font-medium mb-6">
            <Building2 className="w-4 h-4" /> Solution B2B Entreprise
          </div>
          <h1 className="text-3xl sm:text-5xl font-bold leading-tight mb-5">
            Formez vos équipes avec<br />
            <span className="text-[#FFA500]">la référence africaine</span> de l'e-learning
          </h1>
          <p className="text-xl text-blue-100 max-w-2xl mx-auto mb-8">
            Accès multi-utilisateurs, suivi en temps réel, certificats co-brandés.
            La solution de formation professionnelle conçue pour les entreprises africaines.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="#contact" className="bg-[#FFA500] text-black font-bold px-8 py-4 rounded-xl hover:bg-yellow-400 transition-colors text-lg">
              Demander un devis gratuit
            </a>
            <Link href="/catalogue" className="border-2 border-white/30 text-white font-semibold px-8 py-4 rounded-xl hover:bg-white/10 transition-colors text-lg">
              Voir le catalogue
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-white border-b border-gray-100 py-8 px-4">
        <div className="max-w-4xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
          {[
            { value: '12', label: 'pays couverts' },
            { value: '500+', label: 'formations disponibles' },
            { value: '50 000+', label: 'apprenants formés' },
            { value: '98%', label: 'de satisfaction' },
          ].map((s, i) => (
            <div key={i}>
              <div className="text-3xl font-black text-[#0B3D91]">{s.value}</div>
              <div className="text-sm text-gray-500 mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Avantages */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 text-center mb-3">Tout ce dont votre entreprise a besoin</h2>
          <p className="text-gray-500 text-center mb-10 max-w-xl mx-auto">Une solution complète, clé en main, adaptée aux réalités africaines.</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {ADVANTAGES.map((a, i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-200 p-6">
                <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center mb-4">{a.icon}</div>
                <h3 className="font-bold text-gray-900 mb-2">{a.title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{a.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Plans */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 text-center mb-3">Nos offres entreprise</h2>
          <p className="text-gray-500 text-center mb-10">Choisissez le plan adapté à la taille de vos équipes</p>
          <div className="grid sm:grid-cols-3 gap-6">
            {PLANS.map((plan, i) => (
              <div key={i} className={`rounded-2xl border-2 p-6 flex flex-col ${plan.highlight ? 'border-[#0B3D91] bg-[#0B3D91]/2 relative' : 'border-gray-200'}`}>
                {plan.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#FFA500] text-black text-xs font-bold px-4 py-1 rounded-full">
                    Le plus populaire
                  </div>
                )}
                <h3 className={`text-xl font-bold mb-1 ${plan.highlight ? 'text-[#0B3D91]' : 'text-gray-900'}`}>{plan.name}</h3>
                <p className="text-sm text-gray-500 mb-3">{plan.seats}</p>
                <p className="font-bold text-lg text-gray-900 mb-5">{plan.price}</p>
                <ul className="space-y-2 flex-1 mb-6">
                  {plan.features.map((f, j) => (
                    <li key={j} className="flex items-start gap-2 text-sm text-gray-700">
                      <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />{f}
                    </li>
                  ))}
                </ul>
                <a
                  href="#contact"
                  className={`block text-center font-semibold py-3 rounded-xl transition-colors text-sm ${
                    plan.highlight
                      ? 'ibig-gradient text-white hover:opacity-90'
                      : 'border-2 border-gray-200 text-gray-700 hover:border-[#0B3D91] hover:text-[#0B3D91]'
                  }`}
                >
                  Demander un devis
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Secteurs */}
      <section className="py-12 px-4 bg-gray-50">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Secteurs qui nous font confiance</h2>
          <div className="flex flex-wrap justify-center gap-3">
            {CLIENTS_SECTORS.map(s => (
              <span key={s} className="bg-white border border-gray-200 text-gray-700 text-sm font-medium px-4 py-2 rounded-full">
                {s}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Formulaire contact */}
      <section id="contact" className="py-16 px-4 bg-white">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Demandez votre devis gratuit</h2>
            <p className="text-gray-500">Notre équipe vous répond sous 24h avec une proposition personnalisée.</p>
          </div>
          <B2BContactForm />
        </div>
      </section>
    </div>
  )
}
