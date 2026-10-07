import Link from 'next/link'
import type { Metadata } from 'next'
import { Upload, User, BookOpen, Video, DollarSign, Users, BarChart2, ChevronRight, Lightbulb, Tag, AlertTriangle, CheckCircle, FileText, Settings } from 'lucide-react'

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
      { label: 'Demander le statut formateur', desc: 'Connectez-vous et rendez-vous sur /devenir-formateur. L\'équipe IBIG valide votre demande sous 48h ouvrables.' },
      { label: 'Compléter votre biographie', desc: 'Ajoutez une photo professionnelle, votre biographie (min 150 mots), vos expertises et vos certifications dans Mon profil.' },
      { label: 'Accéder à l\'espace formateur', desc: 'Après validation, un bouton "Espace formateur" apparaît dans votre menu profil → /formateur.' },
      { label: 'Vérification de l\'identité', desc: 'Pour recevoir des virements, vous devez vérifier votre identité (pièce d\'identité + justificatif de domicile) dans /formateur/virements.' },
    ],
  },
  {
    num: 2,
    icon: BookOpen,
    title: 'Créer une formation',
    color: 'bg-blue-100 text-[#0B3D91]',
    content: [
      { label: 'Nouvelle formation', desc: 'Dans /formateur/formations → "Nouvelle formation". Renseignez titre, catégorie, niveau et description courte (160 caractères).' },
      { label: 'Description complète', desc: 'Rédigez une description détaillée avec les objectifs pédagogiques, le public cible et les prérequis (min 300 mots recommandé).' },
      { label: 'Image de couverture', desc: 'Uploadez une image au format 16:9 (1280×720 minimum, max 5 Mo, JPG/PNG/WebP). Elle doit être lisible sur mobile.' },
      { label: 'Tarification', desc: 'Définissez le prix en FCFA (min 2 500 FCFA) ou rendez la formation gratuite. Vous pouvez aussi créer des codes promo.' },
      { label: 'Langue et niveau', desc: 'Choisissez la langue (français, anglais) et le niveau : Débutant, Intermédiaire ou Avancé.' },
      { label: 'Vidéo de présentation', desc: 'Ajoutez une vidéo de présentation de 2–3 minutes pour mettre en avant votre formation sur la page catalogue.' },
    ],
  },
  {
    num: 3,
    icon: Video,
    title: 'Ajouter vos leçons',
    color: 'bg-purple-100 text-purple-700',
    content: [
      { label: 'Créer des modules', desc: 'Organisez votre formation en modules thématiques (ex: Module 1 - Introduction, Module 2 - Pratique...).' },
      { label: 'Formats vidéo acceptés', desc: 'MP4 recommandé (H.264/AAC). Taille max 4 Go par fichier. Résolution minimum 720p, idéalement 1080p.' },
      { label: 'Upload sur Bunny Stream', desc: 'Les vidéos sont traitées automatiquement (encodage multi-qualité) sous 15–30 min après upload. Ne fermez pas la page pendant l\'upload.' },
      { label: 'Leçons texte et ressources', desc: 'Créez des leçons en texte enrichi et attachez des fichiers PDF, slides ou exercices téléchargeables.' },
      { label: 'Aperçu gratuit', desc: 'Marquez 1 ou 2 leçons comme "aperçu gratuit" pour donner un avant-goût aux futurs apprenants.' },
      { label: 'Quiz', desc: 'Ajoutez des questions QCM à la fin de chaque module depuis /formateur/quiz/[lessonId]. Min 5 questions pour le quiz final.' },
    ],
  },
  {
    num: 4,
    icon: Upload,
    title: 'Publier et promouvoir',
    color: 'bg-green-100 text-green-700',
    content: [
      { label: 'Soumettre pour validation', desc: 'Cliquez "Soumettre" quand votre formation est prête. L\'équipe IBIG la vérifie sous 48h en semaine.' },
      { label: 'Critères de validation', desc: 'La formation doit contenir au moins 3 modules, 1h de contenu, un quiz final et une image de couverture conforme.' },
      { label: 'Si refusée', desc: 'Vous recevez un email détaillant les points à corriger. Corrigez et resoumettez — pas de limite de tentatives.' },
      { label: 'Codes promo', desc: 'Créez des codes de réduction (% ou montant fixe, limités dans le temps) depuis /formateur/coupons.' },
      { label: 'Notifier vos apprenants', desc: 'Depuis /formateur/notifier, envoyez une notification push à tous vos inscrits lors d\'une mise à jour ou d\'un live.' },
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
      { label: 'Commission IBIG', desc: 'IBIG retient 30% sur chaque vente. Vous percevez 70% du prix de vente net, hors taxes locales applicables.' },
      { label: 'Seuil de virement', desc: 'Le seuil minimum pour demander un virement est 50 000 FCFA. Les virements sont effectués sous 5 jours ouvrables.' },
      { label: 'Modes de paiement', desc: 'Recevez vos revenus par Mobile Money (Orange, MTN, Wave) ou virement bancaire selon votre pays.' },
      { label: 'Factures et fiscalité', desc: 'Les factures mensuelles sont disponibles dans /formateur/virements. Vous êtes responsable de vos obligations fiscales locales.' },
      { label: 'Statistiques avancées', desc: 'Analysez la performance de chaque formation (vues, complétion, notes, revenus) dans /formateur/statistiques.' },
    ],
  },
  {
    num: 6,
    icon: Users,
    title: 'Gérer vos apprenants',
    color: 'bg-red-100 text-red-700',
    content: [
      { label: 'Liste des apprenants', desc: 'Consultez tous vos inscrits, leur progression et leurs notes dans /formateur/apprenants.' },
      { label: 'Messagerie', desc: 'Répondez aux questions de vos apprenants dans /formateur/messagerie. Délai recommandé : 48h maximum.' },
      { label: 'Répondre aux avis', desc: 'Répondez professionnellement à chaque avis, y compris les négatifs. Une réponse appropriée améliore votre note globale.' },
      { label: 'Avis négatifs', desc: 'Pour un avis inapproprié ou faux, signalez-le via le bouton "Signaler" — l\'équipe IBIG examine sous 72h.' },
      { label: 'Inscrire manuellement', desc: 'Vous pouvez donner un accès gratuit à un apprenant spécifique depuis /formateur/apprenants → "Inscrire manuellement".' },
    ],
  },
  {
    num: 7,
    icon: BarChart2,
    title: 'Analyser vos performances',
    color: 'bg-teal-100 text-teal-700',
    content: [
      { label: 'Taux de complétion', desc: 'Suivez quel pourcentage de vos apprenants terminent vos formations. Un taux > 60% est excellent.' },
      { label: 'Leçons abandonnées', desc: 'Identifiez les leçons avec un fort taux d\'abandon pour les améliorer en priorité.' },
      { label: 'Résultats des quiz', desc: 'Analysez les questions les moins bien réussies pour adapter votre pédagogie.' },
      { label: 'Sources de trafic', desc: 'Voyez d\'où viennent vos apprenants (catalogue IBIG, réseaux sociaux, parrainage) dans l\'onglet Statistiques.' },
      { label: 'Export CSV', desc: 'Exportez toutes vos données de ventes et performances en CSV depuis /formateur/statistiques.' },
    ],
  },
]

