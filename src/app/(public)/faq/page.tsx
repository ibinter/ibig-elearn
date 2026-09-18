'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp, Search, MessageCircle } from 'lucide-react'
import Link from 'next/link'

const FAQ = [
  {
    category: 'Inscription & Compte',
    items: [
      { q: "Comment créer un compte sur IBIG E-LEARN ?", a: "Cliquez sur \"S'inscrire gratuitement\" en haut de la page. Vous pouvez vous inscrire avec votre email ou directement avec votre compte Google en un clic." },
      { q: "L'inscription est-elle gratuite ?", a: "Oui, la création de compte est 100% gratuite. Certaines formations sont également gratuites. Pour les formations payantes, vous réglez uniquement à l'inscription à la formation." },
      { q: "J'ai oublié mon mot de passe, que faire ?", a: "Cliquez sur \"Connexion\" puis sur \"Mot de passe oublié\". Vous recevrez un email de réinitialisation en quelques minutes. Vérifiez aussi vos spams." },
      { q: "Puis-je me connecter avec Google ?", a: "Oui ! Sur la page de connexion ou d'inscription, cliquez sur \"Continuer avec Google\" pour vous connecter instantanément sans créer de mot de passe." },
    ]
  },
  {
    category: 'Formations & Apprentissage',
    items: [
      { q: "Comment accéder à mes formations ?", a: "Après inscription et paiement (si la formation est payante), rendez-vous dans \"Mes formations\" depuis votre tableau de bord. Vos formations sont disponibles 24h/24." },
      { q: "Les formations sont-elles disponibles hors ligne ?", a: "IBIG E-LEARN est une Progressive Web App (PWA). Installez-la sur votre téléphone depuis votre navigateur pour une meilleure expérience. Le contenu vidéo nécessite une connexion internet." },
      { q: "Combien de temps ai-je accès à une formation ?", a: "L'accès est illimité dans le temps. Une fois inscrit, vous pouvez reprendre la formation quand vous voulez, sans date d'expiration." },
      { q: "Comment obtenir mon certificat ?", a: "Votre certificat est émis automatiquement dès que vous atteignez 100% de complétion de la formation. Vous le trouverez dans la section \"Mes certificats\" et vous recevrez une notification." },
      { q: "Puis-je poser des questions à l'assistant SARA ?", a: "Oui ! SARA est notre assistante IA disponible dans chaque leçon. Cliquez sur l'icône de chat pendant votre formation pour poser vos questions pédagogiques en temps réel." },
      { q: "Comment fonctionne le système de points et de niveaux ?", a: "Vous gagnez des points en complétant des leçons, des formations, en maintenant votre streak quotidien et en parrainant des amis. Les points vous font monter de niveau (Débutant → Expert) et peuvent être échangés contre des récompenses." },
    ]
  },
  {
    category: 'Paiement & Tarifs',
    items: [
      { q: "Quels modes de paiement acceptez-vous ?", a: "Nous acceptons Orange Money, MTN Mobile Money, Wave, Moov Money ainsi que les cartes bancaires (Visa, Mastercard) dans toute la zone UEMOA et CEMAC." },
      { q: "Les prix sont-ils affichés en quelle devise ?", a: "Les prix s'affichent automatiquement dans votre devise locale (XOF, XAF, EUR, USD, etc.). Utilisez le sélecteur de devise en haut de page pour changer." },
      { q: "Puis-je obtenir une facture ?", a: "Oui, une facture est générée automatiquement après chaque paiement. Retrouvez-la dans votre espace \"Paiements\" sur votre tableau de bord." },
      { q: "Y a-t-il des codes promo ou réductions ?", a: "Oui ! Consultez la section \"Fidélité\" pour échanger vos points contre des réductions. Des codes promo sont aussi régulièrement publiés sur nos réseaux sociaux." },
    ]
  },
  {
    category: 'Certificats & Reconnaissance',
    items: [
      { q: "Les certificats sont-ils reconnus par les entreprises ?", a: "Les certificats IBIG E-LEARN sont reconnus par les entreprises partenaires d'IBIG EDUFORM en Côte d'Ivoire et dans les pays couverts. Chaque certificat comporte un QR code de vérification d'authenticité." },
      { q: "Comment vérifier l'authenticité d'un certificat ?", a: "Chaque certificat a un code de vérification unique. Scannez le QR code ou rendez-vous sur ibig-elearn.vercel.app/verify et entrez le code pour vérifier instantanément." },
      { q: "Puis-je partager mon certificat sur LinkedIn ?", a: "Absolument ! Sur la page de votre certificat, cliquez sur le bouton LinkedIn pour le partager directement sur votre profil professionnel." },
    ]
  },
  {
    category: 'Formateurs',
    items: [
      { q: "Comment devenir formateur sur IBIG E-LEARN ?", a: "Envoyez votre candidature via la page \"Devenir formateur\". Notre équipe examine votre profil et vous contacte sous 5 jours ouvrés. Pas besoin d'être une grande entreprise — les experts indépendants sont les bienvenus !" },
      { q: "Quelle est la rémunération des formateurs ?", a: "Les formateurs reçoivent un pourcentage des ventes de leurs formations. La commission exacte est définie dans votre contrat formateur lors de l'intégration." },
      { q: "Quels outils ont les formateurs pour créer leurs cours ?", a: "L'espace formateur inclut un éditeur de formation complet (modules, leçons, quiz), l'upload vidéo via Bunny Stream, un tableau de bord analytique et la possibilité d'envoyer des notifications aux apprenants." },
    ]
  },
  {
    category: 'Technique & Support',
    items: [
      { q: "La plateforme fonctionne-t-elle sur mobile ?", a: "Oui ! IBIG E-LEARN est optimisée pour mobile. Vous pouvez aussi l'installer comme application (PWA) depuis Chrome sur Android ou Safari sur iPhone." },
      { q: "J'ai un problème technique, qui contacter ?", a: "Utilisez le formulaire de contact sur /contact ou écrivez à support@ibiglearn.com. Vous pouvez aussi utiliser SARA pour les questions courantes." },
      { q: "La vidéo ne se charge pas, que faire ?", a: "Vérifiez votre connexion internet. Si le problème persiste, essayez de vider le cache du navigateur ou d'utiliser un autre navigateur (Chrome recommandé). Contactez le support si cela continue." },
    ]
  },
]

