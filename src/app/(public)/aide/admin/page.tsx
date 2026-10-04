import Link from 'next/link'
import type { Metadata } from 'next'
import { Shield, Users, BookOpen, DollarSign, BarChart2, Settings, ChevronRight, Bell, Award, Tag, Building2, FileText } from 'lucide-react'

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
      { label: 'URL', desc: 'Connectez-vous avec un compte admin ou coordinateur → vous êtes redirigé automatiquement vers /admin.' },
      { label: 'Tableau de bord', desc: 'La page /admin affiche les KPIs en temps réel : apprenants actifs, revenus du mois, formations publiées, certificats émis.' },
      { label: 'Navigation', desc: 'Le menu latéral gauche donne accès à toutes les sections : Utilisateurs, Formations, Paiements, Blog, Rapports, Paramètres.' },
      { label: 'Rôles admin', desc: '"admin" a tous les droits. "coordinateur" a les mêmes droits sauf les Paramètres système.' },
    ],
  },
  {
    icon: Users,
    title: 'Gérer les utilisateurs',
    color: 'bg-blue-100 text-[#0B3D91]',
    items: [
      { label: 'Liste des utilisateurs', desc: '/admin/utilisateurs — recherchez, filtrez par rôle et pays. Cliquez sur un profil pour voir son activité complète.' },
      { label: 'Changer un rôle', desc: 'Dans la fiche utilisateur, modifiez le rôle (apprenant → formateur → coordinateur → admin).' },
      { label: 'Suspendre un compte', desc: 'Utilisez l\'option "Suspendre" pour bloquer temporairement l\'accès sans supprimer les données.' },
      { label: 'Apprenants', desc: '/admin/apprenants — vue dédiée avec progression, formations suivies et certificats obtenus.' },
    ],
  },
  {
    icon: BookOpen,
    title: 'Gérer les formations',
    color: 'bg-purple-100 text-purple-700',
    items: [
      { label: 'Approbations', desc: '/admin/approbations — liste des formations en attente de validation. Prévisualisez et approuvez ou rejetez avec un commentaire.' },
      { label: 'Toutes les formations', desc: '/admin/formations — vue complète avec filtres par catégorie, statut, formateur. Modifiez le prix ou la mise en avant.' },
      { label: 'Parcours métiers', desc: '/admin/parcours — créez et gérez les parcours structurés qui regroupent plusieurs formations.' },
      { label: 'Mettre en avant', desc: 'Cochez "Featured" sur une formation pour la faire apparaître en page d\'accueil et dans les recommandations.' },
    ],
  },
  {
    icon: DollarSign,
    title: 'Gérer les paiements',
    color: 'bg-yellow-100 text-yellow-700',
    items: [
      { label: 'Historique', desc: '/admin/paiements — tous les paiements avec statut (réussi, en attente, échoué), montant et canal (Orange Money, Wave...).' },
      { label: 'Inscriptions manuelles', desc: '/admin/inscriptions — inscrivez manuellement un apprenant à une formation (B2B, partenariats).' },
      { label: 'Virements formateurs', desc: '/admin/virements — validez les demandes de virement des formateurs. Vérifiez le solde et approuvez.' },
      { label: 'Coupons globaux', desc: '/admin/coupons — créez des codes promo globaux applicables à toutes les formations.' },
    ],
  },
  {
    icon: Building2,
    title: 'Gestion B2B — Entreprises',
    color: 'bg-indigo-100 text-indigo-700',
    items: [
      { label: 'Comptes entreprises', desc: '/admin/entreprise — gérez les comptes entreprises (SSO, accès groupé, facturation mensuelle).' },
      { label: 'Cohortes', desc: '/admin/entreprise/cohortes — créez des groupes d\'apprenants par entreprise avec un catalogue de formations dédié.' },
      { label: 'Rapports entreprise', desc: 'Générez des rapports PDF de progression pour chaque cohorte à envoyer aux DRH.' },
      { label: 'SSO', desc: '/admin/sso — configurez la connexion unique (SAML/OAuth) pour les entreprises partenaires.' },
    ],
  },
  {
    icon: FileText,
    title: 'Blog et contenu',
    color: 'bg-pink-100 text-pink-700',
    items: [
      { label: 'Articles de blog', desc: '/admin/blog — créez et gérez les articles du blog IBIG. Définissez auteur, catégorie, image et date de publication.' },
      { label: 'Témoignages', desc: '/admin/temoignages — validez et mettez en avant les avis apprenants sur la page d\'accueil.' },
      { label: 'Newsletter', desc: '/admin/newsletter — gérez la liste des abonnés et envoyez des campagnes email.' },
      { label: 'Badges', desc: '/admin/badges — créez de nouveaux badges et définissez les conditions d\'obtention.' },
    ],
  },
  {
    icon: BarChart2,
    title: 'Rapports et analytics',
    color: 'bg-teal-100 text-teal-700',
    items: [
      { label: 'Rapports financiers', desc: '/admin/rapports — CA mensuel, revenus par formateur, marge IBIG, exports CSV/Excel.' },
      { label: 'Rapports pédagogiques', desc: 'Taux de complétion global, formations les plus suivies, temps moyen de formation.' },
      { label: 'Exports', desc: '/admin/exports — exportez la liste des utilisateurs, des certificats ou des paiements en CSV.' },
      { label: 'Relances inactivité', desc: '/admin/relances — configurez les relances automatiques pour les apprenants inactifs depuis X jours.' },
    ],
  },
  {
    icon: Settings,
    title: 'Paramètres système',
    color: 'bg-gray-100 text-gray-700',
    items: [
      { label: 'Paramètres généraux', desc: '/admin/parametres — nom de la plateforme, email de contact, devise par défaut, langues activées.' },
      { label: 'Marque blanche', desc: '/admin/marque-blanche — configurez une instance white-label pour un partenaire (logo, couleurs, domaine).' },
      { label: 'Notifications', desc: '/admin/notifications — gérez les notifications push envoyées aux utilisateurs.' },
      { label: 'Certificats', desc: '/admin/certificats — personnalisez le template des certificats (logo, signature, texte).' },
    ],
  },
]

export default function GuideAdminPage() {
  return (
    <div className="min-h-screen bg-gray-50">

      <div className="bg-green-700 text-white py-12">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex items-center gap-2 text-green-200 text-sm mb-4">
            <Link href="/aide" className="hover:text-white">Centre d'aide</Link>
            <ChevronRight className="w-4 h-4" />
            <span>Guide Administrateur</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center flex-shrink-0">
              <Shield className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">Guide Administrateur</h1>
              <p className="text-green-200 mt-1">Maîtrisez la console d'administration IBIG E-LEARNING</p>
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

        <div className="mt-10 bg-green-50 rounded-2xl p-6 border border-green-100">
          <h3 className="font-bold text-green-700 mb-3">🔐 Bonnes pratiques de sécurité</h3>
          <ul className="space-y-2">
            {[
              'Ne partagez jamais vos identifiants admin — créez un compte coordinateur pour les collègues',
              'Validez les formations dans les 48h suivant la soumission d\'un formateur',
              'Exportez les rapports financiers chaque fin de mois et archivez-les',
              'Vérifiez les demandes de virement avant approbation (minimum 50 000 FCFA)',
              'Activez les notifications admin pour être alerté de chaque nouveau paiement',
            ].map((t, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                <span className="text-green-600 font-bold mt-0.5">✓</span>
                {t}
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/admin"
            className="bg-green-700 text-white font-bold px-6 py-3 rounded-xl hover:bg-green-800 transition-colors">
            Accéder à la console admin
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