const faqFormateur = [
  {
    q: 'Combien de temps pour être validé comme formateur ?',
    a: 'La validation prend 48h ouvrables après soumission de votre profil complet. Vous recevez un email de confirmation.',
  },
  {
    q: 'Quelle résolution pour mes vidéos ?',
    a: 'Minimum 720p (1280×720), idéalement 1080p (1920×1080). Format MP4 (H.264/AAC), taille max 4 Go par fichier. Bunny Stream adapte automatiquement la qualité selon la connexion de l\'apprenant.',
  },
  {
    q: 'Ma formation a été refusée — que faire ?',
    a: 'L\'email de refus liste les points précis à corriger. Corrigez ces points et resoumettez depuis /formateur/formations. Il n\'y a pas de limite de tentatives.',
  },
  {
    q: 'Quand vais-je recevoir mon virement ?',
    a: 'Demandez un virement dès que votre solde atteint 50 000 FCFA dans /formateur/virements. Les virements sont traités sous 5 jours ouvrables (Mobile Money) ou 7 jours (virement bancaire).',
  },
  {
    q: 'Puis-je modifier une formation déjà publiée ?',
    a: 'Oui. Vous pouvez ajouter, modifier ou supprimer des leçons à tout moment. Les modifications mineures (textes, ressources) sont immédiates. Les nouvelles vidéos requièrent un re-encodage (15–30 min).',
  },
  {
    q: 'Comment gérer la fiscalité sur mes revenus ?',
    a: 'IBIG vous fournit des factures mensuelles dans /formateur/virements. Vous êtes personnellement responsable de déclarer vos revenus selon la loi fiscale de votre pays.',
  },
  {
    q: 'Puis-je enseigner dans plusieurs langues ?',
    a: 'Oui. Créez une formation distincte par langue. Chaque version peut avoir son propre prix et ses propres leçons.',
  },
  {
    q: 'Comment répondre à un avis négatif sans aggraver les choses ?',
    a: 'Restez professionnel et empathique. Remerciez pour le retour, expliquez les améliorations prévues et proposez de continuer en messagerie privée. N\'argumentez jamais publiquement avec un apprenant mécontent.',
  },
]

