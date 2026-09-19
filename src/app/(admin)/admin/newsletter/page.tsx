'use client'

import { useState } from 'react'
import { Send, Mail, Users, ChevronDown, CheckCircle2 } from 'lucide-react'

const ROLES = [
  { value: 'apprenant', label: 'Apprenants' },
  { value: 'formateur', label: 'Formateurs' },
  { value: 'coordinateur', label: 'Coordinateurs' },
  { value: 'admin', label: 'Admins' },
]

export default function NewsletterPage() {
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [selectedRoles, setSelectedRoles] = useState<string[]>(['apprenant'])
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ sent: number } | null>(null)
  const [error, setError] = useState('')

  const toggleRole = (r: string) =>
    setSelectedRoles(prev => prev.includes(r) ? prev.filter(x => x !== r) : [...prev, r])

  const send = async () => {
    if (!subject.trim() || !body.trim()) { setError('Sujet et contenu requis'); return }
    setLoading(true); setError(''); setResult(null)
    const html = `<div style="font-family:sans-serif;max-width:600px;margin:0 auto">
      <div style="background:#0B3D91;padding:24px;border-radius:12px 12px 0 0">
        <h1 style="color:white;margin:0;font-size:22px">IBIG E-LEARN</h1>
      </div>
      <div style="padding:24px;background:#fff;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px">
        <h2 style="color:#111827">${subject}</h2>
        <div style="color:#374151;line-height:1.7">${body.replace(/\n/g, '<br>')}</div>
        <hr style="margin:24px 0;border:none;border-top:1px solid #e5e7eb">
        <p style="color:#9ca3af;font-size:12px">IBIG E-LEARN · Plateforme panafricaine de formation · <a href="https://ibig-elearn.com" style="color:#0B3D91">ibig-elearn.com</a></p>
      </div>
    </div>`
    try {
      const res = await fetch('/api/admin/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject, html, roles: selectedRoles.length ? selectedRoles : undefined }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setResult(data)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-[#0B3D91]/10 rounded-xl flex items-center justify-center">
          <Mail className="w-5 h-5 text-[#0B3D91]" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Newsletter</h1>
          <p className="text-sm text-gray-500">Envoyer un email à vos utilisateurs</p>
        </div>
      </div>

      {/* Destinataires */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
          <Users className="w-4 h-4" /> Destinataires
        </div>
        <div className="flex flex-wrap gap-2">
          {ROLES.map(r => (
            <button
              key={r.value}
              onClick={() => toggleRole(r.value)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                selectedRoles.includes(r.value)
                  ? 'bg-[#0B3D91] text-white border-[#0B3D91]'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-[#0B3D91]'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
        {selectedRoles.length === 0 && (
          <p className="text-xs text-amber-600">Aucun rôle sélectionné = tous les utilisateurs</p>
        )}
      </div>

      {/* Contenu */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Sujet</label>
          <input
            value={subject}
            onChange={e => setSubject(e.target.value)}
            placeholder="Objet de l'email…"
            className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B3D91]/30"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Message</label>
          <textarea
            value={body}
            onChange={e => setBody(e.target.value)}
            rows={10}
            placeholder="Corps de votre message (les sauts de ligne sont conservés)…"
            className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B3D91]/30 resize-y"
          />
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">{error}</div>
      )}

      {result && (
        <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 flex items-center gap-2 text-green-800 text-sm font-medium">
          <CheckCircle2 className="w-4 h-4" />
          Email envoyé à <strong>{result.sent}</strong> destinataire{result.sent !== 1 ? 's' : ''} avec succès.
        </div>
      )}

      <button
        onClick={send}
        disabled={loading}
        className="flex items-center gap-2 px-5 py-2.5 bg-[#0B3D91] text-white rounded-xl font-semibold text-sm hover:bg-[#0a2f70] transition-colors disabled:opacity-60"
      >
        <Send className="w-4 h-4" />
        {loading ? 'Envoi en cours…' : 'Envoyer la newsletter'}
      </button>
    </div>
  )
}
