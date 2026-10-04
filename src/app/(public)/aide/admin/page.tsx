import Link from 'next/link'
import type { Metadata } from 'next'
import { Shield, Users, BookOpen, DollarSign, BarChart2, Settings, ChevronRight, Bell, Award, Tag, Building2, FileText, AlertTriangle, CheckCircle, RefreshCw, Lock, UserPlus, Database } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Guide Administrateur — IBIG E-LEARNING',
  description: 'Guide complet de la console d\'administration IBIG E-LEARNING : gestion des utilisateurs, formations, paiements, rapports.',
}

const sections = [
  {
    icon: Shield,
    title: 'Accéder à la console',
    color: 'bg-green-100 text-green-700',
    items: [
      { label: 'URL admin', desc: 'Connectez-vous avec un compte admin ou coordinateur → vous êtes redirigé automatiquement vers /admin.' },
      { label: 'Tableau de bord', desc: 'La page /admin affiche les KPIs en temps réel : apprenants actifs, revenus du mois, formations publiées, certificats émis.' },
      { label: 'Navigation', desc: 'Le menu latéral gauche donne accès à toutes les sections : Utilisateurs, Formations, Paiements, Blog, Rapports, Paramètres.' },
      { label: 'Rôles admin', desc: '"admin" a tous les droits. "coordinateur" a les mêmes droits sauf les Paramètres système et les virements.' },
    ],
  },
  {
    icon: Users,
    title: 'Gérer les utilisateurs',
    color: 'bg-blue-100 text-[#0B3D91]',
    items: [
      { label: 'Recherche et filtres', desc: '/admin/utilisateurs — recherchez par nom, email, pays ou rôle. Cliquez sur un profil pour voir son activité complète.' },
      { label: 'Créer un coordinateur', desc: 'Cliquez "Ajouter un utilisateur" → rôle "coordinateur". Un email d\'invitation est envoyé automatiquement.' },
      { label: 'Changer un rôle', desc: 'Dans la fiche utilisateur, modifiez le rôle (apprenant → formateur → coordinateur → admin). Le changement est immédiat.' },
      { label: 'Suspendre un compte', desc: 'Option "Suspendre" pour bloquer temporairement l\'accès sans supprimer les données ni les formations.' },
      { label: 'Réinitialiser un mot de passe', desc: 'Dans la fiche → "Réinitialiser le mot de passe". L\'utilisateur reçoit un email de réinitialisation.' },
      { label: 'Vue apprenants', desc: '/admin/apprenants — vue dédiée avec progression, formations suivies, certificats obtenus et activité récente.' },
    ],
  },
  {
    icon: BookOpen,
    title: 'Gérer les formations',
    color: 'bg-purple-100 text-purple-700',
    items: [
      { label: 'Approbations (priorité)', desc: '/admin/approbations — liste des formations en attente. Prévisualisez entièrement avant d\'approuver ou rejeter.' },
      { label: 'Rejeter avec feedback', desc: 'Lors d\'un refus, rédigez un commentaire précis (qualité vidéo, contenu, description). Le formateur est notifié.' },
      { label: 'Toutes les formations', desc: '/admin/formations — vue complète avec filtres par catégorie, statut, formateur, pays et prix.' },
      { label: 'Mettre en avant', desc: 'Cochez "Featured" sur une formation pour la faire apparaître en page d\'accueil et dans les recommandations.' },
      { label: 'Parcours métiers', desc: '/admin/parcours — créez et gérez les parcours structurés qui regroupent plusieurs formations complémentaires.' },
      { label: 'Dépublier une formation', desc: 'En cas de contenu inapproprié ou de plainte, dépubliez immédiatement depuis la fiche formation → "Retirer de la vente".' },
    ],
  },
  {
    icon: DollarSign,
    title: 'Gérer les paiements',
    color: 'bg-yellow-100 text-yellow-700',
    items: [
      { label: 'Historique complet', desc: '/admin/paiements — tous les paiements avec statut (réussi, en attente, échoué), montant et canal (Orange Money, Wave...).' },
      { label: 'Rembourser un apprenant', desc: 'Dans la fiche paiement → "Initier un remboursement". Délai : 3–5 jours selon le canal. Documentez la raison.' },
      { label: 'Inscription manuelle', desc: '/admin/inscriptions — inscrivez manuellement un apprenant (B2B, partenariat, accord commercial).' },
      { label: 'Virements formateurs', desc: '/admin/virements — validez les demandes de virement. Vérifiez le solde disponible avant approbation.' },
      { label: 'Coupons globaux', desc: '/admin/coupons — créez des codes promo globaux (tous formateurs) pour les campagnes marketing IBIG.' },
      { label: 'Litiges CinetPay', desc: 'Pour un litige de paiement Mobile Money, contactez le support CinetPay avec la référence de transaction.' },
    ],
  },
  {
    icon: Building2,
    title: 'Gestion B2B — Entreprises',
    color: 'bg-indigo-100 text-indigo-700',
    items: [
      { label: 'Comptes entreprises', desc: '/admin/entreprise — gérez les comptes entreprises (SSO, accès groupé, facturation mensuelle dédiée).' },
      { label: 'Créer une cohorte', desc: '/admin/entreprise/cohortes — créez des groupes d\'apprenants avec un catalogue de formations et un suivi de progression dédié.' },
      { label: 'Rapports DRH', desc: 'Générez des rapports PDF de progression pour chaque cohorte, exportables et envoyables aux DRH.' },
      { label: 'SSO SAML/OAuth', desc: '/admin/sso — configurez la connexion unique pour les entreprises partenaires (Azure AD, Google Workspace, Okta).' },
      { label: 'Facturation entreprise', desc: 'Les entreprises sont facturées mensuellement. Les factures sont générées automatiquement dans /admin/entreprise/factures.' },
    ],
  },
  {
    icon: FileText,
    title: 'Blog et contenu éditorial',
    color: 'bg-pink-100 text-pink-700',
    items: [
      { label: 'Articles de blog', desc: '/admin/blog — créez et gérez les articles du blog IBIG. Définissez auteur, catégorie, image et date de publication.' },
      { label: 'Témoignages', desc: '/admin/temoignages — validez et mettez en avant les avis apprenants sur la page d\'accueil.' },
      { label: 'Newsletter', desc: '/admin/newsletter — gérez la liste des abonnés et envoyez des campagnes email ciblées par pays ou intérêt.' },
      { label: 'Badges gamification', desc: '/admin/badges — créez de nouveaux badges et définissez précisément les conditions d\'obtention (nb formations, score quiz...).' },
      { label: 'Bannières promotionnelles', desc: 'Depuis /admin/parametres → Bannières, créez des annonces temporaires affichées en haut du site.' },
    ],
  },
  {
    icon: BarChart2,
    title: 'Rapports et analytics',
    color: 'bg-teal-100 text-teal-700',
    items: [
      { label: 'Rapports financiers', desc: '/admin/rapports — CA mensuel, revenus par formateur, marge IBIG, comparaison avec le mois précédent.' },
      { label: 'Rapports pédagogiques', desc: 'Taux de complétion global, formations les plus suivies, temps moyen de formation, résultats quiz.' },
      { label: 'Export comptable', desc: '/admin/exports — exportez tous les paiements en CSV pour votre comptable (colonne TVA incluse).' },
      { label: 'Relances inactivité', desc: '/admin/relances — configurez les emails automatiques pour les apprenants inactifs depuis X jours.' },
      { label: 'Rapport par pays', desc: 'Filtrez tous les rapports par pays pour suivre la performance dans chacun des 12 pays couverts.' },
      { label: 'Sauvegarde des données', desc: 'Les données Supabase sont sauvegardées automatiquement chaque 24h. Pour une export manuelle → /admin/parametres → Backup.' },
    ],
  },
  {
    icon: Settings,
    title: 'Paramètres système',
    color: 'bg-gray-100 text-gray-700',
    items: [
      { label: 'Paramètres généraux', desc: '/admin/parametres — nom de la plateforme, email de contact, devise par défaut, langues activées, fuseau horaire.' },
      { label: 'Intégrations paiement', desc: 'Configurez les clés API CinetPay (Mobile Money) et Stripe (cartes internationales) dans Paramètres → Paiements.' },
      { label: 'Marque blanche', desc: '/admin/marque-blanche — configurez une instance white-label pour un partenaire (logo, couleurs, domaine personnalisé).' },
      { label: 'Certificats', desc: '/admin/certificats — personnalisez le template des certificats (logo, signature, texte d\'accréditation, QR code).' },
      { label: 'Webhooks', desc: 'Configurez des webhooks pour notifier vos systèmes externes (CRM, ERP) à chaque inscription ou paiement.' },
      { label: 'Maintenance', desc: 'Pour mettre le site en maintenance → Paramètres → Mode maintenance. Affichez un message personnalisé aux visiteurs.' },
    ],
  },
  {
    icon: AlertTriangle,
    title: 'Gestion des litiges et incidents',
    color: 'bg-red-100 text-red-700',
    items: [
      { label: 'Litige paiement', desc: 'Si un apprenant conteste un paiement : vérifiez la transaction dans /admin/paiements → contactez CinetPay avec la référence.' },
      { label: 'Demande de remboursement', desc: 'Politique : remboursement si demandé dans 7 jours et < 20% du contenu visionné. Approuvez depuis la fiche paiement.' },
      { label: 'Contenu inapproprié', desc: 'Dépubliez immédiatement la formation signalée → contactez le formateur → décidez d\'une action (correction, suppression).' },
      { label: 'Compte piraté', desc: 'Suspendez le compte → réinitialisez le mot de passe → vérifiez l\'activité suspecte dans /admin/utilisateurs → logs.' },
      { label: 'Bug critique', desc: 'Contactez l\'équipe technique via le canal Slack #support-urgent ou par email urgence@ibig-elearning.com.' },
    ],
  },
]

