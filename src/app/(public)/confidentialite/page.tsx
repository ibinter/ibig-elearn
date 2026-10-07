import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Politique de confidentialité — IBIG E-LEARNING',
  description: 'Politique de confidentialité IBIG E-LEARNING. Données collectées, finalités, droits RGPD, cookies, sécurité des données personnelles.',
  alternates: { canonical: 'https://ibig-elearning.com/confidentialite' },
  robots: { index: true, follow: false },
}

const LAST_UPDATE = 'Octobre 2026'

export default function ConfidentialitePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-[#0B3D91] text-white py-12">
        <div className="max-w-3xl mx-auto px-4">
          <h1 className="text-3xl font-bold mb-2">Politique de confidentialité</h1>
          <p className="text-blue-200 text-sm">Dernière mise à jour : {LAST_UPDATE} · Applicable à ibig-elearning.com</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-12 space-y-6">

        {/* Table des matières */}
        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5">
          <p className="text-xs font-bold text-[#0B3D91] uppercase tracking-widest mb-3">Sommaire</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-sm text-[#0B3D91]">
            {[
              ['1', 'Responsable du traitement'],
              ['2', 'Données collectées'],
              ['3', 'Finalités du traitement'],
              ['4', 'Base légale'],
              ['5', 'Durée de conservation'],
              ['6', 'Partage avec des tiers'],
              ['7', 'Transferts internationaux'],
              ['8', 'Vos droits'],
              ['9', 'Cookies et traceurs'],
              ['10', 'Sécurité des données'],
              ['11', 'Modifications'],
              ['12', 'Contact'],
            ].map(([num, title]) => (
              <a key={num} href={`#sec-${num}`} className="hover:underline">
                {num}. {title}
              </a>
            ))}
          </div>
        </div>

        {/* Intro */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-7">
          <p className="text-sm text-gray-600 leading-relaxed">
            IBIG SARL (Intermark Business International Group), éditrice de la plateforme ibig-elearning.com, attache une grande importance à la protection de vos données personnelles. La présente politique décrit les données que nous collectons, la manière dont nous les utilisons, et les droits dont vous disposez.
          </p>
        </div>

        {/* Section 1 */}
        <section id="sec-1" className="bg-white rounded-2xl border border-gray-100 shadow-sm p-7">
          <h2 className="text-base font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100">1. Responsable du traitement</h2>
          <div className="space-y-1 text-sm text-gray-600">
            <p><strong className="text-gray-800">Entité :</strong> IBIG SARL — Intermark Business International Group</p>
            <p><strong className="text-gray-800">Siège :</strong> Abidjan, Cocody Riviera Palmeraie, Côte d'Ivoire</p>
            <p><strong className="text-gray-800">Email :</strong> contact@ibig-elearning.com</p>
            <p><strong className="text-gray-800">Téléphone :</strong> +225 27 22 27 60 14 / +225 07 78 88 25 92</p>
          </div>
        </section>

        {/* Section 2 */}
        <section id="sec-2" className="bg-white rounded-2xl border border-gray-100 shadow-sm p-7">
          <h2 className="text-base font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100">2. Données collectées</h2>
          <p className="text-sm text-gray-600 mb-3">Nous collectons uniquement les données nécessaires au fonctionnement de la plateforme :</p>
          <div className="space-y-4">
            {[
              {
                cat: 'Données d\'identité', items: [
                  'Prénom, nom (fournis à l\'inscription)',
                  'Adresse email (identifiant principal)',
                  'Pays et langue préférée',
                ]
              },
              {
                cat: 'Données de paiement', items: [
                  'Historique des achats (numéro de commande, formation achetée, montant, date)',
                  'Les données de carte bancaire sont traitées directement par CinetPay — nous n\'en conservons aucune.',
                  'Numéro de téléphone Mobile Money pour confirmation de paiement',
                ]
              },
              {
                cat: 'Données d\'utilisation', items: [
                  'Progression dans les formations (leçons complétées, temps passé)',
                  'Scores des quiz et examens',
                  'Certificats obtenus',
                  'Activité de connexion (date, heure, adresse IP)',
                ]
              },
              {
                cat: 'Données techniques', items: [
                  'Adresse IP et informations de navigateur (user-agent, langue)',
                  'Cookies de session et préférences',
                  'Logs d\'erreurs et de performance anonymisés',
                ]
              },
            ].map(({ cat, items }) => (
              <div key={cat}>
                <p className="text-sm font-semibold text-gray-800 mb-1">{cat}</p>
                <ul className="space-y-1">
                  {items.map((item, i) => (
                    <li key={i} className="flex gap-2 text-sm text-gray-600">
                      <span className="text-[#0B3D91] font-bold flex-shrink-0 mt-0.5">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* Section 3 */}
        <section id="sec-3" className="bg-white rounded-2xl border border-gray-100 shadow-sm p-7">
          <h2 className="text-base font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100">3. Finalités du traitement</h2>
          <ul className="space-y-2">
            {[
              { label: 'Fourniture du service', desc: 'Création et gestion de votre compte, accès aux formations achetées.' },
              { label: 'Traitement des paiements', desc: 'Validation des transactions, émission des factures, gestion des remboursements.' },
              { label: 'Émission des certificats', desc: 'Vérification de la réussite, génération et signature numérique des certificats.' },
              { label: 'Support et communication', desc: 'Réponses à vos demandes, notifications de mise à jour de cours, alertes de sécurité.' },
              { label: 'Amélioration du service', desc: 'Analyse agrégée et anonymisée des parcours d\'apprentissage pour améliorer les contenus.' },
              { label: 'Sécurité et anti-fraude', desc: 'Détection des comportements anormaux lors des examens, prévention de la fraude au paiement.' },
              { label: 'Obligations légales', desc: 'Conservation des données comptables conformément au droit OHADA (10 ans).' },
            ].map((item, i) => (
              <li key={i} className="flex gap-2 text-sm text-gray-600">
                <span className="text-[#0B3D91] font-bold flex-shrink-0 mt-0.5">•</span>
                <span><strong className="text-gray-800">{item.label} :</strong> {item.desc}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Section 4 */}
        <section id="sec-4" className="bg-white rounded-2xl border border-gray-100 shadow-sm p-7">
          <h2 className="text-base font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100">4. Base légale du traitement</h2>
          <ul className="space-y-2">
            {[
              { label: 'Exécution du contrat', desc: 'Traitement nécessaire à la fourniture du service que vous avez commandé.' },
              { label: 'Consentement', desc: 'Envoi d\'emails marketing ou promotionnels (opt-in, révocable à tout moment).' },
              { label: 'Intérêt légitime', desc: 'Sécurité de la plateforme, prévention de la fraude, amélioration des services.' },
              { label: 'Obligation légale', desc: 'Conservation des données comptables et fiscales requise par la loi ivoirienne et le droit OHADA.' },
            ].map((item, i) => (
              <li key={i} className="flex gap-2 text-sm text-gray-600">
                <span className="text-[#0B3D91] font-bold flex-shrink-0 mt-0.5">•</span>
                <span><strong className="text-gray-800">{item.label} :</strong> {item.desc}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Section 5 */}
        <section id="sec-5" className="bg-white rounded-2xl border border-gray-100 shadow-sm p-7">
          <h2 className="text-base font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100">5. Durée de conservation</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-gray-600 border-collapse">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left font-semibold text-gray-800 py-2 pr-4">Type de données</th>
                  <th className="text-left font-semibold text-gray-800 py-2">Durée</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {[
                  ['Compte utilisateur actif', 'Durée du compte + 3 ans après la dernière connexion'],
                  ['Historique des achats', '10 ans (obligation comptable)'],
                  ['Données de progression', 'Durée du compte + 2 ans'],
                  ['Certificats émis', 'Durée illimitée (vérifiabilité permanente)'],
                  ['Logs de sécurité', '12 mois glissants'],
                  ['Données de paiement (référence)', '10 ans (obligation légale)'],
                  ['Cookies analytiques', '13 mois maximum'],
                ].map(([type, duree], i) => (
                  <tr key={i}>
                    <td className="py-2 pr-4">{type}</td>
                    <td className="py-2">{duree}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Section 6 */}
        <section id="sec-6" className="bg-white rounded-2xl border border-gray-100 shadow-sm p-7">
          <h2 className="text-base font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100">6. Partage avec des tiers</h2>
          <p className="text-sm text-gray-600 mb-3">Nous ne vendons jamais vos données personnelles. Nous les partageons uniquement avec les prestataires techniques nécessaires :</p>
          <ul className="space-y-2">
            {[
              { label: 'Supabase Inc.', desc: 'Base de données et authentification. Stockage sécurisé en région Europe (Union européenne). Politique : supabase.com/privacy' },
              { label: 'Vercel Inc.', desc: 'Hébergement de la plateforme web. CDN mondial, infrastructure sécurisée. Politique : vercel.com/legal/privacy-policy' },
              { label: 'CinetPay', desc: 'Traitement sécurisé des paiements Mobile Money et cartes bancaires. Vos données de paiement restent chez CinetPay.' },
              { label: 'Prestataires de formation', desc: 'Les formateurs partenaires accèdent uniquement aux statistiques agrégées de leurs formations (pas de données personnelles identifiantes des apprenants).' },
            ].map((item, i) => (
              <li key={i} className="flex gap-2 text-sm text-gray-600">
                <span className="text-[#0B3D91] font-bold flex-shrink-0 mt-0.5">•</span>
                <span><strong className="text-gray-800">{item.label} :</strong> {item.desc}</span>
              </li>
            ))}
          </ul>
          <p className="text-sm text-gray-600 mt-3">En dehors de ces prestataires, nous pouvons partager des données uniquement si la loi l'exige (réquisition judiciaire, obligation légale).</p>
        </section>

        {/* Section 7 */}
        <section id="sec-7" className="bg-white rounded-2xl border border-gray-100 shadow-sm p-7">
          <h2 className="text-base font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100">7. Transferts internationaux de données</h2>
          <p className="text-sm text-gray-600 leading-relaxed">Nos prestataires (Vercel, Supabase) peuvent traiter des données en dehors de la Côte d'Ivoire et de l'espace OHADA. Ces transferts sont encadrés par des clauses contractuelles types (CCT) conformes aux standards internationaux de protection des données, assurant un niveau de protection équivalent à celui garanti en Côte d'Ivoire.</p>
        </section>

        {/* Section 8 */}
        <section id="sec-8" className="bg-white rounded-2xl border border-gray-100 shadow-sm p-7">
          <h2 className="text-base font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100">8. Vos droits</h2>
          <p className="text-sm text-gray-600 mb-3">Conformément aux lois applicables sur la protection des données, vous disposez des droits suivants :</p>
          <ul className="space-y-2">
            {[
              { label: 'Droit d\'accès', desc: 'Obtenir une copie de toutes les données personnelles que nous détenons sur vous.' },
              { label: 'Droit de rectification', desc: 'Corriger des informations inexactes ou incomplètes vous concernant.' },
              { label: 'Droit à l\'effacement', desc: 'Demander la suppression de vos données (sous réserve des obligations légales de conservation).' },
              { label: 'Droit à la portabilité', desc: 'Recevoir vos données dans un format structuré, couramment utilisé et lisible par machine.' },
              { label: 'Droit d\'opposition', desc: 'Vous opposer au traitement de vos données à des fins marketing à tout moment.' },
              { label: 'Droit à la limitation', desc: 'Demander la suspension du traitement de vos données dans certains cas.' },
              { label: 'Retrait du consentement', desc: 'Retirer à tout moment votre consentement pour les traitements basés sur celui-ci (emails marketing).' },
            ].map((item, i) => (
              <li key={i} className="flex gap-2 text-sm text-gray-600">
                <span className="text-[#0B3D91] font-bold flex-shrink-0 mt-0.5">•</span>
                <span><strong className="text-gray-800">{item.label} :</strong> {item.desc}</span>
              </li>
            ))}
          </ul>
          <div className="mt-4 bg-blue-50 rounded-xl p-4">
            <p className="text-sm text-[#0B3D91] font-medium">Pour exercer vos droits</p>
            <p className="text-sm text-gray-600 mt-1">Envoyez votre demande par email à <strong>contact@ibig-elearning.com</strong> en précisant votre identité et le droit que vous souhaitez exercer. Nous répondrons dans un délai de 30 jours.</p>
          </div>
        </section>

        {/* Section 9 */}
        <section id="sec-9" className="bg-white rounded-2xl border border-gray-100 shadow-sm p-7">
          <h2 className="text-base font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100">9. Cookies et traceurs</h2>
          <p className="text-sm text-gray-600 mb-3">Nous utilisons uniquement les cookies strictement nécessaires au fonctionnement de la plateforme :</p>
          <ul className="space-y-2">
            {[
              { label: 'Cookie de session', desc: 'Maintien de votre connexion (session Supabase). Durée : session navigateur.' },
              { label: 'Cookie de préférences', desc: 'Langue sélectionnée, état de l\'interface. Durée : 12 mois.' },
              { label: 'Cookie CSRF', desc: 'Protection contre les attaques de type Cross-Site Request Forgery. Durée : session.' },
            ].map((item, i) => (
              <li key={i} className="flex gap-2 text-sm text-gray-600">
                <span className="text-[#0B3D91] font-bold flex-shrink-0 mt-0.5">•</span>
                <span><strong className="text-gray-800">{item.label} :</strong> {item.desc}</span>
              </li>
            ))}
          </ul>
          <p className="text-sm text-gray-600 mt-3">Nous n'utilisons pas de cookies publicitaires ou de traçage tiers à des fins de ciblage. Vous pouvez gérer les cookies depuis les paramètres de votre navigateur.</p>
        </section>

        {/* Section 10 */}
        <section id="sec-10" className="bg-white rounded-2xl border border-gray-100 shadow-sm p-7">
          <h2 className="text-base font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100">10. Sécurité des données</h2>
          <p className="text-sm text-gray-600 mb-3">Nous mettons en œuvre des mesures techniques et organisationnelles appropriées pour protéger vos données :</p>
          <ul className="space-y-2">
            {[
              'Chiffrement des données en transit (HTTPS/TLS 1.3) et au repos (AES-256)',
              'Authentification sécurisée via Supabase Auth avec hachage bcrypt des mots de passe',
              'Politique de Row-Level Security (RLS) sur la base de données — chaque utilisateur n\'accède qu\'à ses propres données',
              'Accès aux données de production restreint aux administrateurs autorisés avec MFA',
              'Audits de sécurité réguliers et mises à jour des dépendances',
              'Sauvegardes quotidiennes chiffrées conservées 30 jours',
            ].map((item, i) => (
              <li key={i} className="flex gap-2 text-sm text-gray-600">
                <span className="text-[#0B3D91] font-bold flex-shrink-0 mt-0.5">•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
          <p className="text-sm text-gray-600 mt-3">En cas de violation de données susceptible d'engendrer un risque pour vos droits, nous nous engageons à vous en informer dans les meilleurs délais.</p>
        </section>

        {/* Section 11 */}
        <section id="sec-11" className="bg-white rounded-2xl border border-gray-100 shadow-sm p-7">
          <h2 className="text-base font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100">11. Modifications de la politique</h2>
          <p className="text-sm text-gray-600 leading-relaxed">Nous pouvons mettre à jour cette politique pour refléter des évolutions légales ou techniques. En cas de modification substantielle, nous vous en informerons par email ou par notification sur la plateforme avant l'entrée en vigueur des nouvelles dispositions. La date de dernière mise à jour est toujours indiquée en haut de cette page.</p>
        </section>

        {/* Section 12 */}
        <section id="sec-12" className="bg-white rounded-2xl border border-gray-100 shadow-sm p-7">
          <h2 className="text-base font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100">12. Contact et réclamations</h2>
          <p className="text-sm text-gray-600 mb-3">Pour toute question relative à vos données personnelles ou pour exercer vos droits :</p>
          <div className="space-y-1 text-sm text-gray-600">
            <p>📧 <strong className="text-gray-800">Email :</strong> contact@ibig-elearning.com</p>
            <p>📍 <strong className="text-gray-800">Courrier :</strong> IBIG SARL, Cocody Riviera Palmeraie, Abidjan, Côte d'Ivoire</p>
          </div>
          <p className="text-sm text-gray-600 mt-3">Si vous estimez que vos droits n'ont pas été respectés après avoir contacté notre service, vous avez la possibilité de saisir l'autorité compétente de protection des données de votre pays de résidence.</p>
        </section>

        <div className="flex flex-wrap gap-3 pt-2">
          <Link href="/cgu" className="text-sm text-[#0B3D91] underline">CGU</Link>
          <Link href="/cgv" className="text-sm text-[#0B3D91] underline">CGV</Link>
          <Link href="/mentions-legales" className="text-sm text-[#0B3D91] underline">Mentions légales</Link>
        </div>
      </div>
    </div>
  )
}
