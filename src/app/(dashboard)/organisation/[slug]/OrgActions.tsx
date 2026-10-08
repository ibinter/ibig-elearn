'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { UserPlus, Target, Loader2, X, Download, Plus, Search, Check, Upload } from 'lucide-react'

async function post(url: string, body: unknown) {
  const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error ?? 'Une erreur est survenue')
  return data
}

const card = 'bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-5'
const input = 'w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-[15px] focus:outline-none focus:ring-2 focus:ring-[#0B3D91]/30 focus:border-[#0B3D91]'

/* ── Inviter des collaborateurs ── */
export function InvitePanel({ orgId, cohorts, free, canInviteManagers }: { orgId: string; cohorts: { id: string; name: string }[]; free: number; canInviteManagers: boolean }) {
  const router = useRouter()
  const [emails, setEmails] = useState('')
  const [role, setRole] = useState('learner')
  const [cohortId, setCohortId] = useState('')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const list = emails.split(/[\s,;]+/).map(e => e.trim()).filter(Boolean)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true); setMsg(null)
    try {
      // Envoi par lots de 100 (gros imports CSV)
      const r: { status: string }[] = []
      for (let i = 0; i < list.length; i += 100) {
        const { results } = await post('/api/org/invite', { orgId, emails: list.slice(i, i + 100), role, cohortId: cohortId || null })
        r.push(...(results as { status: string }[]))
      }
      const added = r.filter(x => x.status === 'added').length
      const invited = r.filter(x => x.status === 'invited').length
      const already = r.filter(x => x.status === 'already_member').length
      setMsg({ ok: true, text: [added && `${added} ajouté(s)`, invited && `${invited} invitation(s) envoyée(s)`, already && `${already} déjà membre(s)`].filter(Boolean).join(' · ') })
      setEmails('')
      router.refresh()
    } catch (err) {
      setMsg({ ok: false, text: (err as Error).message })
    } finally { setBusy(false) }
  }

  return (
    <form onSubmit={submit} className={card}>
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-bold text-gray-900 flex items-center gap-2"><UserPlus className="w-5 h-5 text-[#0B3D91]" /> Inviter des collaborateurs</h2>
        <span className="text-xs text-gray-500">{free} siège{free > 1 ? 's' : ''} libre{free > 1 ? 's' : ''}</span>
      </div>
      <textarea value={emails} onChange={e => setEmails(e.target.value)} rows={3} required
        placeholder="adresse1@entreprise.com, adresse2@entreprise.com…" className={`${input} mt-3 resize-none`} />
      <label className="mt-1.5 inline-flex items-center gap-1.5 text-xs font-semibold text-[#0B3D91] cursor-pointer">
        <Upload className="w-3.5 h-3.5" /> Importer un fichier CSV / Excel (.csv)
        <input type="file" accept=".csv,.txt,text/csv" className="hidden" onChange={async e => {
          const file = e.target.files?.[0]
          if (!file) return
          // Toute cellule contenant une adresse email est reprise, quel que soit le séparateur (, ; tabulation)
          const found = (await file.text()).match(/[^\s,;"'<>]+@[^\s,;"'<>]+\.[a-z]{2,}/gi) ?? []
          const unique = [...new Set(found.map(x => x.toLowerCase()))]
          setEmails(prev => [...new Set([...prev.split(/[\s,;]+/).filter(Boolean), ...unique])].join('\n'))
          setMsg({ ok: true, text: `${unique.length} adresse(s) trouvée(s) dans ${file.name}` })
          e.target.value = ''
        }} />
      </label>
      <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
        <select value={role} onChange={e => setRole(e.target.value)} className={input} aria-label="Rôle">
          <option value="learner">Collaborateur (se forme)</option>
          {canInviteManagers && <option value="manager">Responsable (suit l&apos;équipe)</option>}
        </select>
        <select value={cohortId} onChange={e => setCohortId(e.target.value)} className={input} aria-label="Parcours">
          <option value="">Sans parcours pour l&apos;instant</option>
          {cohorts.map(c => <option key={c.id} value={c.id}>Parcours : {c.name}</option>)}
        </select>
      </div>
      {msg && <p className={`mt-2 text-sm ${msg.ok ? 'text-emerald-700' : 'text-red-600'}`}>{msg.text}</p>}
      <button disabled={busy || list.length === 0} className="mt-3 w-full flex items-center justify-center gap-2 bg-[#0B3D91] text-white font-semibold py-3 rounded-xl disabled:opacity-50">
        {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
        {list.length > 1 ? `Inviter ${list.length} personnes` : 'Inviter'}
      </button>
      <p className="mt-2 text-[11px] text-gray-400">Les personnes sans compte reçoivent un email d&apos;invitation valable 7 jours.</p>
    </form>
  )
}

/* ── Sélecteur avec recherche ── */
function Picker({ items, selected, onToggle, placeholder }: { items: { id: string; label: string }[]; selected: Set<string>; onToggle: (id: string) => void; placeholder: string }) {
  const [q, setQ] = useState('')
  const shown = items.filter(i => i.label.toLowerCase().includes(q.toLowerCase()))
  return (
    <div className="rounded-xl border border-gray-200 overflow-hidden">
      <div className="flex items-center gap-2 px-3 border-b border-gray-100">
        <Search className="w-4 h-4 text-gray-400" />
        <input value={q} onChange={e => setQ(e.target.value)} placeholder={placeholder} className="flex-1 py-2.5 text-sm focus:outline-none" />
      </div>
      <ul className="max-h-44 overflow-y-auto">
        {shown.map(i => (
          <li key={i.id}>
            <button type="button" onClick={() => onToggle(i.id)} className="w-full flex items-center gap-2.5 px-3 py-2 text-left text-sm hover:bg-gray-50">
              <span className={`w-5 h-5 rounded-md border flex items-center justify-center flex-shrink-0 ${selected.has(i.id) ? 'bg-[#0B3D91] border-[#0B3D91]' : 'border-gray-300'}`}>
                {selected.has(i.id) && <Check className="w-3.5 h-3.5 text-white" />}
              </span>
              <span className="truncate">{i.label}</span>
            </button>
          </li>
        ))}
        {shown.length === 0 && <li className="px-3 py-3 text-xs text-gray-400">Aucun résultat</li>}
      </ul>
    </div>
  )
}

function useSet() {
  const [s, setS] = useState<Set<string>>(new Set())
  const toggle = (id: string) => setS(prev => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n })
  return [s, toggle, () => setS(new Set())] as const
}

/* ── Créer un parcours d'équipe ── */
export function CohortPanel({ orgId, courses, members }: { orgId: string; courses: { id: string; title: string }[]; members: { id: string; name: string }[] }) {
  const router = useRouter()
  const [name, setName] = useState('')
  const [endDate, setEndDate] = useState('')
  const [mandatory, setMandatory] = useState(false)
  const [courseIds, toggleCourse, resetCourses] = useSet()
  const [memberIds, toggleMember, resetMembers] = useSet()
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true); setMsg(null)
    try {
      await post('/api/org/cohortes', { orgId, name, endDate: endDate || null, isMandatory: mandatory, courseIds: [...courseIds], memberIds: [...memberIds] })
      setMsg({ ok: true, text: 'Parcours créé : les collaborateurs choisis ont accès aux formations.' })
      setName(''); setEndDate(''); setMandatory(false); resetCourses(); resetMembers()
      router.refresh()
    } catch (err) {
      setMsg({ ok: false, text: (err as Error).message })
    } finally { setBusy(false) }
  }

  return (
    <form onSubmit={submit} className={card}>
      <h2 className="font-bold text-gray-900 flex items-center gap-2"><Target className="w-5 h-5 text-[#0B3D91]" /> Créer un parcours d&apos;équipe</h2>
      <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2">
        <input value={name} onChange={e => setName(e.target.value)} required placeholder="Ex. : Équipe commerciale 2026" className={`${input} sm:col-span-2`} />
        <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className={input} aria-label="Échéance" title="Échéance (facultatif)" />
      </div>
      <label className="mt-2 flex items-start gap-2.5 rounded-xl bg-amber-50 border border-amber-100 px-3 py-2.5 text-sm text-amber-900 cursor-pointer">
        <input type="checkbox" checked={mandatory} onChange={e => setMandatory(e.target.checked)} className="mt-0.5 w-4 h-4 accent-[#0B3D91]" />
        <span><strong>Formation obligatoire</strong> — relances automatiques à J-7, J-1 et en cas de retard ; les responsables sont alertés. L&apos;échéance est requise.</span>
      </label>
      <p className="mt-3 mb-1.5 text-xs font-semibold text-gray-600">Formations ({courseIds.size})</p>
      <Picker items={courses.map(c => ({ id: c.id, label: c.title }))} selected={courseIds} onToggle={toggleCourse} placeholder="Rechercher une formation" />
      <p className="mt-3 mb-1.5 text-xs font-semibold text-gray-600">Collaborateurs ({memberIds.size})</p>
      <Picker items={members.map(m => ({ id: m.id, label: m.name }))} selected={memberIds} onToggle={toggleMember} placeholder="Rechercher un collaborateur" />
      {msg && <p className={`mt-2 text-sm ${msg.ok ? 'text-emerald-700' : 'text-red-600'}`}>{msg.text}</p>}
      <button disabled={busy || !name || courseIds.size === 0} className="mt-3 w-full flex items-center justify-center gap-2 bg-[#FFA500] text-black font-bold py-3 rounded-xl disabled:opacity-50">
        {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Créer le parcours
      </button>
    </form>
  )
}

/* ── Ajouter des collaborateurs à un parcours existant ── */
export function AddToCohort({ orgId, cohortId, members }: { orgId: string; cohortId: string; members: { id: string; name: string }[] }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [ids, toggle, reset] = useSet()
  const [busy, setBusy] = useState(false)
  if (members.length === 0) return null
  if (!open) return <button type="button" onClick={() => setOpen(true)} className="text-xs font-semibold text-[#0B3D91] flex items-center gap-1"><Plus className="w-3.5 h-3.5" /> Ajouter</button>
  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={() => setOpen(false)}>
      <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))]" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-3">
          <p className="font-bold text-gray-900">Ajouter au parcours</p>
          <button type="button" onClick={() => setOpen(false)} aria-label="Fermer"><X className="w-5 h-5 text-gray-400" /></button>
        </div>
        <Picker items={members.map(m => ({ id: m.id, label: m.name }))} selected={ids} onToggle={toggle} placeholder="Rechercher un collaborateur" />
        <button type="button" disabled={busy || ids.size === 0}
          onClick={async () => {
            setBusy(true)
            try { await post('/api/org/cohortes', { orgId, cohortId, memberIds: [...ids] }); reset(); setOpen(false); router.refresh() }
            catch (err) { alert((err as Error).message) } finally { setBusy(false) }
          }}
          className="mt-3 w-full flex items-center justify-center gap-2 bg-[#0B3D91] text-white font-semibold py-3 rounded-xl disabled:opacity-50">
          {busy && <Loader2 className="w-4 h-4 animate-spin" />} Ajouter {ids.size || ''}
        </button>
      </div>
    </div>
  )
}

