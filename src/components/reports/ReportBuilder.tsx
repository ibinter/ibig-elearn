'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Play, Download, CalendarClock, Loader2, Trash2 } from 'lucide-react'

type Col = { key: string; label: string }
type Dataset = { key: string; label: string; description: string; columns: Col[] }
type Schedule = { id: string; name: string; dataset: string; frequency: string; recipients: string[]; next_run_at: string }

const PERIODS: Record<string, string> = { '7d': '7 derniers jours', '30d': '30 derniers jours', '90d': '3 derniers mois', '365d': '12 derniers mois', all: 'Depuis le début' }
const input = 'w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white'

export default function ReportBuilder({ orgId, datasets, courses, schedules }: { orgId: string | null; datasets: Dataset[]; courses: { id: string; title: string }[]; schedules: Schedule[] }) {
  const router = useRouter()
  const [dataset, setDataset] = useState(datasets[0].key)
  const [period, setPeriod] = useState('30d')
  const [courseId, setCourseId] = useState('')
  const def = datasets.find(d => d.key === dataset)!
  const [cols, setCols] = useState<string[]>(def.columns.map(c => c.key))
  const [preview, setPreview] = useState<{ columns: Col[]; rows: Record<string, unknown>[]; total: number } | null>(null)
  const [busy, setBusy] = useState('')
  const [err, setErr] = useState('')
  const [sched, setSched] = useState({ name: '', frequency: 'weekly', recipients: '' })
  const [schedMsg, setSchedMsg] = useState('')

  const body = () => ({ orgId, dataset, period, courseId: courseId || null, columns: cols })
  const pickDataset = (k: string) => { setDataset(k); setCols(datasets.find(d => d.key === k)!.columns.map(c => c.key)); setPreview(null) }

  async function run() {
    setBusy('run'); setErr('')
    try {
      const res = await fetch('/api/reports', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body()) })
      const d = await res.json(); if (!res.ok) throw new Error(d.error)
      setPreview(d)
    } catch (e) { setErr((e as Error).message || 'Erreur') } finally { setBusy('') }
  }
  async function download() {
    setBusy('csv'); setErr('')
    try {
      const res = await fetch('/api/reports', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...body(), format: 'csv' }) })
      if (!res.ok) throw new Error((await res.json()).error)
      const url = URL.createObjectURL(await res.blob())
      const a = document.createElement('a'); a.href = url; a.download = `rapport-${dataset}-${new Date().toISOString().slice(0, 10)}.csv`; a.click(); URL.revokeObjectURL(url)
    } catch (e) { setErr((e as Error).message || 'Erreur') } finally { setBusy('') }
  }
  async function schedule(e: React.FormEvent) {
    e.preventDefault(); setBusy('sched'); setSchedMsg('')
    try {
      const res = await fetch('/api/reports/schedules', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...body(), ...sched }) })
      const d = await res.json(); if (!res.ok) throw new Error(d.error)
      setSchedMsg('Rapport programmé.'); setSched({ name: '', frequency: 'weekly', recipients: '' }); router.refresh()
    } catch (x) { setSchedMsg((x as Error).message) } finally { setBusy('') }
  }

  return (
    <div className="space-y-5">
      <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-5 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <label className="text-sm"><span className="block font-semibold text-gray-700 mb-1">Rapport</span>
            <select className={input} value={dataset} onChange={e => pickDataset(e.target.value)}>{datasets.map(d => <option key={d.key} value={d.key}>{d.label}</option>)}</select>
          </label>
          <label className="text-sm"><span className="block font-semibold text-gray-700 mb-1">Période</span>
            <select className={input} value={period} onChange={e => setPeriod(e.target.value)}>{Object.entries(PERIODS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
          </label>
          <label className="text-sm"><span className="block font-semibold text-gray-700 mb-1">Formation</span>
            <select className={input} value={courseId} onChange={e => setCourseId(e.target.value)}>
              <option value="">Toutes les formations</option>{courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
            </select>
          </label>
        </div>
        <p className="text-xs text-gray-500">{def.description}</p>
        <fieldset>
          <legend className="text-sm font-semibold text-gray-700 mb-2">Colonnes</legend>
          <div className="flex flex-wrap gap-2">
            {def.columns.map(c => (
              <label key={c.key} className={`text-xs px-3 py-1.5 rounded-full border cursor-pointer ${cols.includes(c.key) ? 'bg-[#0B3D91] text-white border-[#0B3D91]' : 'border-gray-200 text-gray-600'}`}>
                <input type="checkbox" className="sr-only" checked={cols.includes(c.key)}
                  onChange={e => setCols(list => e.target.checked ? def.columns.map(x => x.key).filter(k => list.includes(k) || k === c.key) : list.filter(k => k !== c.key))} />
                {c.label}
              </label>
            ))}
          </div>
        </fieldset>
        <div className="flex flex-col sm:flex-row gap-2">
          <button type="button" onClick={run} disabled={!!busy || !cols.length} className="flex items-center justify-center gap-2 bg-[#0B3D91] text-white font-semibold text-sm px-4 py-2.5 rounded-xl disabled:opacity-50">
            {busy === 'run' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />} Afficher l&apos;aperçu
          </button>
          <button type="button" onClick={download} disabled={!!busy || !cols.length} className="flex items-center justify-center gap-2 border border-gray-200 text-gray-800 font-semibold text-sm px-4 py-2.5 rounded-xl disabled:opacity-50">
            {busy === 'csv' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />} Télécharger (Excel / CSV)
          </button>
        </div>
        {err && <p className="text-sm text-red-600" role="alert">{err}</p>}
      </section>

      {preview && (
        <section className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden" aria-live="polite">
          <div className="px-4 sm:px-5 py-3 border-b border-gray-100 text-sm text-gray-600"><strong className="text-gray-900">{preview.total}</strong> ligne{preview.total > 1 ? 's' : ''}{preview.total > 100 ? ' · aperçu des 100 premières (le fichier contient tout)' : ''}</div>
          {preview.total === 0 ? <p className="p-6 text-center text-sm text-gray-400">Aucune donnée pour ces critères.</p> : (
            <div className="overflow-x-auto max-h-[480px]">
              <table className="min-w-full text-sm">
                <caption className="sr-only">Aperçu du rapport {def.label}</caption>
                <thead className="bg-gray-50 sticky top-0"><tr>{preview.columns.map(c => <th key={c.key} scope="col" className="px-3 py-2 text-left text-xs font-semibold text-gray-600 whitespace-nowrap">{c.label}</th>)}</tr></thead>
                <tbody className="divide-y divide-gray-50">
                  {preview.rows.map((r, i) => <tr key={i}>{preview.columns.map(c => <td key={c.key} className="px-3 py-2 whitespace-nowrap text-gray-800">{String(r[c.key] ?? '')}</td>)}</tr>)}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-5 space-y-3">
        <h2 className="font-bold text-gray-900 flex items-center gap-2"><CalendarClock className="w-5 h-5 text-[#0B3D91]" /> Envoi automatique par email</h2>
        <p className="text-xs text-gray-500">Le rapport ci-dessus (jeu de données, formation et colonnes) est envoyé avec le fichier en pièce jointe, chaque lundi ou le 1er du mois.</p>
        <form onSubmit={schedule} className="grid grid-cols-1 sm:grid-cols-4 gap-2">
          <input className={input} placeholder="Nom du rapport" aria-label="Nom du rapport" value={sched.name} onChange={e => setSched({ ...sched, name: e.target.value })} />
          <select className={input} aria-label="Fréquence" value={sched.frequency} onChange={e => setSched({ ...sched, frequency: e.target.value })}>
            <option value="weekly">Chaque lundi</option><option value="monthly">Le 1er du mois</option>
          </select>
          <input required className={`${input} sm:col-span-2`} placeholder="Destinataires (emails séparés par des virgules)" aria-label="Destinataires" value={sched.recipients} onChange={e => setSched({ ...sched, recipients: e.target.value })} />
          <button disabled={busy === 'sched'} className="sm:col-span-4 sm:justify-self-start flex items-center gap-2 bg-[#FFA500] text-black font-bold text-sm px-4 py-2.5 rounded-xl">{busy === 'sched' && <Loader2 className="w-4 h-4 animate-spin" />} Programmer l&apos;envoi</button>
        </form>
        {schedMsg && <p className="text-sm text-gray-700" role="status">{schedMsg}</p>}
        {schedules.length > 0 && (
          <ul className="divide-y divide-gray-50 border-t border-gray-100 pt-2">
            {schedules.map(s => (
              <li key={s.id} className="py-2.5 flex items-center gap-3 text-sm">
                <span className="min-w-0 flex-1">
                  <span className="block font-medium text-gray-900">{s.name}</span>
                  <span className="block text-xs text-gray-500">{s.frequency === 'weekly' ? 'Chaque lundi' : 'Le 1er du mois'} · {s.recipients.join(', ')} · prochain envoi le {new Date(s.next_run_at).toLocaleDateString('fr-FR')}</span>
                </span>
                <button type="button" aria-label={`Supprimer ${s.name}`} className="p-1.5 text-gray-300 hover:text-red-500"
                  onClick={async () => { if (confirm('Supprimer cet envoi programmé ?')) { await fetch('/api/reports/schedules', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ orgId, action: 'delete', id: s.id }) }); router.refresh() } }}>
                  <Trash2 className="w-4 h-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
