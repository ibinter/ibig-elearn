'use client'

import { useState } from 'react'
import { Check, X, Download, Loader2 } from 'lucide-react'

type Row = { userId: string; name: string; email: string; registered: boolean; attended: boolean; joinTime: string | null }

export default function AttendanceList({ sessionId, title, rows: initial }: { sessionId: string; title: string; rows: Row[] }) {
  const [rows, setRows] = useState(initial)
  const [busy, setBusy] = useState<string | null>(null)
  const present = rows.filter(r => r.attended).length

  async function mark(userId: string, attended: boolean) {
    setBusy(userId)
    const res = await fetch('/api/live/presence', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sessionId, userId, attended }) })
    if (res.ok) setRows(list => list.map(r => r.userId === userId ? { ...r, attended, joinTime: attended ? r.joinTime ?? new Date().toISOString() : r.joinTime } : r))
    setBusy(null)
  }

  function exportCsv() {
    const esc = (v: string) => `"${v.replace(/"/g, '""')}"`
    const lines = [['Nom', 'Email', 'Inscrit', 'Présent', 'Arrivée'], ...rows.map(r => [r.name, r.email, r.registered ? 'Oui' : 'Non', r.attended ? 'Présent' : 'Absent', r.joinTime ? new Date(r.joinTime).toLocaleString('fr-FR') : ''])]
    const url = URL.createObjectURL(new Blob(['﻿' + lines.map(l => l.map(esc).join(';')).join('\r\n')], { type: 'text/csv;charset=utf-8' }))
    const a = document.createElement('a')
    a.href = url; a.download = `emargement-${title.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 40)}.csv`; a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between gap-3">
        <p className="font-bold text-gray-900">{present} présent{present > 1 ? 's' : ''} sur {rows.length}</p>
        {rows.length > 0 && <button type="button" onClick={exportCsv} className="flex items-center gap-1.5 text-sm font-semibold text-[#0B3D91]"><Download className="w-4 h-4" /> Feuille d&apos;émargement (Excel)</button>}
      </div>
      {rows.length === 0 ? <p className="p-6 text-center text-sm text-gray-400">Aucun participant attendu pour cette session.</p> : (
        <ul className="divide-y divide-gray-50">
          {rows.map(r => (
            <li key={r.userId} className="px-5 py-3 flex items-center gap-3">
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-gray-900 truncate" data-no-translate>{r.name}</span>
                <span className="block text-xs text-gray-400 truncate">{r.email}{r.joinTime ? ` · arrivé à ${new Date(r.joinTime).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}` : ''}{!r.registered ? ' · non inscrit à la session' : ''}</span>
              </span>
              {busy === r.userId ? <Loader2 className="w-5 h-5 animate-spin text-gray-400" /> : (
                <div className="flex rounded-xl border border-gray-200 overflow-hidden text-xs font-semibold">
                  <button type="button" onClick={() => mark(r.userId, true)} className={`flex items-center gap-1 px-3 py-2 ${r.attended ? 'bg-emerald-500 text-white' : 'text-gray-500 hover:bg-gray-50'}`}><Check className="w-3.5 h-3.5" /> Présent</button>
                  <button type="button" onClick={() => mark(r.userId, false)} className={`flex items-center gap-1 px-3 py-2 border-l border-gray-200 ${!r.attended ? 'bg-gray-100 text-gray-700' : 'text-gray-500 hover:bg-gray-50'}`}><X className="w-3.5 h-3.5" /> Absent</button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
