'use client'

import { useState } from 'react'
import type { Tenant } from '@/types/tenant'
import { Plus, Edit2, Trash2, Globe, Eye, EyeOff, CheckCircle, XCircle, ExternalLink } from 'lucide-react'

interface Props { initialTenants: Tenant[] }

const DEFAULT_FORM = {
  subdomain: '', name: '', custom_domain: '',
  logo_url: '', primary_color: '#0B3D91', secondary_color: '#FFA500',
  bg_color: '#FFFFFF', text_color: '#1A1A2E',
  hide_ibig_branding: false, custom_footer: '', is_active: true,
}

export default function TenantManager({ initialTenants }: Props) {
  const [tenants, setTenants] = useState(initialTenants)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Tenant | null>(null)
  const [form, setForm] = useState(DEFAULT_FORM)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [error, setError] = useState('')

  function openCreate() {
    setEditing(null)
    setForm(DEFAULT_FORM)
    setError('')
    setShowForm(true)
  }

  function openEdit(t: Tenant) {
    setEditing(t)
    setForm({
      subdomain: t.subdomain, name: t.name,
      custom_domain: t.custom_domain ?? '',
      logo_url: t.logo_url ?? '',
      primary_color: t.primary_color,
      secondary_color: t.secondary_color,
      bg_color: t.bg_color,
      text_color: t.text_color,
      hide_ibig_branding: t.hide_ibig_branding,
      custom_footer: t.custom_footer ?? '',
      is_active: t.is_active,
    })
    setError('')
    setShowForm(true)
  }

  async function handleSave() {
    if (!form.subdomain || !form.name) { setError('Sous-domaine et nom obligatoires'); return }
    setSaving(true); setError('')
    try {
      const url = editing ? `/api/admin/tenants/${editing.id}` : '/api/admin/tenants'
      const method = editing ? 'PATCH' : 'POST'
      const res = await fetch(url, {
        method, headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, custom_domain: form.custom_domain || null, logo_url: form.logo_url || null, custom_footer: form.custom_footer || null }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error); return }
      if (editing) {
        setTenants(prev => prev.map(t => t.id === editing.id ? data : t))
      } else {
        setTenants(prev => [data, ...prev])
      }
      setShowForm(false)
    } finally { setSaving(false) }
  }

  async function handleDelete(id: string) {
    if (!confirm('Supprimer ce tenant ?')) return
    setDeleting(id)
    await fetch(`/api/admin/tenants/${id}`, { method: 'DELETE' })
    setTenants(prev => prev.filter(t => t.id !== id))
    setDeleting(null)
  }

  async function toggleActive(t: Tenant) {
    const res = await fetch(`/api/admin/tenants/${t.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: !t.is_active }),
    })
    const data = await res.json()
    if (res.ok) setTenants(prev => prev.map(x => x.id === t.id ? data : x))
  }

  const previewUrl = form.subdomain
    ? `https://${form.subdomain}.ibig-elearning.com`
    : form.custom_domain ? `https://${form.custom_domain}` : null

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Marque blanche</h1>
          <p className="text-gray-500 text-sm mt-1">Créez des portails personnalisés pour vos clients B2B</p>
        </div>
        <button onClick={openCreate}
          className="flex items-center gap-2 bg-[#0B3D91] text-white px-4 py-2.5 rounded-xl font-semibold text-sm hover:bg-blue-800 transition-colors">
          <Plus className="w-4 h-4" /> Nouveau tenant
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Tenants total', value: tenants.length, color: 'bg-blue-50 text-[#0B3D91]' },
          { label: 'Actifs', value: tenants.filter(t => t.is_active).length, color: 'bg-green-50 text-green-700' },
          { label: 'Branding masqué', value: tenants.filter(t => t.hide_ibig_branding).length, color: 'bg-orange-50 text-orange-700' },
        ].map(k => (
          <div key={k.label} className={`rounded-2xl p-4 ${k.color}`}>
            <p className="text-3xl font-black">{k.value}</p>
            <p className="text-sm font-medium mt-1">{k.label}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      {tenants.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <Globe className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-lg font-medium">Aucun tenant configuré</p>
          <p className="text-sm mt-1">Créez votre premier portail marque blanche</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {['Tenant', 'Sous-domaine', 'Couleurs', 'Branding', 'Statut', 'Actions'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {tenants.map(t => (
                <tr key={t.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {t.logo_url ? (
                        <img src={t.logo_url} alt={t.name} className="w-8 h-8 object-contain rounded" />
                      ) : (
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold"
                          style={{ backgroundColor: t.primary_color }}>
                          {t.name.charAt(0)}
                        </div>
                      )}
                      <div>
                        <p className="font-semibold text-gray-900">{t.name}</p>
                        {t.custom_domain && (
                          <p className="text-xs text-gray-400">{t.custom_domain}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <a href={`https://${t.subdomain}.ibig-elearning.com`} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1 text-[#0B3D91] hover:underline font-medium">
                      {t.subdomain}.ibig-elearning.com
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full border border-gray-200 shadow-sm" style={{ backgroundColor: t.primary_color }} title="Primaire" />
                      <div className="w-5 h-5 rounded-full border border-gray-200 shadow-sm" style={{ backgroundColor: t.secondary_color }} title="Secondaire" />
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {t.hide_ibig_branding ? (
                      <span className="inline-flex items-center gap-1 text-xs bg-orange-50 text-orange-600 px-2 py-0.5 rounded-full">
                        <EyeOff className="w-3 h-3" /> Masqué
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">
                        <Eye className="w-3 h-3" /> Visible
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => toggleActive(t)}
                      className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${t.is_active ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {t.is_active ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                      {t.is_active ? 'Actif' : 'Inactif'}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button onClick={() => openEdit(t)}
                        className="p-1.5 text-gray-400 hover:text-[#0B3D91] hover:bg-blue-50 rounded-lg transition-colors">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(t.id)} disabled={deleting === t.id}
                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-40">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Form */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">
                {editing ? `Modifier "${editing.name}"` : 'Nouveau tenant marque blanche'}
              </h2>
            </div>

            <div className="p-6 space-y-5">
              {error && (
                <div className="bg-red-50 text-red-700 px-4 py-3 rounded-xl text-sm">{error}</div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Nom du tenant *</label>
                  <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="TotalEnergies Academy"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B3D91]/30" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Sous-domaine *</label>
                  <div className="flex items-center gap-0">
                    <input value={form.subdomain} onChange={e => setForm(f => ({ ...f, subdomain: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') }))}
                      placeholder="total"
                      className="flex-1 border border-gray-200 rounded-l-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B3D91]/30" />
                    <span className="bg-gray-100 border border-l-0 border-gray-200 rounded-r-xl px-3 py-2.5 text-xs text-gray-500 whitespace-nowrap">
                      .ibig-elearning.com
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Domaine personnalisé (optionnel)</label>
                <input value={form.custom_domain} onChange={e => setForm(f => ({ ...f, custom_domain: e.target.value }))}
                  placeholder="elearning.totalenergies.com"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B3D91]/30" />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">URL du logo</label>
                <input value={form.logo_url} onChange={e => setForm(f => ({ ...f, logo_url: e.target.value }))}
                  placeholder="https://cdn.example.com/logo.png"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B3D91]/30" />
                {form.logo_url && (
                  <img src={form.logo_url} alt="preview" className="mt-2 h-10 object-contain" onError={e => (e.currentTarget.style.display = 'none')} />
                )}
              </div>

              {/* Couleurs */}
              <div>
                <p className="text-sm font-semibold text-gray-700 mb-2">Couleurs du thème</p>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { key: 'primary_color', label: 'Couleur primaire' },
                    { key: 'secondary_color', label: 'Couleur secondaire' },
                    { key: 'bg_color', label: 'Fond' },
                    { key: 'text_color', label: 'Texte' },
                  ].map(({ key, label }) => (
                    <div key={key} className="flex items-center gap-2 border border-gray-200 rounded-xl px-3 py-2">
                      <input type="color" value={(form as unknown as Record<string, string>)[key]}
                        onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                        className="w-7 h-7 rounded-lg border-0 cursor-pointer" />
                      <div>
                        <p className="text-xs text-gray-500">{label}</p>
                        <p className="text-xs font-mono text-gray-800">{(form as unknown as Record<string, string>)[key]}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Prévisualisation */}
              <div className="rounded-xl p-4 border border-gray-200"
                style={{ backgroundColor: form.bg_color }}>
                <p className="text-xs text-gray-400 mb-2 font-medium">Aperçu</p>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm"
                    style={{ backgroundColor: form.primary_color }}>
                    {form.name.charAt(0) || 'T'}
                  </div>
                  <div>
                    <p className="font-bold text-sm" style={{ color: form.primary_color }}>
                      {form.name.split(' ')[0] || 'Nom'}
                    </p>
                    <p className="font-bold text-sm -mt-0.5" style={{ color: form.secondary_color }}>
                      {form.name.split(' ').slice(1).join(' ') || 'Academy'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <input type="checkbox" id="hide_branding" checked={form.hide_ibig_branding}
                  onChange={e => setForm(f => ({ ...f, hide_ibig_branding: e.target.checked }))}
                  className="w-4 h-4 rounded text-[#0B3D91]" />
                <label htmlFor="hide_branding" className="text-sm text-gray-700">
                  Masquer le branding IBIG E-LEARNING (<em>White label complet</em>)
                </label>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Message pied de page personnalisé</label>
                <input value={form.custom_footer} onChange={e => setForm(f => ({ ...f, custom_footer: e.target.value }))}
                  placeholder="© 2026 TotalEnergies — Powered by IBIG E-LEARNING"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B3D91]/30" />
              </div>

              <div className="flex items-center gap-3">
                <input type="checkbox" id="is_active" checked={form.is_active}
                  onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))}
                  className="w-4 h-4 rounded text-[#0B3D91]" />
                <label htmlFor="is_active" className="text-sm text-gray-700">Tenant actif</label>
              </div>

              {previewUrl && (
                <p className="text-xs text-gray-400">
                  URL du portail : <a href={previewUrl} target="_blank" rel="noopener noreferrer" className="text-[#0B3D91] hover:underline">{previewUrl}</a>
                </p>
              )}
            </div>

            <div className="p-6 border-t border-gray-100 flex justify-end gap-3">
              <button onClick={() => setShowForm(false)}
                className="px-4 py-2.5 text-sm text-gray-700 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
                Annuler
              </button>
              <button onClick={handleSave} disabled={saving}
                className="px-6 py-2.5 text-sm font-bold text-white bg-[#0B3D91] rounded-xl hover:bg-blue-800 disabled:opacity-60 transition-colors">
                {saving ? 'Enregistrement...' : editing ? 'Mettre à jour' : 'Créer le tenant'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
