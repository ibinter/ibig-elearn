'use client'

import { useState } from 'react'
import { CalendarPlus, Copy, Check } from 'lucide-react'

/** Abonnement de l'agenda personnel (Google Agenda, Outlook, Apple Calendrier). */
export default function CalendarSync({ feedUrl }: { feedUrl: string }) {
  const [copied, setCopied] = useState(false)
  const webcal = feedUrl.replace(/^https?:/, 'webcal:')
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-5">
      <div className="flex items-center gap-2">
        <CalendarPlus className="w-5 h-5 text-[#0B3D91]" />
        <h2 className="font-bold text-gray-900 text-sm">Synchroniser avec mon agenda</h2>
      </div>
      <p className="mt-1 text-xs text-gray-500">Séances de coaching, sessions live et échéances apparaissent automatiquement dans votre agenda (mise à jour toutes les heures).</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <a href={`https://calendar.google.com/calendar/r?cid=${encodeURIComponent(webcal)}`} target="_blank" rel="noopener"
          className="text-xs font-semibold border border-gray-200 rounded-lg px-3 py-2 hover:bg-gray-50">Google Agenda</a>
        <a href={`https://outlook.live.com/calendar/0/addfromweb?url=${encodeURIComponent(feedUrl)}&name=${encodeURIComponent('IBIG E-LEARNING')}`} target="_blank" rel="noopener"
          className="text-xs font-semibold border border-gray-200 rounded-lg px-3 py-2 hover:bg-gray-50">Outlook</a>
        <a href={webcal} className="text-xs font-semibold border border-gray-200 rounded-lg px-3 py-2 hover:bg-gray-50">Apple Calendrier</a>
        <button type="button" onClick={async () => { await navigator.clipboard.writeText(feedUrl); setCopied(true); setTimeout(() => setCopied(false), 2000) }}
          className="text-xs font-semibold text-[#0B3D91] flex items-center gap-1 px-2 py-2">
          {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />} {copied ? 'Lien copié' : 'Copier le lien'}
        </button>
      </div>
      <p className="mt-2 text-[11px] text-gray-400">Ce lien est personnel : ne le partagez pas.</p>
    </div>
  )
}
