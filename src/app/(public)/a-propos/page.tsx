import Link from 'next/link'
import { Users, Globe, Award, Target, Heart, BookOpen } from 'lucide-react'

export const metadata = { title: 'À propos — IBIG E-LEARN', description: 'Découvrez IBIG E-LEARN, la plateforme panafricaine de formation professionnelle en ligne.' }

const team = [
  { name: 'Équipe IBIG EDUFORM', role: 'Pôle formation du groupe IBIG SARL', initial: 'I' },
  { name: 'Formateurs Experts', role: 'Praticiens reconnus dans leurs domaines', initial: 'F' },
  { name: 'Équipe Technique', role: 'Développement & Support de la plateforme', initial: 'T' },
]

const values = [
  { icon: Target, title: 'Excellence africaine', desc: 'Des formations ancrées dans la réalité économique africaine, pensées pour vos marchés locaux.' },
  { icon: Globe, title: 'Accessibilité', desc: 'Accessibles depuis 12 pays, payables en Mobile Money, pour que personne ne soit laissé de côté.' },
  { icon: Award, title: 'Certification reconnue', desc: 'Des certificats vérifiables en ligne, avec un code unique, reconnus par les employeurs partenaires.' },
  { icon: Heart, title: 'Impact humain', desc: 'Notre mission : transformer des milliers de carrières africaines grâce à la formation continue.' },
]

export default function AProposPage() {
  return (
    <div>
      {/* Hero */}
      <section className="ibig-gradient text-white py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-2 text-sm mb-6">
            <BookOpen className="w-4 h-4" /> Pôle IBIG EDUFORM
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold mb-5">
            Former l'Afrique de demain,<br />
            <span className="text-[#FFA500]">dès aujourd'hui</span>
          </h1>
          <p className="text-blue-100 text-lg max-w-2xl mx-auto leading-relaxed">
            IBIG E-LEARN est la plateforme de formation professionnelle en ligne d'IBIG SARL (Intermark Business International Group), conçue pour répondre aux besoins de développement des compétences en Afrique.
          </p>
        </div>
      </section>

      {/* Notre mission */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Notre mission</h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                Nous croyons que chaque professionnel africain mérite d'accéder à des formations de qualité, sans barrières géographiques, linguistiques ou financières.
              </p>
              <p className="text-gray-600 leading-relaxed mb-4">
                Avec IBIG E-LEARN, nous mettons à la disposition des apprenants des contenus créés par des experts praticiens, disponibles 24h/24 depuis n'importe quel appareil, payables en Mobile Money.
              </p>
              <p className="text-gray-600 leading-relaxed">
                À terme, nous visons <strong>60 000 apprenants actifs</strong> dans <strong>12 pays africains</strong>, avec plus de <strong>150 formations certifiantes</strong> couvrant les secteurs porteurs du continent.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { value: '12', label: 'Pays couverts', icon: Globe },
                { value: '150+', label: 'Formations cibles', icon: BookOpen },
                { value: '60 000', label: 'Apprenants visés', icon: Users },
                { value: '100%', label: 'Certifiants', icon: Award },
              ].map(s => (
                <div key={s.label} className="bg-gray-50 rounded-2xl p-5 text-center">
                  <s.icon className="w-7 h-7 text-[#0B3D91] mx-auto mb-2" />
                  <div className="text-2xl font-bold text-[#0B3D91]">{s.value}</div>
                  <div className="text-sm text-gray-500">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Nos valeurs */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">Nos valeurs</h2>
            <p className="text-gray-500 max-w-xl mx-auto">Les principes qui guident chaque décision de la plateforme</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map(v => (
              <div key={v.title} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <v.icon className="w-9 h-9 text-[#0B3D91] mb-4" />
                <h3 className="font-bold text-gray-900 mb-2">{v.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* L'équipe */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">Notre équipe</h2>
            <p className="text-gray-500">Des professionnels engagés pour votre réussite</p>
          </div>
          <div className="grid sm:grid-cols-3 gap-6 max-w-3xl mx-auto">
            {team.map(m => (
              <div key={m.name} className="bg-gray-50 rounded-2xl p-6 text-center">
                <div className="w-16 h-16 rounded-full ibig-gradient flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">
                  {m.initial}
                </div>
                <h3 className="font-bold text-gray-900 mb-1">{m.name}</h3>
                <p className="text-gray-500 text-sm">{m.role}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Rejoignez l'aventure</h2>
          <p className="text-gray-500 mb-6">Que vous soyez apprenant, formateur ou entreprise, nous avons une solution pour vous.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/inscription" className="ibig-gradient text-white font-semibold px-8 py-3 rounded-xl hover:opacity-90 transition-opacity">
              Commencer gratuitement
            </Link>
            <Link href="/contact" className="border border-[#0B3D91] text-[#0B3D91] font-semibold px-8 py-3 rounded-xl hover:bg-[#0B3D91]/5 transition-colors">
              Nous contacter
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
