import Link from 'next/link'
import type { Metadata } from 'next'
import { Upload, User, BookOpen, Video, DollarSign, Users, BarChart2, ChevronRight, Lightbulb, Tag } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Guide Formateur — IBIG E-LEARNING',
  description: 'Guide complet pour créer et vendre vos formations sur IBIG E-LEARNING : profil, création de cours, leçons vidéo, revenus.',
}

const steps = [
  {
    num: 1,
    icon: User,
    title: 'Configurer votre profil formateur',
    color: 'bg-orange-100 text-[#FFA500]',
    content: [
      { label: 'Demander le statut formateur', desc: 'Connectez-vous et rendez-vous sur /devenir-formateur. L\'équipe IBIG valide votre demande sous 48h.' },
      { label: 'Compléter votre biographie', desc: 'Ajoutez une photo professionnelle, votre biographie, vos expertises et vos certifications dans Mon profil.' },
      { label: 'Accéder à l\'espace formateur', desc: 'Après validation, un bouton "Espace formateur" apparaît dans votre menu profil → /formateur.' },
    ],
  },
  {
    num: 2,
    icon: BookOpen,
    title: 'Créer une formation',
    color: 'bg-blue-100 text-[#0B3D91]',
    content: [
      { label: 'Nouvelle formation', desc: 'Dans /formateur/formations → "Nouvelle formation". Renseignez titre, catégorie, niveau et description courte.' },
      { label: 'Description complète', desc: 'Rédigez une description détaillée avec les objectifs pédagogiques, le public cible et les prérequis.' },
      { label: 'Image de couverture', desc: 'Uploadez une image au format 16:9 (1280×720 minimum) qui représente visuellement votre formation.' },
      { label: 'Tarification', desc: 'Définissez le prix en FCFA ou rendez la formation gratuite. Vous pouvez aussi créer des codes promo.' },
      { label: 'Langue et niveau', desc: 'Choisissez la langue (français, anglais) et le niveau : Débutant, Intermédiaire ou Avancé.' },
    ],
  },
  {
    num: 3,
    icon: Video,
    title: 'Ajouter vos leçons',
    color: 'bg-purple-100 text-purple-700',
    content: [
      { label: 'Créer des modules', desc: 'Organisez votre formation en modules thématiques (ex: Module 1 - Introduction, Module 2 - Pratique...).' },
      { label: 'Ajouter des leçons vidéo', desc: 'Uploadez vos vidéos MP4 directement depuis /formateur/formations/[id]/lecons. Les vidéos sont hébergées sur Bunny Stream.' },
      { label: 'Leçons texte', desc: 'Créez des leçons en texte enrichi pour les contenus théoriques, exercices téléchargeables ou ressources complémentaires.' },
      { label: 'Aperçu gratuit', desc: 'Marquez 1 ou 2 leçons comme "aperçu gratuit" pour donner un avant-goût aux futurs apprenants.' },
      { label: 'Quiz', desc: 'Ajoutez des questions QCM à la fin de chaque module depuis /formateur/quiz/[lessonId].' },
    ],
  },
  {
    num: 4,
    icon: Upload,
    title: 'Publier et promouvoir',
    color: 'bg-green-100 text-green-700',
    content: [
      { label: 'Soumettre pour validation', desc: 'Cliquez "Soumettre" quand votre formation est prête. L\'équipe IBIG la vérifie et la publie sous 48h.' },
      { label: 'Codes promo', desc: 'Créez des codes de réduction depuis /formateur/coupons pour les partager sur vos réseaux sociaux.' },
      { label: 'Notifier vos apprenants', desc: 'Depuis /formateur/notifier, envoyez une notification push à tous vos inscrits lors d\'une mise à jour.' },
      { label: 'Sessions live', desc: 'Planifiez des sessions live de questions-réponses avec vos apprenants depuis /formateur/sessions-live.' },
    ],
  },
  {
    num: 5,
    icon: DollarSign,
    title: 'Gérer vos revenus',
    color: 'bg-yellow-100 text-yellow-700',
    content: [
      { label: 'Tableau des revenus', desc: 'Consultez vos ventes en temps réel dans /formateur/revenus : CA mensuel, nombre d\'inscrits, taux de complétion.' },
      { label: 'Commission IBIG', desc: 'IBIG retient 30% sur chaque vente. Vous percevez 70% du prix de vente net.' },
      { label: 'Demande de virement', desc: 'Quand votre solde atteint 50 000 FCFA, faites une demande de virement depuis /formateur/virements.' },
      { label: 'Statistiques avancées', desc: 'Analysez la performance de chaque formation (vues, complétion, notes) dans /formateur/analytics/[courseId].' },
    ],
  },
  {
    num: 6,
    icon: Users,
    title: 'Gérer vos apprenants',
    color: 'bg-red-100 text-red-700',
    content: [
      { label: 'Liste des apprenants', desc: 'Consultez tous vos inscrits, leur progression et leurs notes dans /formateur/apprenants.' },
      { label: 'Messagerie', desc: 'Répondez aux questions de vos apprenants dans /formateur/messagerie. Un délai de 48h est recommandé.' },
      { label: 'Avis et notations', desc: 'Lisez et répondez aux avis laissés sur vos formations pour améliorer votre note et votre visibilité.' },
    ],
  },
]

