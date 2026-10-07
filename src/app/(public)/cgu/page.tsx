import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Conditions Générales d\'Utilisation — IBIG E-LEARNING',
  description: 'CGU de la plateforme IBIG E-LEARNING. Règles d\'utilisation, droits et obligations des utilisateurs, formateurs et administrateurs.',
  alternates: { canonical: 'https://ibig-elearning.com/cgu' },
  robots: { index: true, follow: false },
}

const LAST_UPDATE = 'Octobre 2026'

const articles = [
  {
    num: '1', title: 'Objet et acceptation',
    content: `Les présentes Conditions Générales d'Utilisation (CGU) régissent l'accès et l'utilisation de la plateforme IBIG E-LEARNING (ibig-elearning.com), éditée par IBIG SARL — Intermark Business International Group, dont le siège est à Abidjan, Cocody Riviera Palmeraie, Côte d'Ivoire.

En créant un compte ou en accédant à la plateforme, vous reconnaissez avoir lu, compris et accepté sans réserve les présentes CGU. Si vous n'acceptez pas ces conditions, veuillez ne pas utiliser la plateforme.`,
  },
  {
    num: '2', title: 'Définitions',
    items: [
      { label: 'Plateforme', desc: 'Le site ibig-elearning.com et ses applications associées.' },
      { label: 'Utilisateur', desc: 'Toute personne physique ou morale accédant à la plateforme.' },
      { label: 'Apprenant', desc: 'Utilisateur inscrit à une ou plusieurs formations.' },
      { label: 'Formateur', desc: 'Utilisateur créant et publiant des formations sur la plateforme.' },
      { label: 'Contenu', desc: 'Tout élément publié sur la plateforme : vidéos, textes, quiz, documents, certificats.' },
      { label: 'Certificat', desc: 'Document numérique émis par IBIG SARL attestant la réussite d\'une formation.' },
    ],
  },
  {
    num: '3', title: 'Création de compte',
    content: `Pour accéder aux fonctionnalités complètes de la plateforme, vous devez créer un compte. Vous vous engagez à :`,
    items: [
      { label: 'Exactitude', desc: 'Fournir des informations exactes, complètes et à jour lors de l\'inscription.' },
      { label: 'Confidentialité', desc: 'Maintenir la confidentialité de vos identifiants de connexion et ne pas les partager avec des tiers.' },
      { label: 'Responsabilité', desc: 'Être responsable de toutes les activités réalisées depuis votre compte.' },
      { label: 'Notification', desc: 'Informer immédiatement IBIG SARL en cas d\'utilisation non autorisée de votre compte.' },
      { label: 'Unicité', desc: 'Ne créer qu\'un seul compte personnel. Les comptes multiples sont interdits.' },
    ],
  },
  {
    num: '4', title: 'Accès aux formations et contenu',
    content: `En vous inscrivant à une formation sur IBIG E-LEARNING, vous bénéficiez d'un accès personnel, non exclusif et non transférable au contenu de cette formation. Cet accès est accordé à vie sauf résiliation du compte pour manquement aux CGU.

Les contenus sont protégés par le droit de la propriété intellectuelle. Il est strictement interdit de :`,
    items: [
      { label: '', desc: 'Télécharger, copier ou redistribuer les vidéos et documents de cours sans autorisation.' },
      { label: '', desc: 'Partager votre accès avec d\'autres personnes ou revendre votre compte.' },
      { label: '', desc: 'Utiliser le contenu à des fins commerciales sans accord écrit d\'IBIG SARL.' },
      { label: '', desc: 'Reproduire ou adapter les formations pour créer des contenus concurrents.' },
    ],
  },
  {
    num: '5', title: 'Système d\'évaluation et anti-triche',
    content: `IBIG E-LEARNING dispose d'un système d'évaluation sécurisé. En participant aux quiz et examens, vous acceptez les règles suivantes :`,
    items: [
      { label: 'Honnêteté', desc: 'Les réponses doivent refléter vos propres connaissances. Toute aide extérieure est prohibée pendant les évaluations.' },
      { label: 'Surveillance', desc: 'La plateforme détecte les changements d\'onglet, les vitesses de réponse anormales et les comportements suspects.' },
      { label: 'Auto-soumission', desc: '3 changements d\'onglet pendant un examen entraînent une soumission automatique de vos réponses.' },
      { label: 'Score serveur', desc: 'Les scores sont calculés exclusivement côté serveur — toute tentative de manipulation est détectée et enregistrée.' },
      { label: 'Signalement', desc: 'Les tentatives signalées comme suspectes sont examinées par notre équipe et peuvent entraîner l\'invalidation du certificat.' },
    ],
  },
  {
    num: '6', title: 'Certificats',
    content: `Les certificats IBIG E-LEARNING sont délivrés aux apprenants ayant satisfait à l'ensemble des conditions de la formation (leçons complétées, examen réussi avec le score minimum requis). Chaque certificat comporte un QR code unique permettant sa vérification en ligne.

IBIG SARL se réserve le droit d'invalider tout certificat obtenu frauduleusement.`,
  },
  {
    num: '7', title: 'Obligations des formateurs',
    content: `Les formateurs s'engagent à publier des contenus originaux, exacts et respectueux des droits de tiers. Sont notamment interdits :`,
    items: [
      { label: '', desc: 'Contenus portant atteinte aux droits de propriété intellectuelle de tiers.' },
      { label: '', desc: 'Informations fausses, trompeuses ou susceptibles d\'induire les apprenants en erreur.' },
      { label: '', desc: 'Contenus à caractère discriminatoire, haineux, obscène ou illégal.' },
      { label: '', desc: 'Contenu dont le formateur ne détient pas les droits de diffusion.' },
    ],
  },
  {
    num: '8', title: 'Comportement des utilisateurs',
    content: `Tout utilisateur s'engage à utiliser la plateforme dans le respect des lois applicables et des droits des tiers. Sont prohibés :`,
    items: [
      { label: '', desc: 'Harcèlement, insultes ou comportements abusifs envers d\'autres utilisateurs ou formateurs.' },
      { label: '', desc: 'Diffusion de spam, publicités non sollicitées ou contenus malveillants.' },
      { label: '', desc: 'Tentatives de piratage, d\'accès non autorisé ou de perturbation des services.' },
      { label: '', desc: 'Usurpation d\'identité ou fausse représentation.' },
    ],
  },
  {
    num: '9', title: 'Suspension et résiliation',
    content: `IBIG SARL se réserve le droit de suspendre ou résilier tout compte sans préavis en cas de violation des présentes CGU, d'activité frauduleuse, ou de comportement préjudiciable à la plateforme ou à ses utilisateurs. En cas de résiliation, l'accès aux formations achetées est définitivement supprimé. Aucun remboursement ne sera accordé en cas de résiliation pour faute.`,
  },
  {
    num: '10', title: 'Modifications des CGU',
    content: `IBIG SARL se réserve le droit de modifier les présentes CGU à tout moment. Les utilisateurs seront informés des modifications importantes par email ou notification sur la plateforme. La poursuite de l'utilisation de la plateforme après notification vaut acceptation des nouvelles CGU.`,
  },
  {
    num: '11', title: 'Droit applicable et juridiction',
    content: `Les présentes CGU sont régies par le droit ivoirien et le droit de l'espace OHADA. En cas de litige, les parties s'efforceront de trouver une solution amiable. À défaut, les tribunaux compétents sont ceux d'Abidjan, Côte d'Ivoire.`,
  },
  {
    num: '12', title: 'Contact',
    content: `Pour toute question relative aux présentes CGU, contactez IBIG SARL à : contact@ibig-elearning.com ou par courrier à Abidjan, Cocody Riviera Palmeraie, Côte d'Ivoire.`,
  },
]

