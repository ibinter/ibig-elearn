'use client'

import { useState } from 'react'
import { Loader2, CheckCircle } from 'lucide-react'

const SECTORS = [
  'Banque & Finance', 'Télécoms', 'Agroalimentaire', 'Immobilier', 'Santé',
  'ONG / Associations', 'Distribution / Retail', 'Administration', 'Tech / Startup', 'Autre',
]

const SIZES = ['5–20 employés', '21–50 employés', '51–200 employés', '201–500 employés', '500+ employés']

export default function B2BContactForm() {
  const [form, setForm] = useState({
    company: '', contact_name: '', email: '', phone: '',
    sector: '', company_size: '', learners_count: '', message: '',
  })
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/b2b/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (res.ok) {
        setSent(true)
      } else {
        setError('Erreur lors de l\'envoi. Veuillez réessayer.')
      }
    } catch {
      setError('Erreur réseau. Veuillez réessayer.')
    }
    setLoading(false)
  }

  if (sent) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-2xl p-8 text-center">
        <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-gray-900 mb-2">Demande reçue !</h3>
        <p className="text-gray-600">Notre équipe commerciale vous contacte sous 24h avec une proposition sur mesure.</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 space-y-5">
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nom de l'entreprise *</label>
          <input required value={form.company} onChange={e => setForm(f => ({ ...f, company: e.target.value }))}
            className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B3D91]/30"
            placeholder="ACME Côte d'Ivoire" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Votre nom *</label>
          <input required value={form.contact_name} onChange={e => setForm(f => ({ ...f, contact_name: e.target.value }))}
            className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B3D91]/30"
            placeholder="Prénom Nom" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email professionnel *</label>
          <input required type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
            className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B3D91]/30"
            placeholder="vous@entreprise.com" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone / WhatsApp *</label>
          <input required type="tel" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
            className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B3D91]/30"
            placeholder="+225 07 00 00 00 00" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Secteur d'activité</label>
          <select value={form.sector} onChange={e => setForm(f => ({ ...f, sector: e.target.value }))}
            className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B3D91]/30 bg-white">
            <option value="">Sélectionner</option>
            {SECTORS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Taille de l'entreprise</label>
          <select value={form.company_size} onChange={e => setForm(f => ({ ...f, company_size: e.target.value }))}
            className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B3D91]/30 bg-white">
            <option value="">Sélectionner</option>
            {SIZES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Nombre de collaborateurs à former</label>
        <input type="number" min="5" value={form.learners_count} onChange={e => setForm(f => ({ ...f, learners_count: e.target.value }))}
          className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B3D91]/30"
          placeholder="Ex: 25" />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Votre besoin en formation</label>
        <textarea value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
          rows={3} placeholder="Décrivez les compétences à développer, les formations souhaitées, votre calendrier..."
          className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B3D91]/30 resize-none" />
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl p-3">{error}</div>}

      <button type="submit" disabled={loading}
        className="w-full flex items-center justify-center gap-2 ibig-gradient text-white font-bold py-3.5 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-60 text-sm">
        {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Envoi en cours...</> : 'Envoyer ma demande de devis →'}
      </button>
    </form>
  )
}