export default function GuideFormateurPage() {
  return (
    <div className="min-h-screen bg-gray-50">

      <div className="bg-[#FFA500] text-white py-12">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex items-center gap-2 text-orange-100 text-sm mb-4">
            <Link href="/aide" className="hover:text-white">Centre d'aide</Link>
            <ChevronRight className="w-4 h-4" />
            <span>Guide Formateur</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center flex-shrink-0">
              <Upload className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">Guide Formateur</h1>
              <p className="text-orange-100 mt-1">Créez, publiez et monétisez vos formations sur IBIG E-LEARNING</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-12">

        {/* Revenus mise en avant */}
        <div className="bg-gradient-to-r from-orange-50 to-yellow-50 rounded-2xl p-6 border border-orange-100 mb-10 flex flex-wrap gap-6 items-center">
          <div>
            <p className="text-sm text-gray-500 mb-1">Votre part sur chaque vente</p>
            <p className="text-4xl font-black text-[#FFA500]">70%</p>
          </div>
          <div className="flex-1 min-w-48">
            <p className="text-sm text-gray-700">Vendez une formation à <strong>25 000 FCFA</strong> → vous gagnez <strong>17 500 FCFA</strong> par inscription. Pas de plafond.</p>
          </div>
          <Link href="/devenir-formateur"
            className="bg-[#FFA500] text-white font-bold px-5 py-3 rounded-xl hover:bg-orange-500 transition-colors whitespace-nowrap">
            Devenir formateur →
          </Link>
        </div>

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
                    <div className="w-1.5 h-1.5 rounded-full bg-[#FFA500] mt-2 flex-shrink-0" />
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

        <div className="mt-10 bg-orange-50 rounded-2xl p-6 border border-orange-100">
          <h3 className="font-bold text-[#FFA500] mb-4">💡 Conseils pour maximiser vos ventes</h3>
          <ul className="space-y-2">
            {[
              'Publiez au moins 5h de contenu vidéo par formation — les apprenants perçoivent plus de valeur',
              'Répondez aux questions en moins de 24h pour obtenir de meilleures notes',
              'Créez des codes promo à -20% pour le lancement de chaque nouvelle formation',
              'Mettez à jour régulièrement vos formations pour rester dans les recommandations',
              'Rejoignez notre programme d\'ambassadeurs pour doubler votre visibilité',
            ].map((t, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                <Lightbulb className="w-4 h-4 text-[#FFA500] mt-0.5 flex-shrink-0" />
                {t}
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/formateur"
            className="bg-[#FFA500] text-white font-bold px-6 py-3 rounded-xl hover:bg-orange-500 transition-colors">
            Accéder à mon espace formateur
          </Link>
          <Link href="/aide"
            className="border border-gray-200 text-gray-700 font-semibold px-6 py-3 rounded-xl hover:bg-gray-50 transition-colors">
            ← Retour au centre d'aide
          </Link>
        </div>
      </div>
    </div>
  )
}
