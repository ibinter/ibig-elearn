export default function ConfidentialitePage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-16">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Politique de confidentialité</h1>
      <p className="text-gray-500 mb-8">Dernière mise à jour : septembre 2026</p>

      <div className="space-y-8 text-gray-600">
        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">1. Données collectées</h2>
          <p>Lors de votre inscription sur IBIG E-LEARN, nous collectons :</p>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>Nom complet et adresse email</li>
            <li>Numéro de téléphone (optionnel)</li>
            <li>Pays de résidence</li>
            <li>Données de progression (leçons suivies, quiz, certificats)</li>
            <li>Informations de paiement (traitées par CinetPay, non stockées chez nous)</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">2. Utilisation des données</h2>
          <p>Vos données sont utilisées pour :</p>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>Gérer votre compte et votre accès aux formations</li>
            <li>Personnaliser votre expérience d&apos;apprentissage</li>
            <li>Émettre vos certificats de réussite</li>
            <li>Vous envoyer des notifications relatives à vos formations</li>
            <li>Améliorer nos services</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">3. Partage des données</h2>
          <p>
            Nous ne vendons ni ne louons vos données personnelles à des tiers. Nous pouvons partager vos données avec :
          </p>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li><strong>Supabase</strong> – hébergement et gestion des données</li>
            <li><strong>CinetPay</strong> – traitement des paiements</li>
            <li>Les formateurs, dans la limite des données liées à vos inscriptions à leurs formations</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">4. Vos droits</h2>
          <p>Vous disposez des droits suivants sur vos données personnelles :</p>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>Droit d&apos;accès et de rectification</li>
            <li>Droit à l&apos;effacement (&quot;droit à l&apos;oubli&quot;)</li>
            <li>Droit à la portabilité</li>
            <li>Droit d&apos;opposition au traitement</li>
          </ul>
          <p className="mt-3">Pour exercer ces droits : <strong>privacy@ibiglearn.com</strong></p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">5. Cookies</h2>
          <p>
            Nous utilisons des cookies essentiels pour le fonctionnement de la plateforme (authentification, préférences) et des cookies analytiques anonymisés pour améliorer l&apos;expérience utilisateur. Vous pouvez désactiver les cookies non essentiels dans les paramètres de votre navigateur.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">6. Contact</h2>
          <p>Pour toute question relative à votre vie privée : <strong>contact@ibiglearn.com</strong></p>
        </section>
      </div>
    </div>
  )
}
