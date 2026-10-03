'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Calendar } from 'lucide-react'

export default function PeriodFilter({ currentFrom, currentTo }: { currentFrom: string; currentTo: string }) {
  const [from, setFrom] = useState(currentFrom)
  const [to, setTo] = useState(currentTo)
  const router = useRouter()

  function apply() {
    router.push(`/admin/rapports?from=${from}&to=${to}`)
  }

  const today = new Date().toISOString().slice(0, 10)

  function setPreset(label: string) {
    const d = new Date()
    const y = d.getFullYear()
    const m = d.getMonth()
    switch (label) {
      case '7j': setFrom(new Date(Date.now() - 6 * 86400000).toISOString().slice(0, 10)); setTo(today); break
      case '30j': setFrom(new Date(Date.now() - 29 * 86400000).toISOString().slice(0, 10)); setTo(today); break
      case '90j': setFrom(new Date(Date.now() - 89 * 86400000).toISOString().slice(0, 10)); setTo(today); break
      case 'mois': setFrom(new Date(y, m, 1).toISOString().slice(0, 10)); setTo(today); break
      case 'trim': setFrom(new Date(y, Math.floor(m / 3) * 3, 1).toISOString().slice(0, 10)); setTo(today); break
      case 'annee': setFrom(`${y}-01-01`); setTo(today); break
    }
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <Calendar className="w-4 h-4 text-gray-400" />
      <input type="date" value={from} onChange={e => setFrom(e.target.value)}
        className="border border-gray-200 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-[#0B3D91]/30" />
      <span className="text-gray-400 text-sm">→</span>
      <input type="date" value={to} onChange={e => setTo(e.target.value)}
        className="border border-gray-200 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-[#0B3D91]/30" />
      <div className="flex gap-1">
        {['7j', '30j', '90j', 'mois', 'trim', 'annee'].map(p => (
          <button key={p} onClick={() => setPreset(p)}
            className="text-xs px-2 py-1 border border-gray-200 rounded-md hover:bg-gray-50 text-gray-500 transition-colors">
            {p}
          </button>
        ))}
      </div>
      <button onClick={apply}
        className="ibig-gradient text-white text-xs font-semibold px-3 py-1.5 rounded-lg hover:opacity-90 transition-opacity">
        Appliquer
      </button>
    </div>
  )
}
