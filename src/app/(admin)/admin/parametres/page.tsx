'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Globe, Mail, CreditCard, Bell, Shield, Server, Save, Loader2, CheckCircle, Settings } from 'lucide-react'

type Setting = { key: string; value: string; label: string; category: string }

export default function AdminParametresPage() {
  const [settings, setSettings] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    supabase.from('platform_settings').select('key, value').then(({ data }) => {
      const map: Record<string, string> = {}
      for (const row of data ?? []) map[row.key] = row.value
      setSettings(map)
      setLoading(false)
    })
  }, [])

  async function save() {
    setSaving(true)
    const updates = Object.entries(settings).map(([key, value]) => ({
      key, value, updated_at: new Date().toISOString()
    }))
    await supabase.from('platform_settings').upsert(updates, { onConflict: 'key' })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  function set(key: string, value: string) {
    setSettings(prev => ({ ...prev, [key]: value }))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-8 h-8 text-[#0B3D91] animate-spin" />
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1 flex items-center gap-2">
            <Settings className="w-6 h-6 text-[#0B3D91]" /> Paramètres
          </h1>
          <p className="text-gray-500">Configuration générale de la plateforme IBIG E-LEARN</p>
        </div>
        <button
          onClick={save}
          disabled={saving}
          className="flex items-center gap-2 ibig-gradient text-white font-semibold px-5 py-2.5 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-60 text-sm"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <CheckCircle className="w-4 h-4" /> : <Save className="w-4 h-4" />}
          {saved ? 'Sauvegardé !' : saving ? 'Sauvegarde...' : 'Sauvegarder'}
        </button>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Informations générales */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-5">
            <Globe className="w-5 h-5 text-[#0B3D91]" />
            <h2 className="font-bold text-gray-900">Informations générales</h2>
          </div>
          <div className="space-y-4">
            {[
              { key: 'platform_name', label: 'Nom de la plateforme' },
              { key: 'platform_domain', label: 'Domaine' },
              { key: 'contact_email', label: 'Email de contact', type: 'email' },
            ].map(field => (
              <div key={field.key}>
                <label className="block text-xs font-medium text-gray-500 mb-1">{field.label}</label>
                <input
                  type={field.type ?? 'text'}
                  value={settings[field.key] ?? ''}
                  onChange={e => set(field.key, e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B3D91]/20 focus:border-[#0B3D91]"
                />
              </div>
            ))}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Langue par défaut</label>
              <select
                value={settings['default_language'] ?? 'fr'}
                onChange={e => set('default_language', e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B3D91]/20 focus:border-[#0B3D91]"
              >
                <option value="fr">Français</option>
                <option value="en">English</option>
                <option value="ar">العربية</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Devise par défaut</label>
              <select
                value={settings['default_currency'] ?? 'XOF'}
                onChange={e => set('default_currency', e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B3D91]/20 focus:border-[#0B3D91]"
              >
                <option value="XOF">XOF (Franc CFA UEMOA)</option>
                <option value="XAF">XAF (Franc CFA CEMAC)</option>
                <option value="MAD">MAD (Dirham marocain)</option>
                <option value="EGP">EGP (Livre égyptienne)</option>
                <option value="USD">USD (Dollar américain)</option>
                <option value="EUR">EUR (Euro)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Paiement */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-5">
            <CreditCard className="w-5 h-5 text-[#0B3D91]" />
            <h2 className="font-bold text-gray-900">Paiement</h2>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Commission plateforme (%)</label>
              <input
                type="number"
                min={0}
                max={100}
                value={settings['platform_commission_pct'] ?? '20'}
                onChange={e => set('platform_commission_pct', e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B3D91]/20 focus:border-[#0B3D91]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Garantie remboursement (jours)</label>
              <input
                type="number"
                min={0}
                value={settings['refund_days'] ?? '7'}
                onChange={e => set('refund_days', e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B3D91]/20 focus:border-[#0B3D91]"
              />
            </div>
            <div className="pt-2 border-t border-gray-50">
              <p className="text-xs text-gray-400 mb-3">Méthodes de paiement</p>
              {['CinetPay (Mobile Money)', 'Orange Money', 'MTN MoMo', 'Wave', 'Moov Money', 'Visa / Mastercard'].map(m => (
                <div key={m} className="flex items-center justify-between py-1.5">
                  <span className="text-sm text-gray-700">{m}</span>
                  <span className="text-xs bg-green-100 text-green-700 font-medium px-2 py-0.5 rounded-full">Activé</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Emails */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-5">
            <Mail className="w-5 h-5 text-[#0B3D91]" />
            <h2 className="font-bold text-gray-900">Emails transactionnels</h2>
          </div>
          <div className="space-y-1">
            {[
              { key: 'email_confirmation', label: 'Confirmation inscription' },
              { key: 'email_payment', label: 'Confirmation paiement' },
              { key: 'email_certificate', label: 'Certificat de réussite' },
              { key: 'email_reminder', label: 'Rappel de formation' },
              { key: 'email_newsletter', label: 'Newsletter mensuelle' },
            ].map(item => (
              <label key={item.key} className="flex items-center justify-between py-2.5 cursor-pointer group">
                <span className="text-sm text-gray-700 group-hover:text-gray-900">{item.label}</span>
                <button
                  type="button"
                  onClick={() => set(item.key, settings[item.key] === 'true' ? 'false' : 'true')}
                  className={`relative w-10 h-5.5 rounded-full transition-colors flex-shrink-0 ${settings[item.key] === 'true' ? 'ibig-gradient' : 'bg-gray-200'}`}
                  style={{ width: 40, height: 22 }}
                >
                  <span
                    className={`absolute top-0.5 w-4.5 h-4.5 bg-white rounded-full shadow transition-transform ${settings[item.key] === 'true' ? 'translate-x-5' : 'translate-x-0.5'}`}
                    style={{ width: 18, height: 18, top: 2, transform: settings[item.key] === 'true' ? 'translateX(20px)' : 'translateX(2px)' }}
                  />
                </button>
              </label>
            ))}
          </div>
        </div>

        {/* Système */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-5">
            <Shield className="w-5 h-5 text-[#0B3D91]" />
            <h2 className="font-bold text-gray-900">Système</h2>
          </div>
          <div className="space-y-4">
            <label className="flex items-center justify-between py-2 cursor-pointer">
              <div>
                <p className="text-sm font-medium text-gray-900">Mode maintenance</p>
                <p className="text-xs text-gray-400">Affiche une page de maintenance aux visiteurs</p>
              </div>
              <button
                type="button"
                onClick={() => set('maintenance_mode', settings['maintenance_mode'] === 'true' ? 'false' : 'true')}
                className={`relative rounded-full transition-colors flex-shrink-0 ${settings['maintenance_mode'] === 'true' ? 'bg-red-500' : 'bg-gray-200'}`}
                style={{ width: 40, height: 22 }}
              >
                <span
                  className="absolute top-0.5 bg-white rounded-full shadow transition-transform"
                  style={{ width: 18, height: 18, top: 2, transform: settings['maintenance_mode'] === 'true' ? 'translateX(20px)' : 'translateX(2px)' }}
                />
              </button>
            </label>

            <div className="pt-3 border-t border-gray-50 space-y-2">
              {[
                { label: 'Authentification', value: 'Supabase Auth' },
                { label: 'Chiffrement BDD', value: 'RLS PostgreSQL' },
                { label: 'SSL', value: 'Let\'s Encrypt (Auto)' },
                { label: 'Sauvegarde', value: 'Quotidienne (Supabase)' },
              ].map(item => (
                <div key={item.label} className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">{item.label}</span>
                  <span className="text-xs font-medium text-green-700 bg-green-50 px-2 py-0.5 rounded-full">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Infrastructure */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 lg:col-span-2">
          <div className="flex items-center gap-2 mb-5">
            <Server className="w-5 h-5 text-[#0B3D91]" />
            <h2 className="font-bold text-gray-900">Infrastructure</h2>
          </div>
          <div className="grid sm:grid-cols-3 gap-4">
            {[
              { name: 'Frontend', tech: 'Next.js 16 (Turbopack)', host: 'Vercel Edge Network', status: 'Opérationnel' },
              { name: 'Base de données', tech: 'PostgreSQL 17 (Supabase)', host: 'Supabase Cloud EU', status: 'Opérationnel' },
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