export default function CGUPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-[#0B3D91] text-white py-12">
        <div className="max-w-3xl mx-auto px-4">
          <h1 className="text-3xl font-bold mb-2">Conditions Générales d'Utilisation</h1>
          <p className="text-blue-200 text-sm">Dernière mise à jour : {LAST_UPDATE} · Applicable à ibig-elearning.com</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-12 space-y-6">

        {/* Table des matières */}
        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5">
          <p className="text-xs font-bold text-[#0B3D91] uppercase tracking-widest mb-3">Table des matières</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
            {articles.map(a => (
              <a key={a.num} href={`#art-${a.num}`} className="text-sm text-[#0B3D91] hover:underline">
                Art. {a.num} — {a.title}
              </a>
            ))}
          </div>
        </div>

        {articles.map(a => (
          <section key={a.num} id={`art-${a.num}`} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-7">
            <h2 className="text-base font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100">
              Article {a.num} — {a.title}
            </h2>
            {a.content && <p className="text-sm text-gray-600 leading-relaxed mb-3 whitespace-pre-line">{a.content}</p>}
            {a.items && (
              <ul className="space-y-2 mt-2">
                {a.items.map((item, i) => (
                  <li key={i} className="flex gap-2 text-sm text-gray-600">
                    <span className="text-[#0B3D91] font-bold flex-shrink-0 mt-0.5">•</span>
                    <span>{item.label ? <><strong className="text-gray-800">{item.label} :</strong> {item.desc}</> : item.desc}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        ))}

        <div className="flex flex-wrap gap-3 pt-2">
          <Link href="/cgv" className="text-sm text-[#0B3D91] underline">CGV</Link>
          <Link href="/confidentialite" className="text-sm text-[#0B3D91] underline">Politique de confidentialité</Link>
          <Link href="/mentions-legales" className="text-sm text-[#0B3D91] underline">Mentions légales</Link>
        </div>
      </div>
    </div>
  )
}
