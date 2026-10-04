import Link from 'next/link'
import type { Metadata } from 'next'
import { BookOpen, UserPlus, Search, CreditCard, Play, Award, MessageCircle, ChevronRight, Star, BarChart2, Heart } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Guide Apprenant — IBIG E-LEARNING',
  description: 'Guide complet pour démarrer votre formation sur IBIG E-LEARNING : inscription, choix de formation, paiement, certificat.',
}

const steps = [
  {
    num: 1,
    icon: UserPlus,
    title: 'Créer votre compte',
    color: 'bg-blue-100 text-[#0B3D91]',
    content: [
      { label: 'Via Google', desc: 'Cliquez "Continuer avec Google" sur la page de connexion — accès immédiat sans mot de passe.' },
      { label: 'Par email', desc: 'Renseignez votre nom, email, mot de passe et pays. Un email de confirmation vous est envoyé.' },
      { label: 'Compléter votre profil', desc: 'Ajoutez une photo, votre biographie et vos objectifs dans Mon profil → paramètres.' },
    ],
  },
  {
    num: 2,
    icon: Search,
    title: 'Trouver une formation',
    color: 'bg-orange-100 text-[#FFA500]',
    content: [
      { label: 'Catalogue', desc: 'Parcourez les formations par domaine (Marketing, Finance, Tech, Gestion...) depuis le menu "Formations".' },
      { label: 'Recherche', desc: 'Tapez un mot-clé dans la barre de recherche en haut de page pour trouver une formation précise.' },
      { label: 'Parcours métiers', desc: 'Suivez un parcours structuré (ex: "Responsable RH") qui regroupe plusieurs formations complémentaires.' },
      { label: 'Formations vedettes', desc: 'Consultez les formations les mieux notées et les plus suivies dans votre région.' },
    ],
  },
  {
    num: 3,
    icon: CreditCard,
    title: 'S\'inscrire et payer',
    color: 'bg-green-100 text-green-700',
    content: [
      { label: 'Formations gratuites', desc: 'Cliquez "S\'inscrire gratuitement" et commencez immédiatement.' },
      { label: 'Formations payantes', desc: 'Cliquez "S\'inscrire" et choisissez votre mode de paiement : Orange Money, MTN Money, Wave, Visa ou Mastercard.' },
      { label: 'Codes promo', desc: 'Entrez votre code de réduction sur la page de paiement pour bénéficier d\'une remise.' },
      { label: 'Accès à vie', desc: 'Une fois payé, vous avez accès à vie à la formation et à toutes ses mises à jour.' },
    ],
  },
  {
    num: 4,
    icon: Play,
    title: 'Suivre vos cours',
    color: 'bg-purple-100 text-purple-700',
    content: [
      { label: 'Tableau de bord', desc: 'Retrouvez toutes vos formations en cours dans "Mes formations" sur votre tableau de bord.' },
      { label: 'Progression', desc: 'Chaque leçon terminée met à jour votre barre de progression. Vous pouvez reprendre où vous en étiez.' },
      { label: 'Quiz et exercices', desc: 'Répondez aux quiz à la fin de chaque module pour valider vos acquis.' },
      { label: 'Notes personnelles', desc: 'Prenez des notes pendant les cours, accessibles dans "Mes notes" depuis le menu profil.' },
      { label: 'SARA — IA pédagogique', desc: 'Posez vos questions pédagogiques à SARA, l\'assistante IA disponible 24h/24 dans l\'onglet SARA.' },
    ],
  },
  {
    num: 5,
    icon: Award,
    title: 'Obtenir votre certificat',
    color: 'bg-yellow-100 text-yellow-700',
    content: [
      { label: 'Conditions', desc: 'Terminez 100% des leçons et validez le quiz final avec au moins 70% de bonnes réponses.' },
      { label: 'Génération automatique', desc: 'Votre certificat est généré automatiquement avec un code unique de vérification.' },
      { label: 'Téléchargement', desc: 'Téléchargez votre certificat PDF depuis "Mes certificats" dans votre tableau de bord.' },
      { label: 'Vérification', desc: 'Tout employeur peut vérifier l\'authenticité de votre certificat sur ibig-elearning.com/verify.' },
      { label: 'Badges et points', desc: 'Cumulez des points XP et débloquez des badges à chaque formation terminée. Consultez le classement !' },
    ],
  },
]

const tips = [
  { icon: Star, text: 'Ajoutez des formations à vos favoris pour les retrouver facilement' },
  { icon: BarChart2, text: 'Suivez votre streak quotidien pour rester motivé et progresser régulièrement' },
  { icon: MessageCircle, text: 'Utilisez SARA pour obtenir des explications supplémentaires sur vos cours' },
  { icon: Heart, text: 'Parrainez vos amis et gagnez des réductions sur vos prochaines formations' },
]

