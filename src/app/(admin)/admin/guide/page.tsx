import Link from 'next/link'
import {
  Shield, Users, BookOpen, DollarSign, BarChart2, Settings,
  ChevronRight, Bell, AlertTriangle, Lock, Building2, FileText,
  UserCheck, EyeOff, Crown,
} from 'lucide-react'

export const metadata = {
  title: 'Guide administrateur',
}

const sections = [
  {
    icon: Shield,
    title: 'Accéder à la console',
    color: 'bg-green-100 text-green-700',
    items: [
      { label: 'URL d\'accès', desc: 'Connectez-vous avec un compte admin ou coordinateur → vous êtes redirigé automatiquement vers /admin.' },
      { label: 'Sidebar rétractable', desc: 'Cliquez sur ‹ pour réduire le menu à des icônes, › pour l\'agrandir. La position de scroll est préservée à chaque clic.' },
      { label: 'Navigation stable', desc: 'Le sidebar reste fixe à la navigation : cliquer un élément du menu ne fait pas remonter ni fermer la barre latérale.' },
      { label: 'Rôles d\'accès', desc: '"admin" a tous les droits. "coordinateur" a les mêmes droits sauf la gestion des admins et des paramètres critiques.' },
    ],
  },
  {
    icon: Crown,
    title: 'Gestion des accès admin',
    color: 'bg-red-100 text-red-700',
    items: [
      { label: 'Page Accès admin', desc: '/admin/superadmin — liste de tous les admins et coordinateurs. Modifiez les rôles directement depuis cette page.' },
      { label: 'Protections automatiques', desc: 'Un coordinateur ne peut pas promouvoir ou rétrograder un admin. Impossible de rétrograder le dernier admin de la plateforme.' },
      { label: 'Alerte dernier admin', desc: 'Si vous êtes le seul admin, une alerte orange s\'affiche sur /admin/superadmin pour vous inviter à ajouter un second admin.' },
      { label: 'Changer un rôle', desc: 'Depuis /admin/utilisateurs ou /admin/superadmin → sélecteur de rôle. Le changement est immédiat et sécurisé côté serveur.' },
    ],
  },
  {
    icon: AlertTriangle,
    title: 'Surveillance anti-triche',
    color: 'bg-orange-100 text-orange-700',
    items: [
      { label: 'Page Anti-triche', desc: '/admin/antitricherie — KPIs et tableaux des tentatives suspectes pour examens finaux et quiz.' },
      { label: 'Détection automatique', desc: 'Le système détecte : changements d\'onglet (≥3), soumission automatique, temps trop rapide (<5s/question), dépassement du timer.' },
      { label: 'Indicateurs de triche', desc: 'Chaque tentative signalée affiche : score, nombre de changements d\'onglet, raison du signalement et date.' },
      { label: 'Questions mélangées', desc: 'Les questions sont mélangées de façon unique à chaque tentative (shuffle par graine) pour éviter la mémorisation d\'ordre.' },
    ],
  },
  {
    icon: Users,
    title: 'Gérer les utilisateurs',
    color: 'bg-blue-100 text-[#0B3D91]',
    items: [
      { label: 'Recherche et filtres', desc: '/admin/utilisateurs — recherchez par nom, email, pays ou rôle. Cliquez sur un profil pour voir son activité complète.' },
      { label: 'Changer un rôle', desc: 'Dans la liste, utilisez le sélecteur de rôle (apprenant → formateur → coordinateur). Seul un admin peut attribuer le rôle "admin".' },
      { label: 'Suspendre un compte', desc: 'Option "Suspendre" pour bloquer temporairement l\'accès sans supprimer les données ni les formations.' },
      { label: 'Réinitialiser un mot de passe', desc: 'Depuis Supabase → Authentication → Users → Send magic link. Un lien de connexion est envoyé à l\'email de l\'utilisateur.' },
    ],
  },
  {
    icon: BookOpen,
    title: 'Gérer les formations',
    color: 'bg-purple-100 text-purple-700',
    items: [
      { label: 'Approbations (priorité)', desc: '/admin/approbations — liste des formations en attente. Prévisualisez entièrement avant d\'approuver ou rejeter.' },
      { label: 'Rejeter avec feedback', desc: 'Lors d\'un refus, rédigez un commentaire précis. Le formateur est notifié immédiatement.' },
      { label: 'Toutes les formations', desc: '/admin/formations — vue complète avec filtres par catégorie, statut, formateur, pays et prix.' },
      { label: 'Parcours métiers', desc: '/admin/parcours — créez et gérez les parcours structurés qui regroupent plusieurs formations.' },
    ],
  },
  {
    icon: DollarSign,
    title: 'Gérer les paiements',
    color: 'bg-yellow-100 text-yellow-700',
    items: [
      { label: 'Historique complet', desc: '/admin/paiements — tous les paiements avec statut (réussi, en attente, échoué), montant et canal.' },
      { label: 'Rembourser un apprenant', desc: 'Dans la fiche paiement → "Initier un remboursement". Politique : 7 jours et < 20% du contenu visionné.' },
      { label: 'Virements formateurs', desc: '/admin/virements — validez les demandes de virement. Vérifiez le solde disponible avant approbation.' },
      { label: 'Coupons globaux', desc: '/admin/coupons — créez des codes promo pour les campagnes marketing IBIG.' },
    ],
  },
  {
    icon: Building2,
    title: 'Gestion B2B — Entreprises',
    color: 'bg-indigo-100 text-indigo-700',
    items: [
      { label: 'Comptes entreprises', desc: '/admin/entreprise — gérez les comptes entreprises (SSO, accès groupé, facturation mensuelle dédiée).' },
      { label: 'Cohortes', desc: '/admin/entreprise/cohortes — groupes d\'apprenants avec catalogue dédié et suivi de progression.' },
      { label: 'Rapports DRH', desc: 'Générez des rapports PDF de progression par cohorte, exportables et envoyables aux DRH.' },
      { label: 'SSO SAML/OAuth', desc: '/admin/sso — connexion unique pour les entreprises partenaires (Azure AD, Google Workspace, Okta).' },
    ],
  },
  {
    icon: FileText,
    title: 'Blog et contenu éditorial',
    color: 'bg-pink-100 text-pink-700',
    items: [
      { label: 'Articles de blog', desc: '/admin/blog — créez et gérez les articles du blog IBIG (auteur, catégorie, image, date de publication).' },
      { label: 'Témoignages', desc: '/admin/temoignages — validez et mettez en avant les avis apprenants sur la page d\'accueil.' },
      { label: 'Newsletter', desc: '/admin/newsletter — gérez la liste des abonnés et envoyez des campagnes email.' },
      { label: 'Badges gamification', desc: '/admin/badges — créez des badges et définissez les conditions d\'obtention.' },
    ],
  },
  {
    icon: BarChart2,
    title: 'Rapports et analytics',
    color: 'bg-teal-100 text-teal-700',
    items: [
      { label: 'Rapports financiers', desc: '/admin/rapports — CA mensuel, revenus par formateur, marge IBIG, comparaison mensuelle.' },
      { label: 'Rapports pédagogiques', desc: 'Taux de complétion, formations les plus suivies, résultats quiz, temps moyen de formation.' },
      { label: 'Export comptable', desc: '/admin/exports — exportez tous les paiements en CSV (colonne TVA incluse).' },
      { label: 'Rapport par pays', desc: 'Filtrez tous les rapports par pays pour suivre la performance dans chacun des 12 pays couverts.' },
    ],
  },
  {
    icon: Settings,
    title: 'Paramètres système',
    color: 'bg-gray-100 text-gray-700',
    items: [
      { label: 'Paramètres généraux', desc: '/admin/parametres — nom de la plateforme, email de contact, devise par défaut, langues, fuseau horaire.' },
      { label: 'Intégrations paiement', desc: 'Clés API CinetPay (Mobile Money) et Stripe (cartes internationales) dans Paramètres → Paiements.' },
      { label: 'Marque blanche', desc: '/admin/marque-blanche — instance white-label pour un partenaire (logo, couleurs, domaine personnalisé).' },
      { label: 'Certificats', desc: '/admin/certificats — personnalisez le template des certificats (logo, signature, QR code).' },
    ],
  },
]