const faqAdmin = [
  {
    q: 'Comment créer un coordinateur sans lui donner accès aux paramètres ?',
    a: 'Créez l\'utilisateur avec le rôle "coordinateur" depuis /admin/utilisateurs → "Ajouter". Les coordinateurs ont accès à tout sauf Paramètres système et Virements.',
  },
  {
    q: 'Un formateur dit que son virement a été envoyé mais non reçu — que faire ?',
    a: 'Vérifiez le statut dans /admin/virements. Si marqué "traité", demandez au formateur son numéro de transaction Mobile Money et contactez l\'opérateur. Les délais peuvent atteindre 7 jours ouvrables.',
  },
  {
    q: 'Comment intégrer CinetPay pour les paiements Mobile Money ?',
    a: 'Dans /admin/parametres → Paiements, renseignez vos clés API CinetPay (Site ID + Clé secrète). Activez les webhooks CinetPay vers /api/webhooks/cinetpay sur votre domaine.',
  },
  {
    q: 'Comment valider plusieurs formations d\'un coup ?',
    a: 'Dans /admin/approbations, cochez les formations à approuver → bouton "Approuver la sélection". La validation en masse est limitée à 20 formations par action.',
  },
  {
    q: 'Comment exporter la liste complète des utilisateurs pour un audit ?',
    a: 'Dans /admin/exports → "Utilisateurs" → choisissez les colonnes et la plage de dates → "Exporter CSV". Le fichier inclut nom, email, rôle, pays, date d\'inscription.',
  },
  {
    q: 'Comment sauvegarder manuellement les données Supabase ?',
    a: 'Les backups automatiques sont quotidiens. Pour un export manuel : connectez-vous à Supabase → Storage → Database Backups, ou utilisez pg_dump via les paramètres de connexion.',
  },
  {
    q: 'Peut-on configurer plusieurs administrateurs ?',
    a: 'Oui. Le rôle "admin" peut être attribué à plusieurs comptes. Chaque admin a accès complet. Privilégiez le rôle "coordinateur" pour limiter les risques.',
  },
]