const faqApprenant = [
  {
    q: 'Comment rejoindre une session live ?',
    a: 'Dans "Sessions live" sur votre tableau de bord, cliquez "Rejoindre" à l\'heure prévue. Un lien de visioconférence s\'ouvre automatiquement.',
  },
  {
    q: 'Puis-je changer de devise ou de pays ?',
    a: 'Oui — cliquez sur le sélecteur de devise en haut de page (ex: XOF, EUR, USD). Votre pays peut être modifié dans Mon profil → Paramètres.',
  },
  {
    q: 'Comment accéder à la plateforme sur mobile ?',
    a: 'Téléchargez l\'application IBIG E-LEARNING (bientôt sur Play Store et App Store). En attendant, le site est entièrement responsive sur votre navigateur mobile.',
  },
  {
    q: 'Je veux un remboursement — que faire ?',
    a: 'Contactez le support à contact@ibig-elearning.com dans les 7 jours suivant l\'achat si vous n\'avez pas regardé plus de 20% du contenu. Notre équipe traite la demande sous 48h.',
  },
  {
    q: 'Mon paiement Mobile Money a été débité mais je n\'ai pas accès à la formation ?',
    a: 'Vérifiez votre email de confirmation. Si rien n\'est reçu après 15 minutes, contactez le support avec votre numéro de transaction Mobile Money.',
  },
  {
    q: 'Comment fonctionne le programme de parrainage ?',
    a: 'Dans "Parrainage" sur votre tableau de bord, copiez votre lien unique. Pour chaque ami inscrit via votre lien, vous recevez des crédits IBIG utilisables sur vos prochaines formations.',
  },
  {
    q: 'Puis-je suivre plusieurs formations en même temps ?',
    a: 'Oui, sans limite. Chaque formation a sa propre progression indépendante. Gérez tout depuis "Mes formations" sur votre tableau de bord.',
  },
  {
    q: 'Mon certificat ne se génère pas — que faire ?',
    a: 'Vérifiez que toutes les leçons sont marquées "terminées" et que vous avez validé le quiz final. Si le problème persiste, contactez le support avec le nom de la formation.',
  },
]

export default function GuideApprenantPage() {
  return (
    <div className="min-h-screen bg-gray-50">

      {/* Header */}
      <div className="bg-[#0B3D91] text-white py-12">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex items-center gap-2 text-blue-200 text-sm mb-4">
            <Link href="/aide" className="hover:text-white">Centre d'aide</Link>
            <ChevronRight className="w-4 h-4" />
            <span>Guide Apprenant</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center flex-shrink-0">
              <BookOpen className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">Guide Apprenant</h1>
              <p className="text-blue-200 mt-1">Tout ce qu'il faut savoir pour commencer votre formation en ligne</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-12">

        {/* Étapes */}
        <div className="space-y-8">
          {steps.map(step => (
            <div key={step.num} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="flex items-center gap-4 p-6 border-b border-gray-50">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${step.color}`}>
                  <step.icon className="w-5 h-5" />
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Étape {step.num}</span>
                  <h2 className="text-lg font-bold text-gray-900">{step.title}</h2>
                </div>
              </div>
              <div className="p-6 grid sm:grid-cols-2 gap-4">
                {step.content.map((c, i) => (
                  <div key={i} className="flex gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#0B3D91] mt-2 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-gray-800">{c.label}</p>
                      <p className="text-sm text-gray-500 mt-0.5">{c.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Astuces */}
        <div className="mt-10 bg-blue-50 rounded-2xl p-6 border border-blue-100">
          <h3 className="font-bold text-[#0B3D91] mb-4">💡 Astuces pour progresser rapidement</h3>
          <div className="grid sm:grid-cols-2 gap-3">
            {tips.map((t, i) => (
              <div key={i} className="flex items-start gap-3">
                <t.icon className="w-4 h-4 text-[#0B3D91] mt-0.5 flex-shrink-0" />
                <p className="text-sm text-gray-700">{t.text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ */}
        <div className="mt-10">
          <h3 className="text-xl font-bold text-gray-900 mb-6">Questions fréquentes</h3>
          <div className="space-y-4">
            {faqApprenant.map((item, i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                <p className="font-semibold text-gray-900 mb-2">❓ {item.q}</p>
                <p className="text-sm text-gray-600 leading-relaxed">{item.a}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Contact support */}
        <div className="mt-8 bg-gradient-to-r from-[#0B3D91] to-blue-700 rounded-2xl p-6 text-white">
          <h3 className="font-bold text-lg mb-2">Besoin d'aide supplémentaire ?</h3>
          <p className="text-blue-200 text-sm mb-4">Notre équipe support répond sous 24h en semaine.</p>
          <div className="flex flex-wrap gap-3">
            <a href="mailto:contact@ibig-elearning.com"
              className="bg-white text-[#0B3D91] font-semibold px-5 py-2.5 rounded-xl text-sm hover:bg-blue-50 transition-colors">
              ✉️ Envoyer un email
            </a>
            <Link href="/contact"
              className="border border-white/40 text-white font-semibold px-5 py-2.5 rounded-xl text-sm hover:bg-white/10 transition-colors">
              📝 Formulaire de contact
            </Link>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/catalogue"
            className="bg-[#0B3D91] text-white font-bold px-6 py-3 rounded-xl hover:bg-blue-800 transition-colors">
            Découvrir le catalogue
          </Link>
          <Link href="/inscription"
            className="border border-[#0B3D91] text-[#0B3D91] font-semibold px-6 py-3 rounded-xl hover:bg-blue-50 transition-colors">
            Créer mon compte gratuit
          </Link>
        </div>
      </div>
    </div>
  )
}
