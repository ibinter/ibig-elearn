'use client'

import { useState } from 'react'
import { Plus, Edit2, Trash2, Shield, CheckCircle, XCircle, Building2 } from 'lucide-react'

interface SSOProvider {
  id: string
  org_id: string
  org_name: string
  provider_type: 'google' | 'microsoft' | 'saml' | 'oidc'
  email_domains: string[]
  client_id: string | null
  issuer_url: string | null
  saml_metadata_url: string | null
  button_label: string
  button_logo_url: string | null
  is_active: boolean
  created_at: string
}

interface Props { initialProviders: SSOProvider[] }

const PROVIDER_LABELS: Record<string, string> = {
  google: 'Google Workspace',
  microsoft: 'Microsoft Azure AD',
  saml: 'SAML 2.0',
  oidc: 'OIDC générique',
}
const PROVIDER_ICONS: Record<string, string> = {
  google: '🔵', microsoft: '🟦', saml: '🔐', oidc: '🔑',
}

const DEFAULT_FORM = {
  org_name: '',
  provider_type: 'google' as SSOProvider['provider_type'],
  email_domains_str: '',
  client_id: '', client_secret: '', issuer_url: '',
  saml_metadata_url: '', button_label: 'Se connecter via SSO',
  button_logo_url: '', is_active: true,
}

