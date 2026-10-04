'use client'

import { useState } from 'react'
import { Loader2, ShieldCheck, Smartphone, CreditCard, Globe, ChevronRight, CheckCircle, Banknote, Star } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Provider {
  id: string
  name: string
  label: string
  description: string
  is_default: boolean
  api_route: string
  currencies: string[]
  methods: string[]
  region: 'africa' | 'europe' | 'global'
}

interface Props {
  courseId: string
  priceXof: number
  priceEur: number
  priceUsd: number
  courseName: string
  userEmail: string
  userPhone: string
  userName: string
  userCountry: string
  providers: Provider[]        // chargé depuis la DB par la page serveur
  enrollmentMode?: 'autonome' | 'guide' | 'certifiant'
}

type InstallmentMode = 'full' | '3x'

function formatAmount(amount: number, currency: string) {
  if (currency === 'XOF' || currency === 'XAF') return `${amount.toLocaleString('fr-FR')} FCFA`
  if (currency === 'EUR') return `${amount.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €`
  if (currency === 'USD') return `${amount.toLocaleString('en-US', { minimumFractionDigits: 2 })} $`
  return `${amount} ${currency}`
}

const PROVIDER_ICONS: Record<string, React.ReactNode> = {
  cinetpay:    <Smartphone className="w-5 h-5 text-[#FFA500]" />,
  stripe:      <CreditCard className="w-5 h-5 text-purple-400" />,
  wave:        <Globe className="w-5 h-5 text-blue-400" />,
  flutterwave: <Globe className="w-5 h-5 text-orange-400" />,
  paystack:    <CreditCard className="w-5 h-5 text-teal-400" />,
  paydunya:    <Smartphone className="w-5 h-5 text-green-400" />,
  kkiapay:     <Smartphone className="w-5 h-5 text-yellow-400" />,
}

const REGION_TAGS: Record<string, string> = {
  africa: '🌍 Afrique',
  europe: '🇪🇺 Europe / Diaspora',
  global: '🌐 Global',
}

const CURRENCY_BY_REGION: Record<string, string> = {
  africa: 'XOF',
  europe: 'EUR',
  global: 'EUR',
}