export default function GuideAdminPage() {
  return (
    <div className="min-h-screen bg-gray-50">

      <div className="bg-green-700 text-white py-12">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex items-center gap-2 text-green-200 text-sm mb-4">
            <Link href="/aide" className="hover:text-white">Centre d&apos;aide</Link>
            <ChevronRight className="w-4 h-4" />
            <span>Guide Administrateur</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center flex-shrink-0">
              <Shield className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">Guide Administrateur</h1>
              <p className="text-green-200 mt-1">Maîtrisez la console d&apos;administration IBIG E-LEARNING</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-12">

        {/* Accès rapides */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-10">
          {[
            { label: 'Console admin', href: '/admin', icon: Shield },
            { label: 'Approbations', href: '/admin/approbations', icon: BookOpen },
            { label: 'Utilisateurs', href: '/admin/utilisateurs', icon: Users },
            { label: 'Paiements', href: '/admin/paiements', icon: DollarSign },
          ].map(l => (
            <Link key={l.href} href={l.href}
              className="flex flex-col items-center gap-2 bg-white rounded-xl border border-gray-100 p-4 hover:border-green-200 hover:bg-green-50 transition-colors text-center shadow-sm">
              <l.icon className="w-5 h-5 text-green-700" />
              <span className="text-xs font-semibold text-gray-700">{l.label}</span>
            </Link>
          ))}
        </div>

        {/* Hiérarchie des rôles */}
        <div className="bg-blue-50 rounded-2xl p-6 border border-blue-100 mb-10">
          <h3 className="font-bold text-[#0B3D91] mb-4 flex items-center gap-2">
            <Lock className="w-5 h-5" /> Hiérarchie des rôles
          </h3>
          <div className="grid sm:grid-cols-4 gap-3">
            {[
              { role: 'Admin', color: 'bg-red-100 text-red-700 border-red-200', rights: 'Tous les droits — paramètres inclus' },
              { role: 'Coordinateur', color: 'bg-orange-100 text-orange-700 border-orange-200', rights: 'Admin sauf paramètres système et virements' },
              { role: 'Formateur', color: 'bg-blue-100 text-[#0B3D91] border-blue-200', rights: 'Espace formateur + espace apprenant' },
              { role: 'Apprenant', color: 'bg-gray-100 text-gray-700 border-gray-200', rights: 'Tableau de bord personnel uniquement' },
            ].map((r, i) => (
              <div key={i} className={`rounded-xl border p-3 ${r.color}`}>
                <p className="font-bold text-sm mb-1">{r.role}</p>
                <p className="text-xs opacity-80">{r.rights}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          {sections.map((section, idx) => (
            <div key={idx} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="flex items-center gap-4 p-5 border-b border-gray-50">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${section.color}`}>
                  <section.icon className="w-5 h-5" />
                </div>
                <h2 className="text-lg font-bold text-gray-900">{section.title}</h2>
              </div>
              <div className="p-5 grid sm:grid-cols-2 gap-4">
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
        <div className="mt-10 bg-green-50 rounded-2xl p-6 border border-green-100">
          <h3 className="font-bold text-green-700 mb-4">🔐 Bonnes pratiques de sécurité</h3>
          <ul className="space-y-2">
            {[
              'Ne partagez jamais vos identifiants admin — créez un compte coordinateur pour les collègues',
              'Validez les formations dans les 48h suivant la soumission d\'un formateur',
              'Exportez les rapports financiers chaque fin de mois et archivez-les',
              'Vérifiez les demandes de virement avant approbation (identité + solde réel)',
              'Activez l\'authentification à deux facteurs (2FA) sur votre compte Supabase',
              'Révoquez immédiatement les accès des collaborateurs qui quittent l\'équipe',
            ].map((t, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                <span className="text-green-600 font-bold mt-0.5">✓</span>
                {t}
              </li>
            ))}
          </ul>
        </div>

        {/* FAQ */}
        <div className="mt-10">
          <h3 className="text-xl font-bold text-gray-900 mb-6">Questions fréquentes des administrateurs</h3>
          <div className="space-y-4">
            {faqAdmin.map((item, i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                <p className="font-semibold text-gray-900 mb-2">❓ {item.q}</p>
                <p className="text-sm text-gray-600 leading-relaxed">{item.a}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Contact urgence */}
        <div className="mt-8 bg-gradient-to-r from-green-700 to-green-600 rounded-2xl p-6 text-white">
          <h3 className="font-bold text-lg mb-2">Support technique administrateurs</h3>
          <p className="text-green-200 text-sm mb-4">Pour un incident critique (site inaccessible, faille de sécurité), utilisez le canal d&apos;urgence.</p>
          <div className="flex flex-wrap gap-3">
            <a href="mailto:admin@ibig-elearning.com"
              className="bg-white text-green-700 font-semibold px-5 py-2.5 rounded-xl text-sm hover:bg-green-50 transition-colors">
              ✉️ admin@ibig-elearning.com
            </a>
            <a href="mailto:urgence@ibig-elearning.com"
              className="border border-white/40 text-white font-semibold px-5 py-2.5 rounded-xl text-sm hover:bg-white/10 transition-colors">
              🚨 urgence@ibig-elearning.com
            </a>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/admin"
            className="bg-green-700 text-white font-bold px-6 py-3 rounded-xl hover:bg-green-800 transition-colors">
            Accéder à la console admin
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