export default function SSOManager({ initialProviders }: Props) {
  const [providers, setProviders] = useState(initialProviders)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<SSOProvider | null>(null)
  const [form, setForm] = useState(DEFAULT_FORM)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function openCreate() {
    setEditing(null); setForm(DEFAULT_FORM); setError(''); setShowForm(true)
  }

  function openEdit(p: SSOProvider) {
    setEditing(p)
    setForm({
      org_name: p.org_name,
      provider_type: p.provider_type,
      email_domains_str: p.email_domains.join(', '),
      client_id: p.client_id ?? '', client_secret: '',
      issuer_url: p.issuer_url ?? '',
      saml_metadata_url: p.saml_metadata_url ?? '',
      button_label: p.button_label,
      button_logo_url: p.button_logo_url ?? '',
      is_active: p.is_active,
    })
    setError(''); setShowForm(true)
  }

  async function handleSave() {
    if (!form.org_name.trim() || !form.email_domains_str.trim()) {
      setError('Nom organisation et domaines email obligatoires'); return
    }
    setSaving(true); setError('')
    try {
      const domains = form.email_domains_str.split(/[\s,;]+/).map(d => d.trim().toLowerCase()).filter(Boolean)
      const payload = {
        org_name: form.org_name.trim(), provider_type: form.provider_type,
        email_domains: domains,
        client_id: form.client_id || null,
        ...(form.client_secret ? { client_secret: form.client_secret } : {}),
        issuer_url: form.issuer_url || null,
        saml_metadata_url: form.saml_metadata_url || null,
        button_label: form.button_label || 'Se connecter via SSO',
        button_logo_url: form.button_logo_url || null,
        is_active: form.is_active,
      }
      const url = editing ? `/api/admin/sso/${editing.id}` : '/api/admin/sso'
      const method = editing ? 'PATCH' : 'POST'
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      const data = await res.json()
      if (!res.ok) { setError(data.error); return }

      if (editing) {
        setProviders(prev => prev.map(x => x.id === editing.id ? data : x))
      } else {
        setProviders(prev => [data, ...prev])
      }
      setShowForm(false)
    } finally { setSaving(false) }
  }

  async function handleDelete(id: string) {
    if (!confirm('Supprimer ce provider SSO ?')) return
    await fetch(`/api/admin/sso/${id}`, { method: 'DELETE' })
    setProviders(prev => prev.filter(p => p.id !== id))
  }

  async function toggleActive(p: SSOProvider) {
    const res = await fetch(`/api/admin/sso/${p.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: !p.is_active }),
    })
    if (res.ok) {
      const data = await res.json()
      setProviders(prev => prev.map(x => x.id === p.id ? data : x))
    }
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">SSO Entreprise</h1>
          <p className="text-gray-500 text-sm mt-1">Connexion unique pour les équipes de vos clients B2B</p>
        </div>
        <button onClick={openCreate}
          className="flex items-center gap-2 bg-[#0B3D91] text-white px-4 py-2.5 rounded-xl font-semibold text-sm hover:bg-blue-800 transition-colors">
          <Plus className="w-4 h-4" /> Nouveau provider SSO
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Providers total', value: providers.length, color: 'bg-blue-50 text-[#0B3D91]' },
          { label: 'Actifs', value: providers.filter(p => p.is_active).length, color: 'bg-green-50 text-green-700' },
          { label: 'Google Workspace', value: providers.filter(p => p.provider_type === 'google').length, color: 'bg-red-50 text-red-600' },
          { label: 'Microsoft / SAML', value: providers.filter(p => ['microsoft','saml','oidc'].includes(p.provider_type)).length, color: 'bg-indigo-50 text-indigo-700' },
        ].map(k => (
          <div key={k.label} className={`rounded-2xl p-4 ${k.color}`}>
            <p className="text-3xl font-black">{k.value}</p>
            <p className="text-sm font-medium mt-1">{k.label}</p>
          </div>
        ))}
      </div>

      {providers.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <Shield className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-lg font-medium">Aucun provider SSO configuré</p>
          <p className="text-sm mt-1">Configurez Google Workspace, Azure AD ou SAML pour vos clients B2B</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
          <div className="overflow-x-auto"><table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {['Organisation', 'Provider', 'Domaines email', 'Bouton login', 'Statut', 'Actions'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {providers.map(p => (
                <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-gray-400" />
                      <span className="font-semibold text-gray-900">{p.org_name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1.5 bg-gray-100 text-gray-700 px-2.5 py-1 rounded-full text-xs font-semibold">
                      {PROVIDER_ICONS[p.provider_type]} {PROVIDER_LABELS[p.provider_type]}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {p.email_domains.map(d => (
                        <span key={d} className="text-xs bg-blue-50 text-[#0B3D91] px-2 py-0.5 rounded font-mono">@{d}</span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-gray-700">{p.button_label}</span>
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => toggleActive(p)}
                      className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${p.is_active ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {p.is_active ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                      {p.is_active ? 'Actif' : 'Inactif'}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button onClick={() => openEdit(p)} className="p-1.5 text-gray-400 hover:text-[#0B3D91] hover:bg-blue-50 rounded-lg transition-colors">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(p.id)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table></div>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">
                {editing ? 'Modifier le provider SSO' : 'Nouveau provider SSO'}
              </h2>
            </div>
            <div className="p-6 space-y-5">
              {error && <div className="bg-red-50 text-red-700 px-4 py-3 rounded-xl text-sm">{error}</div>}

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Nom de l'organisation *</label>
                <input value={form.org_name} onChange={e => setForm(f => ({ ...f, org_name: e.target.value }))}
                  placeholder="TotalEnergies CI"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B3D91]/30" />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Type de provider *</label>
                <div className="grid grid-cols-2 gap-2">
                  {(Object.entries(PROVIDER_LABELS) as [SSOProvider['provider_type'], string][]).map(([type, label]) => (
                    <button key={type} type="button" onClick={() => setForm(f => ({ ...f, provider_type: type }))}
                      className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-medium transition-colors ${form.provider_type === type ? 'border-[#0B3D91] bg-[#0B3D91]/5 text-[#0B3D91]' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                      {PROVIDER_ICONS[type]} {label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Domaines email * <span className="font-normal text-gray-400">(séparés par virgule)</span>
                </label>
                <input value={form.email_domains_str} onChange={e => setForm(f => ({ ...f, email_domains_str: e.target.value }))}
                  placeholder="totalenergies.com, total.com"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B3D91]/30" />
                <p className="text-xs text-gray-400 mt-1">Les utilisateurs avec ces domaines verront le bouton SSO à la connexion</p>
              </div>

              {(form.provider_type === 'google' || form.provider_type === 'microsoft' || form.provider_type === 'oidc') && (
                <>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Client ID OAuth</label>
                    <input value={form.client_id} onChange={e => setForm(f => ({ ...f, client_id: e.target.value }))}
                      placeholder="xxx.apps.googleusercontent.com"
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B3D91]/30" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                      Client Secret {editing && <span className="text-gray-400 font-normal">(laisser vide pour conserver)</span>}
                    </label>
                    <input type="password" value={form.client_secret} onChange={e => setForm(f => ({ ...f, client_secret: e.target.value }))}
                      placeholder="••••••••••••"
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B3D91]/30" />
                  </div>
                </>
              )}

              {form.provider_type === 'oidc' && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Issuer URL</label>
                  <input value={form.issuer_url} onChange={e => setForm(f => ({ ...f, issuer_url: e.target.value }))}
                    placeholder="https://accounts.google.com"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B3D91]/30" />
                </div>
              )}

              {form.provider_type === 'saml' && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">URL des métadonnées SAML</label>
                  <input value={form.saml_metadata_url} onChange={e => setForm(f => ({ ...f, saml_metadata_url: e.target.value }))}
                    placeholder="https://login.microsoftonline.com/xxx/federationmetadata/..."
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B3D91]/30" />
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Label du bouton</label>
                  <input value={form.button_label} onChange={e => setForm(f => ({ ...f, button_label: e.target.value }))}
                    placeholder="Se connecter via SSO"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B3D91]/30" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">URL icône</label>
                  <input value={form.button_logo_url} onChange={e => setForm(f => ({ ...f, button_logo_url: e.target.value }))}
                    placeholder="https://cdn.example.com/logo.png"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B3D91]/30" />
                </div>
              </div>

              <div className="rounded-xl p-3 bg-gray-50">
                <p className="text-xs font-semibold text-gray-500 mb-2">Aperçu bouton :</p>
                <button type="button" disabled
                  className="w-full flex items-center justify-center gap-3 border-2 border-[#0B3D91]/30 rounded-xl py-3 px-4 text-sm font-semibold text-[#0B3D91] bg-white">
                  {form.button_logo_url
                    ? <img src={form.button_logo_url} alt="" className="w-5 h-5 object-contain" onError={e => (e.currentTarget.style.display = 'none')} />
                    : <Shield className="w-4 h-4" />}
                  {form.button_label || 'Se connecter via SSO'}
                </button>
              </div>

              <div className="flex items-center gap-3">
                <input type="checkbox" id="sso_active" checked={form.is_active}
                  onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))}
                  className="w-4 h-4 rounded text-[#0B3D91]" />
                <label htmlFor="sso_active" className="text-sm text-gray-700">Provider actif</label>
              </div>
            </div>

            <div className="p-6 border-t border-gray-100 flex justify-end gap-3">
              <button onClick={() => setShowForm(false)}
                className="px-4 py-2.5 text-sm text-gray-700 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
                Annuler
              </button>
              <button onClick={handleSave} disabled={saving}
                className="px-6 py-2.5 text-sm font-bold text-white bg-[#0B3D91] rounded-xl hover:bg-blue-800 disabled:opacity-60 transition-colors">
                {saving ? 'Enregistrement...' : editing ? 'Mettre à jour' : 'Créer le provider'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