export default function PaymentForm({
  courseId, priceXof, priceEur, priceUsd,
  courseName, userEmail, userPhone, userName,
  providers, enrollmentMode = 'guide',
}: Props) {
  const defaultProvider = providers.find(p => p.is_default) ?? providers[0]
  const [selectedId, setSelectedId] = useState(defaultProvider?.id ?? '')
  const [currency, setCurrency] = useState(
    CURRENCY_BY_REGION[defaultProvider?.region ?? 'africa'] ?? 'XOF'
  )
  const [installments, setInstallments] = useState<InstallmentMode>('full')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const selected = providers.find(p => p.id === selectedId)

  const totalAmount = currency === 'XOF' || currency === 'XAF'
    ? priceXof
    : currency === 'EUR' ? priceEur : priceUsd
  const installAmount = Math.ceil(totalAmount / 3)
  const show3x = (currency === 'XOF' || currency === 'XAF') && priceXof >= 60000

  const handleSelectProvider = (p: Provider) => {
    setSelectedId(p.id)
    setCurrency(CURRENCY_BY_REGION[p.region] ?? 'XOF')
    setInstallments('full')
  }

  const handlePay = async () => {
    if (!selected) return
    setError('')
    setLoading(true)
    try {
      const payload: any = { courseId, currency, enrollmentMode }
      if (installments === '3x') payload.installments = 3

      const res = await fetch(selected.api_route, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Une erreur est survenue.'); return }

      const redirectUrl = data.paymentUrl ?? data.checkoutUrl
      if (!redirectUrl) { setError('Erreur : URL de paiement manquante.'); return }
      window.location.href = redirectUrl
    } catch {
      setError('Erreur réseau. Vérifiez votre connexion.')
    } finally {
      setLoading(false)
    }
  }

  if (!providers.length) {
    return (
      <div className="text-center py-8 text-gray-500">
        Aucun moyen de paiement disponible pour votre région. Contactez le support.
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Infos utilisateur */}
      <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm">
        {userName && <div className="flex justify-between"><span className="text-gray-500">Nom</span><span className="font-medium text-gray-900">{userName}</span></div>}
        <div className="flex justify-between"><span className="text-gray-500">Email</span><span className="font-medium text-gray-900 truncate ml-4">{userEmail}</span></div>
        {userPhone && <div className="flex justify-between"><span className="text-gray-500">Téléphone</span><span className="font-medium text-gray-900">{userPhone}</span></div>}
      </div>

      {/* Sélection provider */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">Moyen de paiement</label>
        <div className="space-y-2">
          {providers.map(p => (
            <button
              key={p.id}
              onClick={() => handleSelectProvider(p)}
              className={cn(
                'w-full flex items-center gap-3 p-4 rounded-xl border-2 text-left transition-all',
                selectedId === p.id
                  ? 'border-[#0B3D91] bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300 bg-white'
              )}
            >
              <div className="flex-shrink-0">
                {PROVIDER_ICONS[p.id] ?? <Globe className="w-5 h-5 text-gray-400" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-gray-900 text-sm">{p.name}</span>
                  {p.is_default && (
                    <span className="flex items-center gap-0.5 text-[10px] bg-[#FFA500]/10 text-[#FFA500] px-1.5 py-0.5 rounded font-semibold">
                      <Star className="w-2.5 h-2.5" /> Recommandé
                    </span>
                  )}
                  <span className="text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
                    {REGION_TAGS[p.region]}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-0.5 truncate">{p.label}</p>
              </div>
              {selectedId === p.id && (
                <CheckCircle className="w-5 h-5 text-[#0B3D91] flex-shrink-0" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Méthodes du provider sélectionné */}
      {selected && selected.methods.length > 0 && (
        <div>
          <p className="text-xs text-gray-500 mb-2 font-semibold uppercase tracking-wider">Méthodes acceptées</p>
          <div className="flex flex-wrap gap-1.5">
            {selected.methods.map(m => (
              <span key={m} className="text-xs bg-gray-100 text-gray-700 px-2.5 py-1 rounded-full">
                {m}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Devise */}
      {selected && selected.currencies.length > 1 && (
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Devise</label>
          <div className="flex flex-wrap gap-2">
            {selected.currencies.map(c => (
              <button key={c} onClick={() => setCurrency(c)}
                className={cn('py-2 px-4 rounded-xl border-2 text-sm font-medium transition-all',
                  currency === c ? 'border-[#0B3D91] bg-blue-50 text-[#0B3D91]' : 'border-gray-200 text-gray-600 hover:border-gray-300'
                )}>
                {c}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Option paiement 3x */}
      {show3x && (
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Modalité de paiement</label>
          <div className="grid grid-cols-2 gap-3">
            <button onClick={() => setInstallments('full')}
              className={cn('p-4 rounded-xl border-2 text-left transition-all',
                installments === 'full' ? 'border-[#0B3D91] bg-blue-50' : 'border-gray-200 hover:border-gray-300'
              )}>
              <div className="flex items-center gap-2 mb-1">
                <Banknote className="w-4 h-4 text-[#0B3D91]" />
                <span className="font-semibold text-gray-900 text-sm">Paiement unique</span>
                {installments === 'full' && <CheckCircle className="w-4 h-4 text-[#0B3D91] ml-auto" />}
              </div>
              <p className="text-base font-bold text-gray-900">{formatAmount(totalAmount, currency)}</p>
              <p className="text-xs text-gray-500 mt-0.5">Accès immédiat à vie</p>
            </button>

            <button onClick={() => setInstallments('3x')}
              className={cn('p-4 rounded-xl border-2 text-left transition-all relative overflow-hidden',
                installments === '3x' ? 'border-[#FFA500] bg-orange-50' : 'border-gray-200 hover:border-gray-300'
              )}>
              <div className="absolute top-2 right-2 bg-[#FFA500] text-black text-[10px] font-bold px-1.5 py-0.5 rounded">POPULAIRE</div>
              <div className="flex items-center gap-2 mb-1">
                <Globe className="w-4 h-4 text-[#FFA500]" />
                <span className="font-semibold text-gray-900 text-sm">Payer en 3x</span>
              </div>
              <p className="text-base font-bold text-gray-900">{formatAmount(installAmount, currency)}<span className="text-sm font-normal text-gray-500">/mois</span></p>
              <p className="text-xs text-gray-500 mt-0.5">Sans frais · Accès immédiat</p>
            </button>
          </div>

          {installments === '3x' && (
            <div className="mt-3 bg-orange-50 border border-orange-200 rounded-xl p-3 text-xs">
              <p className="font-semibold text-orange-700 mb-2">Échéancier :</p>
              {[1, 2, 3].map(n => (
                <div key={n} className="flex justify-between text-gray-600 py-1 border-b border-orange-100 last:border-0">
                  <span>{n === 1 ? "Aujourd'hui" : `Dans ${(n - 1) * 30} jours`} — versement {n}/3</span>
                  <span className="font-semibold">{formatAmount(installAmount, currency)}</span>
                </div>
              ))}
              <p className="text-gray-500 mt-2">Total : {formatAmount(totalAmount, currency)} · Accès immédiat dès le 1er versement.</p>
            </div>
          )}
        </div>
      )}

      {/* Récapitulatif */}
      <div className="bg-gray-900 rounded-xl p-4 text-white">
        <div className="flex items-center justify-between mb-1">
          <span className="text-gray-400 text-sm">{courseName}</span>
          <span className="font-bold text-lg text-[#FFA500]">
            {installments === '3x' ? `${formatAmount(installAmount, currency)} × 3` : formatAmount(totalAmount, currency)}
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-gray-500">
          <CheckCircle className="w-3.5 h-3.5 text-green-400" />
          Accès à vie · Certificat inclus · Contenu mis à jour
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl p-3">{error}</div>
      )}

      <button
        onClick={handlePay}
        disabled={loading || !selected}
        className="w-full flex items-center justify-center gap-3 py-4 bg-[#0B3D91] hover:bg-[#0a3480] text-white font-bold rounded-xl text-base transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {loading ? (
          <><Loader2 className="w-5 h-5 animate-spin" />Redirection en cours…</>
        ) : (
          <>
            {PROVIDER_ICONS[selectedId] ?? <CreditCard className="w-5 h-5" />}
            {installments === '3x' ? `Payer ${formatAmount(installAmount, currency)} maintenant` : `Payer ${formatAmount(totalAmount, currency)}`}
            <ChevronRight className="w-5 h-5" />
          </>
        )}
      </button>

      <div className="flex items-start gap-2 text-xs text-gray-400 bg-gray-50 rounded-xl p-3">
        <ShieldCheck className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
        <span>Paiement sécurisé via {selected?.name ?? 'notre prestataire'}. Garantie satisfait ou remboursé 7 jours. Aucune donnée bancaire stockée.</span>
      </div>
    </div>
  )
}