/* ── Retirer un collaborateur ── */
export function RemoveMember({ orgId, userId, name }: { orgId: string; userId: string; name: string }) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  return (
    <button type="button" disabled={busy} title="Retirer de l'équipe" aria-label="Retirer de l'équipe"
      onClick={async () => {
        if (!confirm(`Retirer ${name} de l'équipe ? Son siège sera libéré ; ses formations déjà commencées restent accessibles.`)) return
        setBusy(true)
        try { await post('/api/org/membres', { orgId, action: 'remove', userId }); router.refresh() }
        catch (err) { alert((err as Error).message) } finally { setBusy(false) }
      }}
      className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 flex-shrink-0">
      {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}
    </button>
  )
}

export function CancelInvite({ orgId, invitationId }: { orgId: string; invitationId: string }) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  return (
    <button type="button" disabled={busy}
      onClick={async () => { setBusy(true); try { await post('/api/org/membres', { orgId, action: 'cancel_invite', invitationId }); router.refresh() } finally { setBusy(false) } }}
      className="text-xs font-semibold text-gray-500 hover:text-red-600 px-2 py-1">
      {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Annuler'}
    </button>
  )
}

/* ── Export CSV (Excel) ── */
type Row = { name: string; email: string; role: string; lastActive: string | null; courses: number; done: number; avg: number; certs: number }
export function ExportTeam({ orgName, rows }: { orgName: string; rows: Row[] }) {
  if (rows.length === 0) return null
  function download() {
    const head = ['Nom', 'Email', 'Rôle', 'Dernière activité', 'Formations', 'Terminées', 'Progression moyenne (%)', 'Certificats']
    const esc = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`
    const csv = [head, ...rows.map(r => [r.name, r.email, r.role, r.lastActive ?? '', r.courses, r.done, r.avg, r.certs])]
      .map(l => l.map(esc).join(';')).join('\r\n')
    const url = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' }))
    const a = document.createElement('a')
    a.href = url
    a.download = `suivi-formation-${orgName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }
  return (
    <button type="button" onClick={download} className="flex items-center gap-1.5 text-sm font-semibold text-[#0B3D91]">
      <Download className="w-4 h-4" /> Export Excel
    </button>
  )
}