export default function FAQPage() {
  const [open, setOpen] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  const filtered = search.length > 2
    ? FAQ.map(cat => ({ ...cat, items: cat.items.filter(i => i.q.toLowerCase().includes(search.toLowerCase()) || i.a.toLowerCase().includes(search.toLowerCase())) })).filter(cat => cat.items.length > 0)
    : FAQ

  const totalItems = FAQ.reduce((s, c) => s + c.items.length, 0)

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      {/* Header */}
      <div className="text-center mb-10">
        <div className="w-14 h-14 ibig-gradient rounded-2xl flex items-center justify-center mx-auto mb-4">
          <MessageCircle className="w-7 h-7 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Questions fréquentes</h1>
        <p className="text-gray-500">{totalItems} questions répondues — Si vous ne trouvez pas votre réponse, <Link href="/contact" className="text-[#0B3D91] hover:underline">contactez-nous</Link>.</p>
      </div>

      {/* Recherche */}
      <div className="relative mb-8">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Rechercher une question..."
          className="w-full pl-12 pr-4 py-3.5 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#0B3D91] text-sm bg-white shadow-sm"
        />
      </div>

      {/* Catégories */}
      <div className="space-y-6">
        {filtered.map(cat => (
          <div key={cat.category}>
            <h2 className="text-sm font-bold text-[#0B3D91] uppercase tracking-wider mb-3 px-1">{cat.category}</h2>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden divide-y divide-gray-50">
              {cat.items.map((item, idx) => {
                const key = `${cat.category}-${idx}`
                const isOpen = open === key
                return (
                  <div key={idx}>
                    <button
                      onClick={() => setOpen(isOpen ? null : key)}
                      className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-gray-50/60 transition-colors gap-4"
                    >
                      <span className="font-medium text-gray-900 text-sm leading-snug">{item.q}</span>
                      {isOpen
                        ? <ChevronUp className="w-4 h-4 text-[#0B3D91] flex-shrink-0" />
                        : <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />}
                    </button>
                    {isOpen && (
                      <div className="px-5 pb-5 text-sm text-gray-600 leading-relaxed bg-gray-50/40 border-t border-gray-50">
                        <p className="pt-3">{item.a}</p>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-400">Aucun résultat pour &quot;{search}&quot;</p>
            <Link href="/contact" className="mt-3 inline-block text-[#0B3D91] font-semibold hover:underline text-sm">
              Poser votre question directement →
            </Link>
          </div>
        )}
      </div>

      {/* CTA support */}
      <div className="mt-10 ibig-gradient rounded-2xl p-6 text-white text-center">
        <h3 className="font-bold text-lg mb-1">Vous n'avez pas trouvé votre réponse ?</h3>
        <p className="text-blue-200 text-sm mb-4">Notre équipe répond sous 24h ouvrées.</p>
        <div className="flex justify-center gap-3">
          <Link href="/contact" className="bg-white text-[#0B3D91] font-semibold text-sm px-5 py-2.5 rounded-xl hover:bg-gray-100 transition-colors">
            Nous contacter
          </Link>
          <Link href="/tableau-de-bord" className="border border-white/40 text-white font-semibold text-sm px-5 py-2.5 rounded-xl hover:bg-white/10 transition-colors">
            Assistant SARA
          </Link>
        </div>
      </div>
    </div>
  )
}