const faq = [
  {
    q: 'Comment créer un coordinateur sans lui donner accès aux paramètres ?',
    a: 'Attribuez le rôle "coordinateur" depuis /admin/utilisateurs. Les coordinateurs ont accès à tout sauf /admin/superadmin et les paramètres critiques.',
  },
  {
    q: 'Comment ajouter un second administrateur ?',
    a: 'Allez sur /admin/superadmin → section Coordinateurs ou /admin/utilisateurs → changez le rôle en "admin". Seul un admin peut faire cette action.',
  },
  {
    q: 'Comment consulter les tentatives suspectes d\'examen ?',
    a: 'Rendez-vous sur /admin/antitricherie — vous y trouverez tous les examens et quiz signalés automatiquement par le système anti-triche.',
  },
  {
    q: 'Un formateur dit que son virement n\'a pas été reçu — que faire ?',
    a: 'Vérifiez le statut dans /admin/virements. Si "traité", demandez le numéro de transaction Mobile Money et contactez l\'opérateur. Délai max : 7 jours ouvrables.',
  },
  {
    q: 'Comment exporter la liste des utilisateurs pour un audit ?',
    a: 'Dans /admin/exports → "Utilisateurs" → choisissez colonnes et plage de dates → "Exporter CSV" (nom, email, rôle, pays, date d\'inscription).',
  },
  {
    q: 'Peut-on avoir plusieurs administrateurs ?',
    a: 'Oui, géré depuis /admin/superadmin. Privilégiez le rôle "coordinateur" pour les collaborateurs afin de limiter les risques sur les paramètres critiques.',
  },
]

