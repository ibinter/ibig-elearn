'use client'

import { useState, useCallback } from 'react'
import { Search, Send, Loader2, ChevronDown, ChevronUp, AlertTriangle, CheckCircle } from 'lucide-react'

interface Course { id: string; title: string }
interface InactiveUser {
  user_id: string; email: string; full_name: string; country: string
  course_id: string; course_title: string; course_slug: string
  progress_percent: number; days_inactive: number
}

const SEGMENTS = [
  { value: 'all', label: 'Tous les inactifs' },
  { value: 'never_started', label: 'N\'ont jamais commencé (0%)' },
  { value: 'low_progress', label: 'Peu avancés (< 25%)' },
  { value: 'almost_done', label: 'Presque terminés (≥ 75%)' },
]

export default function RelancesPanel({ courses }: { courses: Course[] }) {
  const [thresholdDays, setThresholdDays] = useState(14)
  const [segment, setSegment] = useState('all')
  const [courseId, setCourseId] = useState('')
  const [campaignName, setCampaignName] = useState('')
  const [previewUsers, setPreviewUsers] = useState<InactiveUser[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [result, setResult] = useState<{ sent: number; total: number } | null>(null)
  const [error, setError] = useState('')
  const [showAll, setShowAll] = useState(false)

  async function handlePreview() {
    setLoading(true)
    setError('')
    setResult(null)
    try {
      const params = new URLSearchParams({ days: String(thresholdDays), segment })
      if (courseId) params.set('course_id', courseId)
      const res = await fetch(`/api/admin/relances/preview?${params}`)
      const d = await res.json()
      if (!res.ok) { setError(d.error ?? 'Erreur'); setLoading(false); return }
      setPreviewUsers(d.users)
    } catch { setError('Erreur réseau') }
    setLoading(false)
  }

  async function handleSend() {
    if (!previewUsers?.length) return
    setSending(true)
    setError('')
    try {
      const res = await fetch('/api/admin/relances/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          users: previewUsers,
          threshold_days: thresholdDays,
          segment,
          course_id: courseId || null,
          campaign_name: campaignName || `Relance ${thresholdDays}j — ${SEGMENTS.find(s => s.value === segment)?.label}`,
        }),
      })
      const d = await res.json()
      if (!res.ok) { setError(d.error ?? 'Erreur envoi'); setSending(false); return }
      setResult({ sent: d.sent, total: d.total })
      setPreviewUsers(null)
    } catch { setError('Erreur réseau') }
    setSending(false)
  }

  const visibleUsers = showAll ? previewUsers : previewUsers?.slice(0, 10)

  return (
    <div className="space-y-4">
      {/* Configuration */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5">
        <h2 className="font-semibold text-gray-900 mb-4">Configuration de la campagne</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Inactifs depuis (jours)</label>
            <div className="flex items-center gap-2">
              <input type="range" min={3} max={90} value={thresholdDays} onChange={e => setThresholdDays(+e.target.value)}
                className="flex-1 accent-[#0B3D91]" />
              <span className="text-sm font-bold text-[#0B3D91] w-8 text-right">{thresholdDays}j</span>
            </div>
            <div className="flex gap-1 mt-1">
              {[7, 14, 30, 60].map(d => (
                <button key={d} onClick={() => setThresholdDays(d)}
                  className={`text-xs px-2 py-0.5 rounded-md border transition-colors ${thresholdDays === d ? 'bg-[#0B3D91] text-white border-[#0B3D91]' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}>
                  {d}j
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Segment</label>
            <select value={segment} onChange={e => setSegment(e.target.value)}
              className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#0B3D91]/30">
              {SEGMENTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Formation (optionnel)</label>
            <select value={courseId} onChange={e => setCourseId(e.target.value)}
              className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#0B3D91]/30">
              <option value="">Toutes les formations</option>
              {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nom de la campagne</label>
            <input value={campaignName} onChange={e => setCampaignName(e.target.value)}
              placeholder={`Relance ${thresholdDays}j — ${SEGMENTS.find(s => s.value === segment)?.label}`}
              className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B3D91]/30" />
          </div>
        </div>

        <button onClick={handlePreview} disabled={loading}
          className="mt-4 flex items-center gap-2 border border-[#0B3D91] text-[#0B3D91] text-sm font-semibold px-4 py-2 rounded-xl hover:bg-blue-50 transition-colors disabled:opacity-60">
          {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Analyse...</> : <><Search className="w-4 h-4" /> Prévisualiser les destinataires</>}
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 text-sm">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" /> {error}
        </div>
      )}

      {result && (
        <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 rounded-xl p-4">
          <CheckCircle className="w-5 h-5 flex-shrink-0" />
          <div>
            <p className="font-semibold">Campagne envoyée avec succès !</p>
            <p className="text-sm">{result.sent} email{result.sent > 1 ? 's' : ''} envoyé{result.sent > 1 ? 's' : ''} sur {result.total} destinataires.</p>
          </div>
        </div>
      )}

      {/* Prévisualisation */}
      {previewUsers !== null && (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">
              {previewUsers.length === 0
                ? 'Aucun apprenant inactif trouvé'
                : `${previewUsers.length} apprenant${previewUsers.length > 1 ? 's' : ''} inactif${previewUsers.length > 1 ? 's' : ''} ciblé${previewUsers.length > 1 ? 's' : ''}`}
            </h2>
            {previewUsers.length > 0 && (
              <button onClick={handleSend} disabled={sending}
                className="flex items-center gap-2 ibig-gradient text-white text-sm font-semibold px-4 py-2 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-60">
                {sending ? <><Loader2 className="w-4 h-4 animate-spin" /> Envoi...</> : <><Send className="w-4 h-4" /> Envoyer {previewUsers.length} email{previewUsers.length > 1 ? 's' : ''}</>}
              </button>
            )}
          </div>

          {previewUsers.length === 0 ? (
            <div className="p-8 text-center text-gray-400 text-sm">
              Aucun apprenant ne correspond à ces critères. Essayez de réduire le seuil ou de changer le segment.
            </div>
          ) : (
            <>
              <div className="divide-y divide-gray-50">
                {visibleUsers?.map(u => (
                  <div key={`${u.user_id}:${u.course_id}`} className="flex items-center gap-4 px-5 py-3">
                    <div className="w-8 h-8 rounded-full bg-[#0B3D91]/10 flex items-center justify-center text-[#0B3D91] font-bold text-sm flex-shrink-0">
                      {(u.full_name || u.email)[0].toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">{u.full_name || '—'}</p>
                      <p className="text-xs text-gray-400">{u.email} · {u.country}</p>
                    </div>
                    <div className="flex-1 min-w-0 hidden sm:block">
                      <p className="text-sm text-gray-700 truncate">{u.course_title}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <div className="h-1.5 w-24 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-[#0B3D91] rounded-full" style={{ width: `${u.progress_percent}%` }} />
                        </div>
                        <span className="text-xs text-gray-400">{u.progress_percent}%</span>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${u.days_inactive >= 30 ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'}`}>
                        {u.days_inactive}j inactif
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              {previewUsers.length > 10 && (
                <button onClick={() => setShowAll(s => !s)}
                  className="w-full flex items-center justify-center gap-1 py-3 text-sm text-gray-500 hover:bg-gray-50 transition-colors border-t border-gray-100">
                  {showAll ? <><ChevronUp className="w-4 h-4" /> Réduire</> : <><ChevronDown className="w-4 h-4" /> Voir les {previewUsers.length - 10} autres</>}
                </button>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}
