import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Conditions Générales de Vente — IBIG E-LEARNING',
  description: 'CGV de la plateforme IBIG E-LEARNING. Modalités d\'achat, paiement Mobile Money, politique de remboursement, accès aux formations.',
  alternates: { canonical: 'https://ibig-elearning.com/cgv' },
  robots: { index: true, follow: false },
}

const LAST_UPDATE = 'Octobre 2026'

const articles = [
  {
    num: '1', title: 'Vendeur',
    content: `Les présentes Conditions Générales de Vente (CGV) s'appliquent à tout achat effectué sur la plateforme ibig-elearning.com, éditée par :

IBIG SARL — Intermark Business International Group
Siège : Abidjan, Cocody Riviera Palmeraie, Côte d'Ivoire
Téléphone : +225 27 22 27 60 14 / +225 07 78 88 25 92
Email : contact@ibig-elearning.com`,
  },
  {
    num: '2', title: 'Produits et services',
    content: `IBIG E-LEARNING commercialise des formations en ligne à destination des particuliers et des professionnels. Chaque formation comprend :`,
    items: [
      { label: '', desc: 'Accès à vie aux vidéos, documents et supports de cours.' },
      { label: '', desc: 'Quiz d\'évaluation et examen final sécurisé.' },
      { label: '', desc: 'Certificat numérique vérifiable par QR code en cas de réussite.' },
      { label: '', desc: 'Accès à SARA, l\'assistante pédagogique IA disponible 24h/24.' },
      { label: '', desc: 'Toutes les mises à jour futures du contenu sans frais supplémentaires.' },
    ],
  },
  {
    num: '3', title: 'Prix',
    content: `Les prix sont affichés en francs CFA (XOF), en euros (EUR) ou en dollars (USD) selon la sélection de l'utilisateur. Les prix s'entendent toutes taxes comprises applicables en Côte d'Ivoire. IBIG SARL se réserve le droit de modifier ses prix à tout moment, étant entendu que le prix applicable est celui en vigueur au moment de la commande.

Des codes promotionnels peuvent être appliqués au moment du paiement pour bénéficier de réductions. Un seul code promo par commande.`,
  },
  {
    num: '4', title: 'Modalités de paiement',
    content: `Les paiements sont traités de manière sécurisée via les opérateurs suivants :`,
    items: [
      { label: 'Orange Money', desc: 'Paiement mobile disponible en Côte d\'Ivoire, Sénégal, Mali, Burkina Faso et autres pays couverts.' },
      { label: 'MTN Mobile Money', desc: 'Disponible en Côte d\'Ivoire, Cameroun, Bénin, Guinée et pays MTN.' },
      { label: 'Wave', desc: 'Disponible au Sénégal, Côte d\'Ivoire, Burkina Faso et Mali.' },
      { label: 'Visa / Mastercard', desc: 'Carte bancaire internationale, paiement sécurisé SSL via CinetPay.' },
    ],
    footer: 'Le paiement est exigible immédiatement à la commande. L\'accès à la formation est débloqué dès confirmation du paiement par l\'opérateur (généralement instantané, délai maximum 15 minutes).',
  },
  {
    num: '5', title: 'Conclusion de la commande',
    content: `La commande est validée à réception de la confirmation de paiement. Un email de confirmation vous est envoyé avec le récapitulatif de votre achat et le lien d'accès à la formation. En cas de non-réception de l'email dans les 30 minutes, vérifiez vos spams ou contactez le support.`,
  },
  {
    num: '6', title: 'Droit de rétractation et remboursement',
    content: `IBIG E-LEARNING propose une garantie satisfait ou remboursé sous les conditions suivantes :`,
    items: [
      { label: 'Délai', desc: 'La demande de remboursement doit être formulée dans les 7 jours calendaires suivant l\'achat.' },
      { label: 'Condition de contenu', desc: 'Moins de 20% du contenu de la formation doit avoir été visionné ou consulté.' },
      { label: 'Procédure', desc: 'Envoyez un email à contact@ibig-elearning.com avec votre numéro de commande et la raison de la demande.' },
      { label: 'Délai de traitement', desc: 'Le remboursement est traité sous 48h ouvrables. Le délai de réception varie selon l\'opérateur (3 à 7 jours ouvrables).' },
      { label: 'Exceptions', desc: 'Aucun remboursement pour les formations dont plus de 20% a été visionné, les formations gratuites ou les achats effectués avec un code promotionnel de plus de 50%.' },
    ],
  },
  {
    num: '7', title: 'Accès aux formations',
    content: `L'accès aux formations achetées est personnel, non transférable et accordé à vie (sous réserve du maintien du compte). En cas de suspension ou résiliation du compte pour violation des CGU ou des CGV, l'accès aux formations est immédiatement révoqué sans remboursement.`,
  },
  {
    num: '8', title: 'Disponibilité du service',
    content: `IBIG SARL s'engage à maintenir la plateforme disponible 24h/24, 7j/7, sous réserve de maintenances planifiées. En cas d'interruption prolongée non planifiée (plus de 48h consécutives), les abonnés actifs seront informés par email et une extension d'accès équivalente pourra être accordée.`,
  },
  {
    num: '9', title: 'Facturation B2B',
    content: `Pour les entreprises, ONG et institutions souhaitant inscrire plusieurs collaborateurs, IBIG SARL propose des tarifs groupés et une facturation mensuelle dédiée. Contactez notre équipe commerciale à contact@ibig-elearning.com pour obtenir un devis personnalisé.`,
  },
  {
    num: '10', title: 'Litiges et règlement amiable',
    content: `En cas de litige relatif à une commande, l'acheteur est invité à contacter en premier lieu le service client à contact@ibig-elearning.com. En l'absence de résolution amiable dans un délai de 30 jours, le litige sera soumis aux juridictions compétentes d'Abidjan, Côte d'Ivoire, conformément au droit ivoirien et au droit OHADA.`,
  },
  {
    num: '11', title: 'Droit applicable',
    content: `Les présentes CGV sont régies par le droit de la République de Côte d'Ivoire et les dispositions applicables du droit OHADA. Toute clause des présentes CGV qui serait déclarée nulle ou inapplicable par une juridiction compétente n'affecte pas la validité des autres clauses.`,
  },
]

