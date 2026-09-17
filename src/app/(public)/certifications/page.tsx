import Link from 'next/link'
import { Award, CheckCircle, Shield, QrCode, Globe, BookOpen } from 'lucide-react'

export const metadata = { title: 'Certifications — IBIG E-LEARN', description: 'Découvrez nos certifications professionnelles vérifiables, reconnues dans 12 pays africains.' }

export default function CertificationsPage() {
  return (
    <div>
      {/* Hero */}
      <section className="ibig-gradient text-white py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="w-16 h-16 rounded-full bg-[#FFA500]/20 flex items-center justify-center mx-auto mb-5">
            <Award className="w-8 h-8 text-[#FFA500]" />
          </div>
          <h1 className="text-4xl font-bold mb-4">Certifications IBIG E-LEARN</h1>
          <p className="text-blue-100 text-lg max-w-2xl mx-auto">
            Chaque certificat délivré porte un code unique vérifiable en ligne. Prouvez vos compétences à vos employeurs et partenaires partout en Afrique.
          </p>
        </div>
      </section>

      {/* Comment ça marche */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">Comment fonctionne la certification ?</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { step: '01', icon: BookOpen, title: 'Suivez la formation', desc: 'Complétez 100% des modules, vidéos, quiz et devoirs.' },
              { step: '02', icon: CheckCircle, title: 'Réussissez l\'évaluation', desc: 'Validez l\'évaluation finale avec la note minimale requise.' },
              { step: '03', icon: Award, title: 'Recevez votre certificat', desc: 'Votre certificat est automatiquement généré et envoyé par email.' },
              { step: '04', icon: QrCode, title: 'Partagez & vérifiez', desc: 'Partagez le code ou le lien de vérification en toute confiance.' },
            ].map(item => (
              <div key={item.step} className="text-center">
                <div className="w-14 h-14 rounded-2xl ibig-gradient flex items-center justify-center mx-auto mb-4 relative">
                  <item.icon className="w-7 h-7 text-white" />
                  <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-[#FFA500] flex items-center justify-center text-xs font-bold text-black">
                    {item.step}
                  </span>
                </div>
                <h3 className="font-bold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-gray-500 text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Avantages */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Un certificat qui a de la valeur</h2>
              <div className="space-y-4">
                {[
                  { icon: Shield, title: 'Anti-fraude', desc: 'Chaque code est unique et cryptographiquement sécurisé. Impossible à falsifier.' },
                  { icon: Globe, title: 'Vérification publique', desc: 'N\'importe qui peut vérifier l\'authenticité de votre certificat sur ibiglearn.com/verify.' },
                  { icon: Award, title: 'Reconnu par les employeurs', desc: 'Nos certificats sont reconnus par nos partenaires entreprises dans 12 pays africains.' },
                  { icon: CheckCircle, title: 'Valable à vie', desc: 'Votre certificat ne expire jamais et reste vérifiable indéfiniment sur notre plateforme.' },
                ].map(item => (
                  <div key={item.title} className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-[#0B3D91]/10 flex items-center justify-center flex-shrink-0">
                      <item.icon className="w-5 h-5 text-[#0B3D91]" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-0.5">{item.title}</h3>
                      <p className="text-gray-500 text-sm">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {/* Sample cert */}
            <div className="bg-gradient-to-br from-[#0B3D91] to-[#1a6cc4] rounded-3xl p-8 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 w-48 h-48 rounded-full bg-white/5 -translate-y-1/4 translate-x-1/4" />
              <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full bg-[#FFA500]/10 translate-y-1/4 -translate-x-1/4" />
              <div className="relative">
                <p className="text-xs text-blue-300 uppercase tracking-widest mb-3">Certificat de réussite</p>
                <h3 className="text-xl font-bold mb-1">Formation Excel Avancé</h3>
                <p className="text-blue-200 text-sm mb-6">Maîtrise des tableaux croisés dynamiques et automatisation VBA</p>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center font-bold">K</div>
                  <div>
                    <p className="font-semibold text-sm">Kouassi Ama</p>
                    <p className="text-blue-300 text-xs">Côte d'Ivoire</p>
                  </div>
                </div>
                <div className="bg-white/10 rounded-xl p-3 font-mono text-sm text-[#FFA500] font-bold tracking-wider">
                  IBIG-XXXX-YYYY-ZZZZ
                </div>
                <p className="text-blue-300 text-xs mt-3">Délivré le 17 septembre 2026 · ibiglearn.com</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Vérifier un certificat */}
      <section className="py-16 bg-white">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Vérifier un certificat</h2>
          <p className="text-gray-500 mb-6 text-sm">Entrez le code de vérification pour confirmer l'authenticité d'un certificat IBIG E-LEARN.</p>
          <div className="flex gap-3 max-w-md mx-auto">
            <form action="" className="flex gap-3 w-full">
              <input
                type="text"
                placeholder="Code de vérification (ex: IBIG-XXXX-...)"
                className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0B3D91] text-sm"
              />
              <Link href="/verify/exemple" className="ibig-gradient text-white font-semibold px-5 py-3 rounded-xl hover:opacity-90 transition-opacity whitespace-nowrap text-sm">
                Vérifier
              </Link>
            </form>
          </div>
          <p className="text-xs text-gray-400 mt-3">Ou accédez directement : ibiglearn.com/verify/[code]</p>
        </div>
      </section>

      {/* CTA */}
      <section className="py-12 bg-gray-50">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Commencez à vous certifier</h2>
          <Link href="/catalogue" className="ibig-gradient text-white font-semibold px-8 py-3 rounded-xl hover:opacity-90 transition-opacity inline-block">
            Explorer les formations certifiantes
          </Link>
        </div>
      </section>
    </div>
  )
}
