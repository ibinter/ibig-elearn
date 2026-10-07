'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronDown, ExternalLink, Loader2 } from 'lucide-react'
import { PAYOUT_METHODS, type InstructorApplication, type PartnerAgreement } from '@/lib/partner'

type Props = {
  app: InstructorApplication
  email: string
  agreement: PartnerAgreement | null
  defaultShare: number
  balance: number
  earned: number
}

const fmt = (n: number) => n.toLocaleString('fr-FR')
const date = (d: string | null) => d ? new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'

export default function PartnerReviewCard({ app, email, agreement, defaultShare, balance, earned }: Props) {
  const router = useRouter()
  const [mode, setMode] = useState<'offer' | 'reject' | 'suspend' | null>(null)
  const [share, setShare] = useState(String(agreement?.instructor_share_pct ?? defaultShare))
  const [special, setSpecial] = useState('')
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function act(action: 'offer' | 'reject' | 'suspend') {
    setLoading(true)
    setError('')
    const res = await fetch('/api/admin/partenaires', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ applicationId: app.id, action, sharePct: Number(share), specialConditions: special, reason }),
    })
    const data = await res.json().catch(() => ({}))
    setLoading(false)
    if (!res.ok) { setError(data.error ?? 'Erreur'); return }
    setMode(null)
    router.refresh()
  }

  const row = (k: string, v: React.ReactNode) => (
    <div className="flex flex-col sm:flex-row sm:gap-3 py-2 border-b border-gray-50 last:border-0">
      <dt className="text-xs font-semibold text-gray-400 sm:w-44 flex-shrink-0">{k}</dt>
      <dd className="text-sm text-gray-800 break-words">{v || '—'}</dd>
    </div>
  )
  const link = (u: string | null) => u ? <a href={u} target="_blank" rel="noopener noreferrer" className="text-[#0B3D91] underline inline-flex items-center gap-1">{u.replace(/^https?:\/\//, '').slice(0, 40)} <ExternalLink className="w-3 h-3" /></a> : null

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
      <div className="p-5 flex flex-col sm:flex-row sm:items-start gap-3 sm:justify-between">
        <div className="min-w-0">
          <p className="font-bold text-gray-900">{app.full_name}</p>
          <p className="text-sm text-gray-600">{app.professional_title} · {app.city}, {app.country}</p>
          <p className="text-xs text-gray-400 mt-0.5">{email} · {app.phone} · déposée le {date(app.submitted_at)}</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {app.expertise_domains.map(d => <span key={d} className="text-[11px] font-semibold bg-[#0B3D91]/8 text-[#0B3D91] px-2 py-0.5 rounded-full">{d}</span>)}
            <span className="text-[11px] font-semibold bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{app.years_experience} ans d&apos;expérience</span>
          </div>
        </div>
        {app.status === 'accepted' && (
          <div className="text-right text-sm flex-shrink-0">
            <p className="font-bold text-emerald-700">{agreement?.instructor_share_pct ?? '—'} % formateur</p>
            <p className="text-xs text-gray-500">Gains cumulés : {fmt(earned)} FCFA · Solde : {fmt(balance)} FCFA</p>
            <p className="text-xs text-gray-400">Signée le {date(agreement?.accepted_at ?? null)} par « {agreement?.signature_name} »</p>
          </div>
        )}
        {app.status === 'terms_offered' && agreement && (
          <p className="text-sm text-amber-700 font-semibold flex-shrink-0">Convention envoyée le {date(agreement.offered_at)} · {agreement.instructor_share_pct} %</p>
        )}
      </div>

      <details className="group border-t border-gray-100">
        <summary className="px-5 py-3 text-sm font-semibold text-gray-700 cursor-pointer flex items-center gap-2 list-none">
          Dossier complet <ChevronDown className="w-4 h-4 transition-transform group-open:rotate-180" />
        </summary>
        <dl className="px-5 pb-4">
          {row('Biographie', <span className="whitespace-pre-line">{app.bio}</span>)}
          {row('Formations envisagées', <span className="whitespace-pre-line">{app.planned_courses}</span>)}
          {row('Motivation', app.motivation)}
          {row('Langues', app.teaching_languages.join(', ').toUpperCase())}
          {row('LinkedIn', link(app.linkedin_url))}
          {row('Site web', link(app.website_url))}
          {row('Exemple de contenu', link(app.sample_content_url))}
          {row('WhatsApp', app.whatsapp)}
          {row('Statut', app.legal_status === 'company' ? `Entreprise — ${app.company_name ?? ''} ${app.tax_id ? `(${app.tax_id})` : ''}` : 'Personne physique')}
          {row('Versement', `${PAYOUT_METHODS[app.payout_method]} — ${app.payout_account}`)}
          {row('Nom de signature', app.signature_name)}
          {app.rejection_reason && row('Dernier motif de refus', app.rejection_reason)}
        </dl>
      </details>

      <div className="border-t border-gray-100 p-4 sm:p-5 space-y-3">
        {mode === null && (
          <div className="flex flex-wrap gap-2">
            {['submitted', 'rejected', 'terms_offered'].includes(app.status) && (
              <button onClick={() => setMode('offer')} className="px-4 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-semibold">
                {app.status === 'terms_offered' ? 'Modifier la convention' : 'Retenir et proposer la convention'}
              </button>
            )}
            {['submitted', 'terms_offered'].includes(app.status) && (
              <button onClick={() => setMode('reject')} className="px-4 py-2.5 rounded-xl border border-amber-300 text-amber-800 text-sm font-semibold">Demander des modifications</button>
            )}
            {app.status === 'accepted' && (
              <button onClick={() => setMode('suspend')} className="px-4 py-2.5 rounded-xl border border-red-200 text-red-700 text-sm font-semibold">Suspendre le partenariat</button>
            )}
          </div>
        )}

        {mode === 'offer' && (
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <label htmlFor={`share-${app.id}`} className="text-sm font-semibold text-gray-800">Part formateur</label>
              <input id={`share-${app.id}`} type="number" min={1} max={99} step="0.5" inputMode="decimal" value={share} onChange={e => setShare(e.target.value)}
                className="w-24 rounded-xl border border-gray-200 px-3 py-2 text-[15px]" />
              <span className="text-sm text-gray-500">% · IBIG EDUFORM : {Math.max(0, 100 - Number(share || 0))} %</span>
            </div>
            <textarea rows={3} value={special} onChange={e => setSpecial(e.target.value)} placeholder="Conditions particulières (optionnel) : exclusivité, bonus de lancement, engagement de volume…"
              className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm" />
            {error && <p className="text-sm text-red-600">{error}</p>}
            <div className="flex gap-2">
              <button disabled={loading} onClick={() => act('offer')} className="px-4 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-semibold inline-flex items-center gap-2 disabled:opacity-60">
                {loading && <Loader2 className="w-4 h-4 animate-spin" />} Envoyer la convention
              </button>
              <button onClick={() => setMode(null)} className="px-4 py-2.5 rounded-xl text-sm text-gray-600">Annuler</button>
            </div>
          </div>
        )}

        {(mode === 'reject' || mode === 'suspend') && (
          <div className="space-y-3">
            <textarea rows={3} value={reason} onChange={e => setReason(e.target.value)}
              placeholder={mode === 'reject' ? 'Motif et points à corriger (visible par le candidat)…' : 'Motif de la suspension (visible par le formateur)…'}
              className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm" />
            {error && <p className="text-sm text-red-600">{error}</p>}
            <div className="flex gap-2">
              <button disabled={loading} onClick={() => act(mode)} className={`px-4 py-2.5 rounded-xl text-white text-sm font-semibold inline-flex items-center gap-2 disabled:opacity-60 ${mode === 'reject' ? 'bg-amber-600' : 'bg-red-600'}`}>
                {loading && <Loader2 className="w-4 h-4 animate-spin" />} {mode === 'reject' ? 'Envoyer la demande' : 'Suspendre'}
              </button>
              <button onClick={() => setMode(null)} className="px-4 py-2.5 rounded-xl text-sm text-gray-600">Annuler</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