export default function CGVPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-[#0B3D91] text-white py-12">
        <div className="max-w-3xl mx-auto px-4">
          <h1 className="text-3xl font-bold mb-2">Conditions Générales de Vente</h1>
          <p className="text-blue-200 text-sm">Dernière mise à jour : {LAST_UPDATE} · Applicable à ibig-elearning.com</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-12 space-y-6">

        {/* Table des matières */}
        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5">
          <p className="text-xs font-bold text-[#0B3D91] uppercase tracking-widest mb-3">Table des matières</p>
          <div className="grid sm:grid-cols-2 gap-1">
            {articles.map(a => (
              <a key={a.num} href={`#art-${a.num}`} className="text-sm text-[#0B3D91] hover:underline">
                Art. {a.num} — {a.title}
              </a>
            ))}
          </div>
        </div>

        {/* Garantie mise en avant */}
        <div className="bg-green-50 border border-green-200 rounded-2xl p-5 flex gap-4">
          <span className="text-2xl">🛡️</span>
          <div>
            <p className="font-bold text-green-800 text-sm">Garantie satisfait ou remboursé — 7 jours</p>
            <p className="text-green-700 text-sm mt-0.5">Si vous n'êtes pas satisfait dans les 7 jours et avez visionné moins de 20% du contenu, nous vous remboursons intégralement. Sans condition.</p>
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
            {'footer' in a && a.footer && <p className="text-sm text-gray-600 leading-relaxed mt-3 italic">{a.footer}</p>}
          </section>
        ))}

        <div className="flex flex-wrap gap-3 pt-2">
          <Link href="/cgu" className="text-sm text-[#0B3D91] underline">CGU</Link>
          <Link href="/confidentialite" className="text-sm text-[#0B3D91] underline">Politique de confidentialité</Link>
          <Link href="/mentions-legales" className="text-sm text-[#0B3D91] underline">Mentions légales</Link>
        </div>
      </div>
    </div>
  )
}