export default function GuideAdminPage() {
  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center gap-2 text-sm text-gray-400 mb-3">
          <Link href="/admin" className="hover:text-gray-600">Console admin</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span>Guide administrateur</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-1 flex items-center gap-2">
          <Shield className="w-6 h-6 text-green-600" />
          Guide Administrateur
        </h1>
        <p className="text-gray-500">Référence complète de la console d'administration IBIG E-LEARNING</p>
      </div>

      {/* Accès rapides */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Anti-triche', href: '/admin/antitricherie', icon: AlertTriangle, color: 'text-orange-600' },
          { label: 'Accès admin', href: '/admin/superadmin', icon: Crown, color: 'text-red-600' },
          { label: 'Utilisateurs', href: '/admin/utilisateurs', icon: Users, color: 'text-blue-600' },
          { label: 'Approbations', href: '/admin/approbations', icon: BookOpen, color: 'text-purple-600' },
        ].map(l => (
          <Link key={l.href} href={l.href}
            className="flex flex-col items-center gap-2 bg-white rounded-xl border border-gray-100 p-4 hover:border-green-200 hover:bg-green-50 transition-colors text-center shadow-sm">
            <l.icon className={`w-5 h-5 ${l.color}`} />
            <span className="text-xs font-semibold text-gray-700">{l.label}</span>
          </Link>
        ))}
      </div>

      {/* Hiérarchie des rôles */}
      <div className="bg-blue-50 rounded-2xl p-5 border border-blue-100">
        <h3 className="font-bold text-[#0B3D91] mb-3 flex items-center gap-2">
          <Lock className="w-4 h-4" /> Hiérarchie des rôles
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          {[
            { role: 'Admin', color: 'bg-red-100 text-red-700 border-red-200', rights: 'Tous les droits — gestion admins, paramètres, tout.' },
            { role: 'Coordinateur', color: 'bg-orange-100 text-orange-700 border-orange-200', rights: 'Console complète sauf gestion admins et paramètres critiques.' },
            { role: 'Formateur', color: 'bg-blue-100 text-[#0B3D91] border-blue-200', rights: 'Espace formateur + tableau de bord apprenant.' },
            { role: 'Apprenant', color: 'bg-gray-100 text-gray-700 border-gray-200', rights: 'Tableau de bord et cours uniquement.' },
          ].map((r, i) => (
            <div key={i} className={`rounded-xl border p-3 ${r.color}`}>
              <p className="font-bold text-sm mb-1">{r.role}</p>
              <p className="text-xs opacity-80">{r.rights}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Sections */}
      <div className="space-y-5">
        {sections.map((section, idx) => (
          <div key={idx} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="flex items-center gap-3 p-5 border-b border-gray-50">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${section.color}`}>
                <section.icon className="w-4 h-4" />
              </div>
              <h2 className="text-base font-bold text-gray-900">{section.title}</h2>
            </div>
            <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {section.items.map((item, i) => (
                <div key={i} className="flex gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-600 mt-2 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{item.label}</p>
                    <p className="text-sm text-gray-500 mt-0.5">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Bonnes pratiques */}
      <div className="bg-green-50 rounded-2xl p-5 border border-green-100">
        <h3 className="font-bold text-green-700 mb-3 flex items-center gap-2">
          <UserCheck className="w-4 h-4" /> Bonnes pratiques de sécurité
        </h3>
        <ul className="space-y-2">
          {[
            'Ne partagez jamais vos identifiants admin — créez un compte coordinateur pour les collègues',
            'Maintenez toujours au moins 2 comptes admin pour éviter un blocage de la plateforme',
            'Validez les formations dans les 48h suivant la soumission d\'un formateur',
            'Vérifiez les tentatives anti-triche signalées chaque semaine dans /admin/antitricherie',
            'Exportez les rapports financiers chaque fin de mois et archivez-les',
            'Révoquez immédiatement les accès des collaborateurs qui quittent l\'équipe via /admin/superadmin',
          ].map((t, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
              <span className="text-green-600 font-bold mt-0.5">✓</span>
              {t}
            </li>
          ))}
        </ul>
      </div>

      {/* FAQ */}
      <div>
        <h3 className="text-lg font-bold text-gray-900 mb-4">Questions fréquentes</h3>
        <div className="space-y-3">
          {faq.map((item, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <p className="font-semibold text-gray-900 mb-2">❓ {item.q}</p>
              <p className="text-sm text-gray-600 leading-relaxed">{item.a}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Contact urgence */}
      <div className="bg-gradient-to-r from-green-700 to-green-600 rounded-2xl p-5 text-white">
        <h3 className="font-bold text-base mb-1">Support technique administrateurs</h3>
        <p className="text-green-200 text-sm mb-4">Pour un incident critique, utilisez le canal d'urgence.</p>
        <div className="flex flex-wrap gap-3">
          <a href="mailto:admin@ibig-elearning.com"
            className="bg-white text-green-700 font-semibold px-4 py-2 rounded-xl text-sm hover:bg-green-50 transition-colors">
            ✉️ admin@ibig-elearning.com
          </a>
          <a href="mailto:urgence@ibig-elearning.com"
            className="border border-white/40 text-white font-semibold px-4 py-2 rounded-xl text-sm hover:bg-white/10 transition-colors">
            🚨 urgence@ibig-elearning.com
          </a>
        </div>
      </div>
    </div>
  )
}
