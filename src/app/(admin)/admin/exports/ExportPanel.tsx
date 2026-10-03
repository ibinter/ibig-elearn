'use client'

import { useState } from 'react'
import { Download, Users, BookOpen, Award, DollarSign, CreditCard, Building2 } from 'lucide-react'

interface ExportItem {
  label: string
  description: string
  type: string
  icon: React.ElementType
  color: string
  hasDates?: boolean
  category: 'base' | 'comptable' | 'b2b'
}

const EXPORTS: ExportItem[] = [
  // Données de base
  { label: 'Apprenants', description: 'Nom, email, pays, niveau, points, date d\'inscription', type: 'users', icon: Users, color: 'bg-blue-50 text-blue-600', category: 'base' },
  { label: 'Inscriptions', description: 'Apprenant, formation, progression, date', type: 'enrollments', icon: BookOpen, color: 'bg-green-50 text-green-600', category: 'base' },
  { label: 'Certificats', description: 'Numéro, apprenant, formation, date d\'émission', type: 'certificates', icon: Award, color: 'bg-purple-50 text-purple-600', category: 'base' },
  // Comptabilité
  { label: 'Journal des ventes', description: 'Référence, date, client, formation, montant HT, TVA, TTC, moyen de paiement', type: 'payments', icon: DollarSign, color: 'bg-emerald-50 text-emerald-600', hasDates: true, category: 'comptable' },
  { label: 'Virements formateurs', description: 'Formateur, montant, devise, statut, dates de demande et traitement', type: 'payouts', icon: CreditCard, color: 'bg-orange-50 text-orange-600', hasDates: true, category: 'comptable' },
  // B2B
  { label: 'Cohortes B2B', description: 'Bon de commande, entreprise, formation, apprenants, prix unitaire, total HT', type: 'b2b', icon: Building2, color: 'bg-indigo-50 text-indigo-600', hasDates: true, category: 'b2b' },
]

const CATEGORY_LABELS = {
  base: 'Données de base',
  comptable: 'Exports comptables',
  b2b: 'Offre entreprise',
}

export default function ExportPanel() {
  const today = new Date().toISOString().slice(0, 10)
  const firstOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10)
  const [from, setFrom] = useState(firstOfMonth)
  const [to, setTo] = useState(today)

  function buildUrl(type: string, hasDates?: boolean) {
    const params = new URLSearchParams({ type })
    if (hasDates) {
      if (from) params.set('from', from)
      if (to) params.set('to', to)
    }
    return `/api/admin/export?${params}`
  }

  const categories = ['base', 'comptable', 'b2b'] as const

  return (
    <div className="space-y-6">
      {/* Filtre dates global */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5">
        <h2 className="text-sm font-semibold text-gray-700 mb-3">Période (pour les exports comptables &amp; B2B)</h2>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-500">Du</label>
            <input type="date" value={from} onChange={e => setFrom(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B3D91]/30" />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-500">au</label>
            <input type="date" value={to} onChange={e => setTo(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B3D91]/30" />
          </div>
          <div className="flex gap-2">
            {[
              { label: 'Ce mois', fn: () => { setFrom(firstOfMonth); setTo(today) } },
              { label: 'T. actuel', fn: () => {
                const q = Math.floor(new Date().getMonth() / 3)
                setFrom(new Date(new Date().getFullYear(), q * 3, 1).toISOString().slice(0, 10))
                setTo(today)
              }},
              { label: 'Cette année', fn: () => { setFrom(`${new Date().getFullYear()}-01-01`); setTo(today) } },
            ].map(p => (
              <button key={p.label} onClick={p.fn}
                className="text-xs px-2.5 py-1 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-gray-600">
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Exports par catégorie */}
      {categories.map(cat => (
        <div key={cat}>
          <h2 className="text-xs font-bold text-gray-400 uppercase mb-3">{CATEGORY_LABELS[cat]}</h2>
          <div className="space-y-3">
            {EXPORTS.filter(e => e.category === cat).map(item => (
              <div key={item.type} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${item.color}`}>
                  <item.icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900">{item.label}</p>
                  <p className="text-sm text-gray-500">{item.description}</p>
                  {item.hasDates && from && to && (
                    <p className="text-xs text-gray-400 mt-0.5">
                      Période : {new Date(from).toLocaleDateString('fr-FR')} → {new Date(to).toLocaleDateString('fr-FR')}
                    </p>
                  )}
                </div>
                <a
                  href={buildUrl(item.type, item.hasDates)}
                  download
                  className="flex items-center gap-2 bg-[#0B3D91] text-white text-sm font-semibold px-4 py-2 rounded-xl hover:opacity-90 transition-opacity flex-shrink-0"
                >
                  <Download className="w-4 h-4" /> CSV
                </a>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
