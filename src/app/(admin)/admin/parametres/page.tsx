import { Globe, Mail, CreditCard, Bell, Shield, Server } from 'lucide-react'

export default function AdminParametresPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Paramètres</h1>
        <p className="text-gray-500">Configuration générale de la plateforme IBIG E-LEARN</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Infos plateforme */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-5">
            <Globe className="w-5 h-5 text-[#0B3D91]" />
            <h2 className="font-bold text-gray-900">Informations générales</h2>
          </div>
          <div className="space-y-4">
            {[
              { label: 'Nom de la plateforme', value: 'IBIG E-LEARN' },
              { label: 'Domaine', value: 'ibiglearn.com' },
              { label: 'Email de contact', value: 'contact@ibiglearn.com' },
              { label: 'Langue par défaut', value: 'Français' },
              { label: 'Devise par défaut', value: 'XOF (Franc CFA)' },
            ].map(item => (
              <div key={item.label} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <span className="text-sm text-gray-500">{item.label}</span>
                <span className="text-sm font-medium text-gray-900">{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Paiement */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-5">
            <CreditCard className="w-5 h-5 text-[#0B3D91]" />
            <h2 className="font-bold text-gray-900">Paiement</h2>
          </div>
          <div className="space-y-4">
            {[
              { label: 'Fournisseur', value: 'CinetPay' },
              { label: 'Mobile Money', value: 'Orange, MTN, Wave, Moov' },
              { label: 'Cartes bancaires', value: 'Visa, Mastercard' },
              { label: 'Garantie remboursement', value: '7 jours' },
              { label: 'Commission plateforme', value: 'Configurable' },
            ].map(item => (
              <div key={item.label} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <span className="text-sm text-gray-500">{item.label}</span>
                <span className="text-sm font-medium text-gray-900">{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Email */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-5">
            <Mail className="w-5 h-5 text-[#0B3D91]" />
            <h2 className="font-bold text-gray-900">Emails transactionnels</h2>
          </div>
          <div className="space-y-3">
            {[
              { label: 'Confirmation inscription', active: true },
              { label: 'Confirmation paiement', active: true },
              { label: 'Certificat de réussite', active: true },
              { label: 'Rappel de formation', active: false },
              { label: 'Newsletter mensuelle', active: false },
            ].map(item => (
              <div key={item.label} className="flex items-center justify-between py-2">
                <span className="text-sm text-gray-700">{item.label}</span>
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${item.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                  {item.active ? 'Activé' : 'Désactivé'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Sécurité */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-5">
            <Shield className="w-5 h-5 text-[#0B3D91]" />
            <h2 className="font-bold text-gray-900">Sécurité</h2>
          </div>
          <div className="space-y-4">
            {[
              { label: 'Authentification', value: 'Supabase Auth' },
              { label: 'Chiffrement BDD', value: 'RLS activé (PostgreSQL)' },
              { label: 'Certificats SSL', value: 'Let\'s Encrypt (Auto)' },
              { label: 'Sauvegarde', value: 'Quotidienne (Supabase)' },
              { label: 'Protection DDoS', value: 'Cloudflare / Vercel Edge' },
            ].map(item => (
              <div key={item.label} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <span className="text-sm text-gray-500">{item.label}</span>
                <span className="text-sm font-medium text-green-700">{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Infrastructure */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 lg:col-span-2">
          <div className="flex items-center gap-2 mb-5">
            <Server className="w-5 h-5 text-[#0B3D91]" />
            <h2 className="font-bold text-gray-900">Infrastructure</h2>
          </div>
          <div className="grid sm:grid-cols-3 gap-6">
            {[
              { name: 'Frontend', tech: 'Next.js 14', host: 'Vercel Edge', status: 'Opérationnel' },
              { name: 'Base de données', tech: 'PostgreSQL (Supabase)', host: 'Supabase Cloud', status: 'Opérationnel' },
              { name: 'Vidéos', tech: 'HLS multi-débit', host: 'Bunny Stream / Cloudflare', status: 'Configurable' },
            ].map(item => (
              <div key={item.name} className="bg-gray-50 rounded-xl p-4">
                <p className="font-semibold text-gray-900 text-sm mb-1">{item.name}</p>
                <p className="text-xs text-gray-500">{item.tech}</p>
                <p className="text-xs text-gray-400">{item.host}</p>
                <span className={`mt-2 inline-block text-xs font-medium px-2 py-0.5 rounded-full ${item.status === 'Opérationnel' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                  {item.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