export default function GuideFormateurPage() {
  return (
    <div className="min-h-screen bg-gray-50">

      <div className="bg-[#FFA500] text-white py-12">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex items-center gap-2 text-orange-100 text-sm mb-4">
            <Link href="/aide" className="hover:text-white">Centre d&apos;aide</Link>
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
            <p className="text-sm text-gray-700">Vendez une formation à <strong>25 000 FCFA</strong> → vous gagnez <strong>17 500 FCFA</strong> par inscription. Pas de plafond de revenus.</p>
          </div>
          <Link href="/devenir-formateur"
            className="bg-[#FFA500] text-white font-bold px-5 py-3 rounded-xl hover:bg-orange-500 transition-colors whitespace-nowrap">
            Devenir formateur →
          </Link>
        </div>

        {/* Checklist avant de publier */}
        <div className="bg-green-50 rounded-2xl p-6 border border-green-100 mb-10">
          <h3 className="font-bold text-green-800 mb-4 flex items-center gap-2">
            <CheckCircle className="w-5 h-5" /> Checklist avant de soumettre votre formation
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {[
              'Au moins 3 modules structurés',
              'Minimum 1h de contenu vidéo total',
              'Un quiz final (min 5 questions)',
              'Image de couverture 16:9 (1280×720)',
              'Description complète (objectifs, public, prérequis)',
              '1–2 leçons en aperçu gratuit',
              'Prix défini ou formation marquée gratuite',
              'Vidéo de présentation (2–3 min) recommandée',
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-2 text-sm text-green-800">
                <CheckCircle className="w-3.5 h-3.5 text-green-600 flex-shrink-0" />
                {item}
              </div>
            ))}
          </div>
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
              <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
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

        {/* Conseils */}
        <div className="mt-10 bg-orange-50 rounded-2xl p-6 border border-orange-100">
          <h3 className="font-bold text-[#FFA500] mb-4">💡 Conseils pour maximiser vos ventes</h3>
          <ul className="space-y-2">
            {[
              'Publiez au moins 5h de contenu vidéo par formation — les apprenants perçoivent plus de valeur',
              'Répondez aux questions en moins de 24h pour obtenir de meilleures notes',
              'Créez des codes promo à -20% pour le lancement de chaque nouvelle formation',
              'Mettez à jour régulièrement vos formations pour rester dans les recommandations',
              'Organisez 1 session live mensuelle gratuite pour fidéliser vos apprenants',
              'Rejoignez notre programme d\'ambassadeurs pour doubler votre visibilité sur la plateforme',
            ].map((t, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                <Lightbulb className="w-4 h-4 text-[#FFA500] mt-0.5 flex-shrink-0" />
                {t}
              </li>
            ))}
          </ul>
        </div>

        {/* FAQ */}
        <div className="mt-10">
          <h3 className="text-xl font-bold text-gray-900 mb-6">Questions fréquentes des formateurs</h3>
          <div className="space-y-4">
            {faqFormateur.map((item, i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                <p className="font-semibold text-gray-900 mb-2">❓ {item.q}</p>
                <p className="text-sm text-gray-600 leading-relaxed">{item.a}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Contact */}
        <div className="mt-8 bg-gradient-to-r from-[#FFA500] to-orange-500 rounded-2xl p-6 text-white">
          <h3 className="font-bold text-lg mb-2">Support formateurs prioritaire</h3>
          <p className="text-orange-100 text-sm mb-4">Les formateurs bénéficient d&apos;un support prioritaire — réponse sous 12h.</p>
          <div className="flex flex-wrap gap-3">
            <a href="mailto:formateurs@ibig-elearning.com"
              className="bg-white text-[#FFA500] font-semibold px-5 py-2.5 rounded-xl text-sm hover:bg-orange-50 transition-colors">
              ✉️ formateurs@ibig-elearning.com
            </a>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/formateur"
            className="bg-[#FFA500] text-white font-bold px-6 py-3 rounded-xl hover:bg-orange-500 transition-colors">
            Accéder à mon espace formateur
          </Link>
          <Link href="/aide"
            className="border border-gray-200 text-gray-700 font-semibold px-6 py-3 rounded-xl hover:bg-gray-50 transition-colors">
            ← Retour au centre d&apos;aide
          </Link>
        </div>
      </div>
    </div>
  )
}
