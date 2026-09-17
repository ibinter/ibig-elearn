export default function MentionsLegalesPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-16">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Mentions légales</h1>

      <div className="prose prose-gray max-w-none space-y-8">
        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">Éditeur du site</h2>
          <div className="text-gray-600 space-y-1">
            <p><strong>Raison sociale :</strong> IBIG SARL – Intermark Business International Group</p>
            <p><strong>Marque :</strong> IBIG EDUFORM</p>
            <p><strong>Siège social :</strong> Abidjan, Côte d&apos;Ivoire</p>
            <p><strong>Email :</strong> contact@ibiglearn.com</p>
            <p><strong>Site web :</strong> ibiglearn.com</p>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">Hébergement</h2>
          <div className="text-gray-600 space-y-1">
            <p><strong>Hébergeur :</strong> Vercel Inc.</p>
            <p><strong>Adresse :</strong> 340 Pine Street, Suite 1401, San Francisco, CA 94104, États-Unis</p>
            <p><strong>Site :</strong> vercel.com</p>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">Propriété intellectuelle</h2>
          <p className="text-gray-600">
            L&apos;ensemble des contenus présents sur le site IBIG E-LEARN (textes, images, vidéos, logos) sont la propriété exclusive d&apos;IBIG SARL ou de ses partenaires formateurs. Toute reproduction, distribution ou utilisation sans autorisation écrite est strictement interdite.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">Responsabilité</h2>
          <p className="text-gray-600">
            IBIG SARL s&apos;efforce d&apos;assurer l&apos;exactitude et la mise à jour des informations disponibles sur ce site. Cependant, elle ne peut garantir l&apos;exactitude, la précision ou l&apos;exhaustivité des informations publiées.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">Droit applicable</h2>
          <p className="text-gray-600">
            Les présentes mentions légales sont régies par le droit ivoirien. Tout litige sera soumis à la compétence exclusive des tribunaux d&apos;Abidjan, Côte d&apos;Ivoire.
          </p>
        </section>
      </div>
    </div>
  )
}
